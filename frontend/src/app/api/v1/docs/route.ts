import { NextRequest, NextResponse } from 'next/server';

/**
 * API documentation endpoint
 * Provides API information, available endpoints, and documentation links
 * 
 * @requires No request parameters or body required
 * 
 * @returns 200 - Success response containing:
 *   - name: API name ("SupplementIQ API")
 *   - version: API version ("1.0.0")
 *   - description: API purpose description
 *   - endpoints: Object mapping feature names to their base URLs
 *   - documentation: Link to full API documentation
 * 
 * @throws None - Always returns 200 with API information
 * 
 * @example
 * GET /api/v1/docs
 * Response: {
 *   "name": "SupplementIQ API",
 *   "version": "1.0.0",
 *   "description": "Transparency engine for supplement industry",
 *   "endpoints": {
 *     "auth": "/api/v1/auth",
 *     "products": "/api/v1/products",
 *     ...
 *   },
 *   "documentation": "https://docs.supplementiq.com"
 * }
 */
export async function GET(request: NextRequest) {
  return NextResponse.json({
    name: 'SupplementIQ API',
    version: '1.0.0',
    description: 'Transparency engine for supplement industry',
    endpoints: {
      auth: '/api/v1/auth',
      products: '/api/v1/products',
      ingredients: '/api/v1/ingredients',
      contributions: '/api/v1/contributions',
      users: '/api/v1/users',
      rankings: '/api/v1/rankings',
      upload: '/api/v1/upload',
      autocomplete: '/api/v1/autocomplete',
      admin: '/api/v1/admin',
      owner: '/api/v1/owner',
      'pending-products': '/api/v1/pending-products',
    },
    documentation: 'https://docs.supplementiq.com',
  });
}
