import { NextRequest, NextResponse } from 'next/server';
import { autocompleteService } from '../../../../../lib/backend/services/autocomplete';
import { sanitizeInput } from '../../../../../lib/middleware/validation';

/**
 * Get flavor autocomplete suggestions
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
 * GET /api/v1/autocomplete/flavors?q=chocolate&limit=10
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
    const suggestions = autocompleteService.searchFlavors(sanitizedQuery, limit);

    return NextResponse.json({
      success: true,
      data: {
        suggestions,
        query: sanitizedQuery,
        count: suggestions.length
      }
    });

  } catch (error) {
    console.error('Autocomplete flavors error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}
