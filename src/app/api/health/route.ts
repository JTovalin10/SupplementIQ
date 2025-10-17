import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/health - Health check endpoint with database connectivity
export async function GET(request: NextRequest) {
  try {
    // Test database connection
    const { error } = await supabase
      .from('users')
      .select('count')
      .limit(1);

    if (error) {
      return NextResponse.json({
        status: 'unhealthy',
        service: 'NextJS API',
        error: 'Database connection failed',
        timestamp: new Date().toISOString(),
      }, { status: 503 });
    }

    return NextResponse.json({
      status: 'healthy',
      service: 'NextJS API',
      database: 'connected',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      environment: process.env.NODE_ENV,
    });

  } catch (error) {
    console.error('Health check error:', error);
    return NextResponse.json({
      status: 'unhealthy',
      service: 'NextJS API',
      error: 'Internal server error',
      timestamp: new Date().toISOString(),
    }, { status: 503 });
  }
}
