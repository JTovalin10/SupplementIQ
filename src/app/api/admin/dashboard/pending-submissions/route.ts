import { createClient } from '@/lib/database/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/admin/dashboard/pending-submissions?page=1&limit=10
export async function GET(request: NextRequest) {
  try {
    // Create server-side Supabase client
    const supabase = await createClient();

    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Authorization header required' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Verify the token and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Get user profile to check role
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !userProfile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    // Check if user has mod+ permissions
    const allowedRoles = ['moderator', 'admin', 'owner'];
    if (!allowedRoles.includes(userProfile.role)) {
      return NextResponse.json({ 
        error: `Insufficient permissions. Only ${allowedRoles.join(', ')} can access this data.` 
      }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(parseInt(searchParams.get('page') || '1', 10), 1);
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '10', 10), 1), 50);
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error, count } = await supabase
      .from('pending_products')
      .select(`
        id,
        slug,
        product_name,
        image_url,
        category,
        created_at,
        submitted_by,
        users:submitted_by ( username ),
        brands:brand_id ( name )
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const submissions = (data || []).map((row: any) => ({
      id: String(row.id),
      slug: row.slug as string,
      productName: row.product_name as string,
      brandName: row.brands?.name ?? 'Unknown',
      imageUrl: row.image_url as string | null,
      category: row.category as string,
      submittedBy: row.users?.username ?? 'Unknown',
      submittedAt: row.created_at as string,
      status: 'pending' as 'pending',
    }));

    // Brand data is already included in the main query

    return NextResponse.json({
      submissions,
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
    });
  } catch (e) {
    return NextResponse.json({ error: 'Failed to fetch pending submissions' }, { status: 500 });
  }
}
