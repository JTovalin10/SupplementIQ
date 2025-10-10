/**
 * Ingredient-related type definitions
 * Defines interfaces for ingredients, ingredient types, and product-ingredient relationships
 */

export interface Ingredient {
  id: string;
  name: string;
  description?: string;
  type_id: string;
  effectiveness_score?: number;
  safety_score?: number;
  popularity_score?: number;
  created_at: string;
  updated_at: string;
  ingredient_types?: {
    name: string;
  };
}

export interface IngredientType {
  id: string;
  name: string;
  description?: string;
  created_at: string;
}

export interface ProductIngredient {
  id: string;
  product_id: string;
  ingredient_id: string;
  amount: number;
  unit: string;
  ingredients?: {
    id: string;
    name: string;
    description?: string;
    effectiveness_score?: number;
    safety_score?: number;
    ingredient_types?: {
      name: string;
    };
  };
}

/**
 * Filter options for ingredient queries
 */
export interface IngredientFilters {
  type?: string;
  search?: string;
  page?: number;
  limit?: number;
}
