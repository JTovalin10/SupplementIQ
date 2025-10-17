import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../../../../lib/backend/supabase';
import { sanitizeInput } from '../../../../../../lib/middleware/validation';

/**
 * Search products
 * 
 * @requires Path parameter:
 *   - query: Search query (min 2 characters)
 * 
 * @requires Optional query parameters:
 *   - limit: Maximum results (default: 10, max: 50)
 * 
 * @returns 200 - Success response with search results
 * @returns 400 - Validation or database error
 * @returns 500 - Internal server error
 * 
 * @throws ValidationError - When search query is too short or limit is invalid
 * @throws DatabaseError - When database query fails
 * 
 * @example
 * GET /api/v1/products/search/whey?limit=20
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ query: string }> }
) {
  try {
    const { query } = await params;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');

    // Validation
    if (!query || query.length < 2) {
      return NextResponse.json({
        error: 'Validation error',
        message: 'Search query must be at least 2 characters',
      }, { status: 400 });
    }

    if (limit < 1 || limit > 50) {
      return NextResponse.json({
        error: 'Validation error',
        message: 'Limit must be between 1 and 50',
      }, { status: 400 });
    }

    // Sanitize the search query to prevent injection
    const sanitizedQuery = sanitizeInput(query);

    const { data, error } = await supabase
      .from('products')
      .select(`
        id,
        name,
        description,
        brand,
        price,
        image_url,
        categories(name)
      `)
      .or(`name.ilike.%${sanitizedQuery}%,description.ilike.%${sanitizedQuery}%,brand.ilike.%${sanitizedQuery}%`)
      .limit(limit);

    if (error) {
      return NextResponse.json({
        error: 'Database error',
        message: error.message,
      }, { status: 400 });
    }

    return NextResponse.json({
      query: sanitizedQuery,
      results: data,
      count: data?.length || 0,
    });

  } catch (error) {
    console.error('Search products error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      message: 'Failed to search products',
    }, { status: 500 });
  }
}
