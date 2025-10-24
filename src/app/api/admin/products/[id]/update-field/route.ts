import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * PUT /api/admin/products/[id]/update-field - Update a specific product field
 * @param {NextRequest} request - The incoming request
 * @param {Object} params - Route parameters containing product ID
 * @returns {Promise<NextResponse>} JSON response with update result
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: productSlug } = await params;
    const { field, value } = await request.json();

    if (!field || value === undefined) {
      return NextResponse.json({
        error: 'Field and value are required'
      }, { status: 400 });
    }

    if (!productSlug || productSlug === 'undefined') {
      return NextResponse.json({ error: 'Invalid product slug' }, { status: 400 });
    }

    // Map field names to database column names
    const fieldMapping: Record<string, string> = {
      'servingsPerContainer': 'servings_per_container',
      'servingSizeG': 'serving_size_g',
      'price': 'price',
      'currency': 'currency',
      'name': 'product_name',
      'description': 'description',
      'imageUrl': 'image_url'
    };

    const dbField = fieldMapping[field];
    if (!dbField) {
      return NextResponse.json({
        error: 'Invalid field name'
      }, { status: 400 });
    }

    // Prepare update data
    const updateData: any = {};
    updateData[dbField] = value;
    updateData.updated_at = new Date().toISOString();

    // Try to update in products table first, then pending_products
    let { data, error } = await supabase
      .from('products')
      .update(updateData)
      .eq('slug', productSlug)
      .select()
      .single();

    // If not found in products, try pending_products
    if (error && error.code === 'PGRST116') {
      const pendingResult = await supabase
        .from('pending_products')
        .update(updateData)
        .eq('slug', productSlug)
        .select()
        .single();
      
      data = pendingResult.data;
      error = pendingResult.error;
    }

    if (error) {
      console.error('Error updating product field:', error);
      return NextResponse.json({
        error: 'Failed to update product field',
        details: error.message
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      field,
      value,
      updatedProduct: data
    });

  } catch (error) {
    console.error('Update field API error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
