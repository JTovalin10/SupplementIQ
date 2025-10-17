// API route for voting on contributions
// TODO: Implement contribution voting system

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return NextResponse.json({ message: 'Vote on contribution', id });
}
