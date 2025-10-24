import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { calculateEnhancedDosageRating, ProductData } from '../../../../lib/config/data/ingredients/simple-enhanced-dosage-calculator';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * POST /api/admin/calculate-enhanced-dosage - Calculate enhanced dosage rating for a specific product
 * @param {NextRequest} request - The incoming request
 * @returns {Promise<NextResponse>} JSON response with enhanced dosage analysis
 */
export async function POST(request: NextRequest) {
  try {
    const { productId, category } = await request.json();

    if (!productId || !category) {
      return NextResponse.json({ 
        error: 'Product ID and category are required' 
      }, { status: 400 });
    }

    // Get product basic info (try both products and pending_products tables)
    let product, productError;
    
    // First try products table
    const { data: productFromDB, error: productErr } = await supabase
      .from('products')
      .select('id, category, servings_per_container, serving_size_g, price')
      .eq('id', productId)
      .single();

    if (productErr && productErr.code === 'PGRST116') {
      // Product not found in products table, try pending_products
      const { data: pendingData, error: pendingErr } = await supabase
        .from('pending_products')
        .select('id, category, servings_per_container, serving_size_g, price')
        .eq('id', productId)
        .single();
      
      product = pendingData;
      productError = pendingErr;
    } else {
      product = productFromDB;
      productError = productErr;
    }

    if (productError) {
      console.error('Error fetching product:', productError);
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Get category-specific details
    const categoryTable = `${category.replace('-', '_')}_details`;
    let details, detailsError;
    
    // Try product_id first, then pending_product_id
    const { data: detailsData, error: detailsErr } = await supabase
      .from(categoryTable)
      .select('*')
      .eq('product_id', productId)
      .single();

    if (detailsErr && detailsErr.code === 'PGRST116') {
      // Try pending_product_id
      const { data: pendingDetailsData, error: pendingDetailsErr } = await supabase
        .from(categoryTable)
        .select('*')
        .eq('pending_product_id', productId)
        .single();
      
      details = pendingDetailsData;
      detailsError = pendingDetailsErr;
    } else {
      details = detailsData;
      detailsError = detailsErr;
    }

    if (detailsError) {
      console.error('Error fetching category details:', detailsError);
      return NextResponse.json({ 
        error: 'Category details not found',
        details: detailsError.message 
      }, { status: 404 });
    }

    // Prepare product data for enhanced calculation
    const productData: ProductData = {
      category: product.category,
      servingsPerContainer: product.servings_per_container || 0,
      servingSizeG: product.serving_size_g || 0,
      price: product.price,
      currency: 'USD',
      creatineType: details.creatine_type_name,
      ingredients: extractIngredientsFromDetails(details, category, product.serving_size_g)
    };

    // Calculate enhanced dosage rating
    const analysis = calculateEnhancedDosageRating(productData);

    // Calculate safety rating - 100% if any ingredient is dangerous
    const safetyRating = analysis.ingredientAnalysis.some(ing => ing.isDangerous) ? 100 : 0;

    // Determine which table to update based on where the product was found
    // Check if we found the product in pending_products (when productErr had PGRST116 error)
    const isPendingProduct = !productFromDB && product;
    const updateTable = isPendingProduct ? 'pending_products' : 'products';

    // Update the product with new ratings
    const { error: updateError } = await supabase
      .from(updateTable)
      .update({
        dosage_rating: analysis.overallScore,
        danger_rating: safetyRating,
        updated_at: new Date().toISOString()
      })
      .eq('id', productId);

    if (updateError) {
      console.error('Error updating product ratings:', updateError);
      return NextResponse.json({ 
        error: 'Failed to update product ratings',
        analysis // Still return the analysis even if update fails
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      productId,
      analysis,
      updated: true
    });

  } catch (error) {
    console.error('Enhanced dosage calculation error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * GET /api/admin/calculate-enhanced-dosage - Get enhanced dosage analysis for a product
 * @param {NextRequest} request - The incoming request
 * @returns {Promise<NextResponse>} JSON response with enhanced dosage analysis
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');
    const category = searchParams.get('category');

    if (!productId || !category) {
      return NextResponse.json({ 
        error: 'Product ID and category are required' 
      }, { status: 400 });
    }

    // Get product basic info (try both products and pending_products tables)
    let product, productError;
    
    // First try products table
    const { data: productFromDB, error: productErr } = await supabase
      .from('products')
      .select('id, category, servings_per_container, serving_size_g, price')
      .eq('id', productId)
      .single();

    if (productErr && productErr.code === 'PGRST116') {
      // Product not found in products table, try pending_products
      const { data: pendingData, error: pendingErr } = await supabase
        .from('pending_products')
        .select('id, category, servings_per_container, serving_size_g, price')
        .eq('id', productId)
        .single();
      
      product = pendingData;
      productError = pendingErr;
    } else {
      product = productFromDB;
      productError = productErr;
    }

    if (productError) {
      console.error('Error fetching product:', productError);
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Get category-specific details
    const categoryTable = `${category.replace('-', '_')}_details`;
    let details, detailsError;
    
    // Try product_id first, then pending_product_id
    const { data: detailsData, error: detailsErr } = await supabase
      .from(categoryTable)
      .select('*')
      .eq('product_id', productId)
      .single();

    if (detailsErr && detailsErr.code === 'PGRST116') {
      // Try pending_product_id
      const { data: pendingDetailsData, error: pendingDetailsErr } = await supabase
        .from(categoryTable)
        .select('*')
        .eq('pending_product_id', productId)
        .single();
      
      details = pendingDetailsData;
      detailsError = pendingDetailsErr;
    } else {
      details = detailsData;
      detailsError = detailsErr;
    }

    if (detailsError) {
      console.error('Error fetching category details:', detailsError);
      return NextResponse.json({ 
        error: 'Category details not found',
        details: detailsError.message 
      }, { status: 404 });
    }

    // Prepare product data for enhanced calculation
    const productData: ProductData = {
      category: product.category,
      servingsPerContainer: product.servings_per_container || 0,
      servingSizeG: product.serving_size_g || 0,
      price: product.price,
      currency: 'USD',
      creatineType: details.creatine_type_name,
      ingredients: extractIngredientsFromDetails(details, category, product.serving_size_g)
    };

    // Calculate enhanced dosage rating
    const analysis = calculateEnhancedDosageRating(productData);

    return NextResponse.json({
      success: true,
      productId,
      analysis
    });

  } catch (error) {
    console.error('Enhanced dosage calculation error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * Extract ingredients from category details based on category type
 */
function extractIngredientsFromDetails(details: any, category: string, servingSizeG?: number): Record<string, number> {
  const ingredients: Record<string, number> = {};

  // Special handling for creatine products
  if (category === 'creatine' && details.creatine_type_name && servingSizeG) {
    // For creatine products, assume the serving size is mostly creatine
    // This is a simplified approach - in reality, you'd want to check the actual creatine content
    const creatineDosageMg = servingSizeG * 1000; // Convert g to mg
    ingredients['creatine_monohydrate_mg'] = creatineDosageMg;
    return ingredients;
  }

  // Common ingredient patterns
  const ingredientPatterns = [
    /_mg$/, // Ingredients ending in _mg
    /_g$/,  // Ingredients ending in _g
    /_mcg$/, // Ingredients ending in _mcg
    /_iu$/  // Ingredients ending in _iu
  ];

  // Extract ingredients based on patterns
  for (const [key, value] of Object.entries(details)) {
    if (typeof value === 'number' && value > 0) {
      // Check if this looks like an ingredient field
      const isIngredient = ingredientPatterns.some(pattern => pattern.test(key));
      
      if (isIngredient) {
        // Convert to mg for consistency
        let dosageMg = value;
        if (key.endsWith('_g')) {
          dosageMg = value * 1000; // Convert g to mg
        } else if (key.endsWith('_mcg')) {
          dosageMg = value / 1000; // Convert mcg to mg
        }
        
        ingredients[key] = dosageMg;
      }
    }
  }

  return ingredients;
}
