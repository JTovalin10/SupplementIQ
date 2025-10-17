import { protectRoute } from '@/lib/auth/jwt-middleware';
import { NextResponse } from 'next/server';

// Mock dashboard stats data
const mockStats = {
  users: { total: 1250 },
  pendingSubmissions: [
    { id: '1', title: 'New Protein Powder', type: 'product' },
    { id: '2', title: 'Updated Creatine Info', type: 'edit' }
  ],
  pendingEdits: [
    { id: '3', title: 'Vitamin D3 Update', type: 'edit' }
  ],
  products: { total: 847 },
  activity: { recentCount: 23 },
  systemHealth: {
    memoryUsage: { heapUsed: 45.2 },
    cpuUsage: 23.1,
    uptime: '15 days'
  }
};

export const GET = protectRoute(['moderator', 'admin', 'owner'])(
  async (request, user) => {
    try {
      console.log(`[DASHBOARD_STATS] User ${user.userId} (${user.role}) accessing stats`);

      // Owner gets additional system stats
      if (user.role === 'owner') {
        return NextResponse.json({
          success: true,
          data: {
            totalUsers: mockStats.users.total,
            pendingSubmissions: mockStats.pendingSubmissions.length,
            pendingEdits: mockStats.pendingEdits.length,
            totalProducts: mockStats.products.total,
            recentActivity: mockStats.activity.recentCount,
            systemHealth: mockStats.systemHealth.memoryUsage.heapUsed,
            databaseSize: '2.4 GB',
            apiCalls: 15420
          }
        });
      }

      // Admin and moderator get basic stats
      return NextResponse.json({
        success: true,
        data: {
          totalUsers: mockStats.users.total,
          pendingSubmissions: mockStats.pendingSubmissions.length,
          pendingEdits: mockStats.pendingEdits.length,
          totalProducts: mockStats.products.total,
          recentActivity: mockStats.activity.recentCount
        }
      });

    } catch (error) {
      console.error('Dashboard stats error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch dashboard stats' },
        { status: 500 }
      );
    }
  }
);