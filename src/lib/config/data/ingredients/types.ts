// Base types and interfaces for ingredient configuration
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

export interface SupplementInfo {
  name: string;
  label: string;
  placeholder: string;
  unit: string;
  description: string;
  section: string;
  // Dosage recommendations based on scientific research
  minDailyDosage?: number; // Minimum effective daily dosage
  maxDailyDosage?: number; // Maximum safe daily dosage
  dangerousDosage?: number; // Dosage considered dangerous/unsafe
  dosageNotes?: string; // Additional scientific notes about dosage
  cautions?: string; // Safety warnings and contraindications (general warnings)
  precaution_people?: string[]; // Specific warnings for people with preconditions (array for easier parsing)
  dosage_citation?: string; // URL to scientific source for dosage
  cautions_citation?: string; // URL to scientific source for cautions
  // Additional properties
  required?: boolean;
  step?: string;
  type?: 'number' | 'text' | 'select' | 'boolean';
  options?: SupplementOption[];
}

export interface SupplementOption {
  value: string;
  label: string;
  minDailyDosage?: number;
  maxDailyDosage?: number;
  dangerousDosage?: number;
  dosageNotes?: string;
  cautions?: string; // Safety warnings and contraindications (general warnings)
  precaution_people?: string[]; // Specific warnings for people with preconditions (array for easier parsing)
  dosage_citation?: string;
  cautions_citation?: string;
}

export interface CategoryIngredients {
  [key: string]: IngredientField[];
}

export interface CategorySupplements {
  [key: string]: SupplementInfo[];
}

// Dosage rating calculation based on scientific recommendations
export interface DosageRating {
  score: number; // 0-100 score
  rating: 'Excellent' | 'Good' | 'Fair' | 'Poor' | 'Dangerous';
  message: string;
}
