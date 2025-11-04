import { createClient } from '@/lib/database/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/products/details/creatine - Get creatine details for a product
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');

    if (!productId) {
      return NextResponse.json({ error: 'Product ID required' }, { status: 400 });
    }

    const productIdInt = parseInt(productId, 10);
    if (isNaN(productIdInt)) {
      return NextResponse.json({ error: 'Invalid product ID' }, { status: 400 });
    }

    // Fetch creatine details
    const { data, error } = await supabase
      .from('creatine_details')
      .select(`
        *,
        creatine_types:creatine_type_name (
          name,
          category,
          recommended_daily_dose_g
        )
      `)
      .eq('product_id', productIdInt)
      .single();

    if (error) {
      console.warn('Creatine details error:', error.message);
      return NextResponse.json({ details: null, error: error.message });
    }

    if (!data) {
      return NextResponse.json({ details: null });
    }

    // Transform the data to include creatine dosage from creatine_types table
    const creatineDosageMg = data.creatine_types?.recommended_daily_dose_g 
      ? Math.round(data.creatine_types.recommended_daily_dose_g * 1000) // Convert g to mg
      : 5000; // Default to 5g if no data

    const transformedData = {
      ...data,
      creatine_monohydrate_mg: creatineDosageMg
    };

    return NextResponse.json({ details: transformedData });
  } catch (error) {
    console.error('Error fetching creatine details:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

