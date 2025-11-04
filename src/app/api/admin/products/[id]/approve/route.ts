import { createClient } from '@/lib/database/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// POST /api/admin/products/[id]/approve - Approve a pending product and move it to production
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id: productSlug } = await params;

    if (!productSlug || productSlug === 'undefined') {
      return NextResponse.json({ error: 'Invalid product slug' }, { status: 400 });
    }

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
        error: `Insufficient permissions. Only ${allowedRoles.join(', ')} can approve products.`
      }, { status: 403 });
    }

    // Get product data from request body (sent from frontend to avoid double DB calls)
    const body = await request.json();
    const { pendingProduct, editedFields } = body;

    if (!pendingProduct) {
      return NextResponse.json({ error: 'Product data not provided' }, { status: 400 });
    }

    // Check if product is already approved
    if (pendingProduct.approval_status === 1) {
      return NextResponse.json({ error: 'Product already approved' }, { status: 400 });
    }

    // Apply any edited fields to the pending product first
    if (editedFields && Object.keys(editedFields).length > 0) {
      console.log('📝 Applying edited fields:', editedFields);
      
      // Update pending product with edited fields
      const { error: updatePendingError } = await supabase
        .from('pending_products')
        .update(editedFields)
        .eq('id', pendingProduct.id);

      if (updatePendingError) {
        console.error('Error updating pending product with edits:', updatePendingError);
        return NextResponse.json({ error: 'Failed to apply edits' }, { status: 500 });
      }

      // Update the pending product object with edited fields for consistency
      Object.assign(pendingProduct, editedFields);
    }

    // CRITICAL: Create a NEW product in the products table (this is missing!)
    const { data: newProduct, error: insertError } = await supabase
      .from('products')
      .insert({
        brand_id: pendingProduct.brand_id,
        category: pendingProduct.category,
        name: pendingProduct.product_name,
        slug: pendingProduct.slug,
        image_url: pendingProduct.image_url,
        description: pendingProduct.description,
        servings_per_container: pendingProduct.servings_per_container,
        serving_size_g: pendingProduct.serving_size_g,
        dosage_rating: pendingProduct.dosage_rating || 0,
        danger_rating: pendingProduct.danger_rating || 0
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating product in products table:', insertError);
      return NextResponse.json({ error: 'Failed to create product in products table' }, { status: 500 });
    }

    console.log('✅ Created product in products table with ID:', newProduct.id);

    // Now update the details table to point to the NEW product ID
    const { error: updateDetailsError } = await supabase
      .from(`${pendingProduct.category.replace('-', '_')}_details`)
      .update({ 
        product_id: newProduct.id, // Use the NEW product ID from products table
        pending_product_id: null 
      })
      .eq('pending_product_id', pendingProduct.id);

    if (updateDetailsError) {
      console.error('Error updating product details:', updateDetailsError);
      return NextResponse.json({ error: 'Failed to update product details' }, { status: 500 });
    }

    // Update pending product status to approved
    const { error: updateError } = await supabase
      .from('pending_products')
      .update({
        approval_status: 1, // Approved
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', pendingProduct.id);

    if (updateError) {
      console.error('Error updating pending product status:', updateError);
      // Don't fail the request, but log the error
    }

    // Update brand product count
    if (pendingProduct.brand_id) {
      await supabase.rpc('increment_brand_product_count', {
        brand_id: pendingProduct.brand_id
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Product approved and moved to production',
      data: {
        productId: newProduct.id, // Use the NEW product ID
        productName: pendingProduct.product_name,
        slug: pendingProduct.slug
      }
    });

  } catch (error) {
    console.error('Error approving product:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

