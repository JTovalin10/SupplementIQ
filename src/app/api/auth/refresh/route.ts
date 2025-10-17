import { refreshAccessToken, verifyToken } from '@/lib/auth/jwt-utils';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { refreshToken } = await request.json();

    if (!refreshToken) {
      return NextResponse.json(
        { error: 'Refresh token is required' },
        { status: 400 }
      );
    }

    // Verify the refresh token
    const payload = await verifyToken(refreshToken);
    
    if ((payload as any).type !== 'refresh') {
      return NextResponse.json(
        { error: 'Invalid refresh token type' },
        { status: 401 }
      );
    }

    // Generate new access token
    const newAccessToken = await refreshAccessToken(refreshToken);

    return NextResponse.json({
      success: true,
      accessToken: newAccessToken
    });

  } catch (error: any) {
    console.error('Token refresh error:', error);
    
    if (error.message.includes('expired')) {
      return NextResponse.json(
        { error: 'Refresh token expired', code: 'REFRESH_EXPIRED' },
        { status: 401 }
      );
    }
    
    if (error.message.includes('invalid')) {
      return NextResponse.json(
        { error: 'Invalid refresh token', code: 'INVALID_REFRESH' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to refresh token' },
      { status: 500 }
    );
  }
}
