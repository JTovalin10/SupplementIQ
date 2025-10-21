import { supabase } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';
import { getRedis } from '../../../../Database/Redis/client';

// Cache configuration
const CACHE_TTL = 86400; // 24 hours in seconds
const CACHE_PREFIX = 'rankings';

// Helper function to generate cache key
function getCacheKey(timeRange: string, page: number, limit: number): string {
  return `${CACHE_PREFIX}:${timeRange}:page_${page}:limit_${limit}`;
}

// Helper function to check if cache is stale (older than 24 hours)
function isCacheStale(cachedData: any): boolean {
  if (!cachedData?.lastUpdated) return true;
  const lastUpdated = new Date(cachedData.lastUpdated);
  const now = new Date();
  const hoursDiff = (now.getTime() - lastUpdated.getTime()) / (1000 * 60 * 60);
  return hoursDiff >= 24;
}

// Helper function to get date filter
function getDateFilter(timeRange: string): Date | null {
  const now = new Date();
  
  switch (timeRange) {
    case 'daily':
      return new Date(now.getTime() - 24 * 60 * 60 * 1000);
    case 'weekly':
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case 'monthly':
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    case 'yearly':
      return new Date(now.getFullYear(), 0, 1);
    case 'all_time':
    default:
      return null;
  }
}

// Helper function to fetch rankings from database
async function fetchRankingsFromDB(timeRange: string, page: number, limit: number) {
  const offset = (page - 1) * limit;
  const dateFilter = getDateFilter(timeRange);

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
    throw new Error(`Database error: ${error.message}`);
  }

  const rankings = (data || []).map((user: any) => ({
    id: user.id,
    username: user.username,
    reputation_points: user.reputation_points || 0,
  }));

  const totalPages = Math.ceil((count || 0) / limit);

  return {
    rankings,
    totalCount: count || 0,
    totalPages,
    currentPage: page,
    limit,
    timeRange,
    lastUpdated: new Date().toISOString(),
    source: 'database'
  };
}

// Helper function to get cached data
async function getCachedData(cacheKey: string): Promise<any | null> {
  try {
    const redis = getRedis();
    
    const cached = await redis.get(cacheKey);
    if (cached) {
      const cachedData = JSON.parse(cached);
      
      // Check if cache is stale
      if (isCacheStale(cachedData)) {
        console.log(`🕐 Cache is stale for ${cacheKey}, will refresh`);
        return null;
      }
      
      console.log(`🚀 Redis cache HIT for ${cacheKey}`);
      return { ...cachedData, source: 'cache' };
    }
    
    console.log(`❌ Redis cache MISS for ${cacheKey}`);
    return null;
  } catch (redisError) {
    console.error('Redis error:', redisError);
    return null;
  }
}

// Helper function to cache data
async function cacheData(cacheKey: string, data: any): Promise<void> {
  try {
    const redis = getRedis();
    await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(data));
    console.log(`💾 Cached rankings data in Redis: ${cacheKey}`);
  } catch (redisError) {
    console.warn('Failed to cache in Redis:', redisError);
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('timeRange') || 'yearly';
    const limit = Math.min(parseInt(searchParams.get('limit') || '10', 10), 100);
    const page = parseInt(searchParams.get('page') || '1', 10);

    // Generate cache key
    const cacheKey = getCacheKey(timeRange, page, limit);

    // Try to get from cache first
    const cachedData = await getCachedData(cacheKey);
    if (cachedData) {
      return NextResponse.json(cachedData);
    }

    // Cache miss or stale - fetch from database
    console.log(`🔄 Fetching fresh rankings data from database for ${timeRange}`);
    const freshData = await fetchRankingsFromDB(timeRange, page, limit);

    // Cache the fresh data
    await cacheData(cacheKey, freshData);

    return NextResponse.json(freshData);

  } catch (error) {
    console.error('Rankings API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}