import { NextRequest, NextResponse } from "next/server";
import { supabase } from "../../../../../lib/backend/supabase";
import { checkAuthRateLimit } from "../../../../../lib/utils/rateLimit";

/**
 * Register a new user account
 * Creates a new user account with email, password, and full name
 *
 * @requires Request body:
 *   - email: Valid email address (automatically normalized, must be unique)
 *   - password: Password string with minimum 8 characters (will be hashed by Supabase)
 *   - full_name: User's full name with minimum 2 characters (stored in user_metadata)
 *
 * @returns 201 - Success response containing:
 *   - message: "User registered successfully"
 *   - user: User object with id, email, user_metadata, app_metadata, created_at, updated_at
 * @returns 400 - Validation error or registration failure (email already exists, invalid format)
 * @returns 500 - Internal server error
 *
 * @throws ValidationError - When required fields are missing or invalid
 * @throws SupabaseError - When user registration fails (email already exists, weak password, etc.)
 *
 * @example
 * POST /api/v1/auth/register
 * Request body: {
 *   "email": "user@example.com",
 *   "password": "securepassword123",
 *   "full_name": "John Doe"
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, full_name } = body;

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

    if (!password || password.length < 8) {
      return NextResponse.json(
        {
          error: "Validation error",
          message: "Password must be at least 8 characters",
        },
        { status: 400 },
      );
    }

    if (!full_name || full_name.trim().length < 2) {
      return NextResponse.json(
        {
          error: "Validation error",
          message: "Full name is required and must be at least 2 characters",
        },
        { status: 400 },
      );
    }

    // Rate limiting check
    const normalizedEmail = email.toLowerCase().trim();
    const rateLimitResult = await checkAuthRateLimit(
      request,
      "register",
      normalizedEmail,
    );

    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          error: "Too many attempts",
          message: "Too many registration attempts. Please try again later.",
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

    const { data, error } = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
      options: {
        data: {
          full_name: full_name.trim(),
        },
      },
    });

    if (error) {
      return NextResponse.json(
        {
          error: "Registration failed",
          message: error.message,
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        message: "User registered successfully",
        user: data.user,
      },
      {
        status: 201,
        headers: {
          "X-RateLimit-Limit": rateLimitResult.limit.toString(),
          "X-RateLimit-Remaining": rateLimitResult.remaining.toString(),
          "X-RateLimit-Reset": rateLimitResult.resetAt.toString(),
        },
      },
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: "Failed to register user",
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
