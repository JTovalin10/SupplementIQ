/**
 * Admin request management routes
 */
import { Request, Response, Router } from 'express';
import { adminCache } from '../../../lib/core/admin-cache';
import { requestQueue } from '../../../lib/core/request-queue';
import { securityService } from '../../../lib/cpp-wrappers/security-tree';
import { supabase } from '../../../lib/supabase';
import { adminAuth } from '../../../middleware/auth';
import { ProductSubmissionRequest, QueuedProductInsert, UpdateRequest } from '../types';
import { generateRequestId } from '../utils';
const router = Router();

// In-memory storage for update requests (in production, use Redis or database)
const activeUpdateRequests = new Map<string, UpdateRequest>();

// In-memory storage for product submission requests
const activeProductRequests = new Map<string, ProductSubmissionRequest>();

// Queue for approved products to be inserted into database at 12 AM PST
const databaseInsertionQueue = new Map<string, QueuedProductInsert>();

// Track daily democratic update usage
let democraticUpdateUsedToday = false;
let lastDemocraticUpdateDate = new Date().toDateString();

// Request expiration (10 minutes)
const REQUEST_EXPIRATION_MINUTES = 10;

/**
 * @route POST /api/v1/admin/requests/create
 * @desc Create a new update request
 * @access Admin only
 * @requires Valid JWT token with admin/owner role
 * @returns 200 - Request created successfully
 * @returns 400 - Invalid request data
 * @returns 403 - Unauthorized
 * @returns 429 - Rate limited
 * @returns 500 - Request creation failed
 */
router.post('/create', adminAuth, async (req: Request, res: Response) => {
  try {
    // Get authenticated user info from JWT token (auth middleware already validates this)
    const requesterId = req.user!.id;
    const requesterName = req.user!.username || req.user!.email;
    
    if (!requesterName) {
      return res.status(400).json({
        success: false,
        error: 'User information incomplete',
        message: 'Username or email is required for request identification'
      });
    }
    
    // Get user authority using admin cache (more efficient than separate calls)
    const { isOwner } = await adminCache.getUserAuthority(requesterId);
    
    // Check if update is already in progress
    // This would check dailyUpdateService.getUpdateStatus()
    
    // Reset daily democratic update flag if it's a new day
    const today = new Date().toDateString();
    if (lastDemocraticUpdateDate !== today) {
      democraticUpdateUsedToday = false;
      lastDemocraticUpdateDate = today;
    }
    
    // Check democratic update daily limit (only for non-owner requests)
    if (!isOwner && democraticUpdateUsedToday) {
      return res.status(429).json({
        success: false,
        error: 'Daily limit reached',
        message: 'Democratic updates are limited to once per day. The daily limit has been reached.'
      });
    }
    
    // Check security restrictions
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const canMakeRequest = securityService.canMakeRequest(requesterId, currentTimestamp);
    
    if (!canMakeRequest) {
      return res.status(429).json({
        success: false,
        error: 'Rate limited',
        message: 'Admin has exceeded daily request limit or has overlapping requests'
      });
    }
    
    // Create the update request
    const requestId = generateRequestId();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + (REQUEST_EXPIRATION_MINUTES * 60 * 1000));
    
    const updateRequest: UpdateRequest = {
      id: requestId,
      requesterId,
      requesterName,
      timestamp: now,
      status: 'pending',
      requestType: isOwner ? 'force_update' : 'democratic_update',
      reason: req.body.reason || undefined,
      votes: {},
      voteCount: 0,
      approveCount: 0,
      rejectCount: 0,
      ownerApproved: false,
      expiresAt
    };
    
    // Record the request in SecurityTree
    securityService.recordRequest(requesterId, currentTimestamp);
    
    // If owner is requesting, auto-approve and queue
    if (isOwner) {
      updateRequest.ownerApprovedBy = requesterName;
      updateRequest.ownerApprovedAt = new Date();
      updateRequest.status = 'approved';
      
      // Queue the owner request for execution
      const queued = await requestQueue.enqueue({
        requesterId,
        requesterName,
        type: 'owner',
        data: updateRequest
      });
      
      if (!queued) {
        return res.status(503).json({
          success: false,
          error: 'Queue full',
          message: 'System is busy processing another request. Please try again later.'
        });
      }
    } else {
      // Add to pending requests for voting
      activeUpdateRequests.set(requestId, updateRequest);
    }
    
    res.json({
      success: true,
      message: isOwner ? 'Owner update approved and executed' : 'Update request created successfully',
      data: {
        requestId,
        status: updateRequest.status,
        expiresAt: updateRequest.expiresAt,
        isOwner: isOwner
      }
    });

  } catch (error) {
    console.error('Failed to create update request:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to create update request'
    });
  }
});

/**
 * @route GET /api/v1/admin/requests/pending
 * @desc Get all pending update requests
 * @access Admin only
 * @returns 200 - List of pending requests
 * @returns 500 - Failed to get requests
 */
router.get('/pending', adminAuth, async (req: Request, res: Response) => {
  try {
    const pendingRequests = Array.from(activeUpdateRequests.values())
      .filter(request => request.status === 'pending')
      .map(request => ({
        ...request,
        votingDetails: {
          totalVotes: request.voteCount,
          approveVotes: request.approveCount,
          rejectVotes: request.rejectCount,
          votes: Object.entries(request.votes).map(([adminId, vote]) => ({
            adminId,
            vote,
            timestamp: new Date() // This would be stored in the actual implementation
          })),
          needsApproval: request.approveCount < Math.ceil(request.voteCount * 0.75),
          approvalPercentage: request.voteCount > 0 ? (request.approveCount / request.voteCount) * 100 : 0
        }
      }));

    res.json({
      success: true,
      data: {
        requests: pendingRequests,
        count: pendingRequests.length,
        democraticUpdateUsedToday,
        lastDemocraticUpdateDate
      }
    });

  } catch (error) {
    console.error('Failed to get pending requests:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to get pending requests'
    });
  }
});

/**
 * @route GET /api/v1/admin/requests/:requestId
 * @desc Get a specific update request
 * @access Admin only
 * @requires req.params.requestId - The request ID
 * @returns 200 - Request details
 * @returns 404 - Request not found
 * @returns 500 - Failed to get request
 */
router.get('/:requestId', adminAuth, async (req: Request, res: Response) => {
  try {
    const { requestId } = req.params;
    
    const updateRequest = activeUpdateRequests.get(requestId);
    if (!updateRequest) {
      return res.status(404).json({
        success: false,
        error: 'Request not found',
        message: 'Update request not found or has expired'
      });
    }

    res.json({
      success: true,
      data: updateRequest
    });

  } catch (error) {
    console.error('Failed to get update request:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to get update request'
    });
  }
});

/**
 * @route GET /api/v1/admin/requests/products
 * @desc Get all pending product submission requests
 * @access Admin only
 * @returns 200 - List of pending product requests
 * @returns 500 - Failed to get requests
 */
router.get('/products', adminAuth, async (req: Request, res: Response) => {
  try {
    const pendingProductRequests = Array.from(activeProductRequests.values())
      .filter(request => request.status === 'pending')
      .map(request => ({
        id: request.id,
        requesterName: request.requesterName,
        timestamp: request.timestamp,
        expiresAt: request.expiresAt,
        productDetails: request.productDetails,
        reviewNotes: request.reviewNotes,
        adminReviewedBy: request.adminReviewedBy,
        adminReviewedAt: request.adminReviewedAt
      }));

    res.json({
      success: true,
      data: {
        requests: pendingProductRequests,
        count: pendingProductRequests.length
      }
    });

  } catch (error) {
    console.error('Failed to get pending product requests:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to get pending product requests'
    });
  }
});

/**
 * @route POST /api/v1/admin/requests/products/:requestId/approve
 * @desc Approve a product submission request (single admin approval required)
 * @access Admin only
 * @requires req.params.requestId - The product request ID
 * @requires req.body.action - 'approve' or 'reject'
 * @requires req.body.reviewNotes - Optional review notes
 * @returns 200 - Request processed successfully
 * @returns 404 - Request not found
 * @returns 400 - Invalid action or request already processed
 * @returns 500 - Failed to process request
 */
router.post('/products/:requestId/approve', adminAuth, async (req: Request, res: Response) => {
  try {
    const { requestId } = req.params;
    const { action, reviewNotes } = req.body;
    const adminId = req.user!.id;
    const adminName = req.user!.username || req.user!.email;
    
    if (!action || !['approve', 'reject'].includes(action)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid action',
        message: 'Action must be either "approve" or "reject"'
      });
    }
    
    const productRequest = activeProductRequests.get(requestId);
    if (!productRequest) {
      return res.status(404).json({
        success: false,
        error: 'Request not found',
        message: 'Product submission request not found or has expired'
      });
    }
    
    if (productRequest.status !== 'pending') {
      return res.status(400).json({
        success: false,
        error: 'Request already processed',
        message: 'This product request has already been processed'
      });
    }
    
    // Update the request status
    productRequest.status = action === 'approve' ? 'queued_for_insertion' : 'rejected';
    productRequest.adminReviewedBy = adminName;
    productRequest.adminReviewedAt = new Date();
    productRequest.reviewNotes = reviewNotes;
    
    if (action === 'approve') {
      // Queue for database insertion at 12 AM PST
      const now = new Date();
      const nextMidnightPST = new Date(now);
      nextMidnightPST.setUTCHours(8, 0, 0, 0); // 12 AM PST = 8 AM UTC
      if (nextMidnightPST <= now) {
        nextMidnightPST.setUTCDate(nextMidnightPST.getUTCDate() + 1);
      }
      
      const queuedInsert: QueuedProductInsert = {
        id: `insert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        originalRequestId: requestId,
        productDetails: productRequest.productDetails,
        approvedBy: adminName,
        approvedAt: new Date(),
        scheduledInsertionTime: nextMidnightPST
      };
      
      databaseInsertionQueue.set(queuedInsert.id, queuedInsert);
      
      console.log(`✅ Product ${requestId} approved by ${adminName} and queued for insertion at ${nextMidnightPST.toISOString()}`);
    }
    
    res.json({
      success: true,
      message: `Product request ${action === 'approve' ? 'approved and queued for database insertion' : 'rejected'}`,
      data: {
        requestId,
        status: productRequest.status,
        adminReviewedBy: adminName,
        adminReviewedAt: productRequest.adminReviewedAt,
        reviewNotes: productRequest.reviewNotes,
        scheduledInsertionTime: action === 'approve' ? 
          databaseInsertionQueue.get(Object.keys(databaseInsertionQueue).slice(-1)[0])?.scheduledInsertionTime : undefined
      }
    });
    
  } catch (error) {
    console.error('Failed to process product request:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to process product request'
    });
  }
});

/**
 * Process queued product insertions (called by existing daily update service)
 * This integrates with the existing queue processor system
 */
export async function processQueuedProductInsertions(): Promise<void> {
  console.log('🕛 Processing queued product insertions...');
  
  // 1. Process queued product insertions
  const queuedInserts = Array.from(databaseInsertionQueue.values());
  
  for (const insert of queuedInserts) {
    try {
      // Insert product into database
      const { data, error } = await supabase
        .from('products')
        .insert([{
          name: insert.productDetails.name,
          brand_name: insert.productDetails.brand_name,
          flavor: insert.productDetails.flavor,
          description: insert.productDetails.description,
          category: insert.productDetails.category,
          ingredients: insert.productDetails.ingredients,
          serving_size: insert.productDetails.serving_size,
          price: insert.productDetails.price,
          availability: insert.productDetails.availability,
          image_url: insert.productDetails.image_url,
          nutrition_facts: insert.productDetails.nutrition_facts,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }]);
      
      if (error) {
        console.error(`❌ Failed to insert product ${insert.productDetails.name}:`, error);
        continue;
      }
      
      // Remove from queue after successful insertion
      databaseInsertionQueue.delete(insert.id);
      
      // Update original request status
      const originalRequest = activeProductRequests.get(insert.originalRequestId);
      if (originalRequest) {
        originalRequest.status = 'approved';
      }
      
      console.log(`✅ Successfully inserted product: ${insert.productDetails.name} by ${insert.approvedBy}`);
      
    } catch (error) {
      console.error(`❌ Error processing product insertion ${insert.id}:`, error);
    }
  }
  
  // 2. Clear the database insertion queue daily
  const queueSizeBeforeClear = databaseInsertionQueue.size;
  databaseInsertionQueue.clear();
  if (queueSizeBeforeClear > 0) {
    console.log(`🧹 Cleared ${queueSizeBeforeClear} remaining items from database insertion queue`);
  }
  
  // 3. Remove unapproved product requests older than 3 days
  const now = new Date();
  const threeDaysAgo = new Date(now.getTime() - (3 * 24 * 60 * 60 * 1000));
  let removedCount = 0;
  
  for (const [requestId, request] of activeProductRequests.entries()) {
    if (request.status === 'pending' && request.timestamp < threeDaysAgo) {
      activeProductRequests.delete(requestId);
      removedCount++;
      console.log(`🗑️ Removed expired product request: ${request.productDetails.name} (submitted ${request.timestamp.toISOString()})`);
    }
  }
  
  if (removedCount > 0) {
    console.log(`🧹 Removed ${removedCount} expired product requests (older than 3 days)`);
  }
  
  if (queuedInserts.length > 0) {
    console.log(`🎉 Processed ${queuedInserts.length} product insertions`);
  }
  
  console.log('✅ Product queue processing completed');
}

export { activeProductRequests, activeUpdateRequests, databaseInsertionQueue, democraticUpdateUsedToday, lastDemocraticUpdateDate, router as requestRoutes };

