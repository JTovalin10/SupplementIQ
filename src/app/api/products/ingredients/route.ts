import { supabase } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

// Returns product -> ingredients list used for priming product caches
export async function GET(_request: NextRequest) {
  try {
    const { data, error } = await supabase
      .from('products')
      .select(`
        id,
        ingredients(
          id,
          name,
          amount,
          unit,
          ingredient_types(name)
        )
      `);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const items = (data || []).map((row: any) => ({
      productId: row.id,
      ingredients: (row.ingredients || []).map((ing: any) => ({
        id: ing.id,
        name: ing.name,
        amount: ing.amount,
        unit: ing.unit,
        type: ing.ingredient_types?.name ?? null,
      })),
    }));

    return NextResponse.json({ items });
  } catch (e) {
    return NextResponse.json({ error: 'Failed to fetch product ingredients' }, { status: 500 });
  }
}


