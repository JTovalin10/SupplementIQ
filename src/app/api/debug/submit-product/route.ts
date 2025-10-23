import { supabase } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Simplified validation schema for debugging
const DebugProductSchema = z.object({
  name: z.string().min(1),
  brand_name: z.string().min(1),
  category: z.enum(['protein', 'pre-workout', 'non-stim-pre-workout', 'energy-drink', 'bcaa', 'eaa', 'fat-burner', 'appetite-suppressant', 'creatine']),
  description: z.string().optional(),
  image_url: z.string().url().optional(),
  servings_per_container: z.number().optional(),
  price: z.number().positive().default(1),
  serving_size_g: z.number().positive().optional(),
  submitted_by: z.string().min(1), // Allow any non-empty string for debugging
});

// Helper function to generate slug
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// POST /api/debug/submit-product - Debug endpoint for product submission
export async function POST(request: NextRequest) {
  console.log('🔥🔥🔥 DEBUG API ENDPOINT HIT! 🔥🔥🔥');
  console.log('Request method:', request.method);
  console.log('Request URL:', request.url);
  
  try {
    console.log('🚀 DEBUG ENDPOINT: Product submission started');
    
    const body = await request.json();
    console.log('Request body:', body);
    
    const validatedData = DebugProductSchema.parse(body);
    console.log('Validated data:', validatedData);

    // Get user ID from headers (simplified)
    const userId = request.headers.get('x-user-id');
    console.log('User ID from headers:', userId);

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID required in x-user-id header' },
        { status: 400 }
      );
    }

    // Get or create brand
    console.log('Getting/creating brand:', validatedData.brand_name);
    const { data: brandData, error: brandError } = await supabase
      .from('brands')
      .select('id')
      .eq('name', validatedData.brand_name)
      .single();

    let brandId: number;
    if (brandError || !brandData) {
      console.log('Creating new brand...');
      const { data: newBrand, error: createBrandError } = await supabase
        .from('brands')
        .insert({
          name: validatedData.brand_name,
          slug: generateSlug(validatedData.brand_name),
        })
        .select('id')
        .single();

      if (createBrandError || !newBrand) {
        console.error('Failed to create brand:', createBrandError);
        return NextResponse.json(
          { error: 'Failed to create brand' },
          { status: 500 }
        );
      }
      brandId = newBrand.id;
      console.log('Created brand with ID:', brandId);
    } else {
      brandId = brandData.id;
      console.log('Found existing brand with ID:', brandId);
    }

    // Insert product into pending_products table
    console.log('Inserting product into pending_products...');
    const { data: product, error: insertError } = await supabase
      .from('pending_products')
      .insert({
        brand_id: brandId,
        category: validatedData.category,
        product_name: validatedData.name,
        slug: generateSlug(validatedData.name),
        image_url: validatedData.image_url,
        description: validatedData.description,
        price: validatedData.price,
        currency: 'USD',
        servings_per_container: validatedData.servings_per_container,
        serving_size_g: validatedData.serving_size_g,
        dosage_rating: 0,
        danger_rating: 0,
        approval_status: 0, // 0 = pending
        submitted_by: userId
      })
      .select(`
        *,
        brands:brand_id (
          id,
          name,
          slug
        )
      `)
      .single();

    if (insertError) {
      console.error('Failed to insert product:', insertError);
      
      // Handle specific error cases
      if (insertError.code === '23505' && insertError.message.includes('slug')) {
        return NextResponse.json(
          { error: 'A product with this name already exists' },
          { status: 409 }
        );
      }
      
      return NextResponse.json(
        { error: 'Failed to insert product', details: insertError.message },
        { status: 500 }
      );
    }

    console.log('Product inserted successfully:', product);

    // Insert category-specific details
    console.log('Inserting category details for:', validatedData.category);
    await insertCategoryDetails(product.id, validatedData.category);

    console.log('✅ DEBUG: Product submission completed successfully');

    return NextResponse.json(
      {
        success: true,
        message: 'Product submitted successfully (DEBUG MODE)',
        product: product,
        submitted_directly: false, // Always false for debug endpoint
        debug_info: {
          userId,
          brandId,
          productId: product.id,
          category: validatedData.category
        }
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('❌ DEBUG: Error in product submission:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Helper function to insert category-specific details
async function insertCategoryDetails(productId: number, category: string) {
  const baseDetails = {
    pending_product_id: productId,
  };

  console.log('Inserting details for category:', category);

  switch (category) {
    case 'pre-workout':
      await supabase.from('preworkout_details').insert(baseDetails);
      break;
    case 'non-stim-pre-workout':
      await supabase.from('non_stim_preworkout_details').insert(baseDetails);
      break;
    case 'energy-drink':
      await supabase.from('energy_drink_details').insert(baseDetails);
      break;
    case 'protein':
      await supabase.from('protein_details').insert(baseDetails);
      break;
    case 'bcaa':
    case 'eaa':
      await supabase.from('amino_acid_details').insert(baseDetails);
      break;
    case 'fat-burner':
    case 'appetite-suppressant':
      await supabase.from('fat_burner_details').insert(baseDetails);
      break;
    case 'creatine':
      await supabase.from('creatine_details').insert({
        ...baseDetails,
        creatine_type_name: 'Creatine Monohydrate' // Default creatine type
      });
      break;
    default:
      console.log('No specific details table for category:', category);
  }
  
  console.log('Category details inserted successfully');
}
