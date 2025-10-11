import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../../../lib/backend/supabase';

/**
 * Get user profile
 * 
 * @requires Authorization header with Bearer token
 * 
 * @returns 200 - Success response with user profile data
 * @returns 401 - Unauthorized
 * @returns 500 - Internal server error
 * 
 * @throws AuthorizationError - When user is not authenticated
 * @throws DatabaseError - When user profile lookup fails
 * 
 * @example
 * GET /api/v1/users/profile
 * Headers: { "Authorization": "Bearer <token>" }
 */
export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({
        error: 'Unauthorized',
        message: 'Authentication required',
      }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return NextResponse.json({
        error: 'Unauthorized',
        message: 'Invalid authorization header format',
      }, { status: 401 });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({
        error: 'Unauthorized',
        message: 'Invalid token',
      }, { status: 401 });
    }

    // Get user profile from database
    const { data, error } = await supabase
      .from('users')
      .select(`
        *,
        contributions(
          id,
          type,
          content,
          rating,
          created_at,
          products(name, brand)
        )
      `)
      .eq('id', user.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({
          error: 'Not found',
          message: 'User profile not found',
        }, { status: 404 });
      }
      return NextResponse.json({
        error: 'Database error',
        message: error.message,
      }, { status: 400 });
    }

    return NextResponse.json({
      profile: data,
    });

  } catch (error) {
    console.error('Get user profile error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      message: 'Failed to get user profile',
    }, { status: 500 });
  }
}

/**
 * Update user profile
 * 
 * @requires Authorization header with Bearer token
 * @requires Request body (all optional):
 *   - full_name: User's full name
 *   - username: Username
 *   - bio: User biography
 *   - avatar_url: Avatar image URL
 * 
 * @returns 200 - Success response with updated profile
 * @returns 400 - Validation or database error
 * @returns 401 - Unauthorized
 * @returns 404 - User profile not found
 * @returns 500 - Internal server error
 */
export async function PUT(request: NextRequest) {
  try {
    // Get authenticated user
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({
        error: 'Unauthorized',
        message: 'Authentication required',
      }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return NextResponse.json({
        error: 'Unauthorized',
        message: 'Invalid authorization header format',
      }, { status: 401 });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({
        error: 'Unauthorized',
        message: 'Invalid token',
      }, { status: 401 });
    }

    const body = await request.json();
    const { full_name, username, bio, avatar_url } = body;

    // Prepare update data
    const updateData: any = {};
    if (full_name !== undefined) updateData.full_name = full_name;
    if (username !== undefined) updateData.username = username;
    if (bio !== undefined) updateData.bio = bio;
    if (avatar_url !== undefined) updateData.avatar_url = avatar_url;

    // Update user profile in database
    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', user.id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({
          error: 'Not found',
          message: 'User profile not found',
        }, { status: 404 });
      }
      return NextResponse.json({
        error: 'Database error',
        message: error.message,
      }, { status: 400 });
    }

    return NextResponse.json({
      message: 'Profile updated successfully',
      profile: data,
    });

  } catch (error) {
    console.error('Update user profile error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      message: 'Failed to update user profile',
    }, { status: 500 });
  }
}
