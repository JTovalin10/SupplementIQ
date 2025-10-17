import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../../lib/supabase';

/**
 * GET /api/products/[id] - Fetch a single product by ID
 * @param {NextRequest} request - The incoming request
 * @param {Object} context - Route context containing params
 * @param {Object} context.params - Route parameters
 * @param {string} context.params.id - Product ID from URL
 * @returns {Promise<NextResponse>} JSON response with product data or 404 if not found
 * 
 * Response includes:
 * - complete product data with brand information
 * - category-specific details (preworkout_details, protein_details, etc.)
 * - ingredient amounts stored as columns in category detail tables
 * - flavors array and other category-specific fields
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // First get the product with brand info
    const { data: product, error } = await supabase
      .from('products')
      .select(`
        *,
        brand:brands(*)
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Product not found' }, { status: 404 });
      }
      console.error('Error fetching product:', error);
      return NextResponse.json({ error: 'Failed to fetch product' }, { status: 500 });
    }

    // Then fetch category-specific details based on the product category
    let categoryDetails = null;
    if (product) {
      const categoryTable = `${product.category.replace('-', '_')}_details`;
      const { data: details, error: detailsError } = await supabase
        .from(categoryTable)
        .select('*')
        .eq('product_id', id)
        .single();

      if (detailsError && detailsError.code !== 'PGRST116') {
        console.error(`Error fetching ${categoryTable}:`, detailsError);
      } else {
        categoryDetails = details;
      }
    }

    // Combine product data with category-specific details
    const productWithDetails = {
      ...product,
      category_details: categoryDetails
    };

    return NextResponse.json({ 
      success: true, 
      data: productWithDetails 
    });

  } catch (error) {
    console.error('Product API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PUT /api/products/[id] - Update an existing product by ID
 * @param {NextRequest} request - The incoming request with updated product data in body
 * @param {Object} context - Route context containing params
 * @param {Object} context.params - Route parameters
 * @param {string} context.params.id - Product ID from URL
 * @returns {Promise<NextResponse>} JSON response with updated product data
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const { data: product, error } = await supabase
      .from('products')
      .update(body)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating product:', error);
      return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      data: product 
    });

  } catch (error) {
    console.error('Product update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/products/[id] - Delete a product by ID
 * @param {NextRequest} request - The incoming request
 * @param {Object} context - Route context containing params
 * @param {Object} context.params - Route parameters
 * @param {string} context.params.id - Product ID from URL
 * @returns {Promise<NextResponse>} JSON response with success message
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting product:', error);
      return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Product deleted successfully' 
    });

  } catch (error) {
    console.error('Product deletion error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}