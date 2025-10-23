import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../../lib/supabase';

/**
 * GET /api/brands/[id] - Fetch a single brand by ID
 * @param {NextRequest} request - The incoming request
 * @param {Object} context - Route context containing params
 * @param {Object} context.params - Route parameters
 * @param {string} context.params.id - Brand ID from URL
 * @returns {Promise<NextResponse>} JSON response with brand data or 404 if not found
 * 
 * Response includes:
 * - complete brand data
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const { data: brand, error } = await supabase
      .from('brands')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Brand not found' }, { status: 404 });
      }
      console.error('Error fetching brand:', error);
      return NextResponse.json({ error: 'Failed to fetch brand' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      data: brand 
    });

  } catch (error) {
    console.error('Brand API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PUT /api/brands/[id] - Update an existing brand by ID
 * @param {NextRequest} request - The incoming request with updated brand data in body
 * @param {Object} context - Route context containing params
 * @param {Object} context.params - Route parameters
 * @param {string} context.params.id - Brand ID from URL
 * @returns {Promise<NextResponse>} JSON response with updated brand data
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const { data: brand, error } = await supabase
      .from('brands')
      .update(body)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating brand:', error);
      return NextResponse.json({ error: 'Failed to update brand' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      data: brand 
    });

  } catch (error) {
    console.error('Brand update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const { error } = await supabase
      .from('brands')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting brand:', error);
      return NextResponse.json({ error: 'Failed to delete brand' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Brand deleted successfully' 
    });

  } catch (error) {
    console.error('Brand deletion error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
