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
}

export interface CategoryIngredients {
  [key: string]: IngredientField[];
}

export const categoryIngredients: CategoryIngredients = {
  protein: [
    // Note: Protein table only has protein_claim_g, effective_protein_g, and protein_sources (JSONB)
    // Individual protein types are not separate fields in the database
    // These would be stored in the protein_sources JSONB field
  ],

  'pre-workout': [
    {
      name: 'serving_scoops',
      label: 'Serving Scoops',
      placeholder: '2',
      unit: 'scoops',
      step: '0.5',
      description: 'Number of scoops per serving'
    },
    {
      name: 'serving_g',
      label: 'Serving Size',
      placeholder: '30.5',
      unit: 'g',
      step: '0.1',
      description: 'Serving size in grams'
    },
    {
      name: 'sugar_g',
      label: 'Sugar',
      placeholder: '0',
      unit: 'g',
      step: '0.1',
      description: 'Sugar content per serving'
    },
    {
      name: 'l_citrulline_mg',
      label: 'L-Citrulline',
      placeholder: '9000',
      unit: 'mg',
      description: 'L-Citrulline for nitric oxide production'
    },
    {
      name: 'creatine_monohydrate_mg',
      label: 'Creatine Monohydrate',
      placeholder: '5000',
      unit: 'mg',
      description: 'Creatine monohydrate for strength and power'
    },
    {
      name: 'glycerpump_mg',
      label: 'GlycerPump',
      placeholder: '3000',
      unit: 'mg',
      description: 'Glycerol for muscle fullness'
    },
    {
      name: 'betaine_anhydrous_mg',
      label: 'Betaine Anhydrous',
      placeholder: '2500',
      unit: 'mg',
      description: 'Betaine for power and strength'
    },
    {
      name: 'agmatine_sulfate_mg',
      label: 'Agmatine Sulfate',
      placeholder: '1000',
      unit: 'mg',
      description: 'Agmatine for nitric oxide and pumps'
    },
    {
      name: 'l_tyrosine_mg',
      label: 'L-Tyrosine',
      placeholder: '1500',
      unit: 'mg',
      description: 'L-Tyrosine for cognitive enhancement'
    },
    {
      name: 'caffeine_anhydrous_mg',
      label: 'Caffeine Anhydrous',
      placeholder: '350',
      unit: 'mg',
      description: 'Caffeine for energy and focus'
    },
    {
      name: 'n_phenethyl_dimethylamine_citrate_mg',
      label: 'N-Phenethyl Dimethylamine Citrate',
      placeholder: '350',
      unit: 'mg',
      description: 'DMHA for energy and focus'
    },
    {
      name: 'kanna_extract_mg',
      label: 'Kanna Extract',
      placeholder: '500',
      unit: 'mg',
      description: 'Kanna extract for mood enhancement'
    },
    {
      name: 'huperzine_a_mcg',
      label: 'Huperzine A',
      placeholder: '400',
      unit: 'mcg',
      description: 'Huperzine A for cognitive function'
    },
    {
      name: 'bioperine_mg',
      label: 'Bioperine',
      placeholder: '5',
      unit: 'mg',
      description: 'Black pepper extract for absorption'
    }
  ],

  'non-stim-pre-workout': [
    {
      name: 'serving_scoops',
      label: 'Serving Scoops',
      placeholder: '2',
      unit: 'scoops',
      step: '0.5',
      description: 'Number of scoops per serving'
    },
    {
      name: 'serving_g',
      label: 'Serving Size',
      placeholder: '40.2',
      unit: 'g',
      step: '0.1',
      description: 'Serving size in grams'
    },
    {
      name: 'calories',
      label: 'Calories',
      placeholder: '20',
      unit: 'cal',
      description: 'Calories per serving'
    },
    {
      name: 'total_carbohydrate_g',
      label: 'Total Carbohydrate',
      placeholder: '4',
      unit: 'g',
      description: 'Total carbohydrates per serving'
    },
    {
      name: 'niacin_mg',
      label: 'Niacin',
      placeholder: '32',
      unit: 'mg',
      description: 'Niacin (Vitamin B3) content'
    },
    {
      name: 'vitamin_b6_mg',
      label: 'Vitamin B6',
      placeholder: '20',
      unit: 'mg',
      description: 'Pyridoxine content'
    },
    {
      name: 'vitamin_b12_mcg',
      label: 'Vitamin B12',
      placeholder: '250',
      unit: 'mcg',
      description: 'Cobalamin content'
    },
    {
      name: 'magnesium_mg',
      label: 'Magnesium',
      placeholder: '50',
      unit: 'mg',
      description: 'Magnesium content'
    },
    {
      name: 'sodium_mg',
      label: 'Sodium',
      placeholder: '420',
      unit: 'mg',
      description: 'Sodium content'
    },
    {
      name: 'potassium_mg',
      label: 'Potassium',
      placeholder: '420',
      unit: 'mg',
      description: 'Potassium content'
    },
    {
      name: 'l_citrulline_mg',
      label: 'L-Citrulline',
      placeholder: '10000',
      unit: 'mg',
      description: 'L-Citrulline for nitric oxide'
    },
    {
      name: 'creatine_monohydrate_mg',
      label: 'Creatine Monohydrate',
      placeholder: '5000',
      unit: 'mg',
      description: 'Creatine monohydrate for strength and power'
    },
    {
      name: 'betaine_anhydrous_mg',
      label: 'Betaine Anhydrous',
      placeholder: '4000',
      unit: 'mg',
      description: 'Betaine for power output'
    },
    {
      name: 'glycerol_powder_mg',
      label: 'Glycerol Powder',
      placeholder: '4000',
      unit: 'mg',
      description: 'Glycerol for muscle fullness'
    },
    {
      name: 'malic_acid_mg',
      label: 'Malic Acid',
      placeholder: '3000',
      unit: 'mg',
      description: 'Malic acid for energy production'
    },
    {
      name: 'taurine_mg',
      label: 'Taurine',
      placeholder: '3000',
      unit: 'mg',
      description: 'Taurine for hydration and pumps'
    },
    {
      name: 'sodium_nitrate_mg',
      label: 'Sodium Nitrate',
      placeholder: '1500',
      unit: 'mg',
      description: 'Sodium nitrate for nitric oxide'
    },
    {
      name: 'agmatine_sulfate_mg',
      label: 'Agmatine Sulfate',
      placeholder: '1000',
      unit: 'mg',
      description: 'Agmatine for pumps and strength'
    },
    {
      name: 'vasodrive_ap_mg',
      label: 'Vasodrive AP',
      placeholder: '508',
      unit: 'mg',
      description: 'Vasodrive AP for nitric oxide'
    }
  ],

  'energy-drink': [
    {
      name: 'serving_size_fl_oz',
      label: 'Serving Size',
      placeholder: '16',
      unit: 'fl oz',
      step: '0.1',
      description: 'Serving size in fluid ounces'
    },
    {
      name: 'sugar_g',
      label: 'Sugar',
      placeholder: '0',
      unit: 'g',
      step: '0.1',
      description: 'Sugar content per serving'
    },
    {
      name: 'caffeine_mg',
      label: 'Caffeine',
      placeholder: '200',
      unit: 'mg',
      description: 'Caffeine content for energy'
    },
    {
      name: 'n_acetyl_l_tyrosine_mg',
      label: 'N-Acetyl L-Tyrosine',
      placeholder: '1000',
      unit: 'mg',
      description: 'NALT for cognitive enhancement'
    },
    {
      name: 'alpha_gpc_mg',
      label: 'Alpha GPC',
      placeholder: '400',
      unit: 'mg',
      description: 'Alpha-GPC for choline support'
    },
    {
      name: 'l_theanine_mg',
      label: 'L-Theanine',
      placeholder: '100',
      unit: 'mg',
      description: 'L-Theanine for calm focus'
    },
    {
      name: 'huperzine_a_mcg',
      label: 'Huperzine A',
      placeholder: '200',
      unit: 'mcg',
      description: 'Huperzine A for cognitive function'
    },
    {
      name: 'uridine_monophosphate_mg',
      label: 'Uridine Monophosphate',
      placeholder: '200',
      unit: 'mg',
      description: 'Uridine for brain health'
    },
    {
      name: 'saffron_extract_mg',
      label: 'Saffron Extract',
      placeholder: '15',
      unit: 'mg',
      description: 'Saffron extract for mood'
    },
    {
      name: 'vitamin_c_mg',
      label: 'Vitamin C',
      placeholder: '90',
      unit: 'mg',
      description: 'Ascorbic acid content'
    },
    {
      name: 'niacin_b3_mg',
      label: 'Niacin B3',
      placeholder: '16',
      unit: 'mg',
      description: 'Niacin for energy metabolism'
    },
    {
      name: 'vitamin_b6_mg',
      label: 'Vitamin B6',
      placeholder: '5',
      unit: 'mg',
      description: 'Pyridoxine for metabolism'
    },
    {
      name: 'vitamin_b12_mcg',
      label: 'Vitamin B12',
      placeholder: '5',
      unit: 'mcg',
      description: 'Cobalamin for energy'
    },
    {
      name: 'pantothenic_acid_b5_mg',
      label: 'Pantothenic Acid B5',
      placeholder: '5',
      unit: 'mg',
      description: 'Pantothenic acid for metabolism'
    }
  ],

  bcaa: [
    {
      name: 'total_eaas_mg',
      label: 'Total EAAs',
      placeholder: '10000',
      unit: 'mg',
      description: 'Total essential amino acids'
    },
    {
      name: 'l_leucine_mg',
      label: 'L-Leucine',
      placeholder: '3000',
      unit: 'mg',
      description: 'L-Leucine for muscle protein synthesis'
    },
    {
      name: 'l_isoleucine_mg',
      label: 'L-Isoleucine',
      placeholder: '1500',
      unit: 'mg',
      description: 'L-Isoleucine for energy and recovery'
    },
    {
      name: 'l_valine_mg',
      label: 'L-Valine',
      placeholder: '1500',
      unit: 'mg',
      description: 'L-Valine for muscle metabolism'
    },
    {
      name: 'l_lysine_hcl_mg',
      label: 'L-Lysine HCL',
      placeholder: '1000',
      unit: 'mg',
      description: 'L-Lysine for protein synthesis'
    },
    {
      name: 'l_threonine_mg',
      label: 'L-Threonine',
      placeholder: '1000',
      unit: 'mg',
      description: 'L-Threonine for protein synthesis'
    },
    {
      name: 'l_phenylalanine_mg',
      label: 'L-Phenylalanine',
      placeholder: '500',
      unit: 'mg',
      description: 'L-Phenylalanine for neurotransmitter synthesis'
    },
    {
      name: 'l_tryptophan_mg',
      label: 'L-Tryptophan',
      placeholder: '150',
      unit: 'mg',
      description: 'L-Tryptophan for serotonin synthesis'
    },
    {
      name: 'l_histidine_hcl_mg',
      label: 'L-Histidine HCL',
      placeholder: '500',
      unit: 'mg',
      description: 'L-Histidine for protein synthesis'
    },
    {
      name: 'l_methionine_mg',
      label: 'L-Methionine',
      placeholder: '200',
      unit: 'mg',
      description: 'L-Methionine for protein synthesis'
    },
    {
      name: 'betaine_anhydrous_mg',
      label: 'Betaine Anhydrous',
      placeholder: '1250',
      unit: 'mg',
      description: 'Betaine for power output'
    },
    {
      name: 'coconut_water_powder_mg',
      label: 'Coconut Water Powder',
      placeholder: '250',
      unit: 'mg',
      description: 'Coconut water powder for electrolytes'
    },
    {
      name: 'astragin_mg',
      label: 'Astragin',
      placeholder: '50',
      unit: 'mg',
      description: 'Astragin for absorption enhancement'
    }
  ],

  eaa: [
    {
      name: 'total_eaas_mg',
      label: 'Total EAAs',
      placeholder: '10000',
      unit: 'mg',
      description: 'Total essential amino acids'
    },
    {
      name: 'l_leucine_mg',
      label: 'L-Leucine',
      placeholder: '3000',
      unit: 'mg',
      description: 'L-Leucine for muscle protein synthesis'
    },
    {
      name: 'l_isoleucine_mg',
      label: 'L-Isoleucine',
      placeholder: '1500',
      unit: 'mg',
      description: 'L-Isoleucine for energy and recovery'
    },
    {
      name: 'l_valine_mg',
      label: 'L-Valine',
      placeholder: '1500',
      unit: 'mg',
      description: 'L-Valine for muscle metabolism'
    },
    {
      name: 'l_lysine_hcl_mg',
      label: 'L-Lysine HCL',
      placeholder: '1000',
      unit: 'mg',
      description: 'L-Lysine for protein synthesis'
    },
    {
      name: 'l_threonine_mg',
      label: 'L-Threonine',
      placeholder: '1000',
      unit: 'mg',
      description: 'L-Threonine for protein synthesis'
    },
    {
      name: 'l_phenylalanine_mg',
      label: 'L-Phenylalanine',
      placeholder: '500',
      unit: 'mg',
      description: 'L-Phenylalanine for neurotransmitter synthesis'
    },
    {
      name: 'l_tryptophan_mg',
      label: 'L-Tryptophan',
      placeholder: '150',
      unit: 'mg',
      description: 'L-Tryptophan for serotonin synthesis'
    },
    {
      name: 'l_histidine_hcl_mg',
      label: 'L-Histidine HCL',
      placeholder: '500',
      unit: 'mg',
      description: 'L-Histidine for protein synthesis'
    },
    {
      name: 'l_methionine_mg',
      label: 'L-Methionine',
      placeholder: '200',
      unit: 'mg',
      description: 'L-Methionine for protein synthesis'
    },
    {
      name: 'betaine_anhydrous_mg',
      label: 'Betaine Anhydrous',
      placeholder: '1250',
      unit: 'mg',
      description: 'Betaine for power output'
    },
    {
      name: 'coconut_water_powder_mg',
      label: 'Coconut Water Powder',
      placeholder: '250',
      unit: 'mg',
      description: 'Coconut water powder for electrolytes'
    },
    {
      name: 'astragin_mg',
      label: 'Astragin',
      placeholder: '50',
      unit: 'mg',
      description: 'Astragin for absorption enhancement'
    }
  ],

  'fat-burner': [
    {
      name: 'stimulant_based',
      label: 'Stimulant Based',
      placeholder: '',
      unit: '',
      description: 'Whether the product is stimulant-based or stim-free'
    },
    {
      name: 'l_carnitine_l_tartrate_mg',
      label: 'L-Carnitine L-Tartrate',
      placeholder: '1000',
      unit: 'mg',
      description: 'L-Carnitine for fat transport'
    },
    {
      name: 'green_tea_extract_mg',
      label: 'Green Tea Extract',
      placeholder: '400',
      unit: 'mg',
      description: 'EGCG for fat oxidation'
    },
    {
      name: 'capsimax_mg',
      label: 'Capsimax',
      placeholder: '100',
      unit: 'mg',
      description: 'Capsimax for thermogenesis'
    },
    {
      name: 'grains_of_paradise_mg',
      label: 'Grains of Paradise',
      placeholder: '50',
      unit: 'mg',
      description: 'Grains of paradise for fat burning'
    },
    {
      name: 'ksm66_ashwagandha_mg',
      label: 'KSM-66 Ashwagandha',
      placeholder: '600',
      unit: 'mg',
      description: 'Ashwagandha for stress management'
    },
    {
      name: 'kelp_extract_mcg',
      label: 'Kelp Extract',
      placeholder: '150',
      unit: 'mcg',
      description: 'Iodine from kelp for thyroid function'
    },
    {
      name: 'selenium_mcg',
      label: 'Selenium',
      placeholder: '200',
      unit: 'mcg',
      description: 'Selenium for thyroid function'
    },
    {
      name: 'zinc_picolinate_mg',
      label: 'Zinc Picolinate',
      placeholder: '15',
      unit: 'mg',
      description: 'Zinc for metabolism support'
    },
    {
      name: 'five_htp_mg',
      label: '5-HTP',
      placeholder: '100',
      unit: 'mg',
      description: '5-HTP for appetite suppression'
    },
    {
      name: 'caffeine_anhydrous_mg',
      label: 'Caffeine Anhydrous',
      placeholder: '200',
      unit: 'mg',
      description: 'Caffeine for thermogenesis and energy'
    },
    {
      name: 'halostachine_mg',
      label: 'Halostachine',
      placeholder: '50',
      unit: 'mg',
      description: 'Halostachine for fat burning'
    },
    {
      name: 'rauwolscine_mcg',
      label: 'Rauwolscine',
      placeholder: '3',
      unit: 'mcg',
      description: 'Rauwolscine for fat burning'
    },
    {
      name: 'bioperine_mg',
      label: 'Bioperine',
      placeholder: '5',
      unit: 'mg',
      description: 'Black pepper extract for absorption'
    }
  ],

  'appetite-suppressant': [
    {
      name: 'five_htp_mg',
      label: '5-HTP',
      placeholder: '100',
      unit: 'mg',
      description: '5-HTP for serotonin and appetite control'
    },
    {
      name: 'ksm66_ashwagandha_mg',
      label: 'KSM-66 Ashwagandha',
      placeholder: '600',
      unit: 'mg',
      description: 'Ashwagandha for stress and cortisol management'
    },
    {
      name: 'saffron_extract_mg',
      label: 'Saffron Extract',
      placeholder: '15',
      unit: 'mg',
      description: 'Saffron extract for mood and appetite'
    }
  ],

  creatine: [
    {
      name: 'creatine_type_name',
      label: 'Creatine Type',
      placeholder: '',
      unit: '',
      required: true,
      description: 'Type of creatine used in the product'
    },
    {
      name: 'serving_size_g',
      label: 'Serving Size',
      placeholder: '5',
      unit: 'g',
      step: '0.1',
      description: 'Serving size in grams'
    },
    {
      name: 'servings_per_container',
      label: 'Servings Per Container',
      placeholder: '100',
      unit: 'servings',
      description: 'Number of servings per container'
    }
  ]
};

// Special fields that need custom handling
export const specialFields = {
  protein: [
    {
      name: 'protein_claim_g',
      label: 'Protein Claim',
      placeholder: '25',
      unit: 'g',
      required: true,
      step: '0.1',
      description: 'Amount of protein claimed on the label'
    },
    {
      name: 'effective_protein_g',
      label: 'Effective Protein',
      placeholder: '24',
      unit: 'g',
      step: '0.1',
      description: 'Bioavailable protein content (if known)'
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
  { value: 'Micronized Creatine', label: 'Micronized Creatine (5g daily)' },
  { value: 'Buffered Creatine', label: 'Buffered Creatine (3g daily)' },
  { value: 'Crea-Trona', label: 'Crea-Trona (3g daily)' },
  { value: 'Effervescent Creatine', label: 'Effervescent Creatine (5g daily)' },
  { value: 'Liquid Creatine', label: 'Liquid Creatine (5g daily)' },
  { value: 'Creatinol-O-Phosphate', label: 'Creatinol-O-Phosphate (5g daily)' },
  { value: 'Creapure', label: 'Creapure (5g daily)' }
];

// Additional ingredients that can be added to any category
// These are common ingredients not in the main database fields but often found in products
export const additionalIngredients: IngredientField[] = [
  {
    name: 'beta_alanine_mg',
    label: 'Beta-Alanine',
    placeholder: '3200',
    unit: 'mg',
    description: 'Beta-alanine for muscle endurance'
  },
  {
    name: 'taurine_mg',
    label: 'Taurine',
    placeholder: '2000',
    unit: 'mg',
    description: 'Taurine for hydration and pumps'
  },
  {
    name: 'l_glutamine_mg',
    label: 'L-Glutamine',
    placeholder: '5000',
    unit: 'mg',
    description: 'L-Glutamine for recovery'
  },
  {
    name: 'l_arginine_mg',
    label: 'L-Arginine',
    placeholder: '3000',
    unit: 'mg',
    description: 'L-Arginine for nitric oxide'
  },
  {
    name: 'citrulline_malate_mg',
    label: 'Citrulline Malate',
    placeholder: '6000',
    unit: 'mg',
    description: 'Citrulline malate for pumps'
  },
  {
    name: 'alpha_lipoic_acid_mg',
    label: 'Alpha Lipoic Acid',
    placeholder: '300',
    unit: 'mg',
    description: 'Alpha lipoic acid for antioxidant support'
  },
  {
    name: 'coenzyme_q10_mg',
    label: 'Coenzyme Q10',
    placeholder: '100',
    unit: 'mg',
    description: 'CoQ10 for cellular energy'
  },
  {
    name: 'rhodiola_rosea_mg',
    label: 'Rhodiola Rosea',
    placeholder: '400',
    unit: 'mg',
    description: 'Rhodiola for stress adaptation'
  },
  {
    name: 'panax_ginseng_mg',
    label: 'Panax Ginseng',
    placeholder: '200',
    unit: 'mg',
    description: 'Panax ginseng for energy'
  },
  {
    name: 'maca_root_mg',
    label: 'Maca Root',
    placeholder: '1000',
    unit: 'mg',
    description: 'Maca root for energy and libido'
  }
];

// Helper function to get all ingredients for a category
export function getAllIngredientsForCategory(category: string): IngredientField[] {
  const baseIngredients = categoryIngredients[category] || [];
  return [...baseIngredients, ...additionalIngredients];
}

// Helper function to get ingredient by name
export function getIngredientByName(name: string): IngredientField | undefined {
  for (const category of Object.values(categoryIngredients)) {
    const ingredient = category.find(ing => ing.name === name);
    if (ingredient) return ingredient;
  }
  return additionalIngredients.find(ing => ing.name === name);
}
