import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Next.js API route is working!',
    timestamp: new Date().toISOString(),
    method: 'GET',
    url: request.url,
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    return NextResponse.json({
      message: 'POST request received successfully',
      receivedData: body,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json({
      error: 'Invalid JSON',
      message: 'Could not parse request body',
    }, { status: 400 });
  }
}
