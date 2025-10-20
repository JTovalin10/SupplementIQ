import { supabase } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

// Use Next.js built-in caching for better performance
export const revalidate = 86400; // Revalidate every 24 hours

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('timeRange') || 'yearly';
    const limit = Math.min(parseInt(searchParams.get('limit') || '10', 10), 100);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const offset = (page - 1) * limit;

    // Calculate date range based on timeRange
    const now = new Date();
    let dateFilter = null;
    
    switch (timeRange) {
      case 'daily':
        dateFilter = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case 'weekly':
        dateFilter = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'monthly':
        dateFilter = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'yearly':
        dateFilter = new Date(now.getFullYear(), 0, 1);
        break;
      case 'all_time':
      default:
        dateFilter = null;
        break;
    }

    // Simple query - no complex caching
    let query = supabase
      .from('users')
      .select(`
        id,
        username,
        reputation_points,
        avatar_url
      `, { count: 'exact' })
      .not('reputation_points', 'is', null)
      .order('reputation_points', { ascending: false })
      .range(offset, offset + limit - 1);

    if (dateFilter) {
      query = query.gte('created_at', dateFilter.toISOString());
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching rankings:', error);
      return NextResponse.json({ error: 'Failed to fetch rankings' }, { status: 500 });
    }

    const rankings = (data || []).map((user: any) => ({
      id: user.id,
      username: user.username,
      reputation_points: user.reputation_points || 0,
      avatar_url: user.avatar_url,
    }));

    const totalPages = Math.ceil((count || 0) / limit);

    return NextResponse.json({ 
      rankings,
      totalCount: count || 0,
      totalPages,
      currentPage: page,
      limit,
      timeRange,
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    console.error('Rankings API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}