import { Request, Response, Router } from 'express';
import { adminCache } from '../lib/core/admin-cache';
import { queueProcessor } from '../lib/core/queue-processor';
import { requestQueue } from '../lib/core/request-queue';
import { dailyUpdateService } from '../lib/services/daily-update-service';
import { supabase } from '../lib/supabase';
import { ownerAuth } from '../middleware/auth';

// Import the activeUpdateRequests Map from admin.ts
// We'll need to access this Map for veto/approve functionality
let activeUpdateRequests: Map<string, any> | null = null;

// Function to set the Map reference (called from admin.ts)
export function setActiveUpdateRequestsMap(map: Map<string, any>) {
  activeUpdateRequests = map;
}

const router = Router();

// Apply owner authentication to all routes
router.use(ownerAuth);

// Configuration constants
const APPROVAL_THRESHOLD_PERCENTAGE = 75; // Percentage of admins required to approve updates

/**
 * Check if a user is the owner using cache
 * @param userId - The user ID to check
 * @returns Promise<boolean> - true if user is owner
 */
async function isUserOwner(userId: string): Promise<boolean> {
  return await adminCache.isUserOwner(userId);
}

/**
 * Get all admin users using cache
 * @returns Promise<string[]> - Array of admin user IDs
 */
async function getAllAdmins(): Promise<string[]> {
  const admins = await adminCache.getAdmins();
  return admins.filter(admin => admin.role === 'admin').map(admin => admin.id);
}

/**
 * @route POST /api/v1/owner/create-admin
 * @desc Create a new admin user
 * @access Owner only
 * @returns 200 - Admin created successfully
 * @returns 403 - Unauthorized (not owner)
 * @returns 400 - Invalid user ID or user already admin/owner
 * @returns 404 - User not found
 */
router.post('/create-admin', ownerAuth, async (req: Request, res: Response) => {
  try {
    const { targetUserId } = req.body;

    // Validate required fields
    if (!targetUserId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'targetUserId is required'
      });
    }

    // Owner is already authenticated via middleware
    const ownerId = req.user!.id;

    // Check if target user exists
    const { data: targetUser, error: userError } = await supabase
      .from('users')
      .select('id, role, username')
      .eq('id', targetUserId)
      .single();

    if (userError || !targetUser) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        message: 'The specified user does not exist'
      });
    }

    // Check if user is already admin or owner
    if (targetUser.role === 'admin' || targetUser.role === 'owner') {
      return res.status(400).json({
        success: false,
        error: 'Invalid operation',
        message: `User is already ${targetUser.role === 'owner' ? 'the owner' : 'an admin'}`
      });
    }

    // Update user role to admin
    const { error: updateError } = await supabase
      .from('users')
      .update({ role: 'admin' })
      .eq('id', targetUserId);

    if (updateError) {
      console.error('❌ Error updating user role:', updateError);
      return res.status(500).json({
        success: false,
        error: 'Database error',
        message: 'Failed to update user role'
      });
    }

    // Add the new admin to cache
    await adminCache.addAdminToCache({
      id: targetUserId,
      role: 'admin'
    });

    console.log(`✅ Owner ${ownerId} promoted user ${targetUserId} (${targetUser.username}) to admin`);

    res.json({
      success: true,
      message: 'Admin created successfully',
      data: {
        userId: targetUserId,
        username: targetUser.username,
        newRole: 'admin',
        promotedBy: ownerId,
        timestamp: new Date()
      }
    });

  } catch (error) {
    console.error('Create admin failed:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to create admin'
    });
  }
});

/**
 * @route POST /api/v1/owner/remove-admin
 * @desc Remove admin privileges from a user
 * @access Owner only
 * @returns 200 - Admin removed successfully
 * @returns 403 - Unauthorized (not owner)
 * @returns 400 - Invalid user ID or user not admin
 * @returns 404 - User not found
 */
router.post('/remove-admin', ownerAuth, async (req: Request, res: Response) => {
  try {
    const { ownerId, targetUserId } = req.body;

    // Validate required fields
    if (!ownerId || !targetUserId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'Both ownerId and targetUserId are required'
      });
    }

    // Check if requester is owner
    const isOwner = await isUserOwner(ownerId);
    if (!isOwner) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized',
        message: 'Only the owner can remove admins'
      });
    }

    // Check if target user exists and is admin
    const { data: targetUser, error: userError } = await supabase
      .from('users')
      .select('id, role, username')
      .eq('id', targetUserId)
      .single();

    if (userError || !targetUser) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        message: 'The specified user does not exist'
      });
    }

    // Check if user is admin
    if (targetUser.role !== 'admin') {
      return res.status(400).json({
        success: false,
        error: 'Invalid operation',
        message: 'User is not an admin'
      });
    }

    // Update user role to regular user
    const { error: updateError } = await supabase
      .from('users')
      .update({ role: 'user' })
      .eq('id', targetUserId);

    if (updateError) {
      console.error('❌ Error updating user role:', updateError);
      return res.status(500).json({
        success: false,
        error: 'Database error',
        message: 'Failed to update user role'
      });
    }

    // Remove the admin from cache
    await adminCache.removeAdminFromCache(targetUserId);

    console.log(`✅ Owner ${ownerId} demoted admin ${targetUserId} (${targetUser.username}) to regular user`);

    res.json({
      success: true,
      message: 'Admin removed successfully',
      data: {
        userId: targetUserId,
        username: targetUser.username,
        newRole: 'user',
        demotedBy: ownerId,
        timestamp: new Date()
      }
    });

  } catch (error) {
    console.error('Remove admin failed:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to remove admin'
    });
  }
});

/**
 * @route GET /api/v1/owner/admins
 * @desc Get list of all admins
 * @access Owner only
 * @returns 200 - List of admins
 * @returns 403 - Unauthorized (not owner)
 */
router.get('/admins', ownerAuth, async (req: Request, res: Response) => {
  try {
    const { ownerId } = req.query;

    // Validate required fields
    if (!ownerId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'ownerId query parameter is required'
      });
    }

    // Check if requester is owner
    const isOwner = await isUserOwner(ownerId as string);
    if (!isOwner) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized',
        message: 'Only the owner can view admin list'
      });
    }

    // Get all admins from cache
    const admins = await adminCache.getAdmins();
    const adminList = admins.filter(admin => admin.role === 'admin');

    res.json({
      success: true,
      data: {
        admins: adminList,
        totalCount: adminList.length,
        approvalThreshold: APPROVAL_THRESHOLD_PERCENTAGE,
        timestamp: new Date()
      }
    });

  } catch (error) {
    console.error('Get admins failed:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to get admin list'
    });
  }
});

/**
 * @route POST /api/v1/owner/force-update
 * @desc Owner can force an immediate update (bypasses democratic voting)
 * @access Owner only
 * @returns 200 - Update initiated successfully
 * @returns 403 - Unauthorized (not owner)
 * @returns 409 - Update already in progress
 * @returns 429 - Rate limited (too soon after last update)
 */
router.post('/force-update', ownerAuth, async (req: Request, res: Response) => {
  try {
    // Owner is already authenticated via middleware
    const ownerId = req.user!.id;

    // Defense in depth: Verify user is actually the owner
    const isOwner = await isUserOwner(ownerId);
    if (!isOwner) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized',
        message: 'Only the owner can force updates'
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

    // Check time restrictions (2-hour cooldown)
    const now = new Date();
    const lastUpdate = status.lastUpdateTime || new Date(0); // Default to epoch if null
    const timeSinceLastUpdate = now.getTime() - lastUpdate.getTime();
    const twoHoursInMs = 2 * 60 * 60 * 1000;

    if (timeSinceLastUpdate < twoHoursInMs) {
      const remainingTime = Math.ceil((twoHoursInMs - timeSinceLastUpdate) / (60 * 1000));
      return res.status(429).json({
        success: false,
        error: 'Rate limited',
        message: `Must wait ${remainingTime} minutes before next update`,
        remainingMinutes: remainingTime
      });
    }

    // Check scheduled update buffer (1 hour before/after 3 AM PST)
    const scheduledUpdateHour = 3; // 3 AM PST
    const currentHour = now.getHours();
    const bufferHours = 1;
    
    if (currentHour >= (scheduledUpdateHour - bufferHours) && 
        currentHour <= (scheduledUpdateHour + bufferHours)) {
      return res.status(429).json({
        success: false,
        error: 'Scheduled update buffer',
        message: 'Updates are restricted 1 hour before/after scheduled daily update (3 AM PST)'
      });
    }

    // Queue the owner's force update request
    const queued = await requestQueue.enqueue({
      requesterId: ownerId,
      requesterName: 'Owner',
      type: 'owner',
      data: {
        bypassDemocratic: true,
        ownerInitiated: true,
        forceUpdate: true
      }
    });

    if (!queued) {
      return res.status(503).json({
        success: false,
        error: 'Queue full',
        message: 'Request queue is currently full'
      });
    }

    console.log(`✅ Owner ${ownerId} initiated force update`);

    res.json({
      success: true,
      message: 'Force update initiated successfully',
      data: {
        requestType: 'force_update',
        initiatedBy: ownerId,
        bypassDemocratic: true,
        timestamp: new Date(),
        queueStatus: 'enqueued'
      }
    });

  } catch (error) {
    console.error('Force update failed:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to initiate force update'
    });
  }
});

/**
 * @route POST /api/v1/owner/veto-request/:requestId
 * @desc Owner can veto/reject any pending request
 * @access Owner only
 * @returns 200 - Request vetoed successfully
 * @returns 403 - Unauthorized (not owner)
 * @returns 404 - Request not found
 * @returns 400 - Request not in pending status
 */
router.post('/veto-request/:requestId', ownerAuth, async (req: Request, res: Response) => {
  try {
    const { requestId } = req.params;
    const { ownerId } = req.body;

    // Validate required fields
    if (!ownerId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'ownerId is required'
      });
    }

    // Check if requester is owner
    const isOwner = await isUserOwner(ownerId);
    if (!isOwner) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized',
        message: 'Only the owner can veto requests'
      });
    }

    // Get the request from admin storage
    if (!activeUpdateRequests) {
      return res.status(503).json({
        success: false,
        error: 'Service unavailable',
        message: 'Admin request storage is not initialized'
      });
    }

    const updateRequest = activeUpdateRequests.get(requestId);
    if (!updateRequest) {
      return res.status(404).json({
        success: false,
        error: 'Request not found',
        message: 'The specified update request does not exist or has expired'
      });
    }

    // Check if request is in pending status
    if (updateRequest.status !== 'pending') {
      return res.status(400).json({
        success: false,
        error: 'Invalid request status',
        message: `Request is ${updateRequest.status}, only pending requests can be vetoed`
      });
    }

    // Update request status to rejected
    updateRequest.status = 'rejected';
    updateRequest.ownerVetoedBy = ownerId;
    updateRequest.ownerVetoedAt = new Date();
    updateRequest.rejectionReason = 'Owner veto';

    console.log(`✅ Owner ${ownerId} vetoed request ${requestId}`);

    res.json({
      success: true,
      message: 'Request vetoed successfully',
      data: {
        requestId,
        previousStatus: 'pending',
        newStatus: 'rejected',
        vetoedBy: ownerId,
        vetoedAt: updateRequest.ownerVetoedAt,
        rejectionReason: 'Owner veto'
      }
    });

  } catch (error) {
    console.error('Veto request failed:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to veto request'
    });
  }
});

/**
 * @route POST /api/v1/owner/approve-request/:requestId
 * @desc Owner can approve any pending request (overrides democratic voting)
 * @access Owner only
 * @returns 200 - Request approved successfully
 * @returns 403 - Unauthorized (not owner)
 * @returns 404 - Request not found
 * @returns 400 - Request not in pending status
 */
router.post('/approve-request/:requestId', ownerAuth, async (req: Request, res: Response) => {
  try {
    const { requestId } = req.params;
    const { ownerId } = req.body;

    // Validate required fields
    if (!ownerId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'ownerId is required'
      });
    }

    // Check if requester is owner
    const isOwner = await isUserOwner(ownerId);
    if (!isOwner) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized',
        message: 'Only the owner can approve requests'
      });
    }

    // Get the request from admin storage
    if (!activeUpdateRequests) {
      return res.status(503).json({
        success: false,
        error: 'Service unavailable',
        message: 'Admin request storage is not initialized'
      });
    }

    const updateRequest = activeUpdateRequests.get(requestId);
    if (!updateRequest) {
      return res.status(404).json({
        success: false,
        error: 'Request not found',
        message: 'The specified update request does not exist or has expired'
      });
    }

    // Check if request is in pending status
    if (updateRequest.status !== 'pending') {
      return res.status(400).json({
        success: false,
        error: 'Invalid request status',
        message: `Request is ${updateRequest.status}, only pending requests can be approved`
      });
    }

    // Check time restrictions (same as force update)
    const now = new Date();
    const lastUpdate = dailyUpdateService.getUpdateStatus().lastUpdateTime || new Date(0);
    const timeSinceLastUpdate = now.getTime() - lastUpdate.getTime();
    const twoHoursInMs = 2 * 60 * 60 * 1000;

    if (timeSinceLastUpdate < twoHoursInMs) {
      const remainingTime = Math.ceil((twoHoursInMs - timeSinceLastUpdate) / (60 * 1000));
      return res.status(429).json({
        success: false,
        error: 'Rate limited',
        message: `Must wait ${remainingTime} minutes before next update`,
        remainingMinutes: remainingTime
      });
    }

    // Check scheduled update buffer (1 hour before/after 3 AM PST)
    const scheduledUpdateHour = 3; // 3 AM PST
    const currentHour = now.getHours();
    const bufferHours = 1;
    
    if (currentHour >= (scheduledUpdateHour - bufferHours) && 
        currentHour <= (scheduledUpdateHour + bufferHours)) {
      return res.status(429).json({
        success: false,
        error: 'Scheduled update buffer',
        message: 'Updates are restricted 1 hour before/after scheduled daily update (3 AM PST)'
      });
    }

    // Update request status to approved
    updateRequest.status = 'approved';
    updateRequest.ownerApprovedBy = ownerId;
    updateRequest.ownerApprovedAt = new Date();

    // Queue the approved request for execution
    const queued = await requestQueue.enqueue({
      requesterId: updateRequest.requesterId,
      requesterName: updateRequest.requesterName,
      type: 'owner',
      data: {
        bypassDemocratic: true,
        ownerApproved: true,
        originalRequestId: requestId
      }
    });

    if (!queued) {
      // Revert the status change if queueing failed
      updateRequest.status = 'pending';
      delete updateRequest.ownerApprovedBy;
      delete updateRequest.ownerApprovedAt;
      
      return res.status(503).json({
        success: false,
        error: 'Queue full',
        message: 'Request queue is currently full, approval failed'
      });
    }

    console.log(`✅ Owner ${ownerId} approved request ${requestId}`);

    res.json({
      success: true,
      message: 'Request approved and queued successfully',
      data: {
        requestId,
        previousStatus: 'pending',
        newStatus: 'approved',
        approvedBy: ownerId,
        approvedAt: updateRequest.ownerApprovedAt,
        queueStatus: 'enqueued'
      }
    });

  } catch (error) {
    console.error('Approve request failed:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to approve request'
    });
  }
});

/**
 * @route GET /api/v1/owner/stats
 * @desc Get owner dashboard statistics
 * @access Owner only
 * @returns 200 - Owner dashboard stats
 * @returns 403 - Unauthorized (not owner)
 */
router.get('/stats', ownerAuth, async (req: Request, res: Response) => {
  try {
    const { ownerId } = req.query;

    // Validate required fields
    if (!ownerId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'ownerId query parameter is required'
      });
    }

    // Check if requester is owner
    const isOwner = await isUserOwner(ownerId as string);
    if (!isOwner) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized',
        message: 'Only the owner can view dashboard stats'
      });
    }

    // Get comprehensive statistics
    const adminCount = await adminCache.getAdminCount();
    const updateStatus = dailyUpdateService.getUpdateStatus();
    const queueStats = requestQueue.getStats();
    const processorStats = queueProcessor.getStats();

    res.json({
      success: true,
      data: {
        adminManagement: {
          totalAdmins: adminCount,
          approvalThreshold: APPROVAL_THRESHOLD_PERCENTAGE
        },
        updateSystem: {
          isUpdating: updateStatus.isUpdating,
          lastUpdateTime: updateStatus.lastUpdateTime,
          stats: updateStatus.stats
        },
        requestQueue: {
          queueSize: queueStats.queueSize,
          maxQueueSize: queueStats.maxQueueSize,
          isProcessing: queueStats.isProcessing,
          totalProcessed: queueStats.totalProcessed
        },
        queueProcessor: {
          isProcessing: processorStats.isProcessing,
          totalExecutions: processorStats.totalExecutions,
          averageExecutionTime: processorStats.averageExecutionTime
        },
        timestamp: new Date()
      }
    });

  } catch (error) {
    console.error('Get owner stats failed:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to get owner stats'
    });
  }
});

// Initialize the Map reference from admin.ts
// This needs to be done after both modules are loaded
import { getActiveUpdateRequestsMap } from './admin';
try {
  setActiveUpdateRequestsMap(getActiveUpdateRequestsMap());
  console.log('✅ Owner routes: Connected to admin request storage');
} catch (error) {
  console.warn('⚠️ Owner routes: Failed to connect to admin request storage:', error);
}

export default router;
