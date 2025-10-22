import { isAppInitialized } from '@/lib/startup';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Middleware to ensure Redis is initialized before processing API requests
 */
export async function redisMiddleware(request: NextRequest) {
  // Only apply to API routes that use Redis
  if (!request.nextUrl.pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // Skip certain routes that don't need Redis
  const skipRoutes = ['/api/health', '/api/test'];
  if (skipRoutes.some(route => request.nextUrl.pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Check if Redis is initialized
  if (!isAppInitialized()) {
    console.log('⏳ Redis not initialized, waiting...');
    
    // Wait for initialization with timeout
    const maxWait = 5000; // 5 seconds
    const startTime = Date.now();
    
    while (!isAppInitialized() && (Date.now() - startTime) < maxWait) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    if (!isAppInitialized()) {
      console.error('❌ Redis initialization timeout');
      return NextResponse.json(
        { error: 'Service temporarily unavailable' },
        { status: 503 }
      );
    }
  }

  return NextResponse.next();
}
