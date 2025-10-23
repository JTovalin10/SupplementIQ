import { supabase } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/admin/submission/[id]
 * Get detailed information about a specific submission for review
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const submissionId = parseInt(id);

    if (isNaN(submissionId)) {
      return NextResponse.json(
        { error: 'Invalid submission ID' },
        { status: 400 }
      );
    }

    // First, get the basic pending product data
    const { data: pendingProduct, error: fetchError } = await supabase
      .from('pending_products')
      .select(`
        *,
        users:submitted_by (id, username, email, role),
        brands (id, name, slug, website, product_count)
      `)
      .eq('id', submissionId)
      .single();

    if (fetchError || !pendingProduct) {
      console.error('Submission fetch error:', fetchError);
      console.error('Submission ID:', submissionId);
      return NextResponse.json(
        { error: 'Submission not found', details: fetchError?.message },
        { status: 404 }
      );
    }

    console.log('Pending product data:', pendingProduct);
    console.log('Product category:', pendingProduct.category);

    // Try to fetch category-specific details if they exist
    let categoryDetails = null;
    try {
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

      const detailTable = categoryDetailsMap[pendingProduct.category as keyof typeof categoryDetailsMap];
      if (detailTable) {
        console.log(`Fetching details from table: ${detailTable} for submission: ${submissionId}`);
        console.log(`Category: ${pendingProduct.category}`);
        
        const { data: details, error: detailsError } = await supabase
          .from(detailTable)
          .select('*')
          .eq('pending_product_id', submissionId)
          .single();
        
        console.log(`Details query result:`, { details, detailsError });
        console.log(`Query was: SELECT * FROM ${detailTable} WHERE pending_product_id = ${submissionId}`);
        
        if (!detailsError && details) {
          categoryDetails = details;
          console.log(`Category details loaded:`, categoryDetails);
        } else {
          console.log(`Failed to load category details:`, detailsError);
          // Try to see if there are any records in the table at all
          const { data: allRecords } = await supabase
            .from(detailTable)
            .select('*')
            .limit(5);
          console.log(`All records in ${detailTable}:`, allRecords);
        }
      } else {
        console.log(`No detail table found for category: ${pendingProduct.category}`);
      }
    } catch (error) {
      console.log('Category details not available:', error);
      // Continue without category details
    }

    // Format the response
    const submission = {
      id: pendingProduct.id,
      productName: pendingProduct.product_name,
      slug: pendingProduct.slug,
      category: pendingProduct.category,
      description: pendingProduct.description,
      imageUrl: pendingProduct.image_url,
      price: pendingProduct.price,
      servingsPerContainer: pendingProduct.servings_per_container,
      servingSizeG: pendingProduct.serving_size_g,
      dosageRating: pendingProduct.dosage_rating || 0,
      dangerRating: pendingProduct.danger_rating || 0,
      approvalStatus: pendingProduct.approval_status || 0,
      communityRating: 0, // Will be calculated from reviews
      totalReviews: 0, // Will be calculated from reviews
      submittedBy: {
        id: pendingProduct.users?.id,
        username: pendingProduct.users?.username,
        email: pendingProduct.users?.email,
        role: pendingProduct.users?.role
      },
      brand: pendingProduct.brands,
      categoryDetails,
      createdAt: pendingProduct.created_at,
      updatedAt: pendingProduct.updated_at || pendingProduct.created_at,
      reviewedBy: pendingProduct.reviewed_by,
      reviewedAt: pendingProduct.reviewed_at
    };

    return NextResponse.json({
      success: true,
      data: submission
    });

  } catch (error) {
    console.error('Error fetching submission details:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/submission/[id]
 * Update submission details (like image URL)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const submissionId = parseInt(id);
    const body = await request.json();
    const { imageUrl } = body;

    if (isNaN(submissionId)) {
      return NextResponse.json(
        { error: 'Invalid submission ID' },
        { status: 400 }
      );
    }

    if (!imageUrl) {
      return NextResponse.json(
        { error: 'Image URL is required' },
        { status: 400 }
      );
    }

    // Update the pending product with the new image URL
    const { data, error } = await supabase
      .from('pending_products')
      .update({ 
        image_url: imageUrl,
        updated_at: new Date().toISOString()
      })
      .eq('id', submissionId)
      .select()
      .single();

    if (error) {
      console.error('Error updating submission:', error);
      return NextResponse.json(
        { error: 'Failed to update submission' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Image URL updated successfully',
      data: { imageUrl }
    });

  } catch (error) {
    console.error('Error updating submission:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
