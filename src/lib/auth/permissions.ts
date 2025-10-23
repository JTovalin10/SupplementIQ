import { supabase } from '@/lib/supabase';

/**
 * Verify that a user has moderator+ permissions
 * @param userId - The user ID to verify
 * @returns Promise<{success: boolean, error?: string, role?: string}>
 */
export async function verifyModeratorPermissions(userId: string): Promise<{
  success: boolean;
  error?: string;
  role?: string;
}> {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single();

    if (error || !user) {
      return {
        success: false,
        error: 'User not found'
      };
    }

    const allowedRoles = ['moderator', 'admin', 'owner'];
    if (!allowedRoles.includes(user.role)) {
      return {
        success: false,
        error: `Insufficient permissions. Only ${allowedRoles.join(', ')} can perform this action.`,
        role: user.role
      };
    }

    return {
      success: true,
      role: user.role
    };
  } catch (error) {
    console.error('Error verifying moderator permissions:', error);
    return {
      success: false,
      error: 'Failed to verify permissions'
    };
  }
}

/**
 * Verify that a user has admin+ permissions (admin or owner only)
 * @param userId - The user ID to verify
 * @returns Promise<{success: boolean, error?: string, role?: string}>
 */
export async function verifyAdminPermissions(userId: string): Promise<{
  success: boolean;
  error?: string;
  role?: string;
}> {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single();

    if (error || !user) {
      return {
        success: false,
        error: 'User not found'
      };
    }

    const allowedRoles = ['admin', 'owner'];
    if (!allowedRoles.includes(user.role)) {
      return {
        success: false,
        error: `Insufficient permissions. Only ${allowedRoles.join(' or ')} can perform this action.`,
        role: user.role
      };
    }

    return {
      success: true,
      role: user.role
    };
  } catch (error) {
    console.error('Error verifying admin permissions:', error);
    return {
      success: false,
      error: 'Failed to verify permissions'
    };
  }
}

/**
 * Verify that a user has owner permissions
 * @param userId - The user ID to verify
 * @returns Promise<{success: boolean, error?: string, role?: string}>
 */
export async function verifyOwnerPermissions(userId: string): Promise<{
  success: boolean;
  error?: string;
  role?: string;
}> {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single();

    if (error || !user) {
      return {
        success: false,
        error: 'User not found'
      };
    }

    if (user.role !== 'owner') {
      return {
        success: false,
        error: 'Insufficient permissions. Only owners can perform this action.',
        role: user.role
      };
    }

    return {
      success: true,
      role: user.role
    };
  } catch (error) {
    console.error('Error verifying owner permissions:', error);
    return {
      success: false,
      error: 'Failed to verify permissions'
    };
  }
}
