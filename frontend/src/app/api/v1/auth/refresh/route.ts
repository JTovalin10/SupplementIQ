import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../../../lib/backend/supabase';

/**
 * Refresh user authentication token
 * Generates a new access token using a valid refresh token to maintain user session
 * 
 * @requires Request body:
 *   - refresh_token: Valid refresh token string obtained from login response
 * 
 * @returns 200 - Success response with new session data containing:
 *   - session.access_token: New JWT access token for API authentication
 *   - session.refresh_token: New refresh token for future token renewals
 *   - session.expires_at: Token expiration timestamp
 *   - session.expires_in: Token validity duration in seconds
 *   - session.token_type: Token type (usually "bearer")
 *   - session.user: Updated user object with current profile data
 * @returns 400 - Bad request (missing refresh token)
 * @returns 401 - Token refresh failed (invalid or expired refresh token)
 * @returns 500 - Internal server error
 * 
 * @throws ValidationError - When refresh_token is missing from request body
 * @throws TokenError - When refresh token is invalid, expired, or revoked
 * @throws SupabaseError - When token refresh service fails
 * 
 * @example
 * POST /api/v1/auth/refresh
 * {
 *   "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9..."
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { refresh_token } = body;

    if (!refresh_token) {
      return NextResponse.json({
        error: 'Bad request',
        message: 'Refresh token is required',
      }, { status: 400 });
    }

    const { data, error } = await supabase.auth.refreshSession({
      refresh_token,
    });

    if (error) {
      return NextResponse.json({
        error: 'Token refresh failed',
        message: error.message,
      }, { status: 401 });
    }

    return NextResponse.json({
      session: data.session,
      user: data.user,
    });

  } catch (error) {
    console.error('Token refresh error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      message: 'Failed to refresh token',
    }, { status: 500 });
  }
}
