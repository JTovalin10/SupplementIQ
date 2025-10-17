// API route for file uploads (product images, labels, etc.)
// TODO: Implement file upload handling

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  return NextResponse.json({ message: 'File upload endpoint' });
}
