import { supabase } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/products/non-stim-preworkout/top-product
// - Returns top non-stim preworkout products sorted by dosage_rating ASC, then community_rating ASC
// - Optional query params:
//   - page: number (default 1)
//   - limit: number (default 25, max 25)
// - If both page and limit are omitted, returns top 75
// Example calls:
// - /api/products/non-stim-preworkout/top-product
// - /api/products/non-stim-preworkout/top-product?page=2&limit=25
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
        non_stim_preworkout_details(
          serving_scoops,
          serving_g,
          flavors,
          key_features,
          calories,
          total_carbohydrate_g,
          niacin_mg,
          vitamin_b6_mg,
          vitamin_b12_mcg,
          magnesium_mg,
          sodium_mg,
          potassium_mg,
          l_citrulline_mg,
          creatine_monohydrate_mg,
          betaine_anhydrous_mg,
          glycerol_powder_mg,
          malic_acid_mg,
          taurine_mg,
          sodium_nitrate_mg,
          agmatine_sulfate_mg,
          vasodrive_ap_mg
        )
      `)
      .eq('category', 'non-stim-preworkout')
      .order('dosage_rating', { ascending: true })
      .order('community_rating', { ascending: true })
      .range(from, clampedTo);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const items = (data || [])
      .filter((row: any) => !!row.non_stim_preworkout_details)
      .map((row: any) => ({
        productId: String(row.id),
        details: row.non_stim_preworkout_details,
      }));

    return NextResponse.json({ items, page: noPaging ? 1 : page, limit: noPaging ? 75 : limit });
  } catch (e) {
    return NextResponse.json({ error: 'Failed to fetch non-stim preworkout details' }, { status: 500 });
  }
}


