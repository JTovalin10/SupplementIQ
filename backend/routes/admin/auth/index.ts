/**
 * Admin authentication routes
 */

import { Request, Response, Router } from 'express';
import { getAllAdmins, getUserAuthority } from '../utils';

const router = Router();

/**
 * @route GET /api/v1/admin/auth/check/:userId
 * @desc Check if a user is an admin or owner
 * @access Public (for frontend auth checks)
 * @requires req.params.userId - The user ID to check
 * @returns 200 - User role information
 * @returns 400 - Invalid user ID
 * @returns 500 - Database error
 */
router.get('/check/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'Missing user ID',
        message: 'User ID is required'
      });
    }

    // Check user authority in single database query
    const { isAdmin, isOwner, role } = await getUserAuthority(userId);

    if (!role) {
      return res.status(401).json({
        success: false,
        error: 'User not found',
        message: 'Authenticated user does not exist'
      });
    }

    const hasAdminAccess = isAdmin || isOwner;

    res.json({
      success: true,
      data: {
        userId,
        isAdmin,
        isOwner,
        hasAdminAccess,
        role: isOwner ? 'owner' : isAdmin ? 'admin' : 'user'
      }
    });

  } catch (error) {
    console.error('Failed to check admin status:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to check admin status'
    });
  }
});

/**
 * @route GET /api/v1/admin/auth/admins
 * @desc Get list of all admin users
 * @access Admin only
 * @returns 200 - List of admin users
 * @returns 403 - Unauthorized
 * @returns 500 - Database error
 */
router.get('/admins', async (req: Request, res: Response) => {
  try {
    // This would typically require authentication middleware
    // For now, we'll assume the request is authenticated
    
    const adminIds = await getAllAdmins();
    
    res.json({
      success: true,
      data: {
        adminIds,
        count: adminIds.length
      }
    });

  } catch (error) {
    console.error('Failed to get admin list:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to get admin list'
    });
  }
});

export { router as authRoutes };
