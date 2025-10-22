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

  // Optimize query - remove exact count for better performance
  let query = supabase
    .from('users')
    .select(`
      id,
      username,
      reputation_points
    `)
    .not('reputation_points', 'is', null)
    .order('reputation_points', { ascending: false })
    .range(offset, offset + limit - 1);

  if (dateFilter) {
    query = query.gte('created_at', dateFilter.toISOString());
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Database error: ${error.message}`);
  }

  const rankings = (data || []).map((user: any) => ({
    id: user.id,
    username: user.username,
    reputation_points: user.reputation_points || 0,
  }));

  // Estimate total count for pagination (faster than exact count)
  const estimatedTotal = rankings.length < limit ? offset + rankings.length : (offset + limit) * 2;
  const totalPages = Math.ceil(estimatedTotal / limit);

  return {
    rankings,
    totalCount: estimatedTotal,
    totalPages,
    currentPage: page,
    limit,
    timeRange,
    lastUpdated: new Date().toISOString(),
    source: 'database'
  };
}

// Helper function to get cached data with proper Redis connection
async function getCachedData(cacheKey: string): Promise<any | null> {
  try {
    const redis = getRedis();
    
    // Redis should already be connected at startup, but handle edge cases
    if (redis.status === 'connecting') {
      console.log(`⏳ Redis connecting, waiting...`);
      // Wait for connection to complete
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    if (redis.status !== 'ready') {
      console.log(`❌ Redis not ready (${redis.status}) for ${cacheKey}`);
      return null;
    }
    
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

// Helper function to cache data with proper Redis connection
async function cacheData(cacheKey: string, data: any): Promise<void> {
  try {
    const redis = getRedis();
    
    // Redis should already be connected at startup
    if (redis.status !== 'ready') {
      console.log(`❌ Redis not ready (${redis.status}) for caching ${cacheKey}`);
      return;
    }
    
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

    // Try to get from cache first (fast path)
    const cachedData = await getCachedData(cacheKey);
    if (cachedData) {
      const response = NextResponse.json(cachedData);
      // Add cache headers for browser caching
      response.headers.set('Cache-Control', 'public, max-age=300'); // 5 minutes
      response.headers.set('X-Cache', 'HIT');
      return response;
    }

    // Cache miss - fetch from database
    console.log(`🔄 Fetching fresh rankings data from database for ${timeRange}`);
    const startTime = Date.now();
    const freshData = await fetchRankingsFromDB(timeRange, page, limit);
    const dbTime = Date.now() - startTime;
    console.log(`📊 Database query took ${dbTime}ms`);

    // Cache the fresh data (async, don't wait)
    const cacheStartTime = Date.now();
    cacheData(cacheKey, freshData).then(() => {
      const cacheTime = Date.now() - cacheStartTime;
      console.log(`💾 Cache write took ${cacheTime}ms`);
    }).catch(err => 
      console.warn('Failed to cache:', err)
    );

    const response = NextResponse.json(freshData);
    // Add cache headers for fresh data
    response.headers.set('Cache-Control', 'public, max-age=60'); // 1 minute
    response.headers.set('X-Cache', 'MISS');
    return response;

  } catch (error) {
    console.error('Rankings API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}