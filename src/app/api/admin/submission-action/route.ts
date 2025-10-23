import { supabase } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/admin/submission-action
 * Handle approve/reject actions for product submissions
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { submissionId, action, adminId, reason, notes } = body;

    // Validate input
    if (!submissionId || !action || !adminId) {
      return NextResponse.json(
        { error: 'Missing required fields: submissionId, action, and adminId' },
        { status: 400 }
      );
    }

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Action must be either "approve" or "reject"' },
        { status: 400 }
      );
    }

    if (action === 'reject' && !reason) {
      return NextResponse.json(
        { error: 'Rejection reason is required' },
        { status: 400 }
      );
    }

    // Get the pending product with all related data
    const { data: tempProduct, error: fetchError } = await supabase
      .from('pending_products')
      .select(`
        *,
        users:submitted_by (username, email),
        brands (id, name)
      `)
      .eq('id', submissionId)
      .eq('approval_status', 0) // Only pending submissions
      .single();

    if (fetchError || !tempProduct) {
      return NextResponse.json(
        { error: 'Submission not found or already processed' },
        { status: 404 }
      );
    }

    // Verify admin permissions
    const permissionCheck = await verifyModeratorPermissions(adminId);
    if (!permissionCheck.success) {
      return NextResponse.json(
        { error: permissionCheck.error },
        { status: permissionCheck.error?.includes('not found') ? 404 : 403 }
      );
    }

    if (action === 'approve') {
      return await handleApproval(tempProduct, adminId, notes, permissionCheck.role);
    } else {
      return await handleRejection(tempProduct, adminId, reason, notes, permissionCheck.role);
    }

  } catch (error) {
    console.error('Submission action error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function handleApproval(tempProduct: any, adminId: string, notes?: string, adminRole?: string) {
  try {
    // Create the permanent product
    const { data: newProduct, error: insertError } = await supabase
      .from('products')
      .insert({
        brand_id: tempProduct.brand_id,
        category: tempProduct.category,
        name: tempProduct.product_name,
        slug: tempProduct.slug,
        image_url: tempProduct.image_url,
        description: tempProduct.description,
        price: tempProduct.price,
        currency: tempProduct.currency,
        servings_per_container: tempProduct.servings_per_container,
        serving_size_g: tempProduct.serving_size_g,
        dosage_rating: tempProduct.dosage_rating,
        danger_rating: tempProduct.danger_rating,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating product:', insertError);
      return NextResponse.json(
        { error: 'Failed to create product' },
        { status: 500 }
      );
    }

    // Copy category-specific details
    await copyCategoryDetails(tempProduct.id, newProduct.id, tempProduct.category);

    // Update pending product status
    const { error: updateError } = await supabase
      .from('pending_products')
      .update({
        approval_status: 1, // Approved
        reviewed_by: adminId,
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', tempProduct.id);

    if (updateError) {
      console.error('Error updating temporary product:', updateError);
    }

    // Log activity with admin role information
    await logActivity('product_approved', `Product "${tempProduct.name}" approved by ${adminRole}`, adminId, {
      product_id: newProduct.id,
      temp_product_id: tempProduct.id,
      admin_notes: notes,
      admin_role: adminRole
    });

    // Update brand product count
    if (tempProduct.brand_id) {
      await supabase.rpc('increment_brand_product_count', {
        brand_id: tempProduct.brand_id
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Product approved successfully',
      data: {
        productId: newProduct.id,
        tempProductId: tempProduct.id,
        productName: tempProduct.name,
        brandName: tempProduct.brands?.name
      }
    });

  } catch (error) {
    console.error('Approval error:', error);
    return NextResponse.json(
      { error: 'Failed to approve product' },
      { status: 500 }
    );
  }
}

async function handleRejection(tempProduct: any, adminId: string, reason: string, notes?: string, adminRole?: string) {
  try {
    // Update pending product status
    const { error: updateError } = await supabase
      .from('pending_products')
      .update({
        approval_status: -1, // Rejected
        reviewed_by: adminId,
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', tempProduct.id);

    if (updateError) {
      console.error('Error updating temporary product:', updateError);
      return NextResponse.json(
        { error: 'Failed to reject submission' },
        { status: 500 }
      );
    }

    // Log activity with admin role information
    await logActivity('product_rejected', `Product "${tempProduct.name}" rejected by ${adminRole}: ${reason}`, adminId, {
      temp_product_id: tempProduct.id,
      rejection_reason: reason,
      admin_notes: notes,
      admin_role: adminRole
    });

    return NextResponse.json({
      success: true,
      message: 'Product rejected successfully',
      data: {
        tempProductId: tempProduct.id,
        productName: tempProduct.name,
        rejectionReason: reason
      }
    });

  } catch (error) {
    console.error('Rejection error:', error);
    return NextResponse.json(
      { error: 'Failed to reject product' },
      { status: 500 }
    );
  }
}

async function copyCategoryDetails(pendingProductId: number, productId: number, category: string) {
  const categoryDetailsMap = {
    'pre-workout': 'preworkout_details',
    'non-stim-pre-workout': 'non_stim_preworkout_details',
    'energy-drink': 'energy_drink_details',
    'protein': 'protein_details',
    'bcaa': 'amino_acid_details',
    'eaa': 'amino_acid_details',
    'fat-burner': 'fat_burner_details',
    'appetite-suppressant': 'fat_burner_details',
    'creatine': 'creatine_details'
  };

  const detailTable = categoryDetailsMap[category as keyof typeof categoryDetailsMap];
  if (!detailTable) return;

  try {
    // Get the pending details
    const { data: pendingDetails, error: detailsError } = await supabase
      .from(detailTable)
      .select('*')
      .eq('pending_product_id', pendingProductId)
      .single();

    if (pendingDetails && !detailsError) {
      // Update the details record to point to the new product
      const { product_id, pending_product_id, ...detailsData } = pendingDetails;
      const { error: detailsUpdateError } = await supabase
        .from(detailTable)
        .update({
          product_id: productId,
          pending_product_id: null
        })
        .eq('id', pendingDetails.id);

      if (detailsUpdateError) {
        console.error(`Error updating ${detailTable}:`, detailsUpdateError);
      }
    }
  } catch (error) {
    console.error(`Error copying ${detailTable}:`, error);
  }
}

async function logActivity(type: string, description: string, userId: string, metadata: any) {
  try {
    await supabase
      .from('recent_activity')
      .insert({
        type,
        description,
        user_id: userId,
        metadata
      });
  } catch (error) {
    console.error('Error logging activity:', error);
  }
}
