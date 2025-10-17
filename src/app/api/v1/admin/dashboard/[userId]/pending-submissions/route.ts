import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

async function handler(request: NextRequest, user: any) {
  try {
    const { userId } = request.nextUrl.pathname.split('/').pop();
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }
    
    // Additional check: Users can only access their own dashboard unless they're owner
    if (user.id !== userId && user.role !== 'owner') {
      return NextResponse.json({ 
        error: 'Can only access your own dashboard data' 
      }, { status: 403 });
    }
    
    // Verify target user exists and has dashboard access
    const supabase = await createClient();
    const { data: targetUserProfile, error: targetUserError } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single();
    
    if (targetUserError || !targetUserProfile) {
      return NextResponse.json({ error: 'Target user not found' }, { status: 404 });
    }
    
    if (!['admin', 'owner'].includes(targetUserProfile.role)) {
      return NextResponse.json({ 
        error: 'Target user does not have dashboard access' 
      }, { status: 403 });
    }
    
    // Return mock pending submissions data
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

// Export with comprehensive admin security
export const GET = withAdminSecurity(['admin', 'owner'], 'ADMIN_PENDING_SUBMISSIONS_ACCESS')(handler);
