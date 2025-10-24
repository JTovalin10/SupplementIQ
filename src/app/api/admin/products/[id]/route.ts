import { createClient } from '@/lib/database/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/admin/products/[slug] - Get detailed product information for review
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id: productSlug } = await params;

    console.log('Product slug received:', productSlug);
    
    if (!productSlug || productSlug === 'undefined') {
      return NextResponse.json({ error: 'Invalid product slug' }, { status: 400 });
    }

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
        error: `Insufficient permissions. Only ${allowedRoles.join(', ')} can review products.`
      }, { status: 403 });
    }

    // Fetch the pending product with all related data
    const { data: product, error } = await supabase
      .from('pending_products')
      .select(`
        *,
        users:submitted_by (
          id,
          username,
          email
        ),
        brands:brand_id (
          id,
          name,
          website
        )
      `)
      .eq('slug', productSlug)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Fetch dosage details based on product category
    let dosageDetails = null;
    try {
      switch (product.category) {
        case 'pre-workout':
          const { data: preworkoutData } = await supabase
            .from('preworkout_details')
            .select('*')
            .eq('pending_product_id', product.id)
            .single();
          dosageDetails = preworkoutData;
          break;
          
        case 'non-stim-pre-workout':
          const { data: nonStimData } = await supabase
            .from('non_stim_preworkout_details')
            .select('*')
            .eq('pending_product_id', product.id)
            .single();
          dosageDetails = nonStimData;
          break;
          
        case 'energy-drink':
          const { data: energyData } = await supabase
            .from('energy_drink_details')
            .select('*')
            .eq('pending_product_id', product.id)
            .single();
          dosageDetails = energyData;
          break;
          
        case 'protein':
          const { data: proteinData } = await supabase
            .from('protein_details')
            .select('*')
            .eq('pending_product_id', product.id)
            .single();
          dosageDetails = proteinData;
          break;
          
        case 'bcaa':
        case 'eaa':
          const { data: aminoData } = await supabase
            .from('amino_acid_details')
            .select('*')
            .eq('pending_product_id', product.id)
            .single();
          dosageDetails = aminoData;
          break;
          
        case 'fat-burner':
        case 'appetite-suppressant':
          const { data: fatBurnerData } = await supabase
            .from('fat_burner_details')
            .select('*')
            .eq('pending_product_id', product.id)
            .single();
          dosageDetails = fatBurnerData;
          break;
          
        case 'creatine':
          // Creatine products might use preworkout_details or have their own table
          const { data: creatineData } = await supabase
            .from('preworkout_details')
            .select('*')
            .eq('pending_product_id', product.id)
            .single();
          dosageDetails = creatineData;
          break;
      }
    } catch (dosageError) {
      console.warn('Could not fetch dosage details:', dosageError);
      // Continue without dosage details
    }

    // Format the response
    const formattedProduct = {
      id: product.id,
      productName: product.product_name,
      brand: {
        id: product.brands?.id,
        name: product.brands?.name || 'Unknown',
        website: product.brands?.website
      },
      category: product.category,
      description: product.description,
      imageUrl: product.image_url,
      price: product.price,
      currency: product.currency,
      servingsPerContainer: product.servings_per_container,
      servingSizeG: product.serving_size_g,
      dosageRating: product.dosage_rating,
      dangerRating: product.danger_rating,
      submittedBy: {
        id: product.users?.id,
        username: product.users?.username || 'Unknown',
        email: product.users?.email
      },
      submittedAt: product.created_at,
      updatedAt: product.updated_at,
      approvalStatus: product.approval_status,
      reviewedBy: product.reviewed_by,
      reviewedAt: product.reviewed_at,
      dosageDetails: dosageDetails
    };

    return NextResponse.json({ product: formattedProduct });
  } catch (error) {
    console.error('Error fetching product details:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
