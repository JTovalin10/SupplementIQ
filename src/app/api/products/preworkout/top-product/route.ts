import { supabase } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/products/preworkout/top-product
// - Returns top preworkout products sorted by dosage_rating ASC, then community_rating ASC
// - Optional query params:
//   - page: number (default 1)
//   - limit: number (default 25, max 25)
// - If both page and limit are omitted, returns top 75
// Example calls:
// - /api/products/preworkout/top-product
// - /api/products/preworkout/top-product?page=2&limit=25
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

    const redis = getRedisTCP();
    if (!redis.isOpen) await redis.connect();
    const key = 'top:preworkout';
    let payload: any[] | null = null;
    const cached = await redis.get(key);
    if (cached) {
      try { payload = JSON.parse(cached); } catch { payload = null; }
    }

    if (!payload) {
      const { data, error } = await supabase
        .from('products')
        .select(`
          id,
          dosage_rating,
          community_rating,
          preworkout_details(
            serving_scoops,
            serving_g,
            flavors,
            sugar_g,
            key_features,
            l_citrulline_mg,
            creatine_monohydrate_mg,
            glycerpump_mg,
            betaine_anhydrous_mg,
            agmatine_sulfate_mg,
            l_tyrosine_mg,
            caffeine_anhydrous_mg,
            n_phenethyl_dimethylamine_citrate_mg,
            kanna_extract_mg,
            huperzine_a_mcg,
            bioperine_mg
          )
        `)
        .eq('category', 'pre-workout')
        .order('dosage_rating', { ascending: true })
        .order('community_rating', { ascending: true })
        .range(0, 74);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      payload = (data || [])
        .filter((row: any) => !!row.preworkout_details)
        .map((row: any) => ({ productId: String(row.id), details: row.preworkout_details }));

      // Ensure we only cache the top 75
      payload = payload.slice(0, 75);
      await redis.set(key, JSON.stringify(payload), { EX: 86400 });
    }

    const items = noPaging ? payload : payload.slice(from, Math.min(to + 1, 75));
    return NextResponse.json({ items, page: noPaging ? 1 : page, limit: noPaging ? 75 : limit });
  } catch (e) {
    return NextResponse.json({ error: 'Failed to fetch preworkout details' }, { status: 500 });
  }
}


