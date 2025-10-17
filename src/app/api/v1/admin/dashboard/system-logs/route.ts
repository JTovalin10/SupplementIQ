import { hasRoleLevelOrAbove, protectRoute } from '@/lib/auth/jwt-middleware';
import { NextResponse } from 'next/server';

// Mock system logs data
const mockSystemLogs = [
  {
    id: '1',
    type: 'info',
    message: 'Database connection pool initialized successfully',
    timestamp: '2024-01-15T12:00:00Z'
  },
  {
    id: '2',
    type: 'info',
    message: 'JWT token validation middleware loaded',
    timestamp: '2024-01-15T11:59:45Z'
  },
  {
    id: '3',
    type: 'warning',
    message: 'High memory usage detected: 85%',
    timestamp: '2024-01-15T11:30:00Z'
  },
  {
    id: '4',
    type: 'info',
    message: 'Cache refresh completed - 1,250 users cached',
    timestamp: '2024-01-15T11:00:00Z'
  },
  {
    id: '5',
    type: 'error',
    message: 'Failed to connect to external API - rate limit exceeded',
    timestamp: '2024-01-15T10:45:00Z'
  },
  {
    id: '6',
    type: 'info',
    message: 'Scheduled backup task completed successfully',
    timestamp: '2024-01-15T08:00:00Z'
  },
  {
    id: '7',
    type: 'warning',
    message: 'Unusual login pattern detected from IP: 192.168.1.100',
    timestamp: '2024-01-15T07:30:00Z'
  },
  {
    id: '8',
    type: 'info',
    message: 'Application server restarted - version 1.2.3',
    timestamp: '2024-01-15T06:00:00Z'
  }
];

export const GET = protectRoute(['admin', 'owner'])(
  async (request, user) => {
    try {
      console.log(`[SYSTEM_LOGS] User ${user.userId} (${user.role}) accessing system logs`);

      // Only admin and owner can access system logs
      if (!hasRoleLevelOrAbove(user, 'admin')) {
        return NextResponse.json(
          { error: 'Insufficient permissions to access system logs' },
          { status: 403 }
        );
      }

      return NextResponse.json({
        success: true,
        data: mockSystemLogs
      });

    } catch (error) {
      console.error('System logs error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch system logs' },
        { status: 500 }
      );
    }
  }
);
