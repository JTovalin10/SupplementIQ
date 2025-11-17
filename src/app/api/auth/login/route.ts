import { createClient } from "@/lib/database/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import {
  checkAuthRateLimit,
  resetRateLimit,
  getRateLimitKey,
} from "@/lib/utils/rateLimit";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
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

    // Get Supabase client
    const supabase = await createClient();

    // Use Supabase auth for authentication
    const { data, error } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    });

    if (error) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 },
      );
    }

    if (!data.user || !data.session) {
      return NextResponse.json(
        { error: "Authentication failed" },
        { status: 401 },
      );
    }

    // Get user profile with role
    const { data: userProfile } = await supabase
      .from("users")
      .select("id, email, username, role")
      .eq("id", data.user.id)
      .single();

    // Update last login timestamp
    await supabase
      .from("users")
      .update({ last_login: new Date().toISOString() })
      .eq("id", data.user.id);

    // Clear rate limit on successful login
    const ipKey = getRateLimitKey(
      "login",
      request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown",
    );
    const emailKey = getRateLimitKey("login:email", normalizedEmail);
    await Promise.all([resetRateLimit(ipKey), resetRateLimit(emailKey)]);

    // Return Supabase session tokens and user info
    return NextResponse.json(
      {
        success: true,
        user: {
          id: data.user.id,
          email: data.user.email,
          username: userProfile?.username || data.user.user_metadata?.username,
          role: userProfile?.role || "user",
        },
        session: {
          accessToken: data.session.access_token,
          refreshToken: data.session.refresh_token,
          expiresAt: data.session.expires_at,
          expiresIn: data.session.expires_in,
        },
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
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
