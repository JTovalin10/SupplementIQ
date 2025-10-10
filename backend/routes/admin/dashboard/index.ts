/**
 * Admin dashboard routes
 * Provides comprehensive dashboard data for admins and owners
 */

import { Request, Response, Router } from 'express';
import { adminCache } from '../../../lib/core/admin-cache';
import { supabase } from '../../../lib/supabase';

const router = Router();

// Apply admin authentication to dashboard routes
router.use(adminAuth);

/**
 * @route GET /api/v1/admin/dashboard/stats
 * @desc Get comprehensive dashboard statistics
 * @access Admin/Owner only
 * @returns 200 - Dashboard statistics
 * @returns 403 - Unauthorized
 * @returns 500 - Failed to get statistics
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    // Get user from auth middleware (would be set by adminAuth/ownerAuth)
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Authentication required'
      });
    }

    // Check if user is admin or owner
    const { isAdmin, isOwner } = await adminCache.getUserAuthority(userId);
    if (!isAdmin && !isOwner) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized',
        message: 'Admin or Owner access required'
      });
    }

    // Get user statistics
    const { data: usersData, error: usersError } = await supabase
      .from('users')
      .select('id, role')
      .eq('is_active', true);

    if (usersError) {
      console.error('Error fetching users:', usersError);
      throw new Error('Failed to fetch user statistics');
    }

    // Count users by role
    const userStats = {
      total: usersData?.length || 0,
      newcomers: usersData?.filter(u => u.role === 'newcomer').length || 0,
      contributors: usersData?.filter(u => u.role === 'contributor').length || 0,
      trusted_editors: usersData?.filter(u => u.role === 'trusted_editor').length || 0,
      moderators: usersData?.filter(u => u.role === 'moderator').length || 0,
      admins: usersData?.filter(u => u.role === 'admin').length || 0,
      owners: usersData?.filter(u => u.role === 'owner').length || 0
    };

    // Get product statistics
    const { data: productsData, error: productsError } = await supabase
      .from('products')
      .select('id, category, is_active');

    if (productsError) {
      console.error('Error fetching products:', productsError);
      throw new Error('Failed to fetch product statistics');
    }

    const productStats = {
      total: productsData?.length || 0,
      active: productsData?.filter(p => p.is_active).length || 0,
      byCategory: productsData?.reduce((acc: any, product) => {
        acc[product.category] = (acc[product.category] || 0) + 1;
        return acc;
      }, {}) || {}
    };

    // Get pending submissions (from product_moderation table or similar)
    const { data: pendingSubmissions, error: submissionsError } = await supabase
      .from('product_submissions')
      .select('id, status')
      .eq('status', 'pending');

    if (submissionsError) {
      console.error('Error fetching pending submissions:', submissionsError);
      // Don't throw error, just use empty array
    }

    // Get pending edits
    const { data: pendingEdits, error: editsError } = await supabase
      .from('product_edits')
      .select('id, status')
      .eq('status', 'pending');

    if (editsError) {
      console.error('Error fetching pending edits:', editsError);
      // Don't throw error, just use empty array
    }

    // Calculate recent activity (last 24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    const { data: recentActivity, error: activityError } = await supabase
      .from('product_submissions')
      .select('id, created_at')
      .gte('created_at', oneDayAgo);

    if (activityError) {
      console.error('Error fetching recent activity:', activityError);
      // Don't throw error, just use empty array
    }

    // System health metrics (for owners)
    let systemHealth = null;
    if (isOwner) {
      systemHealth = {
        databaseSize: '2.4 GB', // This would be calculated from actual DB
        apiCalls: 15420, // This would be tracked
        uptime: Math.floor(process.uptime()),
        memoryUsage: process.memoryUsage()
      };
    }

    res.json({
      success: true,
      data: {
        users: userStats,
        products: productStats,
        pendingSubmissions: pendingSubmissions || [],
        pendingEdits: pendingEdits || [],
        activity: {
          recentCount: recentActivity?.length || 0,
          last24Hours: recentActivity || []
        },
        ...(systemHealth && { systemHealth }),
        timestamp: new Date()
      }
    });

  } catch (error) {
    console.error('Failed to get dashboard statistics:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to get dashboard statistics'
    });
  }
});

/**
 * @route GET /api/v1/admin/dashboard/pending-submissions
 * @desc Get detailed pending submissions
 * @access Admin/Owner only
 * @returns 200 - Pending submissions
 * @returns 403 - Unauthorized
 * @returns 500 - Failed to get submissions
 */
router.get('/pending-submissions', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Authentication required'
      });
    }

    const { isAdmin, isOwner } = await adminCache.getUserAuthority(userId);
    if (!isAdmin && !isOwner) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized',
        message: 'Admin or Owner access required'
      });
    }

    // Get pending submissions with detailed information
    const { data: submissions, error } = await supabase
      .from('product_submissions')
      .select(`
        id,
        product_data,
        status,
        submitted_by,
        created_at,
        users!submitted_by(username, email)
      `)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching pending submissions:', error);
      throw new Error('Failed to fetch pending submissions');
    }

    // Transform the data to match frontend interface
    const transformedSubmissions = submissions?.map(submission => ({
      id: submission.id,
      productName: submission.product_data?.name || 'Unknown Product',
      brandName: submission.product_data?.brand || 'Unknown Brand',
      category: submission.product_data?.category || 'Unknown',
      submittedBy: submission.users?.[0]?.username || submission.submitted_by,
      submittedAt: submission.created_at,
      status: submission.status,
      productData: submission.product_data
    })) || [];

    res.json({
      success: true,
      data: transformedSubmissions
    });

  } catch (error) {
    console.error('Failed to get pending submissions:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to get pending submissions'
    });
  }
});

/**
 * @route GET /api/v1/admin/dashboard/recent-activity
 * @desc Get recent platform activity
 * @access Admin/Owner only
 * @returns 200 - Recent activity
 * @returns 403 - Unauthorized
 * @returns 500 - Failed to get activity
 */
router.get('/recent-activity', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Authentication required'
      });
    }

    const { isAdmin, isOwner } = await adminCache.getUserAuthority(userId);
    if (!isAdmin && !isOwner) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized',
        message: 'Admin or Owner access required'
      });
    }

    // Get recent activity from multiple sources
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const [submissions, edits, approvals] = await Promise.all([
      // Recent submissions
      supabase
        .from('product_submissions')
        .select('id, product_data, created_at, users!submitted_by(username)')
        .gte('created_at', oneDayAgo)
        .order('created_at', { ascending: false })
        .limit(10),
      
      // Recent edits
      supabase
        .from('product_edits')
        .select('id, product_data, created_at, users!edited_by(username)')
        .gte('created_at', oneDayAgo)
        .order('created_at', { ascending: false })
        .limit(10),
      
      // Recent approvals
      supabase
        .from('product_submissions')
        .select('id, product_data, updated_at, users!submitted_by(username)')
        .eq('status', 'approved')
        .gte('updated_at', oneDayAgo)
        .order('updated_at', { ascending: false })
        .limit(10)
    ]);

    // Combine and transform activities
    const activities: Array<{
      id: string;
      type: string;
      description: string;
      user: string;
      timestamp: string;
    }> = [];

    // Add submissions
    submissions.data?.forEach(submission => {
      activities.push({
        id: `submission-${submission.id}`,
        type: 'submission',
        description: `New product submission: "${submission.product_data?.name || 'Unknown Product'}"`,
        user: submission.users?.[0]?.username || 'Unknown User',
        timestamp: submission.created_at
      });
    });

    // Add edits
    edits.data?.forEach(edit => {
      activities.push({
        id: `edit-${edit.id}`,
        type: 'edit',
        description: `Product edit submitted: "${edit.product_data?.name || 'Unknown Product'}"`,
        user: edit.users?.[0]?.username || 'Unknown User',
        timestamp: edit.created_at
      });
    });

    // Add approvals
    approvals.data?.forEach(approval => {
      activities.push({
        id: `approval-${approval.id}`,
        type: 'approval',
        description: `Product approved: "${approval.product_data?.name || 'Unknown Product'}"`,
        user: approval.users?.[0]?.username || 'Unknown User',
        timestamp: approval.updated_at
      });
    });

    // Sort by timestamp and limit to 20 most recent
    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    const recentActivities = activities.slice(0, 20);

    res.json({
      success: true,
      data: recentActivities
    });

  } catch (error) {
    console.error('Failed to get recent activity:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to get recent activity'
    });
  }
});

export default router;
