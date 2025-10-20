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
        { success: false, error: 'Email, password, and username are required' },
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
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    if (!data.user) {
      return NextResponse.json(
        { success: false, error: 'Failed to create user' },
        { status: 500 }
      );
    }

    // Check if email confirmation is required
    const requiresConfirmation = data.user.email_confirmed_at === null;

    // Create user record in public.users table
    const { error: userError } = await supabase
      .from('users')
      .insert({
        id: data.user.id,
        email: data.user.email,
        username: username,
        role: 'newcomer', // Default role for new users
        created_at: new Date().toISOString(),
      });

    if (userError) {
      console.error('Error creating user record:', userError);
      return NextResponse.json(
        { success: false, error: 'Failed to create user profile' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      requiresConfirmation 
    });
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}