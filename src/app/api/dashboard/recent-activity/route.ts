import { fetchRecentActivity } from '@/lib/services/recent-activity';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/dashboard/recent-activity?page=1&limit=10
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(parseInt(searchParams.get('page') || '1', 10), 1);
    const limit = Math.max(parseInt(searchParams.get('limit') || '10', 10), 1);
    const q = searchParams.get('q');
    const result = await fetchRecentActivity(page, limit, { q });
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: 'Failed to fetch recent activity' }, { status: 500 });
  }
}


