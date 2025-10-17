/**
 * Product moderation routes for trusted editors, moderators, admins, and owners
 * Handles product approval, editing, and management based on user roles
 */

import { Request, Response, Router } from 'express';
import { supabase } from '../../../lib/supabase';
import {
    adminAuth,
    moderatorAuth,
    ownerAuth
} from '../../../middleware/auth';

const router = Router();

// Role definitions
enum UserRole {
  NEWCOMER = 'newcomer',           // < 20 contributions
  CONTRIBUTOR = 'contributor',     // 20-100 contributions  
  TRUSTED_EDITOR = 'trusted_editor', // 100+ contributions
  MODERATOR = 'moderator',         // 1000+ contributions + community respect
  ADMIN = 'admin',                 // Can ban users, request deletions
  OWNER = 'owner'                  // Final authority on deletions
}

interface ProductSubmission {
  id: string;
  productDetails: any;
  submittedBy: string;
  submittedAt: Date;
  status: 'pending' | 'approved' | 'rejected';
  reviewedBy?: string;
  reviewedAt?: Date;
  reviewNotes?: string;
}

interface ProductEdit {
  id: string;
  productId: string;
  editDetails: any;
  editedBy: string;
  editedAt: Date;
  status: 'pending' | 'approved' | 'rejected';
  reviewedBy?: string;
  reviewedAt?: Date;
  reviewNotes?: string;
  originalData?: any;
}

// Store pending submissions and edits (in production, use database)
const pendingSubmissions = new Map<string, ProductSubmission>();
const pendingEdits = new Map<string, ProductEdit>();
const contributionCounts = new Map<string, number>();

// Rate limiting for admin deletions (30 seconds between deletions)
const adminDeletionTimestamps = new Map<string, number>();

// Rate limiting for moderator approvals/rejections (30 seconds between actions)
const moderatorActionTimestamps = new Map<string, number>();

/**
 * @route GET /api/v1/admin/products/pending
 * @desc Get all pending product submissions and edits
 * @access Moderator+ (1000+ contributions + community respect/admin approval)
 */
router.get('/pending', moderatorAuth, async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;
    const userRole = await getUserRole(userId);
    
    if (!canViewPending(userRole)) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        message: 'Moderator role or higher required'
      });
    }

    const submissions = Array.from(pendingSubmissions.values())
      .filter(s => s.status === 'pending');
    const edits = Array.from(pendingEdits.values())
      .filter(e => e.status === 'pending');

    res.json({
      success: true,
      data: {
        submissions,
        edits,
        userRole,
        permissions: getUserPermissions(userRole)
      }
    });

  } catch (error) {
    console.error('Get pending products error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to fetch pending products'
    });
  }
});

/**
 * @route POST /api/v1/admin/products/submissions/:id/approve
 * @desc Approve a product submission
 * @access Moderator+ (1000+ contributions + community respect)
 */
router.post('/submissions/:id/approve', moderatorAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;
    const { reviewNotes } = req.body;

    const userRole = await getUserRole(userId);
    
    if (!canApproveSubmissions(userRole)) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        message: 'Moderator role or higher required'
      });
    }

    // Rate limiting for moderators only (30 seconds between approvals/rejections)
    // Admins and Owners can approve/reject at any time
    if (userRole === UserRole.MODERATOR) {
      const lastAction = moderatorActionTimestamps.get(userId) || 0;
      const now = Date.now();
      const timeSinceLastAction = now - lastAction;
      const thirtySeconds = 30 * 1000;

      if (timeSinceLastAction < thirtySeconds) {
        const remainingTime = Math.ceil((thirtySeconds - timeSinceLastAction) / 1000);
        return res.status(429).json({
          success: false,
          error: 'Rate limited',
          message: `Moderators must wait 30 seconds between actions to ensure proper review. Please wait ${remainingTime} more seconds.`,
          retryAfter: remainingTime
        });
      }
    }

    const submission = pendingSubmissions.get(id);
    if (!submission) {
      return res.status(404).json({
        success: false,
        error: 'Not found',
        message: 'Product submission not found'
      });
    }

    // Update submission status
    submission.status = 'approved';
    submission.reviewedBy = userId;
    submission.reviewedAt = new Date();
    submission.reviewNotes = reviewNotes;

    // Insert product into database
    const { data: product, error } = await supabase
      .from('products')
      .insert([submission.productDetails])
      .select()
      .single();

    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Database error',
        message: error.message
      });
    }

    // Increment contributor's contribution count
    incrementContributionCount(submission.submittedBy);

    // Update rate limiting timestamp for moderators only
    if (userRole === UserRole.MODERATOR) {
      moderatorActionTimestamps.set(userId, Date.now());
    }

    res.json({
      success: true,
      message: 'Product submission approved successfully',
      data: { product, submission }
    });

  } catch (error) {
    console.error('Approve submission error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to approve submission'
    });
  }
});

/**
 * @route POST /api/v1/admin/products/submissions/:id/reject
 * @desc Reject a product submission
 * @access Moderator+ (1000+ contributions + community respect)
 */
router.post('/submissions/:id/reject', moderatorAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;
    const { reviewNotes } = req.body;

    const userRole = await getUserRole(userId);
    
    if (!canApproveSubmissions(userRole)) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        message: 'Moderator role or higher required'
      });
    }

    // Rate limiting for moderators only (30 seconds between approvals/rejections)
    // Admins and Owners can approve/reject at any time
    if (userRole === UserRole.MODERATOR) {
      const lastAction = moderatorActionTimestamps.get(userId) || 0;
      const now = Date.now();
      const timeSinceLastAction = now - lastAction;
      const thirtySeconds = 30 * 1000;

      if (timeSinceLastAction < thirtySeconds) {
        const remainingTime = Math.ceil((thirtySeconds - timeSinceLastAction) / 1000);
        return res.status(429).json({
          success: false,
          error: 'Rate limited',
          message: `Moderators must wait 30 seconds between actions to ensure proper review. Please wait ${remainingTime} more seconds.`,
          retryAfter: remainingTime
        });
      }
    }

    const submission = pendingSubmissions.get(id);
    if (!submission) {
      return res.status(404).json({
        success: false,
        error: 'Not found',
        message: 'Product submission not found'
      });
    }

    submission.status = 'rejected';
    submission.reviewedBy = userId;
    submission.reviewedAt = new Date();
    submission.reviewNotes = reviewNotes;

    // Update rate limiting timestamp for moderators only
    if (userRole === UserRole.MODERATOR) {
      moderatorActionTimestamps.set(userId, Date.now());
    }

    res.json({
      success: true,
      message: 'Product submission rejected',
      data: { submission }
    });

  } catch (error) {
    console.error('Reject submission error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to reject submission'
    });
  }
});

/**
 * @route POST /api/v1/admin/products/edits/:id/approve
 * @desc Approve a product edit
 * @access Moderator+ (1000+ contributions + community respect)
 */
router.post('/edits/:id/approve', moderatorAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;
    const { reviewNotes } = req.body;

    const userRole = await getUserRole(userId);
    
    if (!canApproveEdits(userRole)) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        message: 'Moderator role or higher required'
      });
    }

    // Rate limiting for moderators only (30 seconds between approvals/rejections)
    // Admins and Owners can approve/reject at any time
    if (userRole === UserRole.MODERATOR) {
      const lastAction = moderatorActionTimestamps.get(userId) || 0;
      const now = Date.now();
      const timeSinceLastAction = now - lastAction;
      const thirtySeconds = 30 * 1000;

      if (timeSinceLastAction < thirtySeconds) {
        const remainingTime = Math.ceil((thirtySeconds - timeSinceLastAction) / 1000);
        return res.status(429).json({
          success: false,
          error: 'Rate limited',
          message: `Moderators must wait 30 seconds between actions to ensure proper review. Please wait ${remainingTime} more seconds.`,
          retryAfter: remainingTime
        });
      }
    }

    const edit = pendingEdits.get(id);
    if (!edit) {
      return res.status(404).json({
        success: false,
        error: 'Not found',
        message: 'Product edit not found'
      });
    }

    edit.status = 'approved';
    edit.reviewedBy = userId;
    edit.reviewedAt = new Date();
    edit.reviewNotes = reviewNotes;

    // Apply the edit to the database
    const { data: product, error } = await supabase
      .from('products')
      .update(edit.editDetails)
      .eq('id', edit.productId)
      .select()
      .single();

    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Database error',
        message: error.message
      });
    }

    // Increment contributor's contribution count
    incrementContributionCount(edit.editedBy);

    // Update rate limiting timestamp for moderators only
    if (userRole === UserRole.MODERATOR) {
      moderatorActionTimestamps.set(userId, Date.now());
    }

    res.json({
      success: true,
      message: 'Product edit approved successfully',
      data: { product, edit }
    });

  } catch (error) {
    console.error('Approve edit error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to approve edit'
    });
  }
});

/**
 * @route POST /api/v1/admin/products/edits/:id/reject
 * @desc Reject a product edit
 * @access Moderator+ (1000+ contributions + community respect)
 */
router.post('/edits/:id/reject', moderatorAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;
    const { reviewNotes } = req.body;

    const userRole = await getUserRole(userId);
    
    if (!canApproveEdits(userRole)) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        message: 'Moderator role or higher required'
      });
    }

    // Rate limiting for moderators only (30 seconds between approvals/rejections)
    // Admins and Owners can approve/reject at any time
    if (userRole === UserRole.MODERATOR) {
      const lastAction = moderatorActionTimestamps.get(userId) || 0;
      const now = Date.now();
      const timeSinceLastAction = now - lastAction;
      const thirtySeconds = 30 * 1000;

      if (timeSinceLastAction < thirtySeconds) {
        const remainingTime = Math.ceil((thirtySeconds - timeSinceLastAction) / 1000);
        return res.status(429).json({
          success: false,
          error: 'Rate limited',
          message: `Moderators must wait 30 seconds between actions to ensure proper review. Please wait ${remainingTime} more seconds.`,
          retryAfter: remainingTime
        });
      }
    }

    const edit = pendingEdits.get(id);
    if (!edit) {
      return res.status(404).json({
        success: false,
        error: 'Not found',
        message: 'Product edit not found'
      });
    }

    edit.status = 'rejected';
    edit.reviewedBy = userId;
    edit.reviewedAt = new Date();
    edit.reviewNotes = reviewNotes;

    // Update rate limiting timestamp for moderators only
    if (userRole === UserRole.MODERATOR) {
      moderatorActionTimestamps.set(userId, Date.now());
    }

    res.json({
      success: true,
      message: 'Product edit rejected',
      data: { edit }
    });

  } catch (error) {
    console.error('Reject edit error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to reject edit'
    });
  }
});

/**
 * @route POST /api/v1/admin/products/users/:userId/ban
 * @desc Ban a user (Admin+ only)
 * @access Admin+ (cannot ban other admins/owners)
 */
router.post('/users/:userId/ban', ownerAuth, async (req: Request, res: Response) => {
  try {
    const { userId: targetUserId } = req.params;
    const { userId: adminId } = req.body;
    const { reason, duration } = req.body;

    const adminRole = await getUserRole(adminId);
    
    if (!canBanUsers(adminRole)) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        message: 'Admin role or higher required'
      });
    }

    const targetUserRole = await getUserRole(targetUserId);
    if (targetUserRole === UserRole.ADMIN || targetUserRole === UserRole.OWNER) {
      return res.status(403).json({
        success: false,
        error: 'Cannot ban user',
        message: 'Cannot ban administrators or owners'
      });
    }

    // Ban the user in database
    const { error } = await supabase
      .from('users')
      .update({ 
        role: 'banned',
        banned_at: new Date(),
        ban_reason: reason,
        ban_duration: duration
      })
      .eq('id', targetUserId);

    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Database error',
        message: error.message
      });
    }

    res.json({
      success: true,
      message: 'User banned successfully',
      data: { targetUserId, reason, duration }
    });

  } catch (error) {
    console.error('Ban user error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to ban user'
    });
  }
});

/**
 * @route POST /api/v1/admin/products/promote-moderator
 * @desc Promote user to moderator role (Admin+ only, requires 1000+ contributions)
 * @access Admin+ only (Moderators cannot promote other moderators)
 */
router.post('/promote-moderator', ownerAuth, async (req: Request, res: Response) => {
  try {
    const { userId: adminId } = req.body;
    const { targetUserId, reason } = req.body;

    const adminRole = await getUserRole(adminId);
    
    // Only Admins and Owners can promote to moderator (Moderators cannot)
    if (!canBanUsers(adminRole)) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        message: 'Admin role or higher required (Moderators cannot promote other users to moderator)'
      });
    }

    const targetUserRole = await getUserRole(targetUserId);
    const targetContributions = contributionCounts.get(targetUserId) || 0;

    if (targetContributions < 1000) {
      return res.status(400).json({
        success: false,
        error: 'Insufficient contributions',
        message: 'User must have 1000+ contributions to be promoted to moderator'
      });
    }

    if (targetUserRole === UserRole.MODERATOR || targetUserRole === UserRole.ADMIN || targetUserRole === UserRole.OWNER) {
      return res.status(400).json({
        success: false,
        error: 'Already has sufficient role',
        message: 'User already has moderator role or higher'
      });
    }

    // Update user role in database
    const { error } = await supabase
      .from('users')
      .update({ 
        role: 'moderator',
        promoted_at: new Date(),
        promoted_by: adminId,
        promotion_reason: reason
      })
      .eq('id', targetUserId);

    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Database error',
        message: error.message
      });
    }

    res.json({
      success: true,
      message: 'User promoted to moderator successfully',
      data: { 
        targetUserId, 
        newRole: 'moderator',
        contributions: targetContributions,
        promotedBy: adminId,
        reason
      }
    });

  } catch (error) {
    console.error('Promote moderator error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to promote user to moderator'
    });
  }
});

/**
 * @route POST /api/v1/admin/products/promote-admin
 * @desc Promote user directly to admin role (Owner only, requires 1000+ contributions)
 * @access Owner only
 */
router.post('/promote-admin', ownerAuth, async (req: Request, res: Response) => {
  try {
    const { userId: ownerId } = req.body;
    const { targetUserId, reason } = req.body;

    const ownerRole = await getUserRole(ownerId);
    
    if (ownerRole !== UserRole.OWNER) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        message: 'Owner role required to promote to admin'
      });
    }

    const targetUserRole = await getUserRole(targetUserId);
    const targetContributions = contributionCounts.get(targetUserId) || 0;

    if (targetContributions < 1000) {
      return res.status(400).json({
        success: false,
        error: 'Insufficient contributions',
        message: 'User must have 1000+ contributions to be promoted to admin'
      });
    }

    if (targetUserRole === UserRole.ADMIN || targetUserRole === UserRole.OWNER) {
      return res.status(400).json({
        success: false,
        error: 'Already has sufficient role',
        message: 'User already has admin role or higher'
      });
    }

    // Update user role in database
    const { error } = await supabase
      .from('users')
      .update({ 
        role: 'admin',
        promoted_at: new Date(),
        promoted_by: ownerId,
        promotion_reason: reason
      })
      .eq('id', targetUserId);

    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Database error',
        message: error.message
      });
    }

    res.json({
      success: true,
      message: 'User promoted to admin successfully',
      data: { 
        targetUserId, 
        newRole: 'admin',
        contributions: targetContributions,
        promotedBy: ownerId,
        reason
      }
    });

  } catch (error) {
    console.error('Promote admin error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to promote user to admin'
    });
  }
});

/**
 * @route POST /api/v1/admin/products/promote-moderator-override
 * @desc Override promote user to moderator role (Owner only, bypasses contribution requirement)
 * @access Owner only - Override access for special cases (lost accounts, etc.)
 */
router.post('/promote-moderator-override', ownerAuth, async (req: Request, res: Response) => {
  try {
    const { userId: ownerId } = req.body;
    const { targetUserId, reason, overrideCode } = req.body;

    const ownerRole = await getUserRole(ownerId);
    
    if (ownerRole !== UserRole.OWNER) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        message: 'Owner role required for moderator override promotion'
      });
    }

    // Verify override code (same as admin override)
    const validOverrideCode = process.env.ADMIN_OVERRIDE_CODE || 'SUPPLEMENTIQ_OWNER_2024';
    if (overrideCode !== validOverrideCode) {
      return res.status(403).json({
        success: false,
        error: 'Invalid override code',
        message: 'Override code required for moderator promotion bypass'
      });
    }

    const targetUserRole = await getUserRole(targetUserId);
    const targetContributions = contributionCounts.get(targetUserId) || 0;

    if (targetUserRole === UserRole.MODERATOR || targetUserRole === UserRole.ADMIN || targetUserRole === UserRole.OWNER) {
      return res.status(400).json({
        success: false,
        error: 'Already has sufficient role',
        message: 'User already has moderator role or higher'
      });
    }

    // Update user role in database with override flag
    const { error } = await supabase
      .from('users')
      .update({ 
        role: 'moderator',
        promoted_at: new Date(),
        promoted_by: ownerId,
        promotion_reason: reason,
        promotion_override: true,
        override_contributions: targetContributions
      })
      .eq('id', targetUserId);

    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Database error',
        message: error.message
      });
    }

    res.json({
      success: true,
      message: 'User promoted to moderator with override (contribution requirement bypassed)',
      data: { 
        targetUserId, 
        newRole: 'moderator',
        contributions: targetContributions,
        promotedBy: ownerId,
        reason,
        override: true,
        note: 'Promotion performed with owner override - contribution requirement bypassed'
      }
    });

  } catch (error) {
    console.error('Promote moderator override error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to promote user to moderator with override'
    });
  }
});

/**
 * @route POST /api/v1/admin/products/promote-admin-override
 * @desc Override promote user to admin role (Owner only, bypasses contribution requirement)
 * @access Owner only - Override access for special cases
 */
router.post('/promote-admin-override', ownerAuth, async (req: Request, res: Response) => {
  try {
    const { userId: ownerId } = req.body;
    const { targetUserId, reason, overrideCode } = req.body;

    const ownerRole = await getUserRole(ownerId);
    
    if (ownerRole !== UserRole.OWNER) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        message: 'Owner role required for admin override promotion'
      });
    }

    // Verify override code (you can set this to whatever you want)
    const validOverrideCode = process.env.ADMIN_OVERRIDE_CODE || 'SUPPLEMENTIQ_OWNER_2024';
    if (overrideCode !== validOverrideCode) {
      return res.status(403).json({
        success: false,
        error: 'Invalid override code',
        message: 'Override code required for admin promotion bypass'
      });
    }

    const targetUserRole = await getUserRole(targetUserId);
    const targetContributions = contributionCounts.get(targetUserId) || 0;

    if (targetUserRole === UserRole.ADMIN || targetUserRole === UserRole.OWNER) {
      return res.status(400).json({
        success: false,
        error: 'Already has sufficient role',
        message: 'User already has admin role or higher'
      });
    }

    // Update user role in database with override flag
    const { error } = await supabase
      .from('users')
      .update({ 
        role: 'admin',
        promoted_at: new Date(),
        promoted_by: ownerId,
        promotion_reason: reason,
        promotion_override: true,
        override_contributions: targetContributions
      })
      .eq('id', targetUserId);

    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Database error',
        message: error.message
      });
    }

    res.json({
      success: true,
      message: 'User promoted to admin with override (contribution requirement bypassed)',
      data: { 
        targetUserId, 
        newRole: 'admin',
        contributions: targetContributions,
        promotedBy: ownerId,
        reason,
        override: true,
        note: 'Promotion performed with owner override - contribution requirement bypassed'
      }
    });

  } catch (error) {
    console.error('Promote admin override error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to promote user to admin with override'
    });
  }
});

/**
 * @route POST /api/v1/admin/products/revoke-moderator
 * @desc Revoke moderator role from user (Admin+ only)
 * @access Admin+ only
 */
router.post('/revoke-moderator', adminAuth, async (req: Request, res: Response) => {
  try {
    const { userId: adminId } = req.body;
    const { targetUserId, reason } = req.body;

    const adminRole = await getUserRole(adminId);
    
    if (!canBanUsers(adminRole)) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        message: 'Admin role or higher required'
      });
    }

    const targetUserRole = await getUserRole(targetUserId);
    const targetContributions = contributionCounts.get(targetUserId) || 0;

    // Cannot revoke from admins or owners
    if (targetUserRole === UserRole.ADMIN || targetUserRole === UserRole.OWNER) {
      return res.status(400).json({
        success: false,
        error: 'Cannot revoke role',
        message: 'Cannot revoke admin or owner roles'
      });
    }

    // Cannot revoke from non-moderators
    if (targetUserRole !== UserRole.MODERATOR) {
      return res.status(400).json({
        success: false,
        error: 'User is not a moderator',
        message: 'User does not have moderator role to revoke'
      });
    }

    // Calculate new role based on contributions
    let newRole = UserRole.NEWCOMER;
    if (targetContributions >= 100) {
      newRole = UserRole.TRUSTED_EDITOR;
    } else if (targetContributions >= 20) {
      newRole = UserRole.CONTRIBUTOR;
    }

    // Update user role in database
    const { error } = await supabase
      .from('users')
      .update({ 
        role: newRole,
        role_revoked_at: new Date(),
        role_revoked_by: adminId,
        role_revocation_reason: reason
      })
      .eq('id', targetUserId);

    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Database error',
        message: error.message
      });
    }

    res.json({
      success: true,
      message: 'Moderator role revoked successfully',
      data: { 
        targetUserId, 
        previousRole: 'moderator',
        newRole,
        contributions: targetContributions,
        revokedBy: adminId,
        reason
      }
    });

  } catch (error) {
    console.error('Revoke moderator error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to revoke moderator role'
    });
  }
});

/**
 * @route DELETE /api/v1/admin/products/submissions/:id
 * @desc Delete a product submission (Admin+ only, rate limited to 1 per 30 seconds)
 * @access Admin+ only
 */
router.delete('/submissions/:id', adminAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { userId: adminId } = req.body;
    const { reason } = req.body;

    const adminRole = await getUserRole(adminId);
    
    if (!canBanUsers(adminRole)) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        message: 'Admin role or higher required'
      });
    }

    // Check rate limiting (30 seconds between deletions)
    const lastDeletion = adminDeletionTimestamps.get(adminId) || 0;
    const now = Date.now();
    const timeSinceLastDeletion = now - lastDeletion;
    const thirtySeconds = 30 * 1000;

    if (timeSinceLastDeletion < thirtySeconds) {
      const remainingTime = Math.ceil((thirtySeconds - timeSinceLastDeletion) / 1000);
      return res.status(429).json({
        success: false,
        error: 'Rate limited',
        message: `You can only delete one submission every 30 seconds. Please wait ${remainingTime} more seconds.`,
        retryAfter: remainingTime
      });
    }

    const submission = pendingSubmissions.get(id);
    if (!submission) {
      return res.status(404).json({
        success: false,
        error: 'Not found',
        message: 'Product submission not found'
      });
    }

    // Remove submission and update rate limit
    pendingSubmissions.delete(id);
    adminDeletionTimestamps.set(adminId, now);

    res.json({
      success: true,
      message: 'Product submission deleted successfully',
      data: { 
        submissionId: id,
        deletedBy: adminId,
        reason,
        deletedAt: new Date()
      }
    });

  } catch (error) {
    console.error('Delete submission error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to delete submission'
    });
  }
});

/**
 * @route DELETE /api/v1/admin/products/edits/:id
 * @desc Delete a product edit (Admin+ only, rate limited to 1 per 30 seconds)
 * @access Admin+ only
 */
router.delete('/edits/:id', adminAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { userId: adminId } = req.body;
    const { reason } = req.body;

    const adminRole = await getUserRole(adminId);
    
    if (!canBanUsers(adminRole)) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        message: 'Admin role or higher required'
      });
    }

    // Check rate limiting (30 seconds between deletions)
    const lastDeletion = adminDeletionTimestamps.get(adminId) || 0;
    const now = Date.now();
    const timeSinceLastDeletion = now - lastDeletion;
    const thirtySeconds = 30 * 1000;

    if (timeSinceLastDeletion < thirtySeconds) {
      const remainingTime = Math.ceil((thirtySeconds - timeSinceLastDeletion) / 1000);
      return res.status(429).json({
        success: false,
        error: 'Rate limited',
        message: `You can only delete one edit every 30 seconds. Please wait ${remainingTime} more seconds.`,
        retryAfter: remainingTime
      });
    }

    const edit = pendingEdits.get(id);
    if (!edit) {
      return res.status(404).json({
        success: false,
        error: 'Not found',
        message: 'Product edit not found'
      });
    }

    // Remove edit and update rate limit
    pendingEdits.delete(id);
    adminDeletionTimestamps.set(adminId, now);

    res.json({
      success: true,
      message: 'Product edit deleted successfully',
      data: { 
        editId: id,
        deletedBy: adminId,
        reason,
        deletedAt: new Date()
      }
    });

  } catch (error) {
    console.error('Delete edit error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to delete edit'
    });
  }
});

/**
 * @route POST /api/v1/admin/products/delete-request
 * @desc Request product deletion (Admin only, requires Owner approval)
 * @access Admin+ (Owner can directly delete)
 */
router.post('/delete-request', adminAuth, async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;
    const { productId, reason } = req.body;

    const userRole = await getUserRole(userId);
    
    if (!canRequestDeletion(userRole)) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        message: 'Admin role or higher required'
      });
    }

    // If owner, delete directly
    if (userRole === UserRole.OWNER) {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) {
        return res.status(400).json({
          success: false,
          error: 'Database error',
          message: error.message
        });
      }

      return res.json({
        success: true,
        message: 'Product deleted successfully',
        data: { productId }
      });
    }

    // For admins, create deletion request (would need separate table in production)
    res.json({
      success: true,
      message: 'Deletion request submitted for owner approval',
      data: { productId, reason, requestedBy: userId }
    });

  } catch (error) {
    console.error('Delete request error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to process deletion request'
    });
  }
});

// Helper functions
async function getUserRole(userId: string): Promise<UserRole> {
  try {
    const { data: user } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single();

    if (!user || !user.role || !Object.values(UserRole).includes(user.role as UserRole)) {
      return UserRole.NEWCOMER;
    }

    return user.role as UserRole;
    
  } catch (error) {
    console.error('Get user role error:', error);
    return UserRole.NEWCOMER;
  }
}

function canViewPending(role: UserRole): boolean {
  return [UserRole.MODERATOR, UserRole.ADMIN, UserRole.OWNER].includes(role);
}

function canApproveSubmissions(role: UserRole): boolean {
  return [UserRole.MODERATOR, UserRole.ADMIN, UserRole.OWNER].includes(role);
}

function canApproveEdits(role: UserRole): boolean {
  return [UserRole.MODERATOR, UserRole.ADMIN, UserRole.OWNER].includes(role);
}

function canBanUsers(role: UserRole): boolean {
  return [UserRole.ADMIN, UserRole.OWNER].includes(role);
}

function canRequestDeletion(role: UserRole): boolean {
  return [UserRole.ADMIN, UserRole.OWNER].includes(role);
}

function getUserPermissions(role: UserRole) {
  return {
    canViewPending: canViewPending(role),
    canApproveSubmissions: canApproveSubmissions(role),
    canApproveEdits: canApproveEdits(role),
    canBanUsers: canBanUsers(role),
    canRequestDeletion: canRequestDeletion(role),
    canDeleteDirectly: role === UserRole.OWNER
  };
}

function incrementContributionCount(userId: string): void {
  const current = contributionCounts.get(userId) || 0;
  contributionCounts.set(userId, current + 1);
}

export { router as productModerationRoutes };
