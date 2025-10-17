/**
 * Admin queue management routes
 */

import { Request, Response, Router } from 'express';
import { queueProcessor } from '../../../lib/core/queue-processor';
import { requestQueue } from '../../../lib/core/request-queue';
import { isUserAdmin, isUserOwner } from '../utils';

const router = Router();

/**
 * @route GET /api/v1/admin/queue/status
 * @desc Get current queue status and contents
 * @access Admin only
 * @returns 200 - Queue status and contents
 * @returns 403 - Unauthorized
 * @returns 500 - Failed to get queue status
 */
router.get('/status', async (req: Request, res: Response) => {
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

    const queueStats = requestQueue.getStats();
    const queueContents = requestQueue.getQueue();
    const processorStats = queueProcessor.getStats();

    res.json({
      success: true,
      data: {
        queue: {
          ...queueStats,
          contents: queueContents
        },
        processor: processorStats,
        isHealthy: requestQueue.isHealthy()
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
 * @route POST /api/v1/admin/queue/force-process
 * @desc Manually trigger queue processing
 * @access Admin only
 * @returns 200 - Queue processing triggered
 * @returns 403 - Unauthorized
 * @returns 500 - Failed to trigger processing
 */
router.post('/force-process', async (req: Request, res: Response) => {
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

    // Force queue processing
    await requestQueue.forceProcess();
    
    res.json({
      success: true,
      message: 'Queue processing triggered successfully',
      data: {
        processed: true,
        timestamp: new Date()
      }
    });

  } catch (error) {
    console.error('Failed to force queue processing:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to trigger queue processing'
    });
  }
});

/**
 * @route POST /api/v1/admin/queue/clear
 * @desc Clear the queue (owner only)
 * @access Owner only
 * @requires req.body.ownerId - Owner ID confirming clear
 * @returns 200 - Queue cleared successfully
 * @returns 403 - Unauthorized (not owner)
 * @returns 500 - Failed to clear queue
 */
router.post('/clear', async (req: Request, res: Response) => {
  try {
    const { ownerId, userId } = req.body;
    
    // Check if this is the owner
    const isOwner = await isUserOwner(ownerId || userId);
    if (!isOwner) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized',
        message: 'Only the owner can clear the queue'
      });
    }

    const clearedCount = requestQueue.clearQueue();
    
    res.json({
      success: true,
      message: 'Queue cleared successfully',
      data: {
        clearedRequests: clearedCount,
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
 * @route GET /api/v1/admin/queue/processor-stats
 * @desc Get queue processor execution statistics
 * @access Admin only
 * @returns 200 - Processor statistics
 * @returns 403 - Unauthorized
 * @returns 500 - Failed to get processor stats
 */
router.get('/processor-stats', async (req: Request, res: Response) => {
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

    const processorStats = queueProcessor.getStats();
    const executionHistory = queueProcessor.getExecutionHistory();

    res.json({
      success: true,
      data: {
        processor: processorStats,
        executionHistory,
        lastExecuted: executionHistory.length > 0 ? executionHistory[executionHistory.length - 1] : null
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

export { router as queueRoutes };
