import { NextRequest, NextResponse } from 'next/server';

import { getCachedProducts, setCachedProducts } from '../../../../lib/backend/core/cache';
import { supabase } from '../../../../lib/backend/supabase';
import { CACHE_PAGINATION, PAGINATION_DEFAULTS } from '../../../../lib/constants';
import { sanitizeInput } from '../../../../lib/middleware/validation';

/**
 * Get all products with pagination and filtering
 * Caches only the first 2 pages for performance optimization
 * 
 * @requires Optional query parameters:
 *   - page: Page number (default: 1)
 *   - limit: Items per page (default: 25, max: 100)
 *   - category: Filter by product category
 *   - search: Search in product name and description
 *   - sort: Sort field (name, created_at, rating, price)
 *   - order: Sort order (asc, desc)
 * 
 * @returns 200 - Success response with products and pagination info
 * @returns 400 - Validation or database error
 * @returns 500 - Internal server error
 * 
 * @throws ValidationError - When query parameters are invalid
 * @throws DatabaseError - When database query fails
 * 
 * @example
 * GET /api/v1/products?page=1&limit=25&category=protein&search=whey
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const page = parseInt(searchParams.get('page') || PAGINATION_DEFAULTS.PAGE.toString());
    const limit = parseInt(searchParams.get('limit') || PAGINATION_DEFAULTS.LIMIT.toString());
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const sort = searchParams.get('sort') || 'created_at';
    const order = searchParams.get('order') || 'desc';

    // Validation
    if (page < 1) {
      return NextResponse.json({
        error: 'Validation error',
        message: 'Page must be a positive integer',
      }, { status: 400 });
    }

    if (limit < 1 || limit > 100) {
      return NextResponse.json({
        error: 'Validation error',
        message: 'Limit must be between 1 and 100',
      }, { status: 400 });
    }

    const validSortFields = ['name', 'created_at', 'rating', 'price'];
    if (!validSortFields.includes(sort)) {
      return NextResponse.json({
        error: 'Validation error',
        message: 'Invalid sort field',
      }, { status: 400 });
    }

    if (!['asc', 'desc'].includes(order)) {
      return NextResponse.json({
        error: 'Validation error',
        message: 'Order must be asc or desc',
      }, { status: 400 });
    }

    // Check if this page should be cached (first 2 pages only)
    const shouldCache = page <= CACHE_PAGINATION.CACHE_FIRST_PAGES;

    // Sanitize search input to prevent injection
    const sanitizedSearch = search ? sanitizeInput(search) : null;

    // Try to get from cache first (only for first 2 pages)
    if (shouldCache) {
      const cachedData = getCachedProducts(
        page,
        limit,
        category,
        sanitizedSearch,
        sort,
        order
      );

      if (cachedData) {
        return NextResponse.json(cachedData, {
          headers: {
            'Cache-Control': 'public, max-age=3600',
            'X-Cache-Status': 'hit',
          },
        });
      }
    }

    let query = supabase
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
        )
      `)
      .order(sort, { ascending: order === 'asc' });

    // Apply filters with sanitized inputs
    if (category) {
      query = query.eq('category_id', category);
    }

    if (sanitizedSearch) {
      query = query.or(`name.ilike.%${sanitizedSearch}%,description.ilike.%${sanitizedSearch}%`);
    }

    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      return NextResponse.json({
        error: 'Database error',
        message: error.message,
      }, { status: 400 });
    }

    // Calculate pagination info
    const totalPages = Math.ceil((count || 0) / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    const response = {
      products: data,
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: totalPages,
        hasNext,
        hasPrev,
        cached: shouldCache, // Indicate if this response was cached
      },
    };

    // Cache the response for first 2 pages only
    if (shouldCache) {
      setCachedProducts(
        page,
        limit,
        response,
        category,
        sanitizedSearch,
        sort,
        order,
        3600 // Cache for 1 hour
      );
    }

    const headers: Record<string, string> = {};
    if (shouldCache) {
      headers['Cache-Control'] = 'public, max-age=3600';
      headers['X-Cache-Status'] = 'miss';
    } else {
      headers['Cache-Control'] = 'no-cache';
      headers['X-Cache-Status'] = 'not-cached';
    }

    return NextResponse.json(response, { headers });

  } catch (error) {
    console.error('Get products error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      message: 'Failed to fetch products',
    }, { status: 500 });
  }
}

/**
 * Create new product
 * 
 * @requires Request body:
 *   - name: Product name (required, min 2 characters)
 *   - description: Product description (optional)
 *   - category_id: Category UUID (required)
 *   - brand: Brand name (optional)
 *   - price: Price (optional, positive number)
 *   - image_url: Image URL (optional, valid URL)
 * 
 * @requires Authorization header with Bearer token
 * 
 * @returns 201 - Product created successfully
 * @returns 400 - Validation or database error
 * @returns 401 - Unauthorized
 * @returns 500 - Internal server error
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, category_id, brand, price, image_url } = body;

    // Validation
    if (!name || name.trim().length < 2) {
      return NextResponse.json({
        error: 'Validation error',
        message: 'Product name is required and must be at least 2 characters',
      }, { status: 400 });
    }

    if (!category_id) {
      return NextResponse.json({
        error: 'Validation error',
        message: 'Category ID is required',
      }, { status: 400 });
    }

    if (price !== undefined && (typeof price !== 'number' || price < 0)) {
      return NextResponse.json({
        error: 'Validation error',
        message: 'Price must be a positive number',
      }, { status: 400 });
    }

    if (image_url && !isValidUrl(image_url)) {
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

    const { data, error } = await supabase
      .from('products')
      .insert([{
        name: name.trim(),
        description,
        category_id,
        brand,
        price,
        image_url,
        created_by: user.id,
      }])
      .select()
      .single();

    if (error) {
      return NextResponse.json({
        error: 'Database error',
        message: error.message,
      }, { status: 400 });
    }

    return NextResponse.json({
      message: 'Product created successfully',
      product: data,
    }, { status: 201 });

  } catch (error) {
    console.error('Create product error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      message: 'Failed to create product',
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
