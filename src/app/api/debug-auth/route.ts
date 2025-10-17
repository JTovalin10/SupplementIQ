import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// Create a Supabase client for authentication (using anon key, not service role)
const supabaseAuth = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Create a Supabase client for database operations (using service role key)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/debug-auth - Debug authentication status
 * @param {NextRequest} request - The incoming request
 * @returns {Promise<NextResponse>} JSON response with authentication debug info
 */
export async function GET(request: NextRequest) {
  try {
    // Get authentication token
    const authHeader = request.headers.get('authorization');
    console.log('Auth header:', authHeader ? 'Present' : 'Missing');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ 
        error: 'No authorization header',
        debug: {
          hasHeader: !!authHeader,
          headerValue: authHeader,
          timestamp: new Date().toISOString()
        }
      }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    console.log('Token length:', token.length);
    
    // Verify the token with Supabase
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(token);
    
    if (authError || !user) {
      console.error('Authentication error:', authError);
      return NextResponse.json({ 
        error: 'Invalid token',
        debug: {
          authError: authError?.message,
          hasUser: !!user,
          timestamp: new Date().toISOString()
        }
      }, { status: 401 });
    }

    // Get user profile
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    return NextResponse.json({
      success: true,
      debug: {
        userId: user.id,
        userEmail: user.email,
        userProfile: userProfile,
        profileError: profileError?.message,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Debug auth error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      debug: {
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }
    }, { status: 500 });
  }
}
