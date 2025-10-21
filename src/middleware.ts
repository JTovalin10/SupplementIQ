import { createClient } from '@supabase/supabase-js';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Next.js middleware for authentication and route protection
 * Handles JWT token validation and role-based access control
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for public routes
  if (
    pathname.startsWith('/api/v1/auth/login') ||
    pathname.startsWith('/api/v1/auth/register') ||
    pathname.startsWith('/api/v1/docs') ||
    pathname.startsWith('/api/v1/autocomplete') ||
    pathname.startsWith('/api/v1/products') && request.method === 'GET' ||
    pathname.startsWith('/api/health') ||
    pathname.startsWith('/api/auth/forgot-password') ||
    pathname.startsWith('/api/auth/reset-password') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname === '/' ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/register') ||
    pathname.startsWith('/forgot-password') ||
    pathname.startsWith('/reset-password')
  ) {
    return NextResponse.next();
  }

  // Admin routes protection
  if (pathname.startsWith('/api/v1/admin')) {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication required' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Invalid token format' },
        { status: 401 }
      );
    }

    try {
      const { data: { user }, error } = await supabase.auth.getUser(token);
      
      if (error || !user) {
        return NextResponse.json(
          { error: 'Unauthorized', message: 'Invalid token' },
          { status: 401 }
        );
      }

      // Check if user has admin role
      const userRole = user.app_metadata?.role || 'user';
      if (userRole !== 'admin' && userRole !== 'owner') {
        return NextResponse.json(
          { error: 'Forbidden', message: 'Admin access required' },
          { status: 403 }
        );
      }

      // Add user info to request headers for downstream handlers
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set('x-user-id', user.id);
      requestHeaders.set('x-user-role', userRole);
      requestHeaders.set('x-user-email', user.email || '');

      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });

    } catch (error) {
      console.error('Admin middleware error:', error);
      return NextResponse.json(
        { error: 'Internal Server Error', message: 'Authentication failed' },
        { status: 500 }
      );
    }
  }

  // Owner routes protection
  if (pathname.startsWith('/api/v1/owner')) {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication required' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Invalid token format' },
        { status: 401 }
      );
    }

    try {
      const { data: { user }, error } = await supabase.auth.getUser(token);
      
      if (error || !user) {
        return NextResponse.json(
          { error: 'Unauthorized', message: 'Invalid token' },
          { status: 401 }
        );
      }

      // Check if user has owner role
      const userRole = user.app_metadata?.role || 'user';
      if (userRole !== 'owner') {
        return NextResponse.json(
          { error: 'Forbidden', message: 'Owner access required' },
          { status: 403 }
        );
      }

      // Add user info to request headers for downstream handlers
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set('x-user-id', user.id);
      requestHeaders.set('x-user-role', userRole);
      requestHeaders.set('x-user-email', user.email || '');

      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });

    } catch (error) {
      console.error('Owner middleware error:', error);
      return NextResponse.json(
        { error: 'Internal Server Error', message: 'Authentication failed' },
        { status: 500 }
      );
    }
  }

  // Protected routes (require authentication)
  if (
    pathname.startsWith('/api/v1/users') ||
    pathname.startsWith('/api/v1/contributions') ||
    pathname.startsWith('/api/v1/upload') ||
    pathname.startsWith('/api/v1/pending-products') ||
    pathname.startsWith('/api/pending-products')
  ) {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication required' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Invalid token format' },
        { status: 401 }
      );
    }

    try {
      const { data: { user }, error } = await supabase.auth.getUser(token);
      
      if (error || !user) {
        return NextResponse.json(
          { error: 'Unauthorized', message: 'Invalid token' },
          { status: 401 }
        );
      }

      // Add user info to request headers for downstream handlers
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set('x-user-id', user.id);
      requestHeaders.set('x-user-role', user.app_metadata?.role || 'user');
      requestHeaders.set('x-user-email', user.email || '');

      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });

    } catch (error) {
      console.error('Auth middleware error:', error);
      return NextResponse.json(
        { error: 'Internal Server Error', message: 'Authentication failed' },
        { status: 500 }
      );
    }
  }

  // Continue to the next middleware or route handler
  return NextResponse.next();
}

/**
 * Configure which paths the middleware should run on
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};