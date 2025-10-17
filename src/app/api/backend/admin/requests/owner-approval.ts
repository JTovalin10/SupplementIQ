/**
 * Owner approval routes for update requests
 */

import { Request, Response, Router } from 'express';
import { requestQueue } from '../../../lib/core/request-queue';
import { dailyUpdateService } from '../../../lib/services/daily-update-service';
import { hasCooldownPassed, isUserOwner, isWithinUpdateWindow } from '../utils';
import { activeUpdateRequests } from './index';

const router = Router();

/**
 * @route POST /api/v1/admin/requests/:requestId/owner-approve
 * @desc Owner approval for a pending update request
 * @access Owner only
 * @requires req.params.requestId - The update request ID
 * @requires Valid JWT token with owner role
 * @returns 200 - Owner approval recorded and update executed
 * @returns 400 - Request not found or already processed
 * @returns 403 - Unauthorized (not owner)
 * @returns 500 - Approval failed
 */
router.post('/:requestId/owner-approve', async (req: Request, res: Response) => {
  try {
    const { requestId } = req.params;
    
    // Get authenticated user info from JWT token (defense layer 1)
    const confirmingOwnerId = req.user!.id;
    const ownerName = req.user!.username || req.user!.email;
    
    // Defense layer 2: Verify the authenticated user exists and has proper role
    if (!confirmingOwnerId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        message: 'Valid authentication token required'
      });
    }
    
    if (!ownerName) {
      return res.status(400).json({
        success: false,
        error: 'User information incomplete',
        message: 'Username or email is required for approval identification'
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
    
    // Check time-based restrictions
    const lastUpdateTime = dailyUpdateService.getLastUpdateTime();
    if (lastUpdateTime && !hasCooldownPassed(lastUpdateTime)) {
      return res.status(429).json({
        success: false,
        error: 'Cooldown period active',
        message: 'Must wait 2 hours between updates'
      });
    }
    
    // Check if within scheduled update window
    if (isWithinUpdateWindow()) {
      return res.status(409).json({
        success: false,
        error: 'Scheduled update window',
        message: 'Cannot execute updates within 1 hour of scheduled daily update (3:00 AM)'
      });
    }
    
    // Approve the request
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
        message: 'Request approved but system is busy. Will be processed shortly.'
      });
    }
    
    // Remove from pending requests
    activeUpdateRequests.delete(requestId);
    
    res.json({
      success: true,
      message: 'Owner approval recorded and request queued for execution',
      data: {
        requestId,
        status: 'approved',
        ownerApprovedBy: ownerName,
        ownerApprovedAt: updateRequest.ownerApprovedAt,
        queued
      }
    });

  } catch (error) {
    console.error('Failed to record owner approval:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to record owner approval'
    });
  }
});

/**
 * @route POST /api/v1/admin/requests/:requestId/owner-reject
 * @desc Owner rejection for a pending update request
 * @access Owner only
 * @requires req.params.requestId - The update request ID
 * @requires req.body.ownerId - Owner ID confirming rejection
 * @requires req.body.ownerName - Owner name confirming rejection
 * @requires req.body.reason - Reason for rejection
 * @returns 200 - Owner rejection recorded
 * @returns 400 - Request not found or already processed
 * @returns 403 - Unauthorized (not owner)
 * @returns 500 - Rejection failed
 */
router.post('/:requestId/owner-reject', async (req: Request, res: Response) => {
  try {
    const { requestId } = req.params;
    const { ownerId: confirmingOwnerId, ownerName, reason } = req.body;
    
    if (!confirmingOwnerId || !ownerName || !reason) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'ownerId, ownerName, and reason are required'
      });
    }
    
    // Check if this is the owner
    const isOwner = await isUserOwner(confirmingOwnerId);
    if (!isOwner) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized',
        message: 'Only the owner can reject requests'
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
    
    // Reject the request
    updateRequest.status = 'rejected';
    updateRequest.ownerApprovedBy = ownerName;
    updateRequest.ownerApprovedAt = new Date();
    
    // Remove from pending requests
    activeUpdateRequests.delete(requestId);
    
    res.json({
      success: true,
      message: 'Owner rejection recorded',
      data: {
        requestId,
        status: 'rejected',
        ownerRejectedBy: ownerName,
        ownerRejectedAt: updateRequest.ownerApprovedAt,
        reason
      }
    });

  } catch (error) {
    console.error('Failed to record owner rejection:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to record owner rejection'
    });
  }
});

export { router as ownerApprovalRoutes };
