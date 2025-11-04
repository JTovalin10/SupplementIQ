import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../../lib/supabase';

/**
 * POST /api/admin/update-ratings - Update dosage and danger ratings for all products
 * @param {NextRequest} request - The incoming request
 * @returns {Promise<NextResponse>} JSON response with update results
 * 
 * This endpoint should be called periodically to recalculate dosage and danger ratings
 * based on the latest ingredient data in category detail tables.
 */
export async function POST(request: NextRequest) {
  try {
    // Get authentication token
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // TODO: Add admin role check here

    // Get all products
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, category');

    if (productsError) {
      console.error('Error fetching products:', productsError);
      return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
    }

    if (!products || products.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: 'No products found to update',
        updated: 0
      });
    }

    let updatedCount = 0;
    const errors: string[] = [];

    // Process each product
    for (const product of products) {
      try {
        const categoryTable = `${product.category.replace('-', '_')}_details`;
        
        // Get category details
        const { data: details, error: detailsError } = await supabase
          .from(categoryTable)
          .select('*')
          .eq('product_id', product.id)
          .single();

        if (detailsError && detailsError.code !== 'PGRST116') {
          errors.push(`Error fetching details for product ${product.id}: ${detailsError.message}`);
          continue;
        }

        // Calculate ratings
        const dosageRating = await calculateDosageRating(product.category, product.id, details);
        const dangerRating = await calculateDangerRating(product.category, product.id, details);

        // Update product with new ratings
        const { error: updateError } = await supabase
          .from('products')
          .update({
            dosage_rating: dosageRating,
            danger_rating: dangerRating,
            updated_at: new Date().toISOString()
          })
          .eq('id', product.id);

        if (updateError) {
          errors.push(`Error updating product ${product.id}: ${updateError.message}`);
        } else {
          updatedCount++;
        }

      } catch (error) {
        errors.push(`Error processing product ${product.id}: ${error}`);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Updated ${updatedCount} products`,
      updated: updatedCount,
      total: products.length,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error('Update ratings error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * Calculate dosage rating for a product (optimized version)
 */
async function calculateDosageRating(category: string, productId: number, details: any): Promise<number> {
  if (!details) return 0;

  // Define optimal dosages for each category (in mg/mcg)
  const optimalDosages: Record<string, Record<string, number>> = {
    'pre-workout': {
      l_citrulline_mg: 8000,
      creatine_monohydrate_mg: 3000,
      caffeine_anhydrous_mg: 200,
      l_tyrosine_mg: 1000,
      betaine_anhydrous_mg: 2500,
      agmatine_sulfate_mg: 1000,
      glycerpump_mg: 3000
    },
    'protein': {
      effective_protein_g: 25
    },
    'bcaa': {
      l_leucine_mg: 3000,
      l_isoleucine_mg: 1500,
      l_valine_mg: 1500
    },
    'eaa': {
      total_eaas_mg: 10000,
      l_leucine_mg: 3000,
      l_isoleucine_mg: 1500,
      l_valine_mg: 1500
    },
    'fat-burner': {
      caffeine_anhydrous_mg: 200,
      l_carnitine_l_tartrate_mg: 2000,
      green_tea_extract_mg: 500,
      capsimax_mg: 100
    }
  };

  const categoryDosages = optimalDosages[category];
  if (!categoryDosages) return 50;

  let totalScore = 0;
  let ingredientCount = 0;

  for (const [ingredient, optimalDose] of Object.entries(categoryDosages)) {
    const actualDose = details[ingredient];
    if (actualDose && actualDose > 0) {
      const percentage = Math.min((actualDose / optimalDose) * 100, 100);
      totalScore += percentage;
      ingredientCount++;
    }
  }

  return ingredientCount > 0 ? Math.round(totalScore / ingredientCount) : 0;
}

/**
 * Calculate danger rating for a product
 * 
 * Rules:
 * 1. If ANY ingredient is illegal (all dosages = 0), danger rating = 100
 * 2. If ANY ingredient has precaution_people (requires doctor consultation), danger rating += 10
 * 3. If ANY ingredient exceeds dangerous dosage, danger rating increases
 * 4. If ANY ingredient exceeds max safe dose, danger rating increases with log scale
 */
async function calculateDangerRating(category: string, productId: number, details: any): Promise<number> {
  if (!details) return 0;

  // Import ingredient configs to check for illegal ingredients and precaution_people
  const { ingredientDosageCache } = await import('../../../../lib/cache/ingredient-dosage-cache');
  // Get ingredient configs for the category and convert to object
  const categoryConfigsMap = await ingredientDosageCache.getIngredientConfigsForCategory(category);
  const ingredients: Record<string, any> = {};
  for (const [name, config] of categoryConfigsMap) {
    ingredients[name] = config;
  }
  
  let dangerScore = 0;
  let hasIllegalIngredient = false;
  let hasPrecautionPeople = false;
  let hasDangerousIngredient = false;

  // Check each ingredient in the product
  for (const [ingredientName, actualDosage] of Object.entries(details)) {
    if (!actualDosage || typeof actualDosage !== 'number' || actualDosage <= 0) continue;
    
    const ingredientConfig = ingredients[ingredientName];
    if (!ingredientConfig) continue;

    const minDosage = ingredientConfig.minDailyDosage || 0;
    const maxDosage = ingredientConfig.maxDailyDosage || 0;
    const dangerousDosage = ingredientConfig.dangerousDosage || 0;

    // Check if ingredient is illegal (all dosages = 0 means banned)
    if (minDosage === 0 && maxDosage === 0 && dangerousDosage === 0) {
      hasIllegalIngredient = true;
      continue; // Skip to next ingredient
    }

    // Check if ingredient has precaution_people (requires doctor consultation)
    if (ingredientConfig.precaution_people && ingredientConfig.precaution_people.length > 0) {
      hasPrecautionPeople = true;
    }

    // Check if exceeds dangerous dosage
    if (dangerousDosage > 0 && actualDosage >= dangerousDosage) {
      hasDangerousIngredient = true;
      dangerScore = Math.max(dangerScore, 100); // Maximum danger
      continue;
    }

    // Check if exceeds max safe dose (log scale danger)
    if (maxDosage > 0 && actualDosage > maxDosage) {
      const overMaxRatio = actualDosage / maxDosage;
      const logDanger = Math.log(overMaxRatio) / Math.log(2) * 20;
      dangerScore = Math.max(dangerScore, Math.min(100, logDanger));
    }
  }

  // Apply special rules
  if (hasIllegalIngredient) {
    return 100; // Automatically 100/100 if contains illegal ingredient
  }

  if (hasPrecautionPeople) {
    dangerScore += 10; // Add 10 for doctor consultation requirement
  }

  return Math.min(100, Math.round(dangerScore));
}
