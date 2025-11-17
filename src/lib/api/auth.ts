/**
 * Secure Authentication Helper for API Routes
 *
 * This module provides utilities for verifying JWT tokens from Supabase
 * and ensuring that user IDs are cryptographically verified.
 *
 * NEVER trust client-provided headers like x-user-id or x-user-role!
 * Always verify JWT tokens to get the user ID.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/database/supabase/server";

export interface AuthenticatedUser {
  id: string;
  email: string;
  role?: string;
}

/**
 * Extract and verify JWT token from Authorization header
 * Returns the authenticated user or null if authentication fails
 *
 * @param request - Next.js request object
 * @returns Authenticated user object or null
 *
 * @example
 * const user = await authenticateRequest(request);
 * if (!user) {
 *   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
 * }
 * // Use user.id safely
 */
export async function authenticateRequest(
  request: NextRequest,
): Promise<AuthenticatedUser | null> {
  try {
    // Extract token from Authorization header
    const authHeader = request.headers.get("Authorization");

    if (!authHeader) {
      return null;
    }

    // Check for Bearer token format
    if (!authHeader.startsWith("Bearer ")) {
      return null;
    }

    const token = authHeader.replace("Bearer ", "").trim();

    if (!token) {
      return null;
    }

    // Verify token with Supabase
    const supabase = await createClient();

    // getUser() verifies the JWT signature and expiration
    // This is cryptographically secure - the token cannot be faked
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error || !user) {
      console.warn("JWT verification failed:", error?.message);
      return null;
    }

    // Return verified user data
    return {
      id: user.id,
      email: user.email || "",
      role: user.user_metadata?.role,
    };
  } catch (error) {
    console.error("Authentication error:", error);
    return null;
  }
}

/**
 * Require authentication for an API route
 * Returns authenticated user or 401 response
 *
 * @param request - Next.js request object
 * @returns Object with user or NextResponse with 401 status
 *
 * @example
 * export async function POST(request: NextRequest) {
 *   const authResult = await requireAuth(request);
 *
 *   if (authResult instanceof NextResponse) {
 *     return authResult; // Return 401
 *   }
 *
 *   const { user } = authResult;
 *   // Use user.id safely - it's verified!
 * }
 */
export async function requireAuth(
  request: NextRequest,
): Promise<{ user: AuthenticatedUser } | NextResponse> {
  const user = await authenticateRequest(request);

  if (!user) {
    return NextResponse.json(
      {
        error: "Unauthorized",
        message: "Authentication required. Please provide a valid JWT token.",
      },
      { status: 401 },
    );
  }

  return { user };
}

/**
 * Require authentication and specific role
 * Returns authenticated user or 401/403 response
 *
 * @param request - Next.js request object
 * @param allowedRoles - Array of allowed roles (e.g., ['admin', 'moderator'])
 * @returns Object with user or NextResponse with 401/403 status
 *
 * @example
 * export async function DELETE(request: NextRequest) {
 *   const authResult = await requireRole(request, ['admin', 'moderator']);
 *
 *   if (authResult instanceof NextResponse) {
 *     return authResult; // Return 401 or 403
 *   }
 *
 *   const { user } = authResult;
 *   // User has required role - proceed
 * }
 */
export async function requireRole(
  request: NextRequest,
  allowedRoles: string[],
): Promise<{ user: AuthenticatedUser } | NextResponse> {
  // First, verify authentication
  const authResult = await requireAuth(request);

  if (authResult instanceof NextResponse) {
    return authResult; // Return 401 if not authenticated
  }

  const { user } = authResult;

  // Fetch user's role from database (source of truth)
  const supabase = await createClient();
  const { data: userData, error } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (error || !userData) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Check if user has required role
  if (!allowedRoles.includes(userData.role)) {
    return NextResponse.json(
      {
        error: "Forbidden",
        message: `This action requires one of the following roles: ${allowedRoles.join(", ")}`,
      },
      { status: 403 },
    );
  }

  // Return user with verified role
  return { user: { ...user, role: userData.role } };
}

/**
 * Get authenticated user from session (for server components)
 * This uses cookies instead of Authorization header
 *
 * @returns Authenticated user or null
 *
 * @example
 * const user = await getSessionUser();
 * if (!user) {
 *   redirect('/login');
 * }
 */
export async function getSessionUser(): Promise<AuthenticatedUser | null> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return null;
    }

    return {
      id: user.id,
      email: user.email || "",
      role: user.user_metadata?.role,
    };
  } catch (error) {
    console.error("Session authentication error:", error);
    return null;
  }
}

/**
 * Verify that the authenticated user owns the resource
 * Useful for protecting user-specific endpoints
 *
 * @param request - Next.js request object
 * @param resourceUserId - User ID that owns the resource
 * @returns Authenticated user or 401/403 response
 *
 * @example
 * export async function PUT(
 *   request: NextRequest,
 *   { params }: { params: { id: string } }
 * ) {
 *   // Check if user owns this resource
 *   const authResult = await requireResourceOwner(request, params.id);
 *
 *   if (authResult instanceof NextResponse) {
 *     return authResult; // Return 401 or 403
 *   }
 *
 *   const { user } = authResult;
 *   // User owns the resource - proceed with update
 * }
 */
export async function requireResourceOwner(
  request: NextRequest,
  resourceUserId: string,
): Promise<{ user: AuthenticatedUser } | NextResponse> {
  const authResult = await requireAuth(request);

  if (authResult instanceof NextResponse) {
    return authResult; // Return 401 if not authenticated
  }

  const { user } = authResult;

  // Check if user owns the resource
  if (user.id !== resourceUserId) {
    return NextResponse.json(
      {
        error: "Forbidden",
        message: "You do not have permission to access this resource.",
      },
      { status: 403 },
    );
  }

  return { user };
}

/**
 * Get user ID from JWT token (shorthand)
 * Returns null if not authenticated
 *
 * @param request - Next.js request object
 * @returns User ID or null
 *
 * @example
 * const userId = await getUserId(request);
 * if (!userId) {
 *   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
 * }
 */
export async function getUserId(request: NextRequest): Promise<string | null> {
  const user = await authenticateRequest(request);
  return user?.id || null;
}
