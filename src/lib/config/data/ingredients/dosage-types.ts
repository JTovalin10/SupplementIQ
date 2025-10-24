// =================================================================
// INGREDIENT DOSAGE CONFIGURATION TYPES
// TypeScript interfaces matching the database schema
// =================================================================

// Enum for ingredient types (matches database enum)
export type IngredientType = 
  | 'creatine'
  | 'vitamin_mineral' 
  | 'preworkout'
  | 'non_stim_preworkout'
  | 'energy_drink'
  | 'amino_acid'
  | 'fat_burner'
  | 'appetite_suppressant'
  | 'protein'
  | 'bcaa'
  | 'eaa'
  | 'stimulant'
  | 'nootropic'
  | 'adaptogen'
  | 'mineral'
  | 'vitamin'
  | 'herb'
  | 'enzyme'
  | 'probiotic'
  | 'other';

// Enum for dosage units (matches database enum)
export type DosageUnit = 
  | 'mg'
  | 'g' 
  | 'mcg'
  | 'IU'
  | 'ml'
  | 'tsp'
  | 'tbsp'
  | 'capsule'
  | 'tablet'
  | 'serving';

// Main interface for ingredient dosage configuration
export interface IngredientDosageConfig {
  id?: number;
  ingredient_name: string;
  ingredient_type: IngredientType;
  category?: string;
  dosage_unit: DosageUnit;
  
  // Dosage recommendations
  min_daily_dosage?: number;
  max_daily_dosage?: number;
  dangerous_dosage?: number;
  
  // Additional information
  dosage_notes?: string;
  cautions?: string;
  precaution_people?: string[]; // Array of medical conditions
  dosage_citation?: string;
  cautions_citation?: string;
  bioavailability?: number; // Percentage bioavailability
  
  // Metadata
  created_at?: string;
  updated_at?: string;
}

// Interface for creating new dosage configurations
export interface CreateIngredientDosageConfig {
  ingredient_name: string;
  ingredient_type: IngredientType;
  category?: string;
  dosage_unit: DosageUnit;
  min_daily_dosage?: number;
  max_daily_dosage?: number;
  dangerous_dosage?: number;
  dosage_notes?: string;
  cautions?: string;
  precaution_people?: string[];
  dosage_citation?: string;
  cautions_citation?: string;
  bioavailability?: number;
}

// Interface for updating dosage configurations
export interface UpdateIngredientDosageConfig {
  ingredient_name?: string;
  ingredient_type?: IngredientType;
  category?: string;
  dosage_unit?: DosageUnit;
  min_daily_dosage?: number;
  max_daily_dosage?: number;
  dangerous_dosage?: number;
  dosage_notes?: string;
  cautions?: string;
  precaution_people?: string[];
  dosage_citation?: string;
  cautions_citation?: string;
  bioavailability?: number;
}

// Query parameters for filtering dosage configurations
export interface DosageConfigQuery {
  ingredient_name?: string;
  ingredient_type?: IngredientType;
  category?: string;
  dosage_unit?: DosageUnit;
  min_daily_dosage_min?: number;
  min_daily_dosage_max?: number;
  max_daily_dosage_min?: number;
  max_daily_dosage_max?: number;
  dangerous_dosage_min?: number;
  dangerous_dosage_max?: number;
  has_precautions?: boolean;
  bioavailability_min?: number;
  bioavailability_max?: number;
}

// Response type for dosage calculation
export interface DosageCalculationResult {
  ingredient_name: string;
  ingredient_type: IngredientType;
  dosage_unit: DosageUnit;
  input_dosage: number;
  min_daily_dosage?: number;
  max_daily_dosage?: number;
  dangerous_dosage?: number;
  rating: 'Excellent' | 'Good' | 'Fair' | 'Poor' | 'Dangerous';
  score: number; // 0-100
  message: string;
  cautions?: string;
  precaution_people?: string[];
  dosage_notes?: string;
  dosage_citation?: string;
  cautions_citation?: string;
}

// Constants for ingredient type mappings
export const INGREDIENT_TYPE_MAPPINGS: Record<string, IngredientType> = {
  'creatine_dosages': 'creatine',
  'vitamin_mineral_dosages': 'vitamin_mineral',
  'preworkout_dosages': 'preworkout',
  'non_stim_preworkout_dosages': 'non_stim_preworkout',
  'energy_drink_dosages': 'energy_drink',
  'amino_acid_dosages': 'amino_acid',
  'fat_burner_dosages': 'fat_burner',
  'appetite_suppressant_dosages': 'appetite_suppressant',
  'protein_dosages': 'protein',
  'bcaa_dosages': 'bcaa',
  'eaa_dosages': 'eaa',
  'stimulant_dosages': 'stimulant',
  'nootropic_dosages': 'nootropic',
  'adaptogen_dosages': 'adaptogen',
  'mineral_dosages': 'mineral',
  'vitamin_dosages': 'vitamin',
  'herb_dosages': 'herb',
  'enzyme_dosages': 'enzyme',
  'probiotic_dosages': 'probiotic',
  'other_dosages': 'other'
};

// Helper function to validate ingredient type
export function isValidIngredientType(type: string): type is IngredientType {
  const validTypes: IngredientType[] = [
    'creatine', 'vitamin_mineral', 'preworkout', 'non_stim_preworkout',
    'energy_drink', 'amino_acid', 'fat_burner', 'appetite_suppressant',
    'protein', 'bcaa', 'eaa', 'stimulant', 'nootropic', 'adaptogen',
    'mineral', 'vitamin', 'herb', 'enzyme', 'probiotic', 'other'
  ];
  return validTypes.includes(type as IngredientType);
}

// Helper function to validate dosage unit
export function isValidDosageUnit(unit: string): unit is DosageUnit {
  const validUnits: DosageUnit[] = [
    'mg', 'g', 'mcg', 'IU', 'ml', 'tsp', 'tbsp', 'capsule', 'tablet', 'serving'
  ];
  return validUnits.includes(unit as DosageUnit);
}
