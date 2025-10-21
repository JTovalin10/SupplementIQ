import { getUserFriendlyError, mapSupabaseError } from '@/lib/auth/error-messages';
import { supabase } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Signup API route for NextAuth integration
 * Creates user account via Supabase
 */
export async function POST(request: NextRequest) {
  try {
    const { email, password, username } = await request.json();

    if (!email || !password || !username) {
      return NextResponse.json(
        { success: false, error: 'Please fill in all required fields' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: 'Please enter a valid email address' },
        { status: 400 }
      );
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    // Validate username
    if (username.length < 3) {
      return NextResponse.json(
        { success: false, error: 'Username must be at least 3 characters long' },
        { status: 400 }
      );
    }

    // Check if username is already taken (case-insensitive)
    const { data: existingUser } = await supabase
      .from('users')
      .select('username')
      .ilike('username', username.toLowerCase())
      .single();

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'This username is already taken. Please choose a different one' },
        { status: 400 }
      );
    }

    // Create user via Supabase
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
        },
      },
    });

    if (error) {
      const userFriendlyError = mapSupabaseError(error.message);
      return NextResponse.json(
        { success: false, error: userFriendlyError },
        { status: 400 }
      );
    }

    if (!data.user) {
      return NextResponse.json(
        { success: false, error: 'Unable to create your account. Please try again or contact support' },
        { status: 500 }
      );
    }

    // Check if email confirmation is required
    const requiresConfirmation = data.user.email_confirmed_at === null;

    // The auth trigger will automatically create the user record in public.users table
    // We don't need to manually insert it, as this could cause conflicts
    // The trigger will use the username from user_metadata or fallback to email prefix
    
    return NextResponse.json({ 
      success: true, 
      requiresConfirmation 
    });
  } catch (error) {
    console.error('Signup error:', error);
    const userFriendlyError = getUserFriendlyError(error);
    return NextResponse.json(
      { success: false, error: userFriendlyError },
      { status: 500 }
    );
  }
}