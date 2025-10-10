/**
 * Admin security and validation routes
 */

import { Request, Response, Router } from 'express';
import { securityService } from '../../../lib/cpp-wrappers/security-tree';
import { isUserAdmin, isUserOwner, validateAdminId } from '../utils';

const router = Router();

/**
 * @route GET /api/v1/admin/security/stats
 * @desc Get security system statistics
 * @access Admin only
 * @returns 200 - Security statistics
 * @returns 403 - Unauthorized
 * @returns 500 - Failed to get security stats
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    // Check authorization (would typically use middleware)
    const { userId } = req.body; // This would come from auth middleware
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Authentication required'
      });
    }

    const isAdmin = await isUserAdmin(req.user.id);
    const isOwner = await isUserOwner(req.user.id);
    
    if (!isAdmin && !isOwner) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized',
        message: 'Admin access required'
      });
    }

    const currentTimestamp = Math.floor(Date.now() / 1000);
    
    const securityStats = {
      totalRequestsToday: securityService.getTotalRequestsToday(currentTimestamp),
      currentTimestamp,
      dayStartTimestamp: securityService.getDayStart(currentTimestamp),
      securityPolicies: {
        timezone: 'PST/PDT',
        dailyResetTime: '12:00 AM PST/PDT',
        requestExpirationMinutes: 10,
        cooldownHours: 2,
        updateWindowBufferHours: 1,
        adminDailyLimit: 1,
        democraticVoteThreshold: 0.75
      }
    };

    res.json({
      success: true,
      data: securityStats
    });

  } catch (error) {
    console.error('Failed to get security statistics:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to get security statistics'
    });
  }
});

/**
 * @route POST /api/v1/admin/security/validate-admin
 * @desc Validate admin ID and permissions
 * @access Public (for frontend validation)
 * @requires req.body.adminId - The admin ID to validate
 * @returns 200 - Validation result
 * @returns 400 - Invalid admin ID format
 * @returns 500 - Validation failed
 */
router.post('/validate-admin', async (req: Request, res: Response) => {
  try {
    const { adminId } = req.body;
    
    if (!adminId) {
      return res.status(400).json({
        success: false,
        error: 'Missing admin ID',
        message: 'adminId is required'
      });
    }

    // Validate format
    if (!validateAdminId(adminId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid admin ID',
        message: 'Invalid admin ID format'
      });
    }

    // Check if user exists and has admin role
    const isAdmin = await isUserAdmin(req.user.id);
    const isOwner = await isUserOwner(req.user.id);
    const hasAccess = isAdmin || isOwner;

    res.json({
      success: true,
      data: {
        adminId,
        isValidFormat: true,
        isAdmin,
        isOwner,
        hasAccess,
        role: isOwner ? 'owner' : isAdmin ? 'admin' : 'user'
      }
    });

  } catch (error) {
    console.error('Failed to validate admin:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to validate admin'
    });
  }
});

/**
 * @route GET /api/v1/admin/security/can-make-request/:adminId
 * @desc Check if admin can make a new request
 * @access Admin only
 * @requires req.params.adminId - The admin ID to check
 * @returns 200 - Request permission status
 * @returns 403 - Unauthorized
 * @returns 500 - Failed to check permission
 */
router.get('/can-make-request/:adminId', async (req: Request, res: Response) => {
  try {
    const { adminId } = req.params;
    
    // Check authorization (would typically use middleware)
    const { userId } = req.body; // This would come from auth middleware
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Authentication required'
      });
    }

    const isAdmin = await isUserAdmin(req.user.id);
    const isOwner = await isUserOwner(req.user.id);
    
    if (!isAdmin && !isOwner) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized',
        message: 'Admin access required'
      });
    }

    const currentTimestamp = Math.floor(Date.now() / 1000);
    const canMakeRequest = securityService.canMakeRequest(adminId, currentTimestamp);
    const hasAdminMadeRequestToday = securityService.hasAdminMadeRequestToday(adminId, currentTimestamp);
    const adminRequestCountToday = securityService.getAdminRequestCountToday(adminId, currentTimestamp);

    res.json({
      success: true,
      data: {
        adminId,
        canMakeRequest,
        hasAdminMadeRequestToday,
        adminRequestCountToday,
        currentTimestamp,
        dayStartTimestamp: securityService.getDayStart(currentTimestamp)
      }
    });

  } catch (error) {
    console.error('Failed to check request permission:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to check request permission'
    });
  }
});

/**
 * @route GET /api/v1/admin/security/admin-stats/:adminId
 * @desc Get statistics for a specific admin
 * @access Admin only
 * @requires req.params.adminId - The admin ID to get stats for
 * @returns 200 - Admin statistics
 * @returns 403 - Unauthorized
 * @returns 500 - Failed to get admin stats
 */
router.get('/admin-stats/:adminId', async (req: Request, res: Response) => {
  try {
    const { adminId } = req.params;
    
    // Check authorization (would typically use middleware)
    const { userId } = req.body; // This would come from auth middleware
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Authentication required'
      });
    }

    const isAdmin = await isUserAdmin(req.user.id);
    const isOwner = await isUserOwner(req.user.id);
    
    if (!isAdmin && !isOwner) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized',
        message: 'Admin access required'
      });
    }

    const currentTimestamp = Math.floor(Date.now() / 1000);
    
    const adminStats = {
      adminId,
      hasAdminMadeRequestToday: securityService.hasAdminMadeRequestToday(adminId, currentTimestamp),
      adminRequestCountToday: securityService.getAdminRequestCountToday(adminId, currentTimestamp),
      canMakeRequest: securityService.canMakeRequest(adminId, currentTimestamp),
      currentTimestamp,
      dayStartTimestamp: securityService.getDayStart(currentTimestamp),
      isValidAdmin: await isUserAdmin(adminId),
      isOwner: await isUserOwner(req.user.id)
    };

    res.json({
      success: true,
      data: adminStats
    });

  } catch (error) {
    console.error('Failed to get admin statistics:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to get admin statistics'
    });
  }
});

/**
 * @route POST /api/v1/admin/security/cleanup-expired
 * @desc Manually trigger cleanup of expired requests
 * @access Owner only
 * @requires req.body.ownerId - Owner ID confirming cleanup
 * @returns 200 - Cleanup completed
 * @returns 403 - Unauthorized (not owner)
 * @returns 500 - Cleanup failed
 */
router.post('/cleanup-expired', async (req: Request, res: Response) => {
  try {
    const { ownerId } = req.body;
    
    // Check if this is the owner
    const isOwner = await isUserOwner(req.user.id);
    if (!isOwner) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized',
        message: 'Only the owner can trigger cleanup'
      });
    }

    const currentTimestamp = Math.floor(Date.now() / 1000);
    const cleanedCount = securityService.cleanupExpiredRequests(currentTimestamp);

    res.json({
      success: true,
      message: 'Expired requests cleaned up successfully',
      data: {
        cleanedCount,
        currentTimestamp,
        timestamp: new Date()
      }
    });

  } catch (error) {
    console.error('Failed to cleanup expired requests:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to cleanup expired requests'
    });
  }
});

export { router as securityRoutes };
