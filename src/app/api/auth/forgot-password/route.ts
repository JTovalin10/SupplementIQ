import { supabase } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

/**
 * API endpoint for handling forgot password requests
 * Sends a password reset email to the user via Supabase Auth
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    // Validate email
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Please enter a valid email address' },
        { status: 400 }
      )
    }

    // Send password reset email using Supabase Auth
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password`,
    })

    if (error) {
      console.error('Password reset error:', error)
      
      // Return a generic message for security (don't reveal if email exists)
      return NextResponse.json(
        { 
          message: 'If an account with this email exists, you will receive a password reset link shortly.' 
        },
        { status: 200 }
      )
    }

    // Always return success message for security
    return NextResponse.json(
      { 
        message: 'If an account with this email exists, you will receive a password reset link shortly.' 
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('Forgot password error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    )
  }
}
