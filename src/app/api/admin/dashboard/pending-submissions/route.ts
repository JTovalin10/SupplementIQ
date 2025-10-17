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
      .from('temporary_products')
      .select(`
        id,
        brand_id,
        name,
        image_url,
        category,
        created_at,
        approval_status,
        submitted_by,
        users:submitted_by ( username ),
        preworkout_details:preworkout_details!temp_product_id (*),
        non_stim_preworkout_details:non_stim_preworkout_details!temp_product_id (*),
        energy_drink_details:energy_drink_details!temp_product_id (*),
        protein_details:protein_details!temp_product_id (*),
        amino_acid_details:amino_acid_details!temp_product_id (*),
        fat_burner_details:fat_burner_details!temp_product_id (*)
      `, { count: 'exact' })
      .eq('approval_status', 0)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const submissions = (data || []).map((row: any) => ({
      id: String(row.id),
      productName: row.name as string,
      imageUrl: row.image_url as string | null,
      brandId: row.brand_id as number,
      category: row.category as string,
      submittedBy: row.users?.username ?? row.submitted_by ?? 'Unknown',
      submittedAt: row.created_at as string,
      status: 'pending' as 'pending',
      details:
        row.preworkout_details ||
        row.non_stim_preworkout_details ||
        row.energy_drink_details ||
        row.protein_details ||
        row.amino_acid_details ||
        row.fat_burner_details ||
        null,
    }));

    // Fetch full brand data (including logos) in one call
    const brandIds = Array.from(new Set(submissions.map(s => s.brandId))).filter(Boolean) as number[];
    let brandMap = new Map<number, any>();
    if (brandIds.length) {
      const { data: brandsData, error: brandsError } = await supabase
        .from('brands')
        .select('id, name, slug, website, product_count, created_at')
        .in('id', brandIds);
      if (!brandsError && brandsData) {
        brandMap = new Map<number, any>(brandsData.map((b: any) => [b.id, b]));
      }
    }

    // Attach brand object
    for (const s of submissions) {
      const brand = brandMap.get(s.brandId);
      (s as any).brand = brand || null;
    }

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
