// API route for users - GET (profile), PUT (update profile)
// TODO: Implement user management endpoints

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  return NextResponse.json({ message: 'Get users' });
}

export async function PUT(request: NextRequest) {
  return NextResponse.json({ message: 'Update user profile' });
}
