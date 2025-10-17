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
    // TODO: Implement real pending submissions fetching from database
    const pendingSubmissions = [
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
      },
      {
        id: '3',
        productName: 'BCAA 2:1:1',
        brandName: 'Scivation',
        category: 'amino_acids',
        submittedBy: 'supplement_expert',
        submittedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        status: 'pending'
      }
    ];

    return NextResponse.json({ 
      success: true, 
      data: pendingSubmissions 
    });

  } catch (error) {
    console.error('Pending submissions error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
