import { supabase } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

// Returns top non-stim preworkout products with their details (optional pagination)
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

    const { data, error } = await supabase
      .from('products')
      .select(`
        id,
        dosage_rating,
        community_rating,
        total_reviews,
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
      .range(from, to);

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


