import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../../../lib/backend/supabase';

/**
 * Get current authenticated user information
 * Retrieves the current user's profile data using the JWT token from Authorization header
 * 
 * @requires Authorization header - Bearer token in format "Bearer <jwt_token>"
 * 
 * @returns 200 - Success response with user object containing:
 *   - user.id: User's unique identifier
 *   - user.email: User's email address
 *   - user.user_metadata: Object containing full_name and other custom data
 *   - user.app_metadata: Object containing provider and role information
 *   - user.created_at: Account creation timestamp
 *   - user.updated_at: Last update timestamp
 * @returns 401 - Unauthorized (missing or invalid token)
 * @returns 500 - Internal server error
 * 
 * @throws AuthorizationError - When Authorization header is missing
 * @throws TokenError - When JWT token is invalid or expired
 * @throws SupabaseError - When user lookup fails
 * 
 * @example
 * GET /api/v1/auth/me
 * Headers: { "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." }
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({
        error: 'Unauthorized',
        message: 'No authorization header provided',
      }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return NextResponse.json({
        error: 'Unauthorized',
        message: 'Invalid authorization header format. Expected "Bearer <token>"',
      }, { status: 401 });
    }

    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error) {
      return NextResponse.json({
        error: 'Unauthorized',
        message: error.message,
      }, { status: 401 });
    }

    if (!user) {
      return NextResponse.json({
        error: 'Unauthorized',
        message: 'User not found',
      }, { status: 401 });
    }

    return NextResponse.json({
      user,
    });

  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      message: 'Failed to get user',
    }, { status: 500 });
  }
}
