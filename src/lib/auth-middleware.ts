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
 * Authenticate user and check admin/owner/moderator role
 * @param {NextRequest} request - The incoming request
 * @returns {Promise<{user: any, userProfile: any} | NextResponse>} User data or error response
 */
export async function authenticateAdmin(request: NextRequest) {
  try {
    // Get authentication token
    const authHeader = request.headers.get('authorization');
    console.log('Auth Middleware - Authorization header present:', !!authHeader);
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('Auth Middleware - Missing or invalid authorization header');
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    console.log('Auth Middleware - Token extracted, length:', token.length);
    
    // Verify the token with Supabase
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(token);
    
    console.log('Auth Middleware - Token verification result:', {
      hasUser: !!user,
      userId: user?.id,
      error: authError?.message
    });
    
    if (authError || !user) {
      console.error('Authentication error:', authError);
      return NextResponse.json({ error: 'Invalid authentication token' }, { status: 401 });
    }

    // Check if user has admin/owner/moderator role
    console.log('Auth Middleware - Fetching user profile for:', user.id);
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    console.log('Auth Middleware - User profile result:', {
      hasProfile: !!userProfile,
      role: userProfile?.role,
      error: profileError?.message
    });

    if (profileError || !userProfile) {
      console.log('Auth Middleware - User profile not found or error');
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    if (!['admin', 'owner', 'moderator'].includes(userProfile.role)) {
      console.log('Auth Middleware - Insufficient permissions, role:', userProfile.role);
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    console.log('Auth Middleware - Authentication successful for role:', userProfile.role);

    return { user, userProfile };

  } catch (error) {
    console.error('Authentication error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * Authenticate user (any role)
 * @param {NextRequest} request - The incoming request
 * @returns {Promise<{user: any, userProfile: any} | NextResponse>} User data or error response
 */
export async function authenticateUser(request: NextRequest) {
  try {
    // Get authentication token
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Verify the token with Supabase
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(token);
    
    if (authError || !user) {
      console.error('Authentication error:', authError);
      return NextResponse.json({ error: 'Invalid authentication token' }, { status: 401 });
    }

    // Get user profile
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError || !userProfile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    return { user, userProfile };

  } catch (error) {
    console.error('Authentication error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
