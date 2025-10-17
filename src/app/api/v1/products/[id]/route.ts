import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../../../lib/backend/supabase';

/**
 * Get product by ID
 * 
 * @requires Path parameter:
 *   - id: Product UUID
 * 
 * @returns 200 - Success response with product data
 * @returns 400 - Validation or database error
 * @returns 404 - Product not found
 * @returns 500 - Internal server error
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return NextResponse.json({
        error: 'Validation error',
        message: 'Product ID must be a valid UUID',
      }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        categories(name),
        ingredients(
          id,
          name,
          amount,
          unit,
          ingredient_types(name)
        ),
        contributions(
          id,
          type,
          content,
          rating,
          created_at,
          users(full_name)
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({
          error: 'Not found',
          message: 'Product not found',
        }, { status: 404 });
      }
      return NextResponse.json({
        error: 'Database error',
        message: error.message,
      }, { status: 400 });
    }

    return NextResponse.json({ product: data });

  } catch (error) {
    console.error('Get product error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      message: 'Failed to fetch product',
    }, { status: 500 });
  }
}

/**
 * Update product
 * 
 * @requires Path parameter:
 *   - id: Product UUID
 * 
 * @requires Request body (all optional):
 *   - name: Product name (min 2 characters)
 *   - description: Product description
 *   - category_id: Category UUID
 *   - brand: Brand name
 *   - price: Price (positive number)
 *   - image_url: Image URL (valid URL)
 * 
 * @requires Authorization header with Bearer token
 * 
 * @returns 200 - Product updated successfully
 * @returns 400 - Validation or database error
 * @returns 401 - Unauthorized
 * @returns 404 - Product not found or no permission
 * @returns 500 - Internal server error
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const { id } = params;
    const body = await request.json();
    const { name, description, category_id, brand, price, image_url } = body;

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return NextResponse.json({
        error: 'Validation error',
        message: 'Product ID must be a valid UUID',
      }, { status: 400 });
    }

    // Validation for provided fields
    if (name !== undefined && (!name || name.trim().length < 2)) {
      return NextResponse.json({
        error: 'Validation error',
        message: 'Product name must be at least 2 characters',
      }, { status: 400 });
    }

    if (price !== undefined && (typeof price !== 'number' || price < 0)) {
      return NextResponse.json({
        error: 'Validation error',
        message: 'Price must be a positive number',
      }, { status: 400 });
    }

    if (image_url !== undefined && !isValidUrl(image_url)) {
      return NextResponse.json({
        error: 'Validation error',
        message: 'Image URL must be valid',
      }, { status: 400 });
    }

    // Get user from auth header
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({
        error: 'Unauthorized',
        message: 'Authorization header required',
      }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({
        error: 'Unauthorized',
        message: 'Invalid token',
      }, { status: 401 });
    }

    // Prepare update data
    const updateData: any = {};
    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description;
    if (category_id !== undefined) updateData.category_id = category_id;
    if (brand !== undefined) updateData.brand = brand;
    if (price !== undefined) updateData.price = price;
    if (image_url !== undefined) updateData.image_url = image_url;

    const { data, error } = await supabase
      .from('products')
      .update(updateData)
      .eq('id', id)
      .eq('created_by', user.id) // Only allow creator to update
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({
          error: 'Not found',
          message: 'Product not found or you do not have permission to update it',
        }, { status: 404 });
      }
      return NextResponse.json({
        error: 'Database error',
        message: error.message,
      }, { status: 400 });
    }

    return NextResponse.json({
      message: 'Product updated successfully',
      product: data,
    });

  } catch (error) {
    console.error('Update product error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      message: 'Failed to update product',
    }, { status: 500 });
  }
}

/**
 * Delete product
 * 
 * @requires Path parameter:
 *   - id: Product UUID
 * 
 * @requires Authorization header with Bearer token
 * 
 * @returns 200 - Product deleted successfully
 * @returns 400 - Validation or database error
 * @returns 401 - Unauthorized
 * @returns 404 - Product not found or no permission
 * @returns 500 - Internal server error
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const { id } = params;

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return NextResponse.json({
        error: 'Validation error',
        message: 'Product ID must be a valid UUID',
      }, { status: 400 });
    }

    // Get user from auth header
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({
        error: 'Unauthorized',
        message: 'Authorization header required',
      }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({
        error: 'Unauthorized',
        message: 'Invalid token',
      }, { status: 401 });
    }

    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id)
      .eq('created_by', user.id); // Only allow creator to delete

    if (error) {
      return NextResponse.json({
        error: 'Database error',
        message: error.message,
      }, { status: 400 });
    }

    return NextResponse.json({
      message: 'Product deleted successfully',
    });

  } catch (error) {
    console.error('Delete product error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      message: 'Failed to delete product',
    }, { status: 500 });
  }
}

// Helper function to validate URLs
function isValidUrl(string: string): boolean {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}
