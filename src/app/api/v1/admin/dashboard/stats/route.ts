import { supabase } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    try {

      // Fetch real stats from database
      const [
        usersResult,
        pendingSubmissionsResult,
        productsResult,
        recentActivityResult
      ] = await Promise.all([
        // Total users count
        supabase
          .from('users')
          .select('id', { count: 'exact', head: true }),
        
        // Pending submissions count
        supabase
          .from('temporary_products')
          .select('id', { count: 'exact', head: true })
          .eq('approval_status', 0),
        
        // Total products count
        supabase
          .from('products')
          .select('id', { count: 'exact', head: true }),
        
        // Recent activity count (last 24 hours)
        supabase
          .from('temporary_products')
          .select('id', { count: 'exact', head: true })
          .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      ]);

      const totalUsers = usersResult.count || 0;
      const pendingSubmissions = pendingSubmissionsResult.count || 0;
      const totalProducts = productsResult.count || 0;
      const recentActivity = recentActivityResult.count || 0;

      // Get user from auth header for role checking
      const authHeader = request.headers.get('authorization');
      let userRole: string | null = null;
      
      if (authHeader) {
        const token = authHeader.replace('Bearer ', '');
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(token);
        if (!authError && authUser) {
          const { data: userProfile } = await supabase
            .from('users')
            .select('role')
            .eq('id', authUser.id)
            .single();
          userRole = userProfile?.role || null;
        }
      }

      // Owner gets additional system stats
      if (userRole === 'owner') {
        return NextResponse.json({
          success: true,
          data: {
            totalUsers,
            pendingSubmissions,
            pendingEdits: 0, // TODO: Implement pending edits tracking
            totalProducts,
            recentActivity,
            systemHealth: 95.0, // TODO: Implement real system health monitoring
            databaseSize: 'Unknown', // TODO: Implement database size calculation
            apiCalls: 0 // TODO: Implement API call tracking
          }
        });
      }

      // Admin and moderator get basic stats
      return NextResponse.json({
        success: true,
        data: {
          totalUsers,
          pendingSubmissions,
          pendingEdits: 0, // TODO: Implement pending edits tracking
          totalProducts,
          recentActivity
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