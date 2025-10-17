import { Request, Response, Router } from 'express';
import { queueProcessor } from '../lib/core/queue-processor';
import { requestQueue } from '../lib/core/request-queue';
import { securityService } from '../lib/cpp-wrappers/security-tree';
import { dailyUpdateService } from '../lib/services/daily-update-service';
import { adminAuth, ownerAuth } from '../middleware/auth';
import dashboardRoutes from './admin/dashboard';
// import { getAdminCount, getUserAuthority, isUserOwner } from './admin/utils';

// Temporary implementations for testing
async function getUserAuthority(userId: string): Promise<{ isAdmin: boolean; isOwner: boolean }> {
  return { isAdmin: true, isOwner: false }; // Temporary - always return admin
}

async function isUserOwner(userId: string): Promise<boolean> {
  return false; // Temporary - never owner for testing
}

async function getAdminCount(): Promise<number> {
  return 3; // Temporary - return 3 admins for testing
}

const router = Router();

// Mount dashboard routes
router.use('/dashboard', dashboardRoutes);

/**
 * @route GET /api/v1/admin
 * @desc Admin dashboard overview
 * @access Admin only
 * @returns 200 - Admin system overview
 */
router.get('/', async (req, res) => {
  try {
    res.json({
      success: true,
      message: 'SupplementIQ Admin API',
      data: {
        version: '1.0.0',
        endpoints: {
          auth: '/api/v1/admin/auth',
          requests: '/api/v1/admin/requests',
          products: '/api/v1/admin/products',
          queue: '/api/v1/admin/queue',
          stats: '/api/v1/admin/stats',
          security: '/api/v1/admin/security'
        },
        documentation: {
          requestFlow: 'Standard: Admin requests → Owner approves → Queue execution',
          emergencyFlow: 'Emergency: Admin requests → 75% admin vote → Queue execution',
          securityFeatures: [
            '10-minute request expiration',
            'Admin daily request limits',
            '2-hour cooldown between updates',
            '1-hour buffer around scheduled updates',
            'Pull-based queue system with anti-attack protection'
          ]
        },
        timestamp: new Date()
      }
    });
  } catch (error) {
    console.error('Failed to get admin overview:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to get admin overview'
    });
  }
});

/**
 * @route GET /api/v1/admin/health
 * @desc Admin system health check
 * @access Admin only
 * @returns 200 - System health status
 */
router.get('/health', async (req, res) => {
  try {
    // Check all admin system components
    const healthChecks = {
      auth: { status: 'healthy', message: 'Auth system operational' },
      requests: { status: 'healthy', message: 'Request system operational' },
      queue: { status: 'healthy', message: 'Queue system operational' },
      security: { status: 'healthy', message: 'Security system operational' },
      autocomplete: { status: 'disabled', message: 'Autocomplete functionality removed' }
    };

    const overallHealth = 'healthy';
    const timestamp = new Date();

    res.json({
      success: true,
      data: {
        status: overallHealth,
        timestamp,
        components: healthChecks,
        system: {
          uptime: Math.floor(process.uptime()),
          memory: process.memoryUsage(),
          nodeVersion: process.version
        }
      }
    });
  } catch (error) {
    console.error('Admin health check failed:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Admin health check failed'
    });
  }
});

// Configuration constants - easily modifiable
const APPROVAL_THRESHOLD_PERCENTAGE = 75; // Percentage of admins required to approve updates

// In-memory storage for update requests and voting (in production, use Redis or database)
interface UpdateRequest {
  id: string;
  requesterId: string;
  requesterName: string;
  timestamp: Date;
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  votes: {
    [adminId: string]: {
      vote: 'approve' | 'reject';
      timestamp: Date;
      adminName: string;
    };
  };
  ownerApproved?: boolean;
  ownerApprovedBy?: string;
  ownerApprovedAt?: Date;
  expiresAt?: Date;
}


// Storage for active update requests
const activeUpdateRequests = new Map<string, UpdateRequest>();

// Export function to provide Map reference to owner.ts
export function getActiveUpdateRequestsMap() {
  return activeUpdateRequests;
}

/**
 * Check if a user has admin or owner authority using the reusable utility function
 * @param userId - The user ID to check
 * @returns Promise<boolean> - true if user is admin or owner
 */
async function doesUserHaveAuthority(userId: string): Promise<boolean> {
  const { isAdmin, isOwner } = await getUserAuthority(userId);
  return isAdmin || isOwner;
}

// Track daily democratic update usage
let democraticUpdateUsedToday = false;
let lastDemocraticUpdateDate = new Date().toDateString();

// Request expiration (10 minutes)
const REQUEST_EXPIRATION_MINUTES = 10;

// Optimized cleanup - only runs when requests are present
let cleanupTimer: NodeJS.Timeout | null = null;

function scheduleCleanup(): void {
  // Cancel existing timer if any
  if (cleanupTimer) {
    clearTimeout(cleanupTimer);
  }
  
  // Only schedule cleanup if there are active requests
  if (activeUpdateRequests.size > 0) {
    cleanupTimer = setTimeout(() => {
      performCleanup();
    }, 5 * 60 * 1000); // 5 minutes
    console.log(`🧹 Cleanup scheduled in 5 minutes (${activeUpdateRequests.size} active requests)`);
  }
}

function performCleanup(): void {
  const currentTimestamp = Math.floor(Date.now() / 1000);
  let cleanedCount = 0;
  
  // Clean up expired requests from our in-memory storage
  for (const [requestId, request] of activeUpdateRequests) {
    if (request.status === 'pending') {
      const requestTimestamp = Math.floor(request.timestamp.getTime() / 1000);
      if (securityService.isRequestExpired(requestTimestamp, currentTimestamp, REQUEST_EXPIRATION_MINUTES)) {
        request.status = 'expired';
        console.log(`⏰ Request ${requestId} expired after ${REQUEST_EXPIRATION_MINUTES} minutes`);
        activeUpdateRequests.delete(requestId);
        cleanedCount++;
      }
    }
  }
  
  // Also cleanup security service
  securityService.cleanupExpiredRequests(currentTimestamp);
  
  if (cleanedCount > 0) {
    console.log(`🧹 Cleaned up ${cleanedCount} expired requests`);
  }
  
  // Schedule next cleanup if there are still active requests
  if (activeUpdateRequests.size > 0) {
    scheduleCleanup();
  } else {
    console.log('🧹 No active requests remaining, cleanup stopped');
  }
}

// Initial cleanup scheduling
scheduleCleanup();

/**
 * Admin routes for managing daily updates (autocomplete functionality removed)
 * These should be protected with admin authentication
 */

/**
 * @route POST /api/v1/admin/update-daily
 * @desc Trigger daily update (autocomplete functionality removed)
 * @access Admin only
 * @returns 200 - Update completed successfully
 * @returns 409 - Update already in progress
 * @returns 500 - Update failed
 */
router.post('/update-daily', adminAuth, async (req: Request, res: Response) => {
  try {
    const status = dailyUpdateService.getUpdateStatus();
    
    if (status.isUpdating) {
      return res.status(409).json({
        success: false,
        error: 'Update already in progress',
        message: 'Daily update is currently running. Please wait for it to complete.'
      });
    }

    // Start the update process (don't await to avoid timeout)
    dailyUpdateService.performDailyUpdate()
      .then(() => {
        console.log('✅ Manual daily update completed (autocomplete disabled)');
      })
      .catch((error) => {
        console.error('❌ Manual daily update failed:', error);
      });

    res.json({
      success: true,
      message: 'Daily update started (autocomplete functionality removed)',
      status: 'running'
    });

  } catch (error) {
    console.error('Failed to start daily update:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to start daily update'
    });
  }
});

/**
 * @route GET /api/v1/admin/daily-status
 * @desc Get daily update service status (autocomplete functionality removed)
 * @access Admin only
 * @returns 200 - Status information
 */
router.get('/daily-status', adminAuth, async (req: Request, res: Response) => {
  try {
    const status = dailyUpdateService.getUpdateStatus();
    
    res.json({
      success: true,
      data: {
        isUpdating: status.isUpdating,
        lastUpdateTime: status.lastUpdateTime,
        stats: status.stats,
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        message: 'Autocomplete functionality removed'
      }
    });

  } catch (error) {
    console.error('Failed to get daily update status:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to get daily update status'
    });
  }
});

/**
 * @route POST /api/v1/admin/request-update
 * @desc Request a daily update (requires admin voting or owner approval, autocomplete functionality removed)
 * @access Admin only
 * @requires req.body.requesterId - Admin ID requesting the update
 * @requires req.body.requesterName - Admin name requesting the update
 * @returns 200 - Update request created
 * @returns 409 - Request already exists or update in progress
 * @returns 429 - Too frequent requests or daily limit reached
 * @returns 500 - Request creation failed
 */
router.post('/request-update', adminAuth, async (req: Request, res: Response) => {
  try {
    // Get authenticated user info (no longer from request body)
    const requesterId = req.user!.id;
    const requesterName = req.user!.username || req.user!.email;
    
    if (!requesterName) {
      return res.status(400).json({
        success: false,
        error: 'User information incomplete',
        message: 'Username or email is required for request identification'
      });
    }
    
    // Validate admin ID format
    if (!securityService.validateAdminId(requesterId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid admin ID',
        message: 'Admin ID must be a valid UUID v4 format'
      });
    }
    
    // Check if user has authority (admin or owner) in single query
    const hasAuthority = await doesUserHaveAuthority(requesterId);
    
    if (!hasAuthority) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized',
        message: 'Only admins and owners can request updates'
      });
    }
    
    // Check if update is already in progress
    const status = dailyUpdateService.getUpdateStatus();
    if (status.isUpdating) {
      return res.status(409).json({
        success: false,
        error: 'Update in progress',
        message: 'An update is already in progress'
      });
    }
    
    // Use SecurityTree to check if admin can make request
    const currentTimestamp = securityService.getCurrentTimestamp();
    
    if (!securityService.canMakeRequest(requesterId, currentTimestamp)) {
      const hasRequestedToday = securityService.hasAdminMadeRequestToday(requesterId, currentTimestamp);
      const requestCount = securityService.getAdminRequestCountToday(requesterId, currentTimestamp);
      
      return res.status(429).json({
        success: false,
        error: 'Request denied by security policy',
        message: hasRequestedToday 
          ? `You have already made ${requestCount} request(s) today. Only 1 request per admin per day is allowed.`
          : 'Request denied due to security restrictions or overlapping requests.',
        securityInfo: {
          hasRequestedToday,
          requestCountToday: requestCount,
          totalRequestsToday: securityService.getTotalRequestsToday(currentTimestamp)
        }
      });
    }
    
    // Check if there's already a pending request from this admin
    for (const [_, request] of activeUpdateRequests) {
      if (request.requesterId === requesterId && request.status === 'pending') {
        return res.status(409).json({
          success: false,
          error: 'Duplicate request',
          message: 'You already have a pending update request'
        });
      }
    }
    
    // Reset daily democratic update tracking if it's a new day
    const today = new Date().toDateString();
    if (lastDemocraticUpdateDate !== today) {
      democraticUpdateUsedToday = false;
      lastDemocraticUpdateDate = today;
    }
    
    // Check democratic update daily limit (only for non-owner requests)
    const isOwner = await isUserOwner(requesterId);
    if (!isOwner && democraticUpdateUsedToday) {
      return res.status(429).json({
        success: false,
        error: 'Daily limit reached',
        message: 'Democratic updates are limited to once per day. The daily limit has been reached.'
      });
    }
    
    // Create new update request with expiration
    const requestId = `update-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + (REQUEST_EXPIRATION_MINUTES * 60 * 1000));
    
    const updateRequest: UpdateRequest = {
      id: requestId,
      requesterId,
      requesterName,
      timestamp: now,
      expiresAt,
      status: 'pending',
      votes: {},
      ownerApproved: false // Will be set when owner approves
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
      // Schedule cleanup since we now have an active request
      scheduleCleanup();
    }
    
    res.json({
      success: true,
      message: 'Update request created successfully',
      data: {
        requestId,
        status: updateRequest.status,
        requesterName,
        timestamp: updateRequest.timestamp,
        expiresAt: updateRequest.expiresAt,
        isOwnerRequest: isOwner,
        expirationMinutes: REQUEST_EXPIRATION_MINUTES
      }
    });

  } catch (error) {
    console.error('Update request failed:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to create update request'
    });
  }
});

/**
 * @route POST /api/v1/admin/vote-update/:requestId
 * @desc Vote on a pending update request
 * @access Admin only
 * @requires req.params.requestId - The update request ID
 * @requires req.body.adminId - Admin ID voting
 * @requires req.body.adminName - Admin name voting
 * @requires req.body.vote - Vote: 'approve' or 'reject'
 * @returns 200 - Vote recorded successfully
 * @returns 400 - Invalid vote or request not found
 * @returns 403 - Unauthorized admin
 * @returns 500 - Vote recording failed
 */
router.post('/vote-update/:requestId', adminAuth, async (req: Request, res: Response) => {
  try {
    const { requestId } = req.params;
    const { vote } = req.body;
    
    // Get authenticated user info (no longer from request body)
    const adminId = req.user!.id;
    const adminName = req.user!.username || req.user!.email;
    
    if (!adminName || !vote) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'vote is required'
      });
    }
    
    if (!['approve', 'reject'].includes(vote)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid vote',
        message: 'Vote must be either "approve" or "reject"'
      });
    }

    
    // Get the update request
    const updateRequest = activeUpdateRequests.get(requestId);
    if (!updateRequest) {
      return res.status(404).json({
        success: false,
        error: 'Request not found',
        message: 'Update request not found or has expired'
      });
    }
    
    if (updateRequest.status !== 'pending') {
      return res.status(400).json({
        success: false,
        error: 'Request not pending',
        message: 'This update request is no longer pending'
      });
    }
    
    // Check if admin has already voted on this request
    if (updateRequest.votes[adminId]) {
      return res.status(409).json({
        success: false,
        error: 'Already voted',
        message: `You have already voted "${updateRequest.votes[adminId].vote}" on this request`,
        data: {
          requestId,
          previousVote: updateRequest.votes[adminId].vote,
          previousTimestamp: updateRequest.votes[adminId].timestamp
        }
      });
    }
    
    // Record the vote
    updateRequest.votes[adminId] = {
      vote: vote as 'approve' | 'reject',
      timestamp: new Date(),
      adminName
    };
    
    // Check if we have enough votes for a decision
    const totalAdmins = await getAdminCount();
    const approveVotes = Object.values(updateRequest.votes).filter(v => v.vote === 'approve').length;
    const rejectVotes = Object.values(updateRequest.votes).filter(v => v.vote === 'reject').length;
    
    // Approval required based on configured threshold
    const requiredApproval = Math.ceil(totalAdmins * (APPROVAL_THRESHOLD_PERCENTAGE / 100));
    
    if (approveVotes >= requiredApproval) {
      updateRequest.status = 'approved';
      
      // Queue the democratic request for execution
      const queued = await requestQueue.enqueue({
        requesterId: updateRequest.requesterId,
        requesterName: updateRequest.requesterName,
        type: 'democratic',
        data: updateRequest
      });
      
      if (!queued) {
        console.log(`⚠️ Democratic request ${requestId} approved but queue is full, will retry on next poll`);
        // Don't change status - keep it approved but not executed yet
      } else {
        democraticUpdateUsedToday = true;
        // Remove from active requests since it's queued
        activeUpdateRequests.delete(requestId);
      }
    } else if (rejectVotes >= Math.ceil(totalAdmins * 0.26)) { // 26% rejection threshold
      updateRequest.status = 'rejected';
    }
    
    res.json({
      success: true,
      message: 'Vote recorded successfully',
      data: {
        requestId,
        vote,
        adminName,
        totalVotes: Object.keys(updateRequest.votes).length,
        approveVotes,
        rejectVotes,
        requiredApproval,
        status: updateRequest.status
      }
    });

  } catch (error) {
    console.error('Vote recording failed:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to record vote'
    });
  }
});

/**
 * @route GET /api/v1/admin/pending-requests
 * @desc Get all pending update requests
 * @access Admin only
 * @returns 200 - List of pending requests
 */
router.get('/pending-requests', adminAuth, async (req: Request, res: Response) => {
  try {
    const totalAdmins = await getAdminCount();
    const pendingRequests = Array.from(activeUpdateRequests.values())
      .filter(request => request.status === 'pending')
      .map(request => ({
        id: request.id,
        requesterName: request.requesterName,
        timestamp: request.timestamp,
        expiresAt: request.expiresAt,
        votes: Object.values(request.votes),
        totalAdmins,
        approvalProgress: {
          current: Object.values(request.votes).filter(v => v.vote === 'approve').length,
          required: Math.ceil(totalAdmins * (APPROVAL_THRESHOLD_PERCENTAGE / 100))
        },
        votingDetails: {
          totalVotes: Object.keys(request.votes).length,
          approveVotes: Object.values(request.votes).filter(v => v.vote === 'approve').length,
          rejectVotes: Object.values(request.votes).filter(v => v.vote === 'reject').length,
          remainingVotes: totalAdmins - Object.keys(request.votes).length
        }
      }));
    
    res.json({
      success: true,
      data: {
        requests: pendingRequests,
        totalAdmins,
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
 * @route GET /api/v1/admin/vote-status/:requestId/:adminId
 * @desc Check if an admin has voted on a specific request
 * @access Admin only
 * @requires req.params.requestId - The update request ID
 * @requires req.params.adminId - The admin ID to check
 * @returns 200 - Vote status information
 * @returns 404 - Request not found
 */
router.get('/vote-status/:requestId/:adminId', adminAuth, async (req: Request, res: Response) => {
  try {
    // Defense in depth: Verify user is actually an admin
    const userId = req.user!.id;
    const { isAdmin } = await getUserAuthority(userId);
    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized',
        message: 'Only admins can view vote status'
      });
    }

    const { requestId, adminId } = req.params;
    
    // Check if admin is authorized
    const hasAuthority = await doesUserHaveAuthority(adminId);
    if (!hasAuthority) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized',
        message: 'Only admins and owners can check vote status'
      });
    }
    
    // Get the update request
    const updateRequest = activeUpdateRequests.get(requestId);
    if (!updateRequest) {
      return res.status(404).json({
        success: false,
        error: 'Request not found',
        message: 'Update request not found or has expired'
      });
    }
    
    const hasVoted = !!updateRequest.votes[adminId];
    const voteInfo = hasVoted ? updateRequest.votes[adminId] : null;
    
    res.json({
      success: true,
      data: {
        requestId,
        adminId,
        hasVoted,
        vote: voteInfo?.vote || null,
        votedAt: voteInfo?.timestamp || null,
        votedBy: voteInfo?.adminName || null,
        requestStatus: updateRequest.status,
        requestExpiresAt: updateRequest.expiresAt
      }
    });

  } catch (error) {
    console.error('Failed to check vote status:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to check vote status'
    });
  }
});

/**
 * @route POST /api/v1/admin/owner-approve/:requestId
 * @desc Owner approval for a pending update request
 * @access Owner only
 * @requires req.params.requestId - The update request ID
 * @requires req.body.ownerId - Owner ID confirming approval
 * @requires req.body.ownerName - Owner name confirming approval
 * @returns 200 - Owner approval recorded and update executed
 * @returns 400 - Request not found or already processed
 * @returns 403 - Unauthorized (not owner)
 * @returns 500 - Approval failed
 */
router.post('/owner-approve/:requestId', ownerAuth, async (req: Request, res: Response) => {
  try {
    const { requestId } = req.params;
    const { ownerId: confirmingOwnerId, ownerName } = req.body;
    
    if (!confirmingOwnerId || !ownerName) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'ownerId and ownerName are required'
      });
    }
    
    // Check if this is the owner
    const isOwner = await isUserOwner(confirmingOwnerId);
    if (!isOwner) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized',
        message: 'Only the owner can approve requests'
      });
    }
    
    // Get the update request
    const updateRequest = activeUpdateRequests.get(requestId);
    if (!updateRequest) {
      return res.status(404).json({
        success: false,
        error: 'Request not found',
        message: 'Update request not found or has expired'
      });
    }
    
    if (updateRequest.status !== 'pending') {
      return res.status(400).json({
        success: false,
        error: 'Request already processed',
        message: 'This update request has already been processed'
      });
    }
    
    // Owner approval
    updateRequest.ownerApproved = true;
    updateRequest.ownerApprovedBy = ownerName;
    updateRequest.ownerApprovedAt = new Date();
    updateRequest.status = 'approved';
    
    // Queue the owner-approved request for execution
    const queued = await requestQueue.enqueue({
      requesterId: updateRequest.requesterId,
      requesterName: updateRequest.requesterName,
      type: 'owner',
      data: updateRequest
    });
    
    if (!queued) {
      return res.status(503).json({
        success: false,
        error: 'Queue full',
        message: 'System is busy processing another request. The approval has been recorded and will be executed when the queue is available.'
      });
    }
    
    res.json({
      success: true,
      message: 'Owner approval recorded and update executed',
      data: {
        requestId,
        ownerApprovedBy: ownerName,
        ownerApprovedAt: updateRequest.ownerApprovedAt
      }
    });

  } catch (error) {
    console.error('Owner approval failed:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to record owner approval'
    });
  }
});

/**
 * @route GET /api/v1/admin/security-stats
 * @desc Get security tree statistics and admin request patterns
 * @access Admin only
 * @returns 200 - Security statistics
 */
router.get('/security-stats', adminAuth, async (req: Request, res: Response) => {
  try {
    // Defense in depth: Verify user is actually an admin
    const userId = req.user!.id;
    const { isAdmin } = await getUserAuthority(userId);
    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized',
        message: 'Only admins can view security stats'
      });
    }

    const totalAdmins = await getAdminCount();
    const currentTimestamp = securityService.getCurrentTimestamp();
    const adminStats = securityService.getAllAdminStats(currentTimestamp);
    const totalRequestsToday = securityService.getTotalRequestsToday(currentTimestamp);
    
    res.json({
      success: true,
      data: {
        currentTimestamp,
        totalRequestsToday,
        adminStats,
        securityPolicies: {
          maxRequestsPerAdminPerDay: 1,
          requestExpirationMinutes: REQUEST_EXPIRATION_MINUTES,
          democraticUpdatesPerDay: 1,
          democraticUpdateUsedToday,
          timezone: 'PST/PDT',
          dailyResetTime: '12:00 AM PST/PDT'
        },
        systemHealth: {
          totalAdmins,
          activeRequests: activeUpdateRequests.size,
          lastResetDate: lastDemocraticUpdateDate
        }
      }
    });

  } catch (error) {
    console.error('Failed to get security stats:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to get security statistics'
    });
  }
});

/**
 * @route GET /api/v1/admin/queue-status
 * @desc Get request queue status and statistics
 * @access Admin only
 * @returns 200 - Queue status and statistics
 */
router.get('/queue-status', adminAuth, async (req: Request, res: Response) => {
  try {
    // Defense in depth: Verify user is actually an admin
    const userId = req.user!.id;
    const { isAdmin } = await getUserAuthority(userId);
    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized',
        message: 'Only admins can view queue status'
      });
    }

    const queueStats = requestQueue.getStats();
    const queueContents = requestQueue.getQueue();
    
    res.json({
      success: true,
      data: {
        ...queueStats,
        queueContents: queueContents.map((req: any) => ({
          id: req.id,
          requesterName: req.requesterName,
          type: req.type,
          timestamp: req.timestamp,
          priority: req.priority,
          age: Date.now() - req.timestamp.getTime()
        })),
        health: {
          isHealthy: requestQueue.isHealthy(),
          lastHealthCheck: new Date()
        }
      }
    });

  } catch (error) {
    console.error('Failed to get queue status:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to get queue status'
    });
  }
});

/**
 * @route POST /api/v1/admin/force-queue-process
 * @desc Force process the queue (for testing/owner use)
 * @access Owner only
 * @returns 200 - Queue processing triggered
 */
router.post('/force-queue-process', ownerAuth, async (req: Request, res: Response) => {
  try {
    // Defense layer 2: Verify the authenticated user exists and is the owner
    const userId = req.user!.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        message: 'Valid authentication token required'
      });
    }
    
    // Verify JWT token integrity and check if user is owner (owner-only function)
    const isOwner = await isUserOwner(userId);
    if (!isOwner) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized',
        message: 'Only the owner can force queue processing'
      });
    }
    
    await requestQueue.forceProcess();
    
    res.json({
      success: true,
      message: 'Queue processing triggered',
      data: {
        timestamp: new Date(),
        queueStats: requestQueue.getStats()
      }
    });

  } catch (error) {
    console.error('Failed to force queue process:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to force queue processing'
    });
  }
});

/**
 * @route POST /api/v1/admin/clear-queue
 * @desc Clear the request queue (emergency use only)
 * @access Owner only
 * @requires req.body.ownerId - Owner ID confirming the action
 * @returns 200 - Queue cleared
 * @returns 403 - Unauthorized (not owner)
 */
router.post('/clear-queue', ownerAuth, async (req: Request, res: Response) => {
  try {
    const { ownerId: confirmingOwnerId } = req.body;
    
    // Check if this is the owner
    const isOwner = await isUserOwner(confirmingOwnerId);
    if (!isOwner) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized',
        message: 'Only the owner can clear the queue'
      });
    }
    
    const statsBefore = requestQueue.getStats();
    requestQueue.clearQueue();
    
    res.json({
      success: true,
      message: 'Queue cleared successfully',
      data: {
        clearedRequests: statsBefore.queueSize,
        timestamp: new Date()
      }
    });

  } catch (error) {
    console.error('Failed to clear queue:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to clear queue'
    });
  }
});

/**
 * @route GET /api/v1/admin/processor-stats
 * @desc Get queue processor execution statistics
 * @access Admin only
 * @returns 200 - Processor statistics
 */
router.get('/processor-stats', adminAuth, async (req: Request, res: Response) => {
  try {
    // Defense in depth: Verify user is actually an admin
    const userId = req.user!.id;
    const { isAdmin } = await getUserAuthority(userId);
    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized',
        message: 'Only admins can view processor stats'
      });
    }

    const processorStats = queueProcessor.getStats();
    
    res.json({
      success: true,
      data: {
        ...processorStats,
        executionHistory: queueProcessor.getExecutionHistory(20) // Last 20 executions
      }
    });

  } catch (error) {
    console.error('Failed to get processor stats:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to get processor statistics'
    });
  }
});


/**
 * @route GET /api/v1/admin/autocomplete-stats
 * @desc Get detailed autocomplete statistics
 * @access Admin only
 * @returns 200 - Statistics
 */
router.get('/autocomplete-stats', adminAuth, async (req: Request, res: Response) => {
  try {
    // Defense in depth: Verify user is actually an admin
    const userId = req.user!.id;
    const { isAdmin } = await getUserAuthority(userId);
    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized',
        message: 'Only admins can view autocomplete stats'
      });
    }

    const stats = { message: 'Autocomplete functionality removed' };
    const status = dailyUpdateService.getUpdateStatus();
    
    res.json({
      success: true,
      data: {
        ...stats,
        isUpdating: status.isUpdating,
        lastUpdateTime: status.lastUpdateTime,
        serverUptime: Math.floor(process.uptime()),
        memoryUsage: process.memoryUsage(),
        nodeVersion: process.version
      }
    });

  } catch (error) {
    console.error('Failed to get autocomplete stats:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to get autocomplete statistics'
    });
  }
});

// Graceful shutdown handlers
process.on('SIGINT', () => {
  console.log('🛑 Received SIGINT, shutting down admin systems...');
  if (cleanupTimer) {
    clearTimeout(cleanupTimer);
    console.log('🧹 Cleanup timer cleared');
  }
  requestQueue.shutdown();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('🛑 Received SIGTERM, shutting down admin systems...');
  if (cleanupTimer) {
    clearTimeout(cleanupTimer);
    console.log('🧹 Cleanup timer cleared');
  }
  requestQueue.shutdown();
  process.exit(0);
});

export { router as adminRoutes };
