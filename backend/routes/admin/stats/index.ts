/**
 * Admin statistics and monitoring routes
 */

import { Request, Response, Router } from 'express';
import { queueProcessor } from '../../../lib/core/queue-processor';
import { requestQueue } from '../../../lib/core/request-queue';
import { securityService } from '../../../lib/cpp-wrappers/security-tree';
import { dailyUpdateService } from '../../../lib/services/daily-update-service';
import { fileAutocompleteService } from '../../../lib/services/file-autocomplete';
import { activeUpdateRequests, democraticUpdateUsedToday, lastDemocraticUpdateDate } from '../requests';
import { isUserAdmin, isUserOwner } from '../utils';

const router = Router();

/**
 * @route GET /api/v1/admin/stats/overview
 * @desc Get comprehensive admin system statistics
 * @access Admin only
 * @returns 200 - Complete system statistics
 * @returns 403 - Unauthorized
 * @returns 500 - Failed to get statistics
 */
router.get('/overview', async (req: Request, res: Response) => {
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

    const isAdmin = await isUserAdmin(userId);
    const isOwner = await isUserOwner(userId);
    
    if (!isAdmin && !isOwner) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized',
        message: 'Admin access required'
      });
    }

    // Gather all statistics
    const [requestStats, autocompleteStats, securityStats, queueStats, processorStats] = await Promise.all([
      getRequestStats(),
      getAutocompleteStats(),
      getSecurityStats(),
      getQueueStats(),
      getProcessorStats()
    ]);

    res.json({
      success: true,
      data: {
        requests: requestStats,
        autocomplete: autocompleteStats,
        security: securityStats,
        queue: queueStats,
        processor: processorStats,
        system: {
          serverUptime: Math.floor(process.uptime()),
          memoryUsage: process.memoryUsage(),
          nodeVersion: process.version,
          timestamp: new Date()
        }
      }
    });

  } catch (error) {
    console.error('Failed to get overview statistics:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to get system statistics'
    });
  }
});

/**
 * @route GET /api/v1/admin/stats/requests
 * @desc Get request statistics
 * @access Admin only
 * @returns 200 - Request statistics
 * @returns 403 - Unauthorized
 * @returns 500 - Failed to get request stats
 */
router.get('/requests', async (req: Request, res: Response) => {
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

    const isAdmin = await isUserAdmin(userId);
    const isOwner = await isUserOwner(userId);
    
    if (!isAdmin && !isOwner) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized',
        message: 'Admin access required'
      });
    }

    const requestStats = getRequestStats();

    res.json({
      success: true,
      data: requestStats
    });

  } catch (error) {
    console.error('Failed to get request statistics:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to get request statistics'
    });
  }
});

/**
 * @route GET /api/v1/admin/stats/autocomplete
 * @desc Get autocomplete statistics
 * @access Admin only
 * @returns 200 - Autocomplete statistics
 * @returns 403 - Unauthorized
 * @returns 500 - Failed to get autocomplete stats
 */
router.get('/autocomplete', async (req: Request, res: Response) => {
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

    const isAdmin = await isUserAdmin(userId);
    const isOwner = await isUserOwner(userId);
    
    if (!isAdmin && !isOwner) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized',
        message: 'Admin access required'
      });
    }

    const autocompleteStats = await getAutocompleteStats();

    res.json({
      success: true,
      data: autocompleteStats
    });

  } catch (error) {
    console.error('Failed to get autocomplete statistics:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to get autocomplete statistics'
    });
  }
});

/**
 * @route GET /api/v1/admin/stats/security
 * @desc Get security statistics
 * @access Admin only
 * @returns 200 - Security statistics
 * @returns 403 - Unauthorized
 * @returns 500 - Failed to get security stats
 */
router.get('/security', async (req: Request, res: Response) => {
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

    const isAdmin = await isUserAdmin(userId);
    const isOwner = await isUserOwner(userId);
    
    if (!isAdmin && !isOwner) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized',
        message: 'Admin access required'
      });
    }

    const securityStats = await getSecurityStats();

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

// Helper functions to gather statistics
function getRequestStats() {
  const allRequests = Array.from(activeUpdateRequests.values());
  const totalRequests = allRequests.length;
  const pendingRequests = allRequests.filter(r => r.status === 'pending').length;
  const approvedRequests = allRequests.filter(r => r.status === 'approved').length;
  const rejectedRequests = allRequests.filter(r => r.status === 'rejected').length;
  const expiredRequests = allRequests.filter(r => r.status === 'expired').length;

  return {
    totalRequests,
    pendingRequests,
    approvedRequests,
    rejectedRequests,
    expiredRequests,
    democraticUpdateUsedToday,
    lastDemocraticUpdateDate
  };
}

async function getAutocompleteStats() {
  const fileStats = fileAutocompleteService.getStats();
  const updateStatus = dailyUpdateService.getUpdateStatus();
  
  return {
    ...fileStats,
    isUpdating: updateStatus.isUpdating,
    lastUpdateTime: updateStatus.lastUpdateTime,
    serverUptime: Math.floor(process.uptime()),
    memoryUsage: process.memoryUsage(),
    nodeVersion: process.version
  };
}

async function getSecurityStats() {
  const currentTimestamp = Math.floor(Date.now() / 1000);
  
  return {
    totalRequestsToday: securityService.getTotalRequestsToday(currentTimestamp),
    adminRequestCounts: {}, // This would be implemented based on security service capabilities
    canMakeRequest: true, // This would be dynamic based on current state
    hasAdminMadeRequestToday: false, // This would be dynamic
    currentTimestamp,
    securityPolicies: {
      timezone: 'PST/PDT',
      dailyResetTime: '12:00 AM PST/PDT',
      requestExpirationMinutes: 10,
      cooldownHours: 2,
      updateWindowBufferHours: 1
    }
  };
}

function getQueueStats() {
  return requestQueue.getStats();
}

function getProcessorStats() {
  return queueProcessor.getStats();
}

export { router as statsRoutes };
