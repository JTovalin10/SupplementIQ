import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Fetch creatine details for EITHER pending or approved products
 * @param supabase - Supabase client
 * @param productId - Product ID
 * @param isPending - If true, query by pending_product_id; if false, query by product_id
 */
export async function fetchCreatineDetails(
  supabase: SupabaseClient, 
  productId: number,
  isPending: boolean = false
) {
  console.log(`Fetching creatine details for ${isPending ? 'pending' : 'approved'} product ID:`, productId);
  
  // Choose the correct field based on product type
  const queryField = isPending ? 'pending_product_id' : 'product_id';
  
  let { data, error } = await supabase
    .from('creatine_details')
    .select(`
      *,
      creatine_types:creatine_type_name (
        name,
        category,
        recommended_daily_dose_g
      )
    `)
    .eq(queryField, productId)
    .single();
  
  // If query failed for approved products, try to find by getting the pending_products entry that matches
  if ((error || !data) && !isPending) {
    console.log(`No creatine details found with product_id=${productId}, looking for matching pending_products entry`);
    
    // Find the pending_products entry with same slug (products approved with old broken code)
    const { data: productData } = await supabase
      .from('products')
      .select('slug')
      .eq('id', productId)
      .single();
    
    if (productData) {
      // Find matching pending_products entry
      const { data: pendingData } = await supabase
        .from('pending_products')
        .select('id')
        .eq('slug', productData.slug)
        .single();
      
      if (pendingData) {
        console.log(`Found pending_products entry with id=${pendingData.id}, querying creatine_details`);
        const fallbackQuery = await supabase
          .from('creatine_details')
          .select(`
            *,
            creatine_types:creatine_type_name (
              name,
              category,
              recommended_daily_dose_g
            )
          `)
          .eq('pending_product_id', pendingData.id)
          .single();
        
        if (!fallbackQuery.error && fallbackQuery.data) {
          console.log('Found creatine details via pending_products fallback');
          data = fallbackQuery.data;
          error = null;
        }
      }
    }
  }
  
  if (error || !data) {
    console.warn('Creatine details error:', error?.message || 'No data found');
    return null;
  }
  
  // Transform the data to include creatine dosage from creatine_types table
  const creatineDosageMg = data.creatine_types?.recommended_daily_dose_g 
    ? Math.round(data.creatine_types.recommended_daily_dose_g * 1000) // Convert g to mg
    : 5000; // Default to 5g if no data
  
  const transformedData = {
    ...data,
    creatine_monohydrate_mg: creatineDosageMg
  };
  
  console.log('Creatine details fetched:', transformedData);
  return transformedData;
}

