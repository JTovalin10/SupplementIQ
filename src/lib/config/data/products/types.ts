// Product-focused ingredient system types
export interface ProductIngredient {
  name: string;
  label: string;
  placeholder: string;
  unit: string;
  description: string;
  // Product-specific dosage recommendations
  minDailyDosage?: number; // Minimum effective daily dosage for this product type
  maxDailyDosage?: number; // Maximum safe daily dosage for this product type
  dangerousDosage?: number; // Dosage considered dangerous/unsafe for this product type
  dosageNotes?: string; // Additional scientific notes about dosage in this product context
  cautions?: string; // Safety warnings and contraindications (general warnings)
  precaution_people?: string[]; // Specific warnings for people with preconditions (array for easier parsing)
  dosage_citation?: string; // URL to scientific source for dosage
  cautions_citation?: string; // URL to scientific source for cautions
  // Additional properties
  required?: boolean;
  step?: string;
  type?: 'number' | 'text' | 'select' | 'boolean';
  options?: ProductIngredientOption[];
}

export interface ProductIngredientOption {
  value: string;
  label: string;
  minDailyDosage?: number;
  maxDailyDosage?: number;
  dangerousDosage?: number;
  dosageNotes?: string;
  cautions?: string;
  precaution_people?: string[];
  dosage_citation?: string;
  cautions_citation?: string;
}

export interface ProductCategory {
  name: string;
  label: string;
  description: string;
  ingredients: ProductIngredient[];
}

export interface ProductDosageRating {
  score: number; // 0-100
  rating: 'Excellent' | 'Good' | 'Fair' | 'Poor' | 'Dangerous';
  message: string;
}

// Product categories based on actual database schema
export type ProductType = 
  | 'protein'
  | 'pre-workout'
  | 'non-stim-pre-workout'
  | 'energy-drink'
  | 'bcaa'
  | 'eaa'
  | 'fat-burner'
  | 'appetite-suppressant'
  | 'creatine';
