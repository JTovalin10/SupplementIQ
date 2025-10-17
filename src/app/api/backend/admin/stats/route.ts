/**
 * Admin statistics and monitoring API routes (Next.js)
 */

import { NextRequest, NextResponse } from 'next/server';
import { queueProcessor } from '../../../../lib/core/queue-processor';
import { requestQueue } from '../../../../lib/core/request-queue';
import { securityService } from '../../../../lib/cpp-wrappers/security-tree';
import { activeUpdateRequests, democraticUpdateUsedToday, lastDemocraticUpdateDate } from '../requests';
import { getUserAuthority } from '../utils';

/**
 * GET /api/backend/admin/stats/overview
 * Get comprehensive admin system statistics
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

    // Gather all statistics
    const [requestStats, securityStats, queueStats, processorStats] = await Promise.all([
      getRequestStats(),
      getSecurityStats(),
      getQueueStats(),
      getProcessorStats()
    ]);

    return NextResponse.json({
      success: true,
      data: {
        requests: requestStats,
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
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to get system statistics'
    }, { status: 500 });
  }
}

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
