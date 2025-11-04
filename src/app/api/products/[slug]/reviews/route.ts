import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../../../lib/supabase';

/**
 * GET /api/products/[id]/reviews - Fetch reviews for a specific product
 * @param {NextRequest} request - The incoming request with query parameters
 * @param {Object} context - Route context containing params
 * @param {Object} context.params - Route parameters
 * @param {string} context.params.id - Product ID from URL
 * @returns {Promise<NextResponse>} JSON response with product reviews
 * 
 * Query Parameters:
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 10)
 * - sort: Sort by 'helpful', 'recent', or 'rating' (default: 'helpful')
 * 
 * Response includes:
 * - array of product reviews with user information
 * - ratings on 1-10 scale (automatically maintained by database triggers)
 * - pagination metadata
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get('page')) || 1;
    const limit = Number(searchParams.get('limit')) || 10;
    const sort = searchParams.get('sort') || 'helpful';

    // Validate sort parameter
    const validSorts = ['helpful', 'recent', 'rating'];
    const sortBy = validSorts.includes(sort) ? sort : 'helpful';

    let orderBy = 'helpful_votes';
    let ascending = false;
    
    if (sortBy === 'recent') {
      orderBy = 'created_at';
      ascending = false;
    } else if (sortBy === 'rating') {
      orderBy = 'rating';
      ascending = false;
    }

    const { data: reviews, error } = await supabase
      .from('product_reviews')
      .select(`
        id,
        rating,
        title,
        comment,
        recommended_scoops,
        recommended_frequency,
        value_for_money,
        effectiveness,
        safety_concerns,
        is_verified_purchase,
        helpful_votes,
        created_at,
        user:users(
          username,
          reputation_points,
          role
        )
      `)
      .eq('product_id', slug)
      .order(orderBy, { ascending })
      .range((page - 1) * limit, page * limit - 1);

    if (error) {
      console.error('Error fetching reviews:', error);
      return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      data: reviews || [],
      pagination: {
        page,
        limit,
        total: reviews?.length || 0
      }
    });

  } catch (error) {
    console.error('Reviews API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/products/[id]/reviews - Create a new review for a product
 * @param {NextRequest} request - The incoming request with review data in body
 * @param {Object} context - Route context containing params
 * @param {Object} context.params - Route parameters
 * @param {string} context.params.id - Product ID from URL
 * @returns {Promise<NextResponse>} JSON response with created review data
 * 
 * Request Body:
 * - rating: Rating 1.0-10.0 (required) - will automatically update product's community_rating
 * - title: Review title (required)
 * - comment: Review text (required)
 * - recommended_scoops: Recommended number of scoops (optional)
 * - recommended_frequency: How often to take (optional)
 * - value_for_money: 1-5 rating (optional)
 * - effectiveness: 1-5 rating (optional)
 * - safety_concerns: Any safety concerns (optional)
 * - is_verified_purchase: Whether user actually bought it (optional)
 * 
 * Note: Creating a review automatically increments total_reviews and updates community_rating via database triggers
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const body = await request.json();
    
    // Get user from auth token
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Basic validation
    if (!body.rating || !body.title || !body.comment) {
      return NextResponse.json({ error: 'Rating, title, and comment are required' }, { status: 400 });
    }

    // TODO: Extract user ID from JWT token
    // For now, we'll need to implement proper auth
    const userId = 'temp-user-id'; // Replace with actual user ID from token

    const { data: review, error } = await supabase
      .from('product_reviews')
      .insert({
        product_id: parseInt(slug),
        user_id: userId,
        rating: body.rating,
        title: body.title,
        comment: body.comment,
        recommended_scoops: body.recommended_scoops,
        recommended_frequency: body.recommended_frequency,
        value_for_money: body.value_for_money,
        effectiveness: body.effectiveness,
        safety_concerns: body.safety_concerns,
        is_verified_purchase: body.is_verified_purchase || false
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating review:', error);
      return NextResponse.json({ error: 'Failed to create review' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      data: review 
    }, { status: 201 });

  } catch (error) {
    console.error('Review creation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
