import { createClient } from '@/lib/database/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');

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

    // Check if user has moderator+ permissions
    const allowedRoles = ['moderator', 'admin', 'owner'];
    if (!allowedRoles.includes(userProfile.role)) {
      return NextResponse.json({ 
        error: `Insufficient permissions. Only ${allowedRoles.join(', ')} can access this data.` 
      }, { status: 403 });
    }

    // Fetch recent accepted products (products table contains approved products)
    const { data: products, error } = await supabase
      .from('products')
      .select(`
        id,
        name,
        brand_id,
        brands(name),
        category,
        created_at,
        updated_at
      `)
      .order('updated_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching recent products:', error);
      return NextResponse.json({ error: 'Failed to fetch recent products' }, { status: 500 });
    }

    console.log('Fetched products:', JSON.stringify(products, null, 2));

    // Format the data
    const formattedProducts = (products || []).map((product: any) => {
      const brands = product.brands as any;
      const brandName = Array.isArray(brands) 
        ? brands[0]?.name || 'Unknown'
        : brands?.name || 'Unknown';
      
      return {
        id: product.id,
        name: product.name,
        brand: brandName,
        category: product.category,
        submittedBy: 'System', // Products in the products table are already approved
        approvedBy: 'System',
        createdAt: product.created_at,
        updatedAt: product.updated_at
      };
    });

    return NextResponse.json({
      products: formattedProducts,
      total: formattedProducts.length
    });

  } catch (error) {
    console.error('Error in recent products API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
