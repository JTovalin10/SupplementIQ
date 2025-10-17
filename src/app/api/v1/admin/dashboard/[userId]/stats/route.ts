import { logSensitiveOperation, verifySensitiveAccess } from '@/lib/security/role-verification';
import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    
    // Comprehensive security verification for sensitive admin/owner operations
    const { user, allowed, error } = await verifySensitiveAccess(
      request, 
      ['admin', 'owner'], 
      'ADMIN_DASHBOARD_ACCESS'
    );
    
    if (!allowed) {
      await logSensitiveOperation(
        user.id || 'unknown',
        'ADMIN_DASHBOARD_ACCESS',
        { targetUserId: userId, reason: error },
        false
      );
      
      return NextResponse.json({ 
        error: error || 'Access denied' 
      }, { status: error === 'Authentication required' ? 401 : 403 });
    }
    
    // Additional check: Users can only access their own dashboard unless they're owner
    if (user.id !== userId && user.role !== 'owner') {
      await logSensitiveOperation(
        user.id,
        'ADMIN_DASHBOARD_ACCESS',
        { targetUserId: userId, reason: 'Cross-user access denied' },
        false
      );
      
      return NextResponse.json({ 
        error: 'Can only access your own dashboard data' 
      }, { status: 403 });
    }
    
    // Verify target user exists and has dashboard access
    const supabase = await createClient();
    const { data: targetUserProfile, error: targetUserError } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single();
    
    if (targetUserError || !targetUserProfile) {
      return NextResponse.json({ error: 'Target user not found' }, { status: 404 });
    }
    
    if (!['admin', 'owner'].includes(targetUserProfile.role)) {
      return NextResponse.json({ 
        error: 'Target user does not have dashboard access' 
      }, { status: 403 });
    }
    
    // Log successful access
    await logSensitiveOperation(
      user.id,
      'ADMIN_DASHBOARD_ACCESS',
      { targetUserId: userId, userRole: user.role },
      true
    );
    
    // Return dashboard stats (mock data for now)
    const stats = {
      users: { total: 42, active: 38, newThisWeek: 5 },
      products: { total: 156, pending: 12, approved: 144 },
      pendingSubmissions: [],
      pendingEdits: [],
      activity: { recentCount: 28, submissions: 15, approvals: 10, edits: 3 },
      systemHealth: {
        memoryUsage: { heapUsed: 145 * 1024 * 1024, heapTotal: 200 * 1024 * 1024 },
        databaseSize: '2.4 GB',
        apiCalls: 15420,
        uptime: '7d 14h 23m'
      }
    };
    
    return NextResponse.json({ success: true, data: stats });
    
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
