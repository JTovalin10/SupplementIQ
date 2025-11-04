import { productCache, type ProductCacheKey } from '@/lib/cache/product-cache';
import { supabase } from '@/lib/database/supabase/client';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Get top community comment for a product
 * @param {number} productId - Product ID
 * @returns {Promise<Object|null>} Top community comment or null
 */
async function getTopCommunityComment(productId: number): Promise<any> {
  try {
    const { data: comment, error } = await supabase
      .from('product_reviews')
      .select(`
        id,
        title,
        comment,
        recommended_scoops,
        recommended_frequency,
        safety_concerns,
        helpful_votes,
        rating,
        user:users(
          username,
          reputation_points
        )
      `)
      .eq('product_id', productId)
      .order('helpful_votes', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching community comment:', error);
      return null;
    }

    return comment;

  } catch (error) {
    console.error('Error getting community comment:', error);
    return null;
  }
}

// Note: Rating calculation functions moved to /api/admin/update-ratings for periodic updates
// Products API now uses stored ratings for better performance

/**
 * GET /api/products - Fetch products with optional filtering and pagination
 * @param {NextRequest} request - The incoming request with query parameters
 * @returns {Promise<NextResponse>} JSON response with products array and pagination info
 * 
 * Query Parameters:
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 25)
 * - category: Filter by product category
 * - search: Search products by name (case-insensitive)
 * - detailed: Include full product data (default: false) - for admin views
 * 
 * Response includes (default - optimized for listings):
 * - essential product data: id, name, image_url, transparency_score, confidence_level
 * - dosage_rating: 0-100 rating based on ingredient dosages vs optimal amounts (stored)
 * - danger_rating: 0-100 safety rating (0 = safe, 50 = warning, 75 = dangerous, 100 = extreme) (stored)
 * - community_rating: 1-10 rating from community reviews (automatically calculated by database triggers)
 * - total_reviews: Number of community reviews (automatically maintained by database triggers)
 * - community_comment: Top helpful community comment with practical advice
 * - brand info: id and name only
 * - pagination metadata
 * 
 * Response includes (when detailed=true - for admin views):
 * - complete product data with full brand information
 * - all product fields and relationships
 * 
 * Optimized for product listings, search results, and "most popular" displays
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get('page')) || 1;
    const limit = Number(searchParams.get('limit')) || 25;
    const category = searchParams.get('category') || undefined;
    const search = searchParams.get('search') || undefined;
    const detailed = searchParams.get('detailed') === 'true';

    // Check cache key
    const cacheKey: ProductCacheKey = {
      page,
      category,
      search
    };

    // Try to get from cache (only for first 3 pages)
    if (productCache.shouldCache(cacheKey) && !detailed) {
      const cachedProducts = await productCache.get(cacheKey);
      if (cachedProducts) {
        console.log(`✅ [CACHE] Hit for page ${page}, category: ${category}`);
        return NextResponse.json({ 
          success: true, 
          data: cachedProducts,
          pagination: {
            page,
            limit,
            total: cachedProducts.length
          }
        });
      }
      console.log(`❌ [CACHE] Miss for page ${page}, category: ${category}`);
    }

    // Build select query based on whether detailed data is needed
    let selectQuery = `
      id,
      name,
      image_url,
      category,
      slug,
      dosage_rating,
      danger_rating,
      community_rating,
      total_reviews,
      brand:brands(
        id,
        name
      )
    `;
    
    if (detailed) {
      selectQuery = `
        *,
        brand:brands(*)
      `;
    }

    let query = supabase
      .from('products')
      .select(selectQuery)
      .range((page - 1) * limit, page * limit - 1);

    if (category) {
      query = query.eq('category', category);
    }

    if (search) {
      query = query.ilike('name', `%${search}%`);
    }

    const { data: products, error } = await query;

    if (error) {
      console.error('Error fetching products:', error);
      return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
    }

    // Cache the results if applicable
    if (productCache.shouldCache(cacheKey) && !detailed && products && Array.isArray(products)) {
      await productCache.set(cacheKey, products as any);
      console.log(`💾 [CACHE] Cached page ${page}, category: ${category}`);
    }

    // Return products without community comments for performance
    // Comments can be fetched separately if needed
    return NextResponse.json({ 
      success: true, 
      data: products || [],
      pagination: {
        page,
        limit,
        total: products?.length || 0
      }
    });

  } catch (error) {
    console.error('Products API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/products - Create a new product
 * @param {NextRequest} request - The incoming request with product data in body
 * @returns {Promise<NextResponse>} JSON response with created product data
 * 
 * Request Body:
 * - name: Product name (required)
 * - category: Product category (required)
 * - brand_id: ID of the brand (optional)
 * - description: Product description (optional)
 * - serving_size: Serving size number (optional)
 * - serving_unit: Unit of measurement (optional)
 * - nutrition_facts: Nutrition facts object (optional)
 * - ingredients: Array of ingredients (optional)
 * - transparency_score: Transparency score 0-100 (optional, default: 0)
 * - created_by: User ID who created this (optional)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as any;
    
    // Basic validation
    if (!body.name || !body.category) {
      return NextResponse.json({ error: 'Name and category are required' }, { status: 400 });
    }

    const { data: product, error } = await supabase
      .from('products')
      .insert({
        name: body.name,
        category: body.category,
        brand_id: body.brand_id,
        description: body.description,
        serving_size: body.serving_size,
        serving_unit: body.serving_unit,
        nutrition_facts: body.nutrition_facts,
        ingredients: body.ingredients,
        transparency_score: body.transparency_score || 0,
        created_by: body.created_by,
        status: 'pending'
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating product:', error);
      return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      data: product 
    }, { status: 201 });

  } catch (error) {
    console.error('Product creation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}