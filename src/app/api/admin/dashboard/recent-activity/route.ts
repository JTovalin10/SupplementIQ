import { fetchRecentActivity } from '@/lib/api/services/recent-activity';
import { NextResponse } from 'next/server';

// GET /api/admin/dashboard/recent-activity
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limitRaw = parseInt(searchParams.get('limit') || '10', 10);
    const q = searchParams.get('q');

    if (Number.isNaN(page) || page <= 0) {
      return NextResponse.json({ error: 'Page must be greater than 0' }, { status: 400 });
    }

    if (Number.isNaN(limitRaw) || limitRaw <= 0) {
      return NextResponse.json({ error: 'Limit must be positive' }, { status: 400 });
    }

    const result = await fetchRecentActivity(page, limitRaw, { q });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch recent activity' }, { status: 500 });
  }
}
