import { verifyAdminPermissions, verifyOwnerPermissions } from '@/lib/auth/permissions';
import { supabase } from '@/lib/database/supabase/client';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { userId, newRole, promotedBy } = await request.json();

    if (!userId || !newRole || !promotedBy) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Authorization header required' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Verify permissions based on the role being assigned
    let permissionCheck;
    if (newRole === 'admin') {
      // Only owners can promote to admin
      permissionCheck = await verifyOwnerPermissions(token);
    } else if (newRole === 'moderator') {
      // Admins and owners can promote to moderator
      permissionCheck = await verifyAdminPermissions(token);
    } else {
      return NextResponse.json({ error: 'Invalid role for promotion' }, { status: 400 });
    }

    if (!permissionCheck.success) {
      return NextResponse.json({ error: permissionCheck.error }, { status: 403 });
    }

    // Check if the target user exists
    const { data: targetUser, error: userError } = await supabase
      .from('users')
      .select('id, role, username')
      .eq('id', userId)
      .single();

    if (userError || !targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Prevent demotion (can't promote to a lower role)
    const roleHierarchy = {
      'newcomer': 1,
      'contributor': 2,
      'trusted_editor': 3,
      'moderator': 4,
      'admin': 5,
      'owner': 6,
    };

    const currentLevel = roleHierarchy[targetUser.role as keyof typeof roleHierarchy] || 0;
    const newLevel = roleHierarchy[newRole as keyof typeof roleHierarchy] || 0;

    if (newLevel <= currentLevel) {
      return NextResponse.json({ 
        error: `Cannot promote user from ${targetUser.role} to ${newRole}` 
      }, { status: 400 });
    }

    // Update the user's role
    const { error: updateError } = await supabase
      .from('users')
      .update({ 
        role: newRole,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (updateError) {
      console.error('Error updating user role:', updateError);
      return NextResponse.json({ error: 'Failed to update user role' }, { status: 500 });
    }

    // Log the promotion activity
    const { error: logError } = await supabase
      .from('activity_logs')
      .insert({
        user_id: userId,
        action: 'role_promotion',
        details: {
          old_role: targetUser.role,
          new_role: newRole,
          promoted_by: promotedBy,
          timestamp: new Date().toISOString()
        },
        created_at: new Date().toISOString()
      });

    if (logError) {
      console.error('Error logging promotion:', logError);
      // Don't fail the request if logging fails
    }

    return NextResponse.json({
      success: true,
      message: `User ${targetUser.username} promoted to ${newRole} successfully`,
      data: {
        userId,
        oldRole: targetUser.role,
        newRole,
        promotedBy
      }
    });

  } catch (error) {
    console.error('Error in user promotion API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
