import { supabase } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Fetch user data from public_profiles view (allows all users to see public data)
    const { data: userData, error } = await supabase
      .from('public_profiles')
      .select(`
        id,
        username,
        role,
        reputation_points,
        bio,
        joined_date,
        recent_activity
      `)
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching user:', error);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Fetch user badges
    const { data: badges, error: badgesError } = await supabase
      .from('user_badges')
      .select('badge_type, earned_at')
      .eq('user_id', userId)
      .order('earned_at', { ascending: false });

    if (badgesError) {
      console.error('Error fetching badges:', badgesError);
    }

    // Fetch user's product reviews
    const { data: reviews, error: reviewsError } = await supabase
      .from('product_reviews')
      .select(`
        id,
        rating,
        review_text,
        created_at,
        products:product_id (name)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (reviewsError) {
      console.error('Error fetching reviews:', reviewsError);
    }

    // Fetch user's product submissions
    const { data: submissions, error: submissionsError } = await supabase
      .from('temporary_products')
      .select(`
        id,
        name,
        category,
        created_at,
        approval_status
      `)
      .eq('submitted_by', userId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (submissionsError) {
      console.error('Error fetching submissions:', submissionsError);
    }

    return NextResponse.json({ 
      user: userData,
      badges: badges || [],
      reviews: reviews || [],
      submissions: submissions || []
    });
  } catch (error) {
    console.error('User API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
