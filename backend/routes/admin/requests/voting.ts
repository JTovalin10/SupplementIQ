/**
 * Admin voting routes for update requests
 */

import { Request, Response, Router } from 'express';
import { requestQueue } from '../../../lib/core/request-queue';
import { getAdminCount, getUserAuthority } from '../utils';
import { activeUpdateRequests } from './index';

const router = Router();

/**
 * @route POST /api/v1/admin/requests/:requestId/vote
 * @desc Vote on a pending update request
 * @access Admin only
 * @requires req.params.requestId - The update request ID
 * @requires Valid JWT token with admin/owner role
 * @requires req.body.vote - Vote: 'approve' or 'reject'
 * @returns 200 - Vote recorded successfully
 * @returns 400 - Invalid vote or request not found
 * @returns 403 - Unauthorized admin
 * @returns 500 - Vote recording failed
 */
router.post('/:requestId/vote', async (req: Request, res: Response) => {
  try {
    const { requestId } = req.params;
    const { vote } = req.body;
    
    // Get authenticated user info from JWT token (defense layer 1)
    const adminId = req.user!.id;
    const adminName = req.user!.username || req.user!.email;
    
    // Defense layer 2: Verify the authenticated user exists and has proper role
    if (!adminId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        message: 'Valid authentication token required'
      });
    }
    
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
    
    // Check if user is authorized to vote (admin or owner)
    const { isAdmin, isOwner } = await getUserAuthority(req.user!.id);
    
    if (!isAdmin && !isOwner) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized',
        message: 'Only admins can vote on updates'
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
      return res.status(400).json({
        success: false,
        error: 'Already voted',
        message: 'Admin has already voted on this request'
      });
    }
    
    // Record the vote
    updateRequest.votes[adminId] = vote;
    updateRequest.voteCount++;
    
    if (vote === 'approve') {
      updateRequest.approveCount++;
    } else {
      updateRequest.rejectCount++;
    }
    
    // Check if request has enough votes for approval (75% approval required)
    const totalAdmins = await getAdminCount(); // Efficient count query
    const requiredApprovals = Math.ceil(totalAdmins * 0.75);
    
    if (updateRequest.approveCount >= requiredApprovals) {
      // Request approved by democratic vote
      updateRequest.status = 'approved';
      
      // Note: Democratic update flag is managed internally by the request system
      
      // Queue the approved request for execution
      const queued = await requestQueue.enqueue({
        requesterId: updateRequest.requesterId,
        requesterName: updateRequest.requesterName,
        type: 'democratic',
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
        message: 'Request approved by democratic vote and queued for execution',
        data: {
          requestId,
          status: 'approved',
          voteCount: updateRequest.voteCount,
          approveCount: updateRequest.approveCount,
          rejectCount: updateRequest.rejectCount,
          requiredApprovals,
          queued
        }
      });
    } else {
      // Still pending, just record the vote
      res.json({
        success: true,
        message: 'Vote recorded successfully',
        data: {
          requestId,
          status: 'pending',
          voteCount: updateRequest.voteCount,
          approveCount: updateRequest.approveCount,
          rejectCount: updateRequest.rejectCount,
          requiredApprovals,
          approvalPercentage: (updateRequest.approveCount / updateRequest.voteCount) * 100
        }
      });
    }

  } catch (error) {
    console.error('Failed to record vote:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to record vote'
    });
  }
});

/**
 * @route GET /api/v1/admin/requests/:requestId/vote-status/:adminId
 * @desc Check if an admin has voted on a specific request
 * @access Admin only
 * @requires req.params.requestId - The request ID
 * @requires req.params.adminId - The admin ID to check
 * @returns 200 - Vote status
 * @returns 404 - Request not found
 * @returns 500 - Failed to check vote status
 */
router.get('/:requestId/vote-status/:adminId', async (req: Request, res: Response) => {
  try {
    const { requestId, adminId } = req.params;
    
    const updateRequest = activeUpdateRequests.get(requestId);
    if (!updateRequest) {
      return res.status(404).json({
        success: false,
        error: 'Request not found',
        message: 'Update request not found or has expired'
      });
    }
    
    const hasVoted = !!updateRequest.votes[adminId];
    const vote = updateRequest.votes[adminId];
    
    res.json({
      success: true,
      data: {
        requestId,
        adminId,
        hasVoted,
        vote: vote || null,
        voteCount: updateRequest.voteCount,
        approveCount: updateRequest.approveCount,
        rejectCount: updateRequest.rejectCount
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

export { router as votingRoutes };
