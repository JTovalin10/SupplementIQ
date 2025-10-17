import { protectRoute } from '@/lib/auth/jwt-middleware';
import { NextResponse } from 'next/server';

// Mock recent activity data
const mockRecentActivity = [
  {
    id: '1',
    action: 'Approved Product Submission',
    user: 'admin_user',
    timestamp: '2024-01-15T11:30:00Z',
    details: 'Approved "Omega-3 Fish Oil" submission from user_123'
  },
  {
    id: '2',
    action: 'Updated User Role',
    user: 'owner_user',
    timestamp: '2024-01-15T10:45:00Z',
    details: 'Promoted user_456 from user to moderator'
  },
  {
    id: '3',
    action: 'Rejected Edit Submission',
    user: 'moderator_1',
    timestamp: '2024-01-15T09:20:00Z',
    details: 'Rejected "Creatine Loading Phase" edit - insufficient evidence'
  },
  {
    id: '4',
    action: 'System Backup Completed',
    user: 'system',
    timestamp: '2024-01-15T08:00:00Z',
    details: 'Daily database backup completed successfully'
  },
  {
    id: '5',
    action: 'New User Registration',
    user: 'user_789',
    timestamp: '2024-01-15T07:15:00Z',
    details: 'User registered with email: newuser@example.com'
  },
  {
    id: '6',
    action: 'Product Review Submitted',
    user: 'user_101',
    timestamp: '2024-01-14T18:30:00Z',
    details: 'Submitted review for "Multivitamin Complex" - 4.5 stars'
  }
];

export const GET = protectRoute(['moderator', 'admin', 'owner'])(
  async (request, user) => {
    try {
      console.log(`[RECENT_ACTIVITY] User ${user.userId} (${user.role}) accessing recent activity`);

      return NextResponse.json({
        success: true,
        data: mockRecentActivity
      });

    } catch (error) {
      console.error('Recent activity error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch recent activity' },
        { status: 500 }
      );
    }
  }
);