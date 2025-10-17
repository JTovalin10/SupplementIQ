import { NextRequest, NextResponse } from 'next/server';
import { authenticateAdmin } from '../../../../../../lib/auth-middleware';

export async function GET(request: NextRequest) {
  try {
    // Authenticate admin/moderator/owner user
    const authResult = await authenticateAdmin(request);
    if (authResult instanceof NextResponse) {
      return authResult; // Return error response
    }
    
    const { user, userProfile } = authResult;

    // For now, return mock data to get the dashboard working
    // TODO: Implement real stats fetching from database
    const stats = {
      users: {
        total: 42,
        active: 38,
        newThisWeek: 5
      },
      products: {
        total: 156,
        pending: 12,
        approved: 144
      },
      pendingSubmissions: [
        {
          id: '1',
          productName: 'Optimum Nutrition Gold Standard Whey',
          brandName: 'Optimum Nutrition',
          category: 'protein',
          submittedBy: 'fitness_enthusiast_99',
          submittedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          status: 'pending'
        },
        {
          id: '2',
          productName: 'Creatine Monohydrate',
          brandName: 'MuscleTech',
          category: 'creatine',
          submittedBy: 'gym_bro_2024',
          submittedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
          status: 'pending'
        }
      ],
      pendingEdits: [
        {
          id: '1',
          productName: 'Dymatize ISO100',
          field: 'protein_per_serving',
          oldValue: '25g',
          newValue: '26g',
          submittedBy: 'verified_user_1',
          submittedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString()
        }
      ],
      activity: {
        recentCount: 28,
        submissions: 15,
        approvals: 10,
        edits: 3
      },
      systemHealth: {
        memoryUsage: {
          heapUsed: 145 * 1024 * 1024, // 145 MB
          heapTotal: 200 * 1024 * 1024  // 200 MB
        },
        databaseSize: '2.4 GB',
        apiCalls: 15420,
        uptime: '7d 14h 23m'
      }
    };

    return NextResponse.json({ 
      success: true, 
      data: stats 
    });

  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
