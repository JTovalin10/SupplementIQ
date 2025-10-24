export interface ProductData {
  id: string;
  productName: string;
  brand: {
    id: number;
    name: string;
    website?: string;
  };
  category: string;
  description: string;
  imageUrl?: string;
  price?: number;
  currency?: string;
  servingsPerContainer?: number;
  servingSizeG?: number;
  dosageRating: number;
  dangerRating: number;
  submittedBy?: {
    id: string;
    username: string;
    email?: string;
  };
  submittedAt?: string;
  updatedAt?: string;
  approvalStatus?: number;
  reviewedBy?: string;
  reviewedAt?: string;
  // Detailed dosage information for review - now as key-value pairs
  dosageDetails?: Record<string, any>;
}

// Ingredient mapping configuration for different product categories
export interface IngredientConfig {
  displayName: string;
  unit: string;
  category: string;
  description?: string;
}

export interface DosageMapping {
  [key: string]: IngredientConfig;
}

// Comprehensive ingredient mappings for all product categories
export const DOSAGE_MAPPINGS: Record<string, DosageMapping> = {
  'pre-workout': {
    // Serving information
    serving_scoops: { displayName: 'Serving Scoops', unit: 'scoops', category: 'serving' },
    serving_g: { displayName: 'Serving Size', unit: 'g', category: 'serving' },
    flavors: { displayName: 'Available Flavors', unit: '', category: 'info' },
    key_features: { displayName: 'Key Features', unit: '', category: 'info' },
    
    // Nutritional information
    sugar_g: { displayName: 'Sugar', unit: 'g', category: 'nutrition' },
    
    // Pre-workout ingredients
    l_citrulline_mg: { displayName: 'L-Citrulline', unit: 'mg', category: 'ingredient', description: 'Nitric oxide precursor for pumps' },
    creatine_monohydrate_mg: { displayName: 'Creatine Monohydrate', unit: 'mg', category: 'ingredient', description: 'Strength and power enhancement' },
    glycerpump_mg: { displayName: 'GlycerPump', unit: 'mg', category: 'ingredient', description: 'Glycerol for cell volumization' },
    betaine_anhydrous_mg: { displayName: 'Betaine Anhydrous', unit: 'mg', category: 'ingredient', description: 'Power and strength enhancement' },
    agmatine_sulfate_mg: { displayName: 'Agmatine Sulfate', unit: 'mg', category: 'ingredient', description: 'Nitric oxide enhancement' },
    l_tyrosine_mg: { displayName: 'L-Tyrosine', unit: 'mg', category: 'ingredient', description: 'Focus and mental clarity' },
    caffeine_anhydrous_mg: { displayName: 'Caffeine Anhydrous', unit: 'mg', category: 'ingredient', description: 'Energy and alertness' },
    n_phenethyl_dimethylamine_citrate_mg: { displayName: 'N-Phenethyl Dimethylamine Citrate', unit: 'mg', category: 'ingredient', description: 'Stimulant and focus' },
    kanna_extract_mg: { displayName: 'Kanna Extract', unit: 'mg', category: 'ingredient', description: 'Mood enhancement' },
    huperzine_a_mcg: { displayName: 'Huperzine A', unit: 'mcg', category: 'ingredient', description: 'Cognitive enhancement' },
    bioperine_mg: { displayName: 'Bioperine', unit: 'mg', category: 'ingredient', description: 'Absorption enhancement' },
  },

  'non-stim-pre-workout': {
    // Serving information
    serving_scoops: { displayName: 'Serving Scoops', unit: 'scoops', category: 'serving' },
    serving_g: { displayName: 'Serving Size', unit: 'g', category: 'serving' },
    flavors: { displayName: 'Available Flavors', unit: '', category: 'info' },
    key_features: { displayName: 'Key Features', unit: '', category: 'info' },
    
    // Nutritional information
    calories: { displayName: 'Calories', unit: 'cal', category: 'nutrition' },
    total_carbohydrate_g: { displayName: 'Total Carbohydrates', unit: 'g', category: 'nutrition' },
    
    // Vitamins and minerals
    niacin_mg: { displayName: 'Niacin (B3)', unit: 'mg', category: 'vitamin' },
    vitamin_b6_mg: { displayName: 'Vitamin B6', unit: 'mg', category: 'vitamin' },
    vitamin_b12_mcg: { displayName: 'Vitamin B12', unit: 'mcg', category: 'vitamin' },
    magnesium_mg: { displayName: 'Magnesium', unit: 'mg', category: 'mineral' },
    sodium_mg: { displayName: 'Sodium', unit: 'mg', category: 'mineral' },
    potassium_mg: { displayName: 'Potassium', unit: 'mg', category: 'mineral' },
    
    // Performance ingredients
    l_citrulline_mg: { displayName: 'L-Citrulline', unit: 'mg', category: 'ingredient', description: 'Nitric oxide precursor' },
    creatine_monohydrate_mg: { displayName: 'Creatine Monohydrate', unit: 'mg', category: 'ingredient', description: 'Strength enhancement' },
    betaine_anhydrous_mg: { displayName: 'Betaine Anhydrous', unit: 'mg', category: 'ingredient', description: 'Power enhancement' },
    glycerol_powder_mg: { displayName: 'Glycerol Powder', unit: 'mg', category: 'ingredient', description: 'Cell volumization' },
    malic_acid_mg: { displayName: 'Malic Acid', unit: 'mg', category: 'ingredient', description: 'Energy production' },
    taurine_mg: { displayName: 'Taurine', unit: 'mg', category: 'ingredient', description: 'Hydration and performance' },
    sodium_nitrate_mg: { displayName: 'Sodium Nitrate', unit: 'mg', category: 'ingredient', description: 'Nitric oxide enhancement' },
    agmatine_sulfate_mg: { displayName: 'Agmatine Sulfate', unit: 'mg', category: 'ingredient', description: 'Nitric oxide enhancement' },
    vasodrive_ap_mg: { displayName: 'Vasodrive AP', unit: 'mg', category: 'ingredient', description: 'Nitric oxide enhancement' },
  },

  'energy-drink': {
    // Serving information
    serving_size_fl_oz: { displayName: 'Serving Size', unit: 'fl oz', category: 'serving' },
    flavors: { displayName: 'Available Flavors', unit: '', category: 'info' },
    key_features: { displayName: 'Key Features', unit: '', category: 'info' },
    
    // Nutritional information
    sugar_g: { displayName: 'Sugar', unit: 'g', category: 'nutrition' },
    
    // Energy and focus ingredients
    caffeine_mg: { displayName: 'Caffeine', unit: 'mg', category: 'ingredient', description: 'Energy and alertness' },
    n_acetyl_l_tyrosine_mg: { displayName: 'N-Acetyl L-Tyrosine', unit: 'mg', category: 'ingredient', description: 'Focus and mental clarity' },
    alpha_gpc_mg: { displayName: 'Alpha-GPC', unit: 'mg', category: 'ingredient', description: 'Cognitive enhancement' },
    l_theanine_mg: { displayName: 'L-Theanine', unit: 'mg', category: 'ingredient', description: 'Calm focus' },
    huperzine_a_mcg: { displayName: 'Huperzine A', unit: 'mcg', category: 'ingredient', description: 'Memory enhancement' },
    uridine_monophosphate_mg: { displayName: 'Uridine Monophosphate', unit: 'mg', category: 'ingredient', description: 'Cognitive function' },
    saffron_extract_mg: { displayName: 'Saffron Extract', unit: 'mg', category: 'ingredient', description: 'Mood enhancement' },
    
    // Vitamins
    vitamin_c_mg: { displayName: 'Vitamin C', unit: 'mg', category: 'vitamin' },
    niacin_b3_mg: { displayName: 'Niacin (B3)', unit: 'mg', category: 'vitamin' },
    vitamin_b6_mg: { displayName: 'Vitamin B6', unit: 'mg', category: 'vitamin' },
    vitamin_b12_mcg: { displayName: 'Vitamin B12', unit: 'mcg', category: 'vitamin' },
    pantothenic_acid_b5_mg: { displayName: 'Pantothenic Acid (B5)', unit: 'mg', category: 'vitamin' },
  },

  'protein': {
    flavors: { displayName: 'Available Flavors', unit: '', category: 'info' },
    protein_claim_g: { displayName: 'Protein Claim', unit: 'g', category: 'nutrition' },
    effective_protein_g: { displayName: 'Effective Protein', unit: 'g', category: 'nutrition' },
    protein_sources: { displayName: 'Protein Sources', unit: '', category: 'info' },
  },

  'bcaa': {
    flavors: { displayName: 'Available Flavors', unit: '', category: 'info' },
    key_features: { displayName: 'Key Features', unit: '', category: 'info' },
    total_eaas_mg: { displayName: 'Total EAAs', unit: 'mg', category: 'nutrition' },
    l_leucine_mg: { displayName: 'L-Leucine', unit: 'mg', category: 'amino', description: 'Muscle protein synthesis trigger' },
    l_isoleucine_mg: { displayName: 'L-Isoleucine', unit: 'mg', category: 'amino', description: 'Energy and glucose uptake' },
    l_valine_mg: { displayName: 'L-Valine', unit: 'mg', category: 'amino', description: 'Muscle growth and recovery' },
    l_lysine_hcl_mg: { displayName: 'L-Lysine HCl', unit: 'mg', category: 'amino', description: 'Collagen synthesis' },
    l_threonine_mg: { displayName: 'L-Threonine', unit: 'mg', category: 'amino', description: 'Immune function' },
    l_phenylalanine_mg: { displayName: 'L-Phenylalanine', unit: 'mg', category: 'amino', description: 'Neurotransmitter synthesis' },
    l_tryptophan_mg: { displayName: 'L-Tryptophan', unit: 'mg', category: 'amino', description: 'Serotonin synthesis' },
    l_histidine_hcl_mg: { displayName: 'L-Histidine HCl', unit: 'mg', category: 'amino', description: 'Histamine synthesis' },
    l_methionine_mg: { displayName: 'L-Methionine', unit: 'mg', category: 'amino', description: 'Antioxidant synthesis' },
    betaine_anhydrous_mg: { displayName: 'Betaine Anhydrous', unit: 'mg', category: 'ingredient', description: 'Power enhancement' },
    coconut_water_powder_mg: { displayName: 'Coconut Water Powder', unit: 'mg', category: 'ingredient', description: 'Electrolyte replacement' },
    astragin_mg: { displayName: 'Astragin', unit: 'mg', category: 'ingredient', description: 'Absorption enhancement' },
  },

  'eaa': {
    flavors: { displayName: 'Available Flavors', unit: '', category: 'info' },
    key_features: { displayName: 'Key Features', unit: '', category: 'info' },
    total_eaas_mg: { displayName: 'Total EAAs', unit: 'mg', category: 'nutrition' },
    l_leucine_mg: { displayName: 'L-Leucine', unit: 'mg', category: 'amino', description: 'Muscle protein synthesis trigger' },
    l_isoleucine_mg: { displayName: 'L-Isoleucine', unit: 'mg', category: 'amino', description: 'Energy and glucose uptake' },
    l_valine_mg: { displayName: 'L-Valine', unit: 'mg', category: 'amino', description: 'Muscle growth and recovery' },
    l_lysine_hcl_mg: { displayName: 'L-Lysine HCl', unit: 'mg', category: 'amino', description: 'Collagen synthesis' },
    l_threonine_mg: { displayName: 'L-Threonine', unit: 'mg', category: 'amino', description: 'Immune function' },
    l_phenylalanine_mg: { displayName: 'L-Phenylalanine', unit: 'mg', category: 'amino', description: 'Neurotransmitter synthesis' },
    l_tryptophan_mg: { displayName: 'L-Tryptophan', unit: 'mg', category: 'amino', description: 'Serotonin synthesis' },
    l_histidine_hcl_mg: { displayName: 'L-Histidine HCl', unit: 'mg', category: 'amino', description: 'Histamine synthesis' },
    l_methionine_mg: { displayName: 'L-Methionine', unit: 'mg', category: 'amino', description: 'Antioxidant synthesis' },
    betaine_anhydrous_mg: { displayName: 'Betaine Anhydrous', unit: 'mg', category: 'ingredient', description: 'Power enhancement' },
    coconut_water_powder_mg: { displayName: 'Coconut Water Powder', unit: 'mg', category: 'ingredient', description: 'Electrolyte replacement' },
    astragin_mg: { displayName: 'Astragin', unit: 'mg', category: 'ingredient', description: 'Absorption enhancement' },
  },

  'fat-burner': {
    stimulant_based: { displayName: 'Stimulant Based', unit: '', category: 'info' },
    key_features: { displayName: 'Key Features', unit: '', category: 'info' },
    l_carnitine_l_tartrate_mg: { displayName: 'L-Carnitine L-Tartrate', unit: 'mg', category: 'ingredient', description: 'Fat metabolism' },
    green_tea_extract_mg: { displayName: 'Green Tea Extract', unit: 'mg', category: 'ingredient', description: 'Antioxidants and metabolism' },
    capsimax_mg: { displayName: 'Capsimax', unit: 'mg', category: 'ingredient', description: 'Thermogenesis' },
    grains_of_paradise_mg: { displayName: 'Grains of Paradise', unit: 'mg', category: 'ingredient', description: 'Thermogenesis' },
    ksm66_ashwagandha_mg: { displayName: 'KSM-66 Ashwagandha', unit: 'mg', category: 'ingredient', description: 'Stress reduction' },
    kelp_extract_mcg: { displayName: 'Kelp Extract', unit: 'mcg', category: 'ingredient', description: 'Thyroid support' },
    selenium_mcg: { displayName: 'Selenium', unit: 'mcg', category: 'mineral', description: 'Thyroid function' },
    zinc_picolinate_mg: { displayName: 'Zinc Picolinate', unit: 'mg', category: 'mineral', description: 'Metabolism support' },
    five_htp_mg: { displayName: '5-HTP', unit: 'mg', category: 'ingredient', description: 'Appetite suppression' },
    caffeine_anhydrous_mg: { displayName: 'Caffeine Anhydrous', unit: 'mg', category: 'ingredient', description: 'Energy and metabolism' },
    halostachine_mg: { displayName: 'Halostachine', unit: 'mg', category: 'ingredient', description: 'Fat burning' },
    rauwolscine_mcg: { displayName: 'Rauwolscine', unit: 'mcg', category: 'ingredient', description: 'Fat burning' },
    bioperine_mg: { displayName: 'Bioperine', unit: 'mg', category: 'ingredient', description: 'Absorption enhancement' },
  },

  'appetite-suppressant': {
    stimulant_based: { displayName: 'Stimulant Based', unit: '', category: 'info' },
    key_features: { displayName: 'Key Features', unit: '', category: 'info' },
    l_carnitine_l_tartrate_mg: { displayName: 'L-Carnitine L-Tartrate', unit: 'mg', category: 'ingredient', description: 'Fat metabolism' },
    green_tea_extract_mg: { displayName: 'Green Tea Extract', unit: 'mg', category: 'ingredient', description: 'Antioxidants and metabolism' },
    capsimax_mg: { displayName: 'Capsimax', unit: 'mg', category: 'ingredient', description: 'Thermogenesis' },
    grains_of_paradise_mg: { displayName: 'Grains of Paradise', unit: 'mg', category: 'ingredient', description: 'Thermogenesis' },
    ksm66_ashwagandha_mg: { displayName: 'KSM-66 Ashwagandha', unit: 'mg', category: 'ingredient', description: 'Stress reduction' },
    kelp_extract_mcg: { displayName: 'Kelp Extract', unit: 'mcg', category: 'ingredient', description: 'Thyroid support' },
    selenium_mcg: { displayName: 'Selenium', unit: 'mcg', category: 'mineral', description: 'Thyroid function' },
    zinc_picolinate_mg: { displayName: 'Zinc Picolinate', unit: 'mg', category: 'mineral', description: 'Metabolism support' },
    five_htp_mg: { displayName: '5-HTP', unit: 'mg', category: 'ingredient', description: 'Appetite suppression' },
    caffeine_anhydrous_mg: { displayName: 'Caffeine Anhydrous', unit: 'mg', category: 'ingredient', description: 'Energy and metabolism' },
    halostachine_mg: { displayName: 'Halostachine', unit: 'mg', category: 'ingredient', description: 'Fat burning' },
    rauwolscine_mcg: { displayName: 'Rauwolscine', unit: 'mcg', category: 'ingredient', description: 'Fat burning' },
    bioperine_mg: { displayName: 'Bioperine', unit: 'mg', category: 'ingredient', description: 'Absorption enhancement' },
  },

  'creatine': {
    creatine_type_name: { displayName: 'Creatine Type', unit: '', category: 'info' },
    flavors: { displayName: 'Available Flavors', unit: '', category: 'info' },
    serving_size_g: { displayName: 'Serving Size', unit: 'g', category: 'serving' },
    servings_per_container: { displayName: 'Servings per Container', unit: 'servings', category: 'serving' },
  },
};

export type ProductMode = 'review' | 'product';
export type ProductCategory = 'protein' | 'pre-workout' | 'non-stim-pre-workout' | 'energy-drink' | 'bcaa' | 'eaa' | 'fat-burner' | 'appetite-suppressant' | 'creatine';
