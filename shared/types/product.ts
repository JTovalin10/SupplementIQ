/**
 * Product-related type definitions
 * Defines interfaces for products, categories, and product-specific details
 */

import { Contribution } from './contribution';
import { ProductIngredient } from './ingredient';
import { AminoAcidDetails, EnergyDrinkDetails, FatBurnerDetails, PreworkoutDetails, ProteinDetails } from './product-details';

export interface Product {
  id: string;
  name: string;
  description?: string;
  brand?: string;
  price?: number;
  image_url?: string;
  category_id: string;
  created_by: string;
  rating?: number;
  transparency_score?: number;
  value_for_money?: number;
  created_at: string;
  updated_at: string;
  categories?: {
    name: string;
  };
  ingredients?: ProductIngredient[];
  contributions?: Contribution[];
  // Category-specific details
  preworkout_details?: PreworkoutDetails;
  energy_drink_details?: EnergyDrinkDetails;
  protein_details?: ProteinDetails;
  amino_acid_details?: AminoAcidDetails;
  fat_burner_details?: FatBurnerDetails;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  created_at: string;
}

/**
 * Request type for creating a new product
 */
export interface CreateProductRequest {
  name: string;
  description?: string;
  brand?: string;
  price?: number;
  image_url?: string;
  category_id: string;
}

/**
 * Filter options for product queries
 */
export interface ProductFilters {
  category?: string;
  search?: string;
  sort?: 'name' | 'created_at' | 'rating' | 'price';
  order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}
