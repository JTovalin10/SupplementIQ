import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabase';

/**
 * GET /api/test-ratings - Test endpoint to verify automatic rating system
 * @param {NextRequest} request - The incoming request
 * @returns {Promise<NextResponse>} JSON response with rating system status
 * 
 * This endpoint helps verify that the database triggers are working correctly
 * for automatic review counting and rating calculation.
 */
export async function GET(request: NextRequest) {
  try {
    // Get a sample product with its reviews
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select(`
        id,
        name,
        community_rating,
        total_reviews,
        dosage_rating,
        danger_rating
      `)
      .limit(5);

    if (productsError) {
      console.error('Error fetching products:', productsError);
      return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
    }

    // For each product, get its actual review count and average rating
    const productsWithVerification = await Promise.all(
      (products || []).map(async (product) => {
        const { data: reviews, error: reviewsError } = await supabase
          .from('product_reviews')
          .select('rating')
          .eq('product_id', product.id);

        if (reviewsError) {
          return {
            ...product,
            verification: {
              error: reviewsError.message,
              actual_count: 0,
              actual_avg_rating: 0
            }
          };
        }

        const actualCount = reviews?.length || 0;
        const actualAvgRating = actualCount > 0 
          ? reviews.reduce((sum, review) => sum + review.rating, 0) / actualCount 
          : 0;

        return {
          ...product,
          verification: {
            actual_count: actualCount,
            actual_avg_rating: Math.round(actualAvgRating * 10) / 10,
            stored_count: product.total_reviews,
            stored_avg_rating: product.community_rating,
            matches: actualCount === product.total_reviews && 
                     Math.abs(actualAvgRating - product.community_rating) < 0.1
          }
        };
      })
    );

    return NextResponse.json({
      success: true,
      message: 'Rating system verification',
      data: productsWithVerification,
      summary: {
        total_products: productsWithVerification.length,
        matching_counts: productsWithVerification.filter(p => p.verification.matches).length,
        trigger_status: 'Database triggers should automatically maintain counts and averages'
      }
    });

  } catch (error) {
    console.error('Test ratings error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


