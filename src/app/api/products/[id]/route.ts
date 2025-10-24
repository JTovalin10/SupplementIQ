import { createClient } from '@/lib/database/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/products/[id] - Get approved product information for public display
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id: productId } = await params;

    // Convert productId to integer for database queries
    const productIdInt = parseInt(productId, 10);
    if (isNaN(productIdInt)) {
      return NextResponse.json({ error: 'Invalid product ID format' }, { status: 400 });
    }

    // Fetch the approved product with all related data
    const { data: product, error } = await supabase
      .from('products')
      .select(`
        *,
        brands:brand_id (
          id,
          name,
          website
        )
      `)
      .eq('id', productIdInt)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Format the response
    const formattedProduct = {
      id: product.id,
      productName: product.name,
      brand: {
        id: product.brands?.id,
        name: product.brands?.name || 'Unknown',
        website: product.brands?.website
      },
      category: product.category,
      description: product.description,
      imageUrl: product.image_url,
      servingsPerContainer: product.servings_per_container,
      servingSizeG: product.serving_size_g,
      dosageRating: product.dosage_rating,
      dangerRating: product.danger_rating,
      updatedAt: product.updated_at,
      createdAt: product.created_at
    };

    return NextResponse.json({ product: formattedProduct });
  } catch (error) {
    console.error('Error fetching product details:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}