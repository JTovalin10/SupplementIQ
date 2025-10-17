import { supabase } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/products/bcaa/top-product
// - Returns top BCAA products sorted by dosage_rating ASC, then community_rating ASC
// - Optional query params: page (default 1), limit (default 25, max 25)
// - If page & limit omitted, returns top 75
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const pageParam = searchParams.get('page');
    const limitParam = searchParams.get('limit');
    const page = Math.max(1, parseInt(pageParam || '1', 10));
    const limit = Math.max(1, Math.min(25, parseInt(limitParam || '25', 10)));
    const noPaging = !pageParam && !limitParam;

    const from = noPaging ? 0 : (page - 1) * limit;
    const to = noPaging ? 74 : from + limit - 1;
    if (!noPaging && from > 74) {
      return NextResponse.json({ items: [], page, limit });
    }
    const clampedTo = Math.min(to, 74);

    const { data, error } = await supabase
      .from('products')
      .select(`
        id,
        dosage_rating,
        community_rating,
        amino_acid_details(
          flavors,
          key_features,
          total_eaas_mg,
          l_leucine_mg,
          l_isoleucine_mg,
          l_valine_mg,
          l_lysine_hcl_mg,
          l_threonine_mg,
          l_phenylalanine_mg,
          l_tryptophan_mg,
          l_histidine_hcl_mg,
          l_methionine_mg,
          betaine_anhydrous_mg,
          coconut_water_powder_mg,
          astragin_mg
        )
      `)
      .eq('category', 'bcaa')
      .order('dosage_rating', { ascending: true })
      .order('community_rating', { ascending: true })
      .range(from, clampedTo);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const items = (data || [])
      .filter((row: any) => !!row.amino_acid_details)
      .map((row: any) => ({
        productId: String(row.id),
        details: row.amino_acid_details,
      }));

    return NextResponse.json({ items, page: noPaging ? 1 : page, limit: noPaging ? 75 : limit });
  } catch (e) {
    return NextResponse.json({ error: 'Failed to fetch BCAA details' }, { status: 500 });
  }
}


