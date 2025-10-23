// Ingredient configurations for different product categories
// This file maps all database fields from each detail table to form fields
// 
// Database Tables Mapped:
// - preworkout_details: 15 ingredients + serving info
// - non_stim_preworkout_details: 20 ingredients + serving info  
// - energy_drink_details: 13 ingredients + serving info
// - protein_details: 2 main fields (protein_claim_g, effective_protein_g) + protein_sources JSONB
// - amino_acid_details: 13 ingredients (covers both BCAA and EAA)
// - fat_burner_details: 13 ingredients + stimulant_based boolean
// - creatine_details: 3 fields (creatine_type_name, serving_size_g, servings_per_container)
//
// Each ingredient field maps directly to a database column
// Users can add/remove ingredients as needed - all database fields are available
export interface IngredientField {
  name: string;
  label: string;
  placeholder: string;
  unit: string;
  required?: boolean;
  step?: string;
  description?: string;
  type?: 'number' | 'text' | 'select' | 'boolean';
  options?: { value: string; label: string }[];
  section?: string;
}

export interface CategoryIngredients {
  [key: string]: IngredientField[];
}

export const categoryIngredients: CategoryIngredients = {
  protein: [
    // Nutritional Information (alphabetical) - REQUIRED FIELDS FIRST
    {
      name: 'calories',
      label: 'Calories',
      placeholder: '120',
      unit: 'cal',
      description: 'Calories per serving',
      required: true,
      section: 'Nutritional Information'
    },
    {
      name: 'cholesterol_mg',
      label: 'Cholesterol',
      placeholder: '5',
      unit: 'mg',
      description: 'Cholesterol content per serving',
      required: true,
      section: 'Nutritional Information'
    },
    {
      name: 'fiber_g',
      label: 'Dietary Fiber',
      placeholder: '0',
      unit: 'g',
      step: '0.1',
      description: 'Dietary fiber content per serving',
      required: true,
      section: 'Nutritional Information'
    },
    {
      name: 'fat_g',
      label: 'Total Fat',
      placeholder: '1',
      unit: 'g',
      step: '0.1',
      description: 'Total fat content per serving',
      required: true,
      section: 'Nutritional Information'
    },
    {
      name: 'protein_claim_g',
      label: 'Total Protein Claim',
      placeholder: '25',
      unit: 'g',
      step: '0.1',
      description: 'Total protein content per serving as claimed by manufacturer',
      required: true,
      section: 'Nutritional Information'
    },
    {
      name: 'saturated_fat_g',
      label: 'Saturated Fat',
      placeholder: '0.5',
      unit: 'g',
      step: '0.1',
      description: 'Saturated fat content per serving',
      required: true,
      section: 'Nutritional Information'
    },
    {
      name: 'serving_size_g',
      label: 'Serving Size',
      placeholder: '30',
      unit: 'g',
      step: '0.1',
      description: 'Serving size in grams',
      required: true,
      section: 'Nutritional Information'
    },
    {
      name: 'servings_per_container',
      label: 'Servings Per Container',
      placeholder: '30',
      unit: 'servings',
      description: 'Number of servings per container',
      required: true,
      section: 'Nutritional Information'
    },
    {
      name: 'price',
      label: 'Price',
      placeholder: '29.99',
      unit: '$',
      step: '0.01',
      description: 'Product price for bang for your buck calculations',
      required: true,
      section: 'Nutritional Information'
    },
    {
      name: 'sodium_mg',
      label: 'Sodium',
      placeholder: '140',
      unit: 'mg',
      description: 'Sodium content per serving',
      required: true,
      section: 'Nutritional Information'
    },
    {
      name: 'sugar_g',
      label: 'Sugar',
      placeholder: '1',
      unit: 'g',
      step: '0.1',
      description: 'Sugar content per serving',
      required: true,
      section: 'Nutritional Information'
    },
    {
      name: 'total_carbohydrate_g',
      label: 'Total Carbohydrate',
      placeholder: '3',
      unit: 'g',
      step: '0.1',
      description: 'Total carbohydrates per serving',
      required: true,
      section: 'Nutritional Information'
    },

    // Dairy Proteins (alphabetical)
    {
      name: 'casein_mg',
      label: 'Casein Protein',
      placeholder: '10000',
      unit: 'mg',
      description: 'Casein protein content',
      section: 'Dairy Proteins'
    },
    {
      name: 'whey_concentrate_mg',
      label: 'Whey Protein Concentrate',
      placeholder: '15000',
      unit: 'mg',
      description: 'Whey protein concentrate content',
      section: 'Dairy Proteins'
    },
    {
      name: 'whey_isolate_mg',
      label: 'Whey Protein Isolate',
      placeholder: '20000',
      unit: 'mg',
      description: 'Whey protein isolate content',
      section: 'Dairy Proteins'
    },

    // Plant Proteins (alphabetical)
    {
      name: 'hemp_protein_mg',
      label: 'Hemp Protein',
      placeholder: '8000',
      unit: 'mg',
      description: 'Hemp protein content',
      section: 'Plant Proteins'
    },
    {
      name: 'pea_protein_mg',
      label: 'Pea Protein',
      placeholder: '15000',
      unit: 'mg',
      description: 'Pea protein content',
      section: 'Plant Proteins'
    },
    {
      name: 'rice_protein_mg',
      label: 'Rice Protein',
      placeholder: '10000',
      unit: 'mg',
      description: 'Rice protein content',
      section: 'Plant Proteins'
    },
    {
      name: 'soy_protein_mg',
      label: 'Soy Protein',
      placeholder: '12000',
      unit: 'mg',
      description: 'Soy protein content',
      section: 'Plant Proteins'
    },

    // Specialty Proteins (alphabetical)
    {
      name: 'collagen_mg',
      label: 'Collagen Protein',
      placeholder: '5000',
      unit: 'mg',
      description: 'Collagen protein content',
      section: 'Specialty Proteins'
    },
    {
      name: 'egg_protein_mg',
      label: 'Egg White Protein',
      placeholder: '10000',
      unit: 'mg',
      description: 'Egg white protein content',
      section: 'Specialty Proteins'
    }
  ],

  'pre-workout': [
    // Basic Information (alphabetical)
    {
      name: 'calories',
      label: 'Calories',
      placeholder: '5',
      unit: 'cal',
      description: 'Calories per serving',
      required: true,
      section: 'Basic Information'
    },
    {
      name: 'serving_g',
      label: 'Serving Size',
      placeholder: '30.5',
      unit: 'g',
      step: '0.1',
      description: 'Serving size in grams',
      required: true,
      section: 'Basic Information'
    },
    {
      name: 'serving_scoops',
      label: 'Serving Scoops',
      placeholder: '2',
      unit: 'scoops',
      step: '0.5',
      description: 'Number of scoops per serving',
      required: true,
      section: 'Basic Information'
    },
    {
      name: 'sugar_g',
      label: 'Sugar',
      placeholder: '0',
      unit: 'g',
      step: '0.1',
      description: 'Sugar content per serving',
      required: true,
      section: 'Basic Information'
    },
    {
      name: 'total_carbohydrate_g',
      label: 'Total Carbohydrate',
      placeholder: '1',
      unit: 'g',
      step: '0.1',
      description: 'Total carbohydrates per serving',
      required: true,
      section: 'Basic Information'
    },
    {
      name: 'servings_per_container',
      label: 'Servings Per Container',
      placeholder: '30',
      unit: 'servings',
      step: '1',
      description: 'Number of servings per container',
      required: true,
      section: 'Basic Information'
    },
    {
      name: 'price',
      label: 'Price',
      placeholder: '29.99',
      unit: '$',
      step: '0.01',
      description: 'Product price for bang for your buck calculations',
      required: true,
      section: 'Basic Information'
    },

    // Vitamins & Minerals (alphabetical)
    {
      name: 'magnesium_mg',
      label: 'Magnesium',
      placeholder: '25',
      unit: 'mg',
      description: 'Magnesium content',
      section: 'Vitamins & Minerals'
    },
    {
      name: 'niacin_mg',
      label: 'Niacin',
      placeholder: '16',
      unit: 'mg',
      description: 'Niacin (Vitamin B3) content',
      section: 'Vitamins & Minerals'
    },
    {
      name: 'potassium_mg',
      label: 'Potassium',
      placeholder: '190',
      unit: 'mg',
      description: 'Potassium content',
      section: 'Vitamins & Minerals'
    },
    {
      name: 'sodium_mg',
      label: 'Sodium',
      placeholder: '190',
      unit: 'mg',
      description: 'Sodium content',
      section: 'Vitamins & Minerals'
    },
    {
      name: 'vitamin_b6_mg',
      label: 'Vitamin B6',
      placeholder: '10',
      unit: 'mg',
      description: 'Pyridoxine content',
      section: 'Vitamins & Minerals'
    },
    {
      name: 'vitamin_b12_mcg',
      label: 'Vitamin B12',
      placeholder: '125',
      unit: 'mcg',
      description: 'Cobalamin content',
      section: 'Vitamins & Minerals'
    },

    // Performance Ingredients (alphabetical)
    {
      name: 'betaine_anhydrous_mg',
      label: 'Betaine Anhydrous',
      placeholder: '2000',
      unit: 'mg',
      description: 'Betaine for power and strength',
      section: 'Performance Ingredients'
    },
    {
      name: 'creatine_monohydrate_mg',
      label: 'Creatine Monohydrate',
      placeholder: '2500',
      unit: 'mg',
      description: 'Creatine monohydrate for strength and power',
      section: 'Performance Ingredients'
    },
    {
      name: 'glycerol_mg',
      label: 'Glycerol',
      placeholder: '2000',
      unit: 'mg',
      description: 'Glycerol for muscle fullness and hydration',
      section: 'Performance Ingredients'
    },
    {
      name: 'l_citrulline_mg',
      label: 'L-Citrulline',
      placeholder: '5000',
      unit: 'mg',
      description: 'L-Citrulline for nitric oxide production',
      section: 'Performance Ingredients'
    },
    {
      name: 'malic_acid_mg',
      label: 'Malic Acid',
      placeholder: '1500',
      unit: 'mg',
      description: 'Malic acid for energy production',
      section: 'Performance Ingredients'
    },
    {
      name: 'pink_himalayan_salt_mg',
      label: 'Pink Himalayan Salt',
      placeholder: '500',
      unit: 'mg',
      description: 'Pink Himalayan salt for electrolyte balance',
      section: 'Performance Ingredients'
    },

    // Cognitive Enhancement (alphabetical)
    {
      name: 'alpha_gpc_mg',
      label: 'Alpha-GPC',
      placeholder: '400',
      unit: 'mg',
      description: 'Alpha-GPC for cognitive function and focus',
      section: 'Cognitive Enhancement'
    },
    {
      name: 'huperzine_a_mcg',
      label: 'Huperzine A',
      placeholder: '100',
      unit: 'mcg',
      description: 'Huperzine A for cognitive function',
      section: 'Cognitive Enhancement'
    },
    {
      name: 'l_tyrosine_mg',
      label: 'L-Tyrosine',
      placeholder: '2500',
      unit: 'mg',
      description: 'L-Tyrosine for cognitive enhancement',
      section: 'Cognitive Enhancement'
    },

    // Energy & Stimulants (alphabetical)
    {
      name: 'caffeine_anhydrous_mg',
      label: 'Caffeine Anhydrous',
      placeholder: '200',
      unit: 'mg',
      description: 'Caffeine for energy and focus',
      section: 'Energy & Stimulants'
    },
    {
      name: 'n_phenethyl_dimethylamine_citrate_mg',
      label: 'N-Phenethyl Dimethylamine Citrate',
      placeholder: '350',
      unit: 'mg',
      description: 'DMHA for energy and focus',
      section: 'Energy & Stimulants'
    },

    // Additional Ingredients (alphabetical)
    {
      name: 'agmatine_sulfate_mg',
      label: 'Agmatine Sulfate',
      placeholder: '1000',
      unit: 'mg',
      description: 'Agmatine for nitric oxide and pumps',
      section: 'Additional Ingredients'
    },
    {
      name: 'bioperine_mg',
      label: 'Bioperine',
      placeholder: '5',
      unit: 'mg',
      description: 'Black pepper extract for absorption',
      section: 'Additional Ingredients'
    },
    {
      name: 'kanna_extract_mg',
      label: 'Kanna Extract',
      placeholder: '500',
      unit: 'mg',
      description: 'Kanna extract for mood enhancement',
      section: 'Additional Ingredients'
    }
  ],

  'non-stim-pre-workout': [
    // Basic Information (alphabetical)
    {
      name: 'calories',
      label: 'Calories',
      placeholder: '20',
      unit: 'cal',
      description: 'Calories per serving',
      required: true,
      section: 'Basic Information'
    },
    {
      name: 'serving_g',
      label: 'Serving Size',
      placeholder: '40.2',
      unit: 'g',
      step: '0.1',
      description: 'Serving size in grams',
      required: true,
      section: 'Basic Information'
    },
    {
      name: 'serving_scoops',
      label: 'Serving Scoops',
      placeholder: '2',
      unit: 'scoops',
      step: '0.5',
      description: 'Number of scoops per serving',
      required: true,
      section: 'Basic Information'
    },
    {
      name: 'sugar_g',
      label: 'Sugar',
      placeholder: '0',
      unit: 'g',
      step: '0.1',
      description: 'Sugar content per serving',
      required: true,
      section: 'Basic Information'
    },
    {
      name: 'total_carbohydrate_g',
      label: 'Total Carbohydrate',
      placeholder: '2',
      unit: 'g',
      step: '0.1',
      description: 'Total carbohydrates per serving',
      required: true,
      section: 'Basic Information'
    },
    {
      name: 'servings_per_container',
      label: 'Servings Per Container',
      placeholder: '30',
      unit: 'servings',
      step: '1',
      description: 'Number of servings per container',
      required: true,
      section: 'Basic Information'
    },
    {
      name: 'price',
      label: 'Price',
      placeholder: '29.99',
      unit: '$',
      step: '0.01',
      description: 'Product price for bang for your buck calculations',
      required: true,
      section: 'Basic Information'
    },

    // Vitamins & Minerals (alphabetical)
    {
      name: 'magnesium_mg',
      label: 'Magnesium',
      placeholder: '50',
      unit: 'mg',
      description: 'Magnesium content',
      section: 'Vitamins & Minerals'
    },
    {
      name: 'niacin_mg',
      label: 'Niacin',
      placeholder: '32',
      unit: 'mg',
      description: 'Niacin (Vitamin B3) content',
      section: 'Vitamins & Minerals'
    },
    {
      name: 'potassium_mg',
      label: 'Potassium',
      placeholder: '420',
      unit: 'mg',
      description: 'Potassium content',
      section: 'Vitamins & Minerals'
    },
    {
      name: 'sodium_mg',
      label: 'Sodium',
      placeholder: '420',
      unit: 'mg',
      description: 'Sodium content',
      section: 'Vitamins & Minerals'
    },
    {
      name: 'vitamin_b6_mg',
      label: 'Vitamin B6',
      placeholder: '20',
      unit: 'mg',
      description: 'Pyridoxine content',
      section: 'Vitamins & Minerals'
    },
    {
      name: 'vitamin_b12_mcg',
      label: 'Vitamin B12',
      placeholder: '250',
      unit: 'mcg',
      description: 'Cobalamin content',
      section: 'Vitamins & Minerals'
    },

    // Performance Ingredients (alphabetical)
    {
      name: 'betaine_anhydrous_mg',
      label: 'Betaine Anhydrous',
      placeholder: '3000',
      unit: 'mg',
      description: 'Betaine for power and strength',
      section: 'Performance Ingredients'
    },
    {
      name: 'creatine_monohydrate_mg',
      label: 'Creatine Monohydrate',
      placeholder: '3000',
      unit: 'mg',
      description: 'Creatine monohydrate for strength and power',
      section: 'Performance Ingredients'
    },
    {
      name: 'glycerol_mg',
      label: 'Glycerol',
      placeholder: '3000',
      unit: 'mg',
      description: 'Glycerol for muscle fullness and hydration',
      section: 'Performance Ingredients'
    },
    {
      name: 'l_citrulline_mg',
      label: 'L-Citrulline',
      placeholder: '6000',
      unit: 'mg',
      description: 'L-Citrulline for nitric oxide production',
      section: 'Performance Ingredients'
    },
    {
      name: 'malic_acid_mg',
      label: 'Malic Acid',
      placeholder: '2000',
      unit: 'mg',
      description: 'Malic acid for energy production',
      section: 'Performance Ingredients'
    },
    {
      name: 'pink_himalayan_salt_mg',
      label: 'Pink Himalayan Salt',
      placeholder: '750',
      unit: 'mg',
      description: 'Pink Himalayan salt for electrolyte balance',
      section: 'Performance Ingredients'
    },

    // Cognitive Enhancement (alphabetical)
    {
      name: 'alpha_gpc_mg',
      label: 'Alpha-GPC',
      placeholder: '600',
      unit: 'mg',
      description: 'Alpha-GPC for cognitive function and focus',
      section: 'Cognitive Enhancement'
    },
    {
      name: 'huperzine_a_mcg',
      label: 'Huperzine A',
      placeholder: '200',
      unit: 'mcg',
      description: 'Huperzine A for cognitive function',
      section: 'Cognitive Enhancement'
    },
    {
      name: 'l_tyrosine_mg',
      label: 'L-Tyrosine',
      placeholder: '3000',
      unit: 'mg',
      description: 'L-Tyrosine for cognitive enhancement',
      section: 'Cognitive Enhancement'
    },

    // Additional Ingredients (alphabetical)
    {
      name: 'agmatine_sulfate_mg',
      label: 'Agmatine Sulfate',
      placeholder: '1500',
      unit: 'mg',
      description: 'Agmatine for nitric oxide and pumps',
      section: 'Additional Ingredients'
    },
    {
      name: 'bioperine_mg',
      label: 'Bioperine',
      placeholder: '10',
      unit: 'mg',
      description: 'Black pepper extract for absorption',
      section: 'Additional Ingredients'
    },
    {
      name: 'kanna_extract_mg',
      label: 'Kanna Extract',
      placeholder: '750',
      unit: 'mg',
      description: 'Kanna extract for mood enhancement',
      section: 'Additional Ingredients'
    }
  ],

  'energy-drink': [
    // Basic Information (alphabetical)
    {
      name: 'serving_size_fl_oz',
      label: 'Serving Size',
      placeholder: '16',
      unit: 'fl oz',
      step: '0.1',
      description: 'Serving size in fluid ounces',
      required: true,
      section: 'Basic Information'
    },
    {
      name: 'servings_per_container',
      label: 'Servings Per Container',
      placeholder: '12',
      unit: 'servings',
      step: '1',
      description: 'Number of servings per container',
      required: true,
      section: 'Basic Information'
    },
    {
      name: 'price',
      label: 'Price',
      placeholder: '29.99',
      unit: '$',
      step: '0.01',
      description: 'Product price for bang for your buck calculations',
      required: true,
      section: 'Basic Information'
    },

    // Vitamins & Minerals (alphabetical)
    {
      name: 'niacin_mg',
      label: 'Niacin',
      placeholder: '20',
      unit: 'mg',
      description: 'Niacin (Vitamin B3) content',
      section: 'Vitamins & Minerals'
    },
    {
      name: 'pantothenic_acid_b5_mg',
      label: 'Pantothenic Acid (B5)',
      placeholder: '5',
      unit: 'mg',
      description: 'Pantothenic acid content',
      section: 'Vitamins & Minerals'
    },
    {
      name: 'vitamin_b6_mg',
      label: 'Vitamin B6',
      placeholder: '2',
      unit: 'mg',
      description: 'Pyridoxine content',
      section: 'Vitamins & Minerals'
    },
    {
      name: 'vitamin_b12_mcg',
      label: 'Vitamin B12',
      placeholder: '6',
      unit: 'mcg',
      description: 'Cobalamin content',
      section: 'Vitamins & Minerals'
    },

    // Performance Ingredients (alphabetical)
    {
      name: 'l_citrulline_mg',
      label: 'L-Citrulline',
      placeholder: '1000',
      unit: 'mg',
      description: 'L-Citrulline for nitric oxide production',
      section: 'Performance Ingredients'
    },
    {
      name: 'l_tyrosine_mg',
      label: 'L-Tyrosine',
      placeholder: '500',
      unit: 'mg',
      description: 'L-Tyrosine for cognitive enhancement',
      section: 'Performance Ingredients'
    },

    // Energy & Stimulants (alphabetical)
    {
      name: 'caffeine_mg',
      label: 'Caffeine',
      placeholder: '160',
      unit: 'mg',
      description: 'Caffeine content',
      section: 'Energy & Stimulants'
    },
    {
      name: 'n_acetyl_l_tyrosine_mg',
      label: 'N-Acetyl L-Tyrosine',
      placeholder: '300',
      unit: 'mg',
      description: 'N-Acetyl L-Tyrosine for focus',
      section: 'Energy & Stimulants'
    },

    // Additional Ingredients (alphabetical)
    {
      name: 'alpha_gpc_mg',
      label: 'Alpha-GPC',
      placeholder: '200',
      unit: 'mg',
      description: 'Alpha-GPC for cognitive function',
      section: 'Additional Ingredients'
    },
    {
      name: 'taurine_mg',
      label: 'Taurine',
      placeholder: '1000',
      unit: 'mg',
      description: 'Taurine for energy and hydration',
      section: 'Additional Ingredients'
    }
  ],

  bcaa: [
    // Basic Information (alphabetical)
    {
      name: 'serving_size_g',
      label: 'Serving Size',
      placeholder: '10',
      unit: 'g',
      step: '0.1',
      description: 'Serving size in grams',
      required: true,
      section: 'Basic Information'
    },
    {
      name: 'servings_per_container',
      label: 'Servings Per Container',
      placeholder: '30',
      unit: 'servings',
      description: 'Number of servings per container',
      required: true,
      section: 'Basic Information'
    },
    {
      name: 'price',
      label: 'Price',
      placeholder: '29.99',
      unit: '$',
      step: '0.01',
      description: 'Product price for bang for your buck calculations',
      required: true,
      section: 'Basic Information'
    },

    // BCAA Ingredients (alphabetical)
    {
      name: 'l_isoleucine_mg',
      label: 'L-Isoleucine',
      placeholder: '2000',
      unit: 'mg',
      description: 'L-Isoleucine content',
      section: 'BCAA Ingredients'
    },
    {
      name: 'l_leucine_mg',
      label: 'L-Leucine',
      placeholder: '5000',
      unit: 'mg',
      description: 'L-Leucine content',
      section: 'BCAA Ingredients'
    },
    {
      name: 'l_valine_mg',
      label: 'L-Valine',
      placeholder: '2000',
      unit: 'mg',
      description: 'L-Valine content',
      section: 'BCAA Ingredients'
    },

    // Additional Ingredients (alphabetical)
    {
      name: 'betaine_anhydrous_mg',
      label: 'Betaine Anhydrous',
      placeholder: '1000',
      unit: 'mg',
      description: 'Betaine for power and strength',
      section: 'Additional Ingredients'
    },
    {
      name: 'coconut_water_powder_mg',
      label: 'Coconut Water Powder',
      placeholder: '500',
      unit: 'mg',
      description: 'Coconut water powder for hydration',
      section: 'Additional Ingredients'
    },
    {
      name: 'total_eaas_mg',
      label: 'Total EAAs',
      placeholder: '9000',
      unit: 'mg',
      description: 'Total essential amino acids',
      section: 'Additional Ingredients'
    }
  ],

  eaa: [
    // Basic Information (alphabetical)
    {
      name: 'serving_size_g',
      label: 'Serving Size',
      placeholder: '10',
      unit: 'g',
      step: '0.1',
      description: 'Serving size in grams',
      required: true,
      section: 'Basic Information'
    },
    {
      name: 'servings_per_container',
      label: 'Servings Per Container',
      placeholder: '30',
      unit: 'servings',
      description: 'Number of servings per container',
      required: true,
      section: 'Basic Information'
    },
    {
      name: 'price',
      label: 'Price',
      placeholder: '29.99',
      unit: '$',
      step: '0.01',
      description: 'Product price for bang for your buck calculations',
      required: true,
      section: 'Basic Information'
    },

    // EAA Ingredients (alphabetical)
    {
      name: 'l_histidine_hcl_mg',
      label: 'L-Histidine HCL',
      placeholder: '1000',
      unit: 'mg',
      description: 'L-Histidine HCL content',
      section: 'EAA Ingredients'
    },
    {
      name: 'l_isoleucine_mg',
      label: 'L-Isoleucine',
      placeholder: '2000',
      unit: 'mg',
      description: 'L-Isoleucine content',
      section: 'EAA Ingredients'
    },
    {
      name: 'l_leucine_mg',
      label: 'L-Leucine',
      placeholder: '5000',
      unit: 'mg',
      description: 'L-Leucine content',
      section: 'EAA Ingredients'
    },
    {
      name: 'l_lysine_hcl_mg',
      label: 'L-Lysine HCL',
      placeholder: '2000',
      unit: 'mg',
      description: 'L-Lysine HCL content',
      section: 'EAA Ingredients'
    },
    {
      name: 'l_methionine_mg',
      label: 'L-Methionine',
      placeholder: '1000',
      unit: 'mg',
      description: 'L-Methionine content',
      section: 'EAA Ingredients'
    },
    {
      name: 'l_phenylalanine_mg',
      label: 'L-Phenylalanine',
      placeholder: '1500',
      unit: 'mg',
      description: 'L-Phenylalanine content',
      section: 'EAA Ingredients'
    },
    {
      name: 'l_threonine_mg',
      label: 'L-Threonine',
      placeholder: '1500',
      unit: 'mg',
      description: 'L-Threonine content',
      section: 'EAA Ingredients'
    },
    {
      name: 'l_tryptophan_mg',
      label: 'L-Tryptophan',
      placeholder: '500',
      unit: 'mg',
      description: 'L-Tryptophan content',
      section: 'EAA Ingredients'
    },
    {
      name: 'l_valine_mg',
      label: 'L-Valine',
      placeholder: '2000',
      unit: 'mg',
      description: 'L-Valine content',
      section: 'EAA Ingredients'
    },

    // Additional Ingredients (alphabetical)
    {
      name: 'astragin_mg',
      label: 'Astragin',
      placeholder: '50',
      unit: 'mg',
      description: 'Astragin for absorption',
      section: 'Additional Ingredients'
    },
    {
      name: 'betaine_anhydrous_mg',
      label: 'Betaine Anhydrous',
      placeholder: '1000',
      unit: 'mg',
      description: 'Betaine for power and strength',
      section: 'Additional Ingredients'
    },
    {
      name: 'coconut_water_powder_mg',
      label: 'Coconut Water Powder',
      placeholder: '500',
      unit: 'mg',
      description: 'Coconut water powder for hydration',
      section: 'Additional Ingredients'
    },
    {
      name: 'total_eaas_mg',
      label: 'Total EAAs',
      placeholder: '15000',
      unit: 'mg',
      description: 'Total essential amino acids',
      section: 'Additional Ingredients'
    }
  ],

  'fat-burner': [
    // Basic Information (alphabetical)
    {
      name: 'serving_size_g',
      label: 'Serving Size',
      placeholder: '2',
      unit: 'g',
      step: '0.1',
      description: 'Serving size in grams',
      required: true,
      section: 'Basic Information'
    },
    {
      name: 'servings_per_container',
      label: 'Servings Per Container',
      placeholder: '60',
      unit: 'servings',
      description: 'Number of servings per container',
      required: true,
      section: 'Basic Information'
    },
    {
      name: 'price',
      label: 'Price',
      placeholder: '29.99',
      unit: '$',
      step: '0.01',
      description: 'Product price for bang for your buck calculations',
      required: true,
      section: 'Basic Information'
    },

    // Stimulants (alphabetical)
    {
      name: 'caffeine_anhydrous_mg',
      label: 'Caffeine Anhydrous',
      placeholder: '200',
      unit: 'mg',
      description: 'Caffeine for energy and metabolism',
      section: 'Stimulants'
    },
    {
      name: 'green_tea_extract_mg',
      label: 'Green Tea Extract',
      placeholder: '500',
      unit: 'mg',
      description: 'Green tea extract for metabolism',
      section: 'Stimulants'
    },

    // Fat Burning Ingredients (alphabetical)
    {
      name: 'carnitine_mg',
      label: 'L-Carnitine',
      placeholder: '1000',
      unit: 'mg',
      description: 'L-Carnitine for fat transport',
      section: 'Fat Burning Ingredients'
    },
    {
      name: 'cla_mg',
      label: 'CLA',
      placeholder: '1000',
      unit: 'mg',
      description: 'Conjugated Linoleic Acid for fat loss',
      section: 'Fat Burning Ingredients'
    },
    {
      name: 'forskolin_mg',
      label: 'Forskolin',
      placeholder: '250',
      unit: 'mg',
      description: 'Forskolin for fat burning',
      section: 'Fat Burning Ingredients'
    },
    {
      name: 'garcinia_cambogia_mg',
      label: 'Garcinia Cambogia',
      placeholder: '500',
      unit: 'mg',
      description: 'Garcinia Cambogia for appetite control',
      section: 'Fat Burning Ingredients'
    },
    {
      name: 'raspberry_ketones_mg',
      label: 'Raspberry Ketones',
      placeholder: '200',
      unit: 'mg',
      description: 'Raspberry ketones for fat burning',
      section: 'Fat Burning Ingredients'
    },

    // Appetite Control (alphabetical)
    {
      name: 'glucomannan_mg',
      label: 'Glucomannan',
      placeholder: '1000',
      unit: 'mg',
      description: 'Glucomannan for appetite suppression',
      section: 'Appetite Control'
    },
    {
      name: 'saffron_extract_mg',
      label: 'Saffron Extract',
      placeholder: '30',
      unit: 'mg',
      description: 'Saffron extract for mood and appetite',
      section: 'Appetite Control'
    },

    // Additional Ingredients (alphabetical)
    {
      name: 'bioperine_mg',
      label: 'Bioperine',
      placeholder: '5',
      unit: 'mg',
      description: 'Black pepper extract for absorption',
      section: 'Additional Ingredients'
    },
    {
      name: 'chromium_mcg',
      label: 'Chromium',
      placeholder: '200',
      unit: 'mcg',
      description: 'Chromium for blood sugar control',
      section: 'Additional Ingredients'
    }
  ],

  'appetite-suppressant': [
    // Basic Information (alphabetical)
    {
      name: 'serving_size_g',
      label: 'Serving Size',
      placeholder: '2',
      unit: 'g',
      step: '0.1',
      description: 'Serving size in grams',
      required: true,
      section: 'Basic Information'
    },
    {
      name: 'servings_per_container',
      label: 'Servings Per Container',
      placeholder: '60',
      unit: 'servings',
      description: 'Number of servings per container',
      required: true,
      section: 'Basic Information'
    },
    {
      name: 'price',
      label: 'Price',
      placeholder: '29.99',
      unit: '$',
      step: '0.01',
      description: 'Product price for bang for your buck calculations',
      required: true,
      section: 'Basic Information'
    },

    // Appetite Control Ingredients (alphabetical)
    {
      name: 'glucomannan_mg',
      label: 'Glucomannan',
      placeholder: '2000',
      unit: 'mg',
      description: 'Glucomannan for appetite suppression',
      section: 'Appetite Control Ingredients'
    },
    {
      name: 'garcinia_cambogia_mg',
      label: 'Garcinia Cambogia',
      placeholder: '1000',
      unit: 'mg',
      description: 'Garcinia Cambogia for appetite control',
      section: 'Appetite Control Ingredients'
    },
    {
      name: 'saffron_extract_mg',
      label: 'Saffron Extract',
      placeholder: '30',
      unit: 'mg',
      description: 'Saffron extract for mood and appetite',
      section: 'Appetite Control Ingredients'
    },

    // Additional Ingredients (alphabetical)
    {
      name: 'bioperine_mg',
      label: 'Bioperine',
      placeholder: '5',
      unit: 'mg',
      description: 'Black pepper extract for absorption',
      section: 'Additional Ingredients'
    },
    {
      name: 'chromium_mcg',
      label: 'Chromium',
      placeholder: '200',
      unit: 'mcg',
      description: 'Chromium for blood sugar control',
      section: 'Additional Ingredients'
    }
  ],

  creatine: [
    // Basic Information (alphabetical)
    {
      name: 'creatine_type_name',
      label: 'Creatine Type',
      placeholder: '',
      unit: '',
      required: true,
      description: 'Type of creatine used in the product',
      section: 'Basic Information'
    },
    {
      name: 'flavors',
      label: 'Flavors',
      placeholder: 'Unflavored',
      unit: '',
      required: false,
      description: 'Available flavors for the product',
      section: 'Basic Information'
    },
    {
      name: 'serving_size_g',
      label: 'Serving Size',
      placeholder: '5',
      unit: 'g',
      step: '0.1',
      description: 'Serving size in grams',
      required: true,
      section: 'Basic Information'
    },
    {
      name: 'servings_per_container',
      label: 'Servings Per Container',
      placeholder: '100',
      unit: 'servings',
      description: 'Number of servings per container',
      required: true,
      section: 'Basic Information'
    },
    {
      name: 'lab_verified_creatine_content_g',
      label: 'Lab Verified Creatine Content',
      placeholder: '5',
      unit: 'g',
      step: '0.1',
      description: 'Lab-verified creatine content per serving',
      required: false,
      section: 'Lab Verification'
    }
  ]
};

// Creatine types for dropdown
export const creatineTypes = [
  { value: 'Creatine Monohydrate', label: 'Creatine Monohydrate (5g daily)' },
  { value: 'Creatine Anhydrous', label: 'Creatine Anhydrous (4.5g daily)' },
  { value: 'Creatine Phosphate', label: 'Creatine Phosphate (5g daily)' },
  { value: 'Free Acid Creatine', label: 'Free Acid Creatine (4.5g daily)' },
  { value: 'Creatine Hydrochloride', label: 'Creatine Hydrochloride (2g daily)' },
  { value: 'Creatine Citrate', label: 'Creatine Citrate (5g daily)' },
  { value: 'Creatine Malate', label: 'Creatine Malate (5g daily)' },
  { value: 'Creatine Pyruvate', label: 'Creatine Pyruvate (5g daily)' },
  { value: 'Creatine Nitrate', label: 'Creatine Nitrate (3g daily)' },
  { value: 'Creatine Gluconate', label: 'Creatine Gluconate (5g daily)' },
  { value: 'Creatine Orotate', label: 'Creatine Orotate (5g daily)' },
  { value: 'Creatine Alpha-Ketoglutarate', label: 'Creatine Alpha-Ketoglutarate (5g daily)' },
  { value: 'Creatine Taurinate', label: 'Creatine Taurinate (5g daily)' },
  { value: 'Creatine Ethyl Ester', label: 'Creatine Ethyl Ester (3g daily)' },
  { value: 'Creatine Ethyl Ester Malate', label: 'Creatine Ethyl Ester Malate (3g daily)' },
  { value: 'Creatine Magnesium Chelate', label: 'Creatine Magnesium Chelate (5g daily)' },
  { value: 'Micronized Creatine Monohydrate', label: 'Micronized Creatine Monohydrate (5g daily)' },
  { value: 'Buffered Creatine', label: 'Buffered Creatine (3g daily)' },
  { value: 'Crea-Trona', label: 'Crea-Trona (3g daily)' },
  { value: 'Effervescent Creatine', label: 'Effervescent Creatine (5g daily)' },
  { value: 'Liquid Creatine', label: 'Liquid Creatine (5g daily)' },
  { value: 'Creatinol-O-Phosphate', label: 'Creatinol-O-Phosphate (5g daily)' },
  { value: 'Creapure', label: 'Creapure (5g daily)' }
];

// Additional ingredients that can be added to any category
export const additionalIngredients: IngredientField[] = [
  {
    name: 'bioperine_mg',
    label: 'Bioperine',
    placeholder: '5',
    unit: 'mg',
    description: 'Black pepper extract for absorption enhancement'
  },
  {
    name: 'lecithin_mg',
    label: 'Lecithin',
    placeholder: '100',
    unit: 'mg',
    description: 'Lecithin for emulsification and absorption'
  },
  {
    name: 'silica_mg',
    label: 'Silica',
    placeholder: '10',
    unit: 'mg',
    description: 'Silica as anti-caking agent'
  }
];

// Helper function to get ingredient by name
export function getIngredientByName(name: string): IngredientField | undefined {
  for (const category of Object.values(categoryIngredients)) {
    const ingredient = category.find(ing => ing.name === name);
    if (ingredient) return ingredient;
  }
  return additionalIngredients.find(ing => ing.name === name);
}