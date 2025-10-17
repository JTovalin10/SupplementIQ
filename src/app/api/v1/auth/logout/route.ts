import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../../../lib/backend/supabase';

/**
 * Logout current user session
 * Invalidates the current user's authentication session
 * 
 * @requires No request body or parameters required
 * 
 * @returns 200 - Success response containing:
 *   - message: "Logout successful"
 * @returns 400 - Logout failure (session already invalid)
 * @returns 500 - Internal server error
 * 
 * @throws SupabaseError - When logout operation fails
 * 
 * @example
 * POST /api/v1/auth/logout
 */
export async function POST(request: NextRequest) {
  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      return NextResponse.json({
        error: 'Logout failed',
        message: error.message,
      }, { status: 400 });
    }

    return NextResponse.json({
      message: 'Logout successful',
    });

  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      message: 'Failed to logout',
    }, { status: 500 });
  }
}
