// API route for contributions - GET (list), POST (create)
// TODO: Implement contribution management endpoints

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  return NextResponse.json({ message: 'List contributions' });
}

export async function POST(request: NextRequest) {
  return NextResponse.json({ message: 'Create contribution' });
}
