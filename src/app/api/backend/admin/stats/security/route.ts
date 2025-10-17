/**
 * Admin security statistics API route (Next.js)
 */

import { NextRequest, NextResponse } from 'next/server';
import { securityService } from '../../../../../lib/cpp-wrappers/security-tree';
import { getUserAuthority } from '../../utils';

/**
 * GET /api/backend/admin/stats/security
 * Get security statistics
 * Access: Admin only
 */
export async function GET(request: NextRequest) {
  try {
    // Get userId from headers (would typically come from auth middleware)
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized',
        message: 'Authentication required'
      }, { status: 401 });
    }

    // Optimized: Single database call to check both admin and owner status
    const { isAdmin, isOwner } = await getUserAuthority(userId);
    
    if (!isAdmin && !isOwner) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized',
        message: 'Admin access required'
      }, { status: 403 });
    }

    const securityStats = await getSecurityStats();

    return NextResponse.json({
      success: true,
      data: securityStats
    });

  } catch (error) {
    console.error('Failed to get security statistics:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to get security statistics'
    }, { status: 500 });
  }
}

// Helper function to gather security statistics
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
