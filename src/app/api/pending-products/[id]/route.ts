import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Validation schemas
const ProductApprovalRequestSchema = z.object({
  status: z.enum(['approved', 'rejected']),
  reviewed_by: z.string().uuid(),
});

// GET /api/pending-products/[id] - Get specific pending product
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const productId = parseInt(id, 10);
    
    if (isNaN(productId)) {
      return NextResponse.json(
        { error: 'Invalid product ID' },
        { status: 400 }
      );
    }

    const { data: product, error } = await supabase
      .from('pending_products')
      .select(`
        *,
        brands:brand_id (
          id,
          name,
          slug,
          website,
          product_count,
          created_at
        )
      `)
      .eq('id', productId)
      .single();

    if (error || !product) {
      return NextResponse.json(
        { error: 'Pending product not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(product);

  } catch (error) {
    console.error('Error fetching pending product:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/pending-products/[id]/review - Approve or reject product
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const productId = parseInt(id, 10);
    
    if (isNaN(productId)) {
      return NextResponse.json(
        { error: 'Invalid product ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validatedData = ProductApprovalRequestSchema.parse(body);

    // No rejection reason stored anymore

    // Update the pending product status
    const { data: updatedProduct, error: updateError } = await supabase
      .from('pending_products')
      .update({
        status: validatedData.status,
        reviewed_by: validatedData.reviewed_by,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', productId)
      .eq('status', 'pending') // Only allow updating pending products
      .select(`
        *,
        brands:brand_id (
          id,
          name,
          slug,
          website
        )
      `)
      .single();

    if (updateError || !updatedProduct) {
      return NextResponse.json(
        { error: 'Failed to update product status or product not found' },
        { status: 400 }
      );
    }

    // If approved, migrate to main products table
    if (validatedData.status === 'approved') {
      try {
        const newProductId = await migrateApprovedProduct(productId);
        console.log(`✅ Product migrated to main table with ID: ${newProductId}`);
      } catch (migrationError) {
        console.error('Failed to migrate approved product:', migrationError);
        return NextResponse.json(
          { error: 'Product approved but failed to migrate to main table' },
          { status: 500 }
        );
      }
    }

    const statusMessage = validatedData.status === 'approved' 
      ? 'Product approved and migrated to main database'
      : 'Product rejected';

    return NextResponse.json({
      message: statusMessage,
      product: updatedProduct,
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error reviewing pending product:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper function to migrate approved product to main products table
async function migrateApprovedProduct(pendingProductId: number): Promise<number> {
  // Get the pending product data
  const { data: pendingProduct, error: fetchError } = await supabase
    .from('pending_products')
    .select('*')
    .eq('id', pendingProductId)
    .eq('status', 'approved')
    .single();

  if (fetchError || !pendingProduct) {
    throw new Error('Pending product not found or not approved');
  }

  // Insert into main products table
  const { data: newProduct, error: insertError } = await supabase
    .from('products')
    .insert({
      brand_id: pendingProduct.brand_id,
      category: pendingProduct.category,
      name: pendingProduct.name,
      slug: pendingProduct.slug,
      release_year: pendingProduct.release_year,
      image_url: pendingProduct.image_url,
      description: pendingProduct.description,
      servings_per_container: pendingProduct.servings_per_container,
      price: pendingProduct.price,
      serving_size_g: pendingProduct.serving_size_g,
      transparency_score: pendingProduct.transparency_score,
      confidence_level: pendingProduct.confidence_level,
    })
    .select('id')
    .single();

  if (insertError || !newProduct) {
    throw new Error('Failed to insert into main products table');
  }

  // Migrate category-specific details
  await migrateCategorySpecificDetails(pendingProductId, newProduct.id, pendingProduct.category);

  // Delete from pending tables
  const { error: deleteError } = await supabase
    .from('pending_products')
    .delete()
    .eq('id', pendingProductId);

  if (deleteError) {
    throw new Error('Failed to delete pending product');
  }

  return newProduct.id;
}

// Helper function to migrate category-specific details
async function migrateCategorySpecificDetails(
  pendingProductId: number, 
  newProductId: number, 
  category: string
) {
  switch (category) {
    case 'pre-workout':
      await migrateTable(
        'pending_preworkout_details',
        'preworkout_details',
        pendingProductId,
        newProductId
      );
      break;
    case 'non-stim-pre-workout':
      await migrateTable(
        'pending_non_stim_preworkout_details',
        'non_stim_preworkout_details',
        pendingProductId,
        newProductId
      );
      break;
    case 'energy-drink':
      await migrateTable(
        'pending_energy_drink_details',
        'energy_drink_details',
        pendingProductId,
        newProductId
      );
      break;
    case 'protein':
      await migrateTable(
        'pending_protein_details',
        'protein_details',
        pendingProductId,
        newProductId
      );
      break;
    case 'bcaa':
    case 'eaa':
      await migrateTable(
        'pending_amino_acid_details',
        'amino_acid_details',
        pendingProductId,
        newProductId
      );
      break;
    case 'fat-burner':
    case 'appetite-suppressant':
      await migrateTable(
        'pending_fat_burner_details',
        'fat_burner_details',
        pendingProductId,
        newProductId
      );
      break;
    case 'creatine':
      // Creatine doesn't have a specific details table
      break;
    default:
      throw new Error(`Unsupported product category: ${category}`);
  }
}

// Helper function to migrate data from pending to main table
async function migrateTable(
  pendingTable: string,
  mainTable: string,
  pendingProductId: number,
  newProductId: number
) {
  // Get data from pending table
  const { data: pendingData, error: fetchError } = await supabase
    .from(pendingTable)
    .select('*')
    .eq('product_id', pendingProductId)
    .single();

  if (fetchError || !pendingData) {
    // No details found, that's okay
    return;
  }

  // Insert into main table with new product_id
  const { product_id, ...detailsWithoutId } = pendingData;
  const { error: insertError } = await supabase
    .from(mainTable)
    .insert({
      ...detailsWithoutId,
      product_id: newProductId,
    });

  if (insertError) {
    throw new Error(`Failed to migrate ${mainTable}: ${insertError.message}`);
  }

  // Delete from pending table
  const { error: deleteError } = await supabase
    .from(pendingTable)
    .delete()
    .eq('product_id', pendingProductId);

  if (deleteError) {
    throw new Error(`Failed to delete from ${pendingTable}: ${deleteError.message}`);
  }
}
