import { SupabaseClient } from '@supabase/supabase-js';
import { fetchCreatineDetails } from './creatine/index';

// Map category names to their directory names
const CATEGORY_MAP: Record<string, string> = {
  'creatine': 'creatine',
  'pre-workout': 'preworkout',
  'non-stim-pre-workout': 'non-stim-preworkout',
  'energy-drink': 'energy-drink',
  'protein': 'protein',
  'bcaa': 'bcaa',
  'eaa': 'eaa',
  'fat-burner': 'fat-burner',
  'appetite-suppressant': 'appetite-suppressant',
};

/**
 * Fetch dosage details for a product based on its category
 * Routes to category-specific handlers for better organization and debugging
 * @param supabase - Supabase client instance
 * @param category - Product category (e.g., 'creatine', 'pre-workout')
 * @param productId - Product ID in the products table
 * @returns Product details specific to the category
 */
export async function fetchProductDetails(
  supabase: SupabaseClient, 
  category: string, 
  productId: number
) {
  console.log('🔍 [FETCH] Fetching product details for category:', category, 'product ID:', productId);
  
  // Map category to directory name
  const dirName = CATEGORY_MAP[category];
  if (!dirName) {
    console.warn('❌ [FETCH] Unknown category:', category);
    return null;
  }

  // Route to category-specific handler
  switch (category) {
    case 'creatine':
      // For approved products, pass isPending: false
      return await fetchCreatineDetails(supabase, productId, false);
    
    case 'pre-workout':
    case 'non-stim-pre-workout':
    case 'energy-drink':
    case 'protein':
    case 'bcaa':
    case 'eaa':
    case 'fat-burner':
    case 'appetite-suppressant':
      // TODO: Implement dosage detail handlers for these categories
      console.log(`ℹ️ [FETCH] Dosage details not yet implemented for category: ${category} - returning null`);
      return null;
    
    default:
      console.warn(`❌ [FETCH] Unknown category: ${category} - returning null`);
      return null;
  }
}

