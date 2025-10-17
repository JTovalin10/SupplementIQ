import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabase';

/**
 * GET /api/brands - Fetch brands with optional filtering and pagination
 * @param {NextRequest} request - The incoming request with query parameters
 * @returns {Promise<NextResponse>} JSON response with brands array and pagination info
 * 
 * Query Parameters:
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 25)
 * - search: Search brands by name (case-insensitive)
 * 
 * Response includes:
 * - brand data with logo images from brand_logos table
 * - pagination metadata
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get('page')) || 1;
    const limit = Number(searchParams.get('limit')) || 25;
    const search = searchParams.get('search');

    let query = supabase
      .from('brands')
      .select(`
        *,
        logo:brand_logos(*)
      `)
      .range((page - 1) * limit, page * limit - 1);

    if (search) {
      query = query.ilike('name', `%${search}%`);
    }

    const { data: brands, error } = await query;

    if (error) {
      console.error('Error fetching brands:', error);
      return NextResponse.json({ error: 'Failed to fetch brands' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      data: brands || [],
      pagination: {
        page,
        limit,
        total: brands?.length || 0
      }
    });

  } catch (error) {
    console.error('Brands API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/brands - Create a new brand
 * @param {NextRequest} request - The incoming request with brand data in body
 * @returns {Promise<NextResponse>} JSON response with created brand data
 * 
 * Request Body:
 * - name: Brand name (required)
 * - website: Brand website URL (optional)
 * - description: Brand description (optional)
 * - country: Country of origin (optional)
 * - transparency_score: Transparency score 0-100 (optional, default: 0)
 * - created_by: User ID who created this (optional)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    if (!body.name) {
      return NextResponse.json({ error: 'Brand name is required' }, { status: 400 });
    }

    const { data: brand, error } = await supabase
      .from('brands')
      .insert({
        name: body.name,
        website: body.website,
        description: body.description,
        country: body.country,
        transparency_score: body.transparency_score || 0,
        created_by: body.created_by
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating brand:', error);
      return NextResponse.json({ error: 'Failed to create brand' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      data: brand 
    }, { status: 201 });

  } catch (error) {
    console.error('Brand creation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
