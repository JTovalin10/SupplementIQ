import { supabase } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

/**
 * API endpoint for handling password reset confirmation
 * Updates the user's password using Supabase Auth
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { password, confirmPassword } = body

    // Validate password
    if (!password) {
      return NextResponse.json(
        { error: 'Password is required' },
        { status: 400 }
      )
    }

    // Validate password confirmation
    if (password !== confirmPassword) {
      return NextResponse.json(
        { error: 'Passwords do not match' },
        { status: 400 }
      )
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      )
    }

    // Check for password complexity
    const hasUpperCase = /[A-Z]/.test(password)
    const hasLowerCase = /[a-z]/.test(password)
    const hasNumbers = /\d/.test(password)
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password)

    if (!hasUpperCase || !hasLowerCase || !hasNumbers || !hasSpecialChar) {
      return NextResponse.json(
        { 
          error: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character' 
        },
        { status: 400 }
      )
    }

    // Update password using Supabase Auth
    const { error } = await supabase.auth.updateUser({
      password: password
    })

    if (error) {
      console.error('Password update error:', error)
      
      // Handle specific error cases
      if (error.message.includes('session')) {
        return NextResponse.json(
          { error: 'Invalid or expired reset link. Please request a new password reset.' },
          { status: 400 }
        )
      }
      
      return NextResponse.json(
        { error: 'Failed to update password. Please try again.' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { 
        message: 'Password updated successfully. You can now log in with your new password.' 
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('Reset password error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    )
  }
}
