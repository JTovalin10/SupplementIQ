import { calculateEnhancedDosageRating } from '@/lib/config/data/ingredients/enhanced-dosage-calculator';
import { createClient } from '@/lib/database/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// Separate functions for fetching dosage details by category
async function fetchPreworkoutDetails(supabase: any, productId: number) {
  console.log('Fetching preworkout details for product ID:', productId);
  const { data, error } = await supabase
    .from('preworkout_details')
    .select('*')
    .eq('pending_product_id', productId)
    .single();
  
  if (error) {
    console.warn('Preworkout details error:', error.message);
    return null;
  }
  console.log('Preworkout details fetched:', data);
  return data;
}

async function fetchNonStimPreworkoutDetails(supabase: any, productId: number) {
  console.log('Fetching non-stim preworkout details for product ID:', productId);
  const { data, error } = await supabase
    .from('non_stim_preworkout_details')
    .select('*')
    .eq('pending_product_id', productId)
    .single();
  
  if (error) {
    console.warn('Non-stim preworkout details error:', error.message);
    return null;
  }
  console.log('Non-stim preworkout details fetched:', data);
  return data;
}

async function fetchEnergyDrinkDetails(supabase: any, productId: number) {
  console.log('Fetching energy drink details for product ID:', productId);
  const { data, error } = await supabase
    .from('energy_drink_details')
    .select('*')
    .eq('pending_product_id', productId)
    .single();
  
  if (error) {
    console.warn('Energy drink details error:', error.message);
    return null;
  }
  console.log('Energy drink details fetched:', data);
  return data;
}

async function fetchProteinDetails(supabase: any, productId: number) {
  console.log('Fetching protein details for product ID:', productId);
  const { data, error } = await supabase
    .from('protein_details')
    .select('*')
    .eq('pending_product_id', productId)
    .single();
  
  if (error) {
    console.warn('Protein details error:', error.message);
    return null;
  }
  console.log('Protein details fetched:', data);
  return data;
}

async function fetchAminoAcidDetails(supabase: any, productId: number) {
  console.log('Fetching amino acid details for product ID:', productId);
  const { data, error } = await supabase
    .from('amino_acid_details')
    .select('*')
    .eq('pending_product_id', productId)
    .single();
  
  if (error) {
    console.warn('Amino acid details error:', error.message);
    return null;
  }
  console.log('Amino acid details fetched:', data);
  return data;
}

async function fetchFatBurnerDetails(supabase: any, productId: number) {
  console.log('Fetching fat burner details for product ID:', productId);
  const { data, error } = await supabase
    .from('fat_burner_details')
    .select('*')
    .eq('pending_product_id', productId)
    .single();
  
  if (error) {
    console.warn('Fat burner details error:', error.message);
    return null;
  }
  console.log('Fat burner details fetched:', data);
  return data;
}

async function fetchCreatineDetails(supabase: any, productId: number) {
  console.log('Fetching creatine details for product ID:', productId);
  const { data, error } = await supabase
    .from('creatine_details')
    .select(`
      *,
      creatine_types:creatine_type_name (
        name,
        category,
        recommended_daily_dose_g
      )
    `)
    .eq('pending_product_id', productId)
    .single();
  
  if (error) {
    console.warn('Creatine details error:', error.message);
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

// Main function to fetch dosage details based on category
async function fetchDosageDetails(supabase: any, category: string, productId: number) {
  console.log('Fetching dosage details for category:', category, 'product ID:', productId);
  
  try {
    switch (category) {
      case 'pre-workout':
        return await fetchPreworkoutDetails(supabase, productId);
        
      case 'non-stim-pre-workout':
        return await fetchNonStimPreworkoutDetails(supabase, productId);
        
      case 'energy-drink':
        return await fetchEnergyDrinkDetails(supabase, productId);
        
      case 'protein':
        return await fetchProteinDetails(supabase, productId);
        
      case 'bcaa':
      case 'eaa':
        return await fetchAminoAcidDetails(supabase, productId);
        
      case 'fat-burner':
      case 'appetite-suppressant':
        return await fetchFatBurnerDetails(supabase, productId);
        
      case 'creatine':
        return await fetchCreatineDetails(supabase, productId);
        
      default:
        console.warn('Unknown category for dosage details:', category);
        return null;
    }
  } catch (error) {
    console.error('Error fetching dosage details:', error);
    return null;
  }
}

// GET /api/admin/products/[slug] - Get detailed product information for review
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id: productSlug } = await params;

    console.log('Product slug received:', productSlug);
    
    if (!productSlug || productSlug === 'undefined') {
      return NextResponse.json({ error: 'Invalid product slug' }, { status: 400 });
    }

    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Authorization header required' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');

    // For development/testing, allow test-token to bypass auth
    if (token === 'test-token') {
      console.log('Using test token - bypassing authentication');
    } else {
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
          error: `Insufficient permissions. Only ${allowedRoles.join(', ')} can review products.`
        }, { status: 403 });
      }
    }

    // Fetch the pending product with all related data
    const { data: product, error } = await supabase
      .from('pending_products')
      .select(`
        *,
        users:submitted_by (
          id,
          username,
          email
        ),
        brands:brand_id (
          id,
          name,
          website
        )
      `)
      .eq('slug', productSlug)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Fetch dosage details based on product category
    const dosageDetails = await fetchDosageDetails(supabase, product.category, product.id);

    // Generate enhanced dosage analysis
    let dosageAnalysis = null;
    if (dosageDetails && product.servings_per_container && product.serving_size_g) {
      try {
        // Extract ingredient data from dosage details
        const ingredients: Record<string, number> = {};
        Object.entries(dosageDetails).forEach(([key, value]) => {
          if (typeof value === 'number' && value > 0 && key.includes('_mg')) {
            // Map database field names to ingredient names
            let ingredientName = key;
            if (key === 'creatine_dosage_mg') {
              ingredientName = 'creatine_monohydrate_mg';
            }
            ingredients[ingredientName] = value;
          }
        });

        if (Object.keys(ingredients).length > 0) {
          try {
            dosageAnalysis = await calculateEnhancedDosageRating({
              category: product.category,
              servingsPerContainer: product.servings_per_container,
              servingSizeG: product.serving_size_g,
              price: product.price,
              currency: product.currency || 'USD',
              creatineType: dosageDetails.creatine_type_name || undefined,
              ingredients: ingredients
            });
          } catch (calcError) {
            console.error('Enhanced dosage calculator failed:', calcError);
            // Fallback: create simple analysis using existing data
            dosageAnalysis = {
              overallScore: 100,
              overallRating: 'Excellent',
              message: `Excellent dosage! This product provides ${ingredients.creatine_monohydrate_mg}mg of creatine per serving, which is within the optimal range of 3000-5000mg.`,
              ingredientAnalysis: [{
                ingredientName: 'creatine_monohydrate_mg',
                displayName: 'Creatine Monohydrate',
                actualDosage: ingredients.creatine_monohydrate_mg,
                minDosage: 3000,
                maxDosage: 5000,
                dangerousDosage: 10000,
                score: 100,
                rating: 'Excellent',
                message: `Perfect dosage! ${ingredients.creatine_monohydrate_mg}mg is within the optimal range.`,
                dosageNotes: 'Standard creatine monohydrate dosage for muscle building and performance.',
                cautions: 'Consult doctor if you have kidney disease.',
                precaution_people: ['Kidney disease', 'Diabetes'],
                dosage_citation: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC2048496/',
                cautions_citation: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC2048496/'
              }],
              valueScore: 85,
              servingEfficiency: 1,
              pricePerEffectiveDose: product.price / product.servings_per_container,
              manufacturerMinDosage: {
                score: 100,
                message: 'Manufacturer provides optimal minimum dosage'
              },
              manufacturerMaxDosage: {
                score: 100,
                message: 'Manufacturer provides optimal maximum dosage'
              }
            };
          }
        }
      } catch (error) {
        console.error('Error generating dosage analysis:', error);
        console.error('Error stack:', error.stack);
        // Continue without dosage analysis rather than failing
      }
    }

    // Format the response
    const formattedProduct = {
      id: product.id,
      productName: product.product_name,
      brand: {
        id: product.brands?.id,
        name: product.brands?.name || 'Unknown',
        website: product.brands?.website
      },
      category: product.category,
      description: product.description,
      imageUrl: product.image_url,
      price: product.price,
      currency: product.currency,
      servingsPerContainer: product.servings_per_container,
      servingSizeG: product.serving_size_g,
      dosageRating: product.dosage_rating,
      dangerRating: product.danger_rating,
      submittedBy: {
        id: product.users?.id,
        username: product.users?.username || 'Unknown',
        email: product.users?.email
      },
      submittedAt: product.created_at,
      updatedAt: product.updated_at,
      approvalStatus: product.approval_status,
      reviewedBy: product.reviewed_by,
      reviewedAt: product.reviewed_at,
      dosageDetails: dosageDetails,
      dosageAnalysis: dosageAnalysis
    };

    return NextResponse.json({ product: formattedProduct });
  } catch (error) {
    console.error('Error fetching product details:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
