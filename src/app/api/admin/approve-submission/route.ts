import { verifyModeratorPermissions } from '@/lib/auth/permissions';
import { supabase } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/admin/approve-submission
 * Approve a pending product submission
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { submissionId, adminId, adminNotes } = body;

    // Validate input
    if (!submissionId || !adminId) {
      return NextResponse.json(
        { error: 'Missing required fields: submissionId and adminId' },
        { status: 400 }
      );
    }

    // Verify admin permissions first
    const permissionCheck = await verifyModeratorPermissions(adminId);
    if (!permissionCheck.success) {
      return NextResponse.json(
        { error: permissionCheck.error },
        { status: permissionCheck.error?.includes('not found') ? 404 : 403 }
      );
    }

    // Get the temporary product
    const { data: tempProduct, error: fetchError } = await supabase
      .from('temporary_products')
      .select('*')
      .eq('id', submissionId)
      .eq('approval_status', 0) // Only pending submissions
      .single();

    if (fetchError || !tempProduct) {
      return NextResponse.json(
        { error: 'Submission not found or already processed' },
        { status: 404 }
      );
    }

    // Start a transaction to move data from temporary_products to products
    const { data: newProduct, error: insertError } = await supabase
      .from('products')
      .insert({
        brand_id: tempProduct.brand_id,
        category: tempProduct.category,
        name: tempProduct.name,
        slug: tempProduct.slug,
        image_url: tempProduct.image_url,
        description: tempProduct.description,
        servings_per_container: tempProduct.servings_per_container,
        serving_size_g: tempProduct.serving_size_g,
        dosage_rating: tempProduct.dosage_rating,
        danger_rating: tempProduct.danger_rating,
        created_by: tempProduct.submitted_by,
        status: 'active'
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
    const categoryDetailsMap = {
      'pre-workout': 'preworkout_details',
      'non-stim-pre-workout': 'non_stim_preworkout_details',
      'energy-drink': 'energy_drink_details',
      'protein': 'protein_details',
      'bcaa': 'amino_acid_details',
      'eaa': 'amino_acid_details',
      'fat-burner': 'fat_burner_details',
      'appetite-suppressant': 'appetite_suppressant_details',
      'creatine': 'creatine_details'
    };

    const detailTable = categoryDetailsMap[tempProduct.category as keyof typeof categoryDetailsMap];
    if (detailTable) {
      // Get the temporary details
      const { data: tempDetails, error: detailsError } = await supabase
        .from(detailTable)
        .select('*')
        .eq('temp_product_id', submissionId)
        .single();

      if (tempDetails && !detailsError) {
        // Create the permanent details record
        const { product_id, temp_product_id, ...detailsData } = tempDetails;
        const { error: detailsInsertError } = await supabase
          .from(detailTable)
          .insert({
            ...detailsData,
            product_id: newProduct.id
          });

        if (detailsInsertError) {
          console.error(`Error creating ${detailTable}:`, detailsInsertError);
          // Continue anyway - the main product was created
        }
      }
    }

    // Update the temporary product status to approved
    const { error: updateError } = await supabase
      .from('temporary_products')
      .update({
        approval_status: 1, // Approved
        reviewed_by: adminId,
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', submissionId);

    if (updateError) {
      console.error('Error updating temporary product:', updateError);
      // The product was created, so we'll continue
    }

    // Log the approval activity
    const { error: activityError } = await supabase
      .from('recent_activity')
      .insert({
        type: 'product_approved',
        description: `Product "${tempProduct.name}" approved`,
        user_id: adminId,
        metadata: {
          product_id: newProduct.id,
          temp_product_id: submissionId,
          admin_notes: adminNotes
        }
      });

    if (activityError) {
      console.error('Error logging activity:', activityError);
      // Non-critical error
    }

    return NextResponse.json({
      success: true,
      message: 'Product approved successfully',
      data: {
        productId: newProduct.id,
        tempProductId: submissionId,
        productName: tempProduct.name
      }
    });

  } catch (error) {
    console.error('Approval error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
