import { supabase } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/dashboard/pending-submissions?page=1&limit=10
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(parseInt(searchParams.get('page') || '1', 10), 1);
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '10', 10), 1), 50);
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error } = await supabase
      .from('temporary_products')
      .select(`
        id,
        name,
        category,
        created_at,
        approval_status,
        submitted_by,
        brands:brand_id ( name )
      `)
      .eq('approval_status', 0)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const submissions = (data || []).map((row: any) => ({
      id: String(row.id),
      productName: row.name as string,
      brandName: row.brands?.name ?? 'Unknown',
      category: row.category as string,
      submittedBy: row.submitted_by ?? 'Unknown',
      submittedAt: row.created_at as string,
      status: 'pending' as 'pending',
    }));

    return NextResponse.json(submissions);
  } catch (e) {
    return NextResponse.json({ error: 'Failed to fetch pending submissions' }, { status: 500 });
  }
}


