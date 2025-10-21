import { getRedisTCP } from '../../../../../Database/Redis/client';
import { supabase } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

// Daily cache refresh endpoint
// This can be called by a cron job or scheduled task to refresh rankings cache

const TIME_RANGES = ['daily', 'weekly', 'monthly', 'yearly', 'all_time'];
const CACHE_PREFIX = 'rankings';

// Helper function to generate cache key
function getCacheKey(timeRange: string, page: number, limit: number): string {
  return `${CACHE_PREFIX}:${timeRange}:page_${page}:limit_${limit}`;
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

// Helper function to cache data
async function cacheData(cacheKey: string, data: any): Promise<void> {
  try {
    const redis = getRedisTCP();
    if (!redis.isOpen) await redis.connect();
    
    await redis.setEx(cacheKey, 86400, JSON.stringify(data)); // 24 hours TTL
    console.log(`💾 Cached rankings data in Redis: ${cacheKey}`);
  } catch (redisError) {
    console.warn('Failed to cache in Redis:', redisError);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('timeRange') || 'all';
    const pages = searchParams.get('pages') || '3'; // Default to refresh first 3 pages
    const limit = searchParams.get('limit') || '10'; // Default to 10 items per page

    const pagesToRefresh = parseInt(pages, 10);
    const limitPerPage = parseInt(limit, 10);
    const timeRangesToRefresh = timeRange === 'all' ? TIME_RANGES : [timeRange];

    const redis = getRedisTCP();
    if (!redis.isOpen) await redis.connect();

    let totalRefreshed = 0;
    const results = [];

    for (const tr of timeRangesToRefresh) {
      for (let page = 1; page <= pagesToRefresh; page++) {
        try {
          const cacheKey = getCacheKey(tr, page, limitPerPage);
          
          // Fetch fresh data from database
          const freshData = await fetchRankingsFromDB(tr, page, limitPerPage);
          
          // Cache the fresh data
          await cacheData(cacheKey, freshData);
          
          totalRefreshed++;
          results.push({
            timeRange: tr,
            page,
            limit: limitPerPage,
            cacheKey,
            success: true
          });
          
        } catch (error) {
          console.error(`Failed to refresh cache for ${tr} page ${page}:`, error);
          results.push({
            timeRange: tr,
            page,
            limit: limitPerPage,
            cacheKey: getCacheKey(tr, page, limitPerPage),
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Refreshed ${totalRefreshed} cache entries`,
      totalRefreshed,
      results,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Cache refresh error:', error);
    return NextResponse.json({ 
      error: 'Failed to refresh cache',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('timeRange') || 'all';
    const pages = searchParams.get('pages') || '3';
    const limit = searchParams.get('limit') || '10';

    return NextResponse.json({
      message: 'Rankings cache refresh endpoint',
      usage: {
        POST: 'Refresh cache entries',
        parameters: {
          timeRange: 'daily|weekly|monthly|yearly|all_time|all (default: all)',
          pages: 'Number of pages to refresh (default: 3)',
          limit: 'Items per page (default: 10)'
        }
      },
      example: 'POST /api/rankings/refresh?timeRange=yearly&pages=5&limit=20'
    });

  } catch (error) {
    console.error('Cache refresh info error:', error);
    return NextResponse.json({ 
      error: 'Failed to get cache refresh info',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
