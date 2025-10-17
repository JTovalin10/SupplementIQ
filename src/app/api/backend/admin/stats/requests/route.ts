/**
 * Admin request statistics API route (Next.js)
 */

import { NextRequest, NextResponse } from 'next/server';
import { activeUpdateRequests, democraticUpdateUsedToday, lastDemocraticUpdateDate } from '../../requests';
import { getUserAuthority } from '../../utils';

/**
 * GET /api/backend/admin/stats/requests
 * Get request statistics
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

    const requestStats = getRequestStats();

    return NextResponse.json({
      success: true,
      data: requestStats
    });

  } catch (error) {
    console.error('Failed to get request statistics:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to get request statistics'
    }, { status: 500 });
  }
}

// Helper function to gather request statistics
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
