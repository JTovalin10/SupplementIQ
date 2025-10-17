import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../../../../lib/supabase';

export async function GET(request: NextRequest) {
  try {
    // Get authentication token
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Verify the token with Supabase
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error('Authentication error:', authError);
      return NextResponse.json({ error: 'Invalid authentication token' }, { status: 401 });
    }

    // Check if user has admin/owner role
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !userProfile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    if (!['admin', 'owner'].includes(userProfile.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // For now, return mock data to get the dashboard working
    // TODO: Implement real recent activity fetching from database
    const recentActivity = [
      {
        id: '1',
        type: 'submission',
        description: 'New product submitted: Optimum Nutrition Gold Standard Whey',
        user: 'fitness_enthusiast_99',
        timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString()
      },
      {
        id: '2',
        type: 'approval',
        description: 'Approved product: Dymatize ISO100',
        user: 'admin_user',
        timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString()
      },
      {
        id: '3',
        type: 'edit',
        description: 'Updated protein content for MuscleTech NitroTech',
        user: 'verified_user_1',
        timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString()
      },
      {
        id: '4',
        type: 'rejection',
        description: 'Rejected submission: Invalid ingredient list',
        user: 'admin_user',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
      }
    ];

    return NextResponse.json({ 
      success: true, 
      data: recentActivity 
    });

  } catch (error) {
    console.error('Recent activity error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
