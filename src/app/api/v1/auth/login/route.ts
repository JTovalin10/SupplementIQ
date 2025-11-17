import { NextRequest, NextResponse } from "next/server";
import { supabase } from "../../../../../lib/backend/supabase";
import {
  checkAuthRateLimit,
  resetRateLimit,
  getRateLimitKey,
} from "../../../../../lib/utils/rateLimit";

/**
 * Authenticate user login
 * Validates user credentials and returns user session data upon successful authentication
 *
 * @requires Request body:
 *   - email: Valid email address (automatically normalized, must match registered email)
 *   - password: User's password (non-empty string, must match registered password)
 *
 * @returns 200 - Success response containing:
 *   - message: "Login successful"
 *   - user: User object with id, email, user_metadata, app_metadata, created_at, updated_at
 *   - session: Session object with access_token, refresh_token, expires_at, expires_in, token_type
 * @returns 400 - Validation error for missing or invalid fields
 * @returns 401 - Authentication failure (invalid credentials, user not found)
 * @returns 500 - Internal server error
 *
 * @throws ValidationError - When email or password fields are missing/invalid
 * @throws AuthenticationError - When credentials don't match existing user
 * @throws SupabaseError - When authentication service fails
 *
 * @example
 * POST /api/v1/auth/login
 * Request body: {
 *   "email": "user@example.com",
 *   "password": "userpassword"
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Validation
    if (!email || !isValidEmail(email)) {
      return NextResponse.json(
        {
          error: "Validation error",
          message: "Valid email address is required",
        },
        { status: 400 },
      );
    }

    if (!password || password.trim().length === 0) {
      return NextResponse.json(
        {
          error: "Validation error",
          message: "Password is required",
        },
        { status: 400 },
      );
    }

    // Rate limiting check
    const normalizedEmail = email.toLowerCase().trim();
    const rateLimitResult = await checkAuthRateLimit(
      request,
      "login",
      normalizedEmail,
    );

    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          error: "Too many attempts",
          message: "Too many login attempts. Please try again later.",
          retryAfter: rateLimitResult.retryAfter,
          resetAt: rateLimitResult.resetAt,
        },
        {
          status: 429,
          headers: {
            "Retry-After": rateLimitResult.retryAfter?.toString() || "60",
            "X-RateLimit-Limit": rateLimitResult.limit.toString(),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": rateLimitResult.resetAt.toString(),
          },
        },
      );
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    });

    if (error) {
      return NextResponse.json(
        {
          error: "Login failed",
          message: error.message,
        },
        { status: 401 },
      );
    }

    // Clear rate limit on successful login
    const ipKey = getRateLimitKey(
      "login",
      request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown",
    );
    const emailKey = getRateLimitKey("login:email", normalizedEmail);
    await Promise.all([resetRateLimit(ipKey), resetRateLimit(emailKey)]);

    return NextResponse.json(
      {
        message: "Login successful",
        user: data.user,
        session: data.session,
      },
      {
        headers: {
          "X-RateLimit-Limit": rateLimitResult.limit.toString(),
          "X-RateLimit-Remaining": rateLimitResult.remaining.toString(),
          "X-RateLimit-Reset": rateLimitResult.resetAt.toString(),
        },
      },
    );
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: "Failed to login",
      },
      { status: 500 },
    );
  }
}

// Helper function to validate email
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
