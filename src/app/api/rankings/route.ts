import { getRedisTCP } from '@/../../Database/Redis/client';
import { supabase } from '@/lib/database/supabase';
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

    // Check if this is the first page with 10 users - use Redis cache
    const isFirstPageWithTenUsers = page === 1 && limit === 10;
    
    if (isFirstPageWithTenUsers) {
      try {
        const redis = getRedisTCP();
        if (!redis.isOpen) await redis.connect();
        
        // Create cache key based on timeRange
        const cacheKey = `rankings:first_page:${timeRange}`;
        
        // Try to get from Redis cache first
        const cached = await redis.get(cacheKey);
        if (cached && typeof cached === 'string') {
          try {
            const cachedData = JSON.parse(cached);
            console.log(`🚀 Redis cache HIT for ${cacheKey}`);
            return NextResponse.json(cachedData);
          } catch (parseError) {
            console.warn('Failed to parse cached data:', parseError);
          }
        }
        
        console.log(`❌ Redis cache MISS for ${cacheKey} - fetching from DB`);
      } catch (redisError) {
        console.warn('Redis error, falling back to database:', redisError);
      }
    }

    // Fetch from database
    let query = supabase
      .from('users')
      .select(`
        id,
        username,
        reputation_points
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
    }));

    const totalPages = Math.ceil((count || 0) / limit);

    const response = { 
      rankings,
      totalCount: count || 0,
      totalPages,
      currentPage: page,
      limit,
      timeRange,
      lastUpdated: new Date().toISOString()
    };

    // Cache the first page with 10 users in Redis for 24 hours
    if (isFirstPageWithTenUsers) {
      try {
        const redis = getRedisTCP();
        if (!redis.isOpen) await redis.connect();
        
        const cacheKey = `rankings:first_page:${timeRange}`;
        await redis.setEx(cacheKey, 86400, JSON.stringify(response)); // 24 hours TTL
        console.log(`💾 Cached first page rankings in Redis for ${timeRange}`);
      } catch (redisError) {
        console.warn('Failed to cache in Redis:', redisError);
      }
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Rankings API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}