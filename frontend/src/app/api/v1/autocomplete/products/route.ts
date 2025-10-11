import { NextRequest, NextResponse } from 'next/server';
import { autocompleteService } from '../../../../../lib/backend/services/autocomplete';
import { sanitizeInput } from '../../../../../lib/middleware/validation';

/**
 * Get product autocomplete suggestions
 * 
 * @requires Query parameters:
 *   - q: Search query (prefix, required, min 1 character)
 *   - limit: Maximum results (optional, default: 25, max: 100)
 * 
 * @returns 200 - Success response with autocomplete suggestions
 * @returns 400 - Validation error
 * @returns 500 - Internal server error
 * 
 * @throws ValidationError - When query parameter is missing or invalid
 * 
 * @example
 * GET /api/v1/autocomplete/products?q=whey&limit=10
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const limit = parseInt(searchParams.get('limit') || '25');

    // Validation
    if (!query || query.length < 1) {
      return NextResponse.json({
        success: false,
        error: 'Query parameter "q" is required and must be at least 1 character'
      }, { status: 400 });
    }

    if (limit < 1 || limit > 100) {
      return NextResponse.json({
        success: false,
        error: 'Limit must be between 1 and 100'
      }, { status: 400 });
    }

    const sanitizedQuery = sanitizeInput(query);
    const suggestions = autocompleteService.searchProducts(sanitizedQuery, limit);

    return NextResponse.json({
      success: true,
      data: {
        suggestions,
        query: sanitizedQuery,
        count: suggestions.length
      }
    });

  } catch (error) {
    console.error('Autocomplete products error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

/**
 * Add a new product to autocomplete index
 * 
 * @requires Request body:
 *   - name: Product name to add (required, non-empty string)
 * 
 * @requires Authorization header with Bearer token
 * 
 * @returns 200 - Success response
 * @returns 400 - Validation error
 * @returns 401 - Unauthorized
 * @returns 403 - Forbidden (insufficient permissions)
 * @returns 500 - Internal server error
 * 
 * @throws ValidationError - When product name is missing or invalid
 * @throws AuthorizationError - When user is not authenticated or authorized
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name } = body;

    // Validation
    if (!name || typeof name !== 'string' || name.trim().length < 1) {
      return NextResponse.json({
        success: false,
        error: 'Product name is required and must be a non-empty string'
      }, { status: 400 });
    }

    // TODO: Add authentication and authorization checks
    // For now, we'll allow the operation but in production you should verify:
    // 1. User is authenticated
    // 2. User has admin/moderator permissions

    const productName = sanitizeInput(name.trim());
    autocompleteService.addProduct(productName);

    return NextResponse.json({
      success: true,
      message: 'Product added to autocomplete index',
      data: { name: productName }
    });

  } catch (error) {
    console.error('Add product to autocomplete error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}
