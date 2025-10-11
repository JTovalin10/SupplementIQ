import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/pending-products/pending/count - Get count of pending products for admin dashboard
export async function GET(request: NextRequest) {
  try {
    // Count pending products
    const { count, error } = await supabase
      .from('pending_products')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    if (error) {
      return NextResponse.json(
        { error: 'Failed to count pending products' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      pending_count: count || 0,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Error counting pending products:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
