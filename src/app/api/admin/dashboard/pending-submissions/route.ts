import { supabase } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/admin/dashboard/pending-submissions?page=1&limit=10
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(parseInt(searchParams.get('page') || '1', 10), 1);
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '10', 10), 1), 50);
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error, count } = await supabase
      .from('pending_products')
      .select(`
        id,
        product_name,
        image_url,
        category,
        created_at,
        submitted_by,
        users:submitted_by ( username ),
        brands:brand_id ( name )
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const submissions = (data || []).map((row: any) => ({
      id: String(row.id),
      productName: row.product_name as string,
      brandName: row.brands?.name ?? 'Unknown',
      imageUrl: row.image_url as string | null,
      category: row.category as string,
      submittedBy: row.users?.username ?? 'Unknown',
      submittedAt: row.created_at as string,
      status: 'pending' as 'pending',
    }));

    // Brand data is already included in the main query

    return NextResponse.json({
      submissions,
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
    });
  } catch (e) {
    return NextResponse.json({ error: 'Failed to fetch pending submissions' }, { status: 500 });
  }
}
