/**
 * Type definitions based on the actual database schema
 * Generated from supabase/schema.sql
 */

// ENUM types from schema
export type UserRole = 'newcomer' | 'contributor' | 'trusted_editor' | 'moderator' | 'admin' | 'owner';
export type ContributionStatus = 'pending' | 'approved' | 'rejected' | 'needs_review';
export type ProductCategory = 'protein' | 'pre-workout' | 'non-stim-pre-workout' | 'energy-drink' | 'bcaa' | 'eaa' | 'fat-burner' | 'appetite-suppressant' | 'creatine';
export type ConfidenceLevel = 'verified' | 'likely' | 'estimated' | 'unknown';
export type BrandTrust = 'new' | 'reputable' | 'controversial';

// User types
export interface User {
  id: string; // UUID
  username: string;
  email: string;
  reputation_points: number;
  role: UserRole;
  bio?: string;
  created_at: string; // TIMESTAMPTZ
  updated_at: string; // TIMESTAMPTZ
}

export interface UserBadge {
  id: number;
  user_id: string; // UUID
  badge_type: string;
  earned_at: string; // TIMESTAMPTZ
}

// Brand types
export interface Brand {
  id: number;
  name: string;
  slug?: string;
  website?: string;
  product_count: number;
  brand_trust: BrandTrust;
  transparency_score: number; // 0-100
  created_at: string; // TIMESTAMPTZ
}

export interface BrandLogo {
  id: number;
  brand_id: number;
  image_url: string;
  is_primary: boolean;
  created_at: string; // TIMESTAMPTZ
}

// Product types
export interface Product {
  id: number;
  brand_id: number;
  category: ProductCategory;
  name: string;
  slug: string;
  image_url?: string;
  description?: string;
  servings_per_container?: number;
  serving_size_g?: number; // DECIMAL(5,2)
  transparency_score: number; // 0-100
  confidence_level: ConfidenceLevel;
  dosage_rating: number; // 0-100
  danger_rating: number; // 0-100
  community_rating: number; // 0.0-10.0, DECIMAL(3,1)
  total_reviews: number;
  created_at: string; // TIMESTAMPTZ
  updated_at: string; // TIMESTAMPTZ
  // Relations
  brand?: Brand;
}

export interface ProductImage {
  id: number;
  product_id: number;
  image_url: string;
  is_primary: boolean;
  alt_text?: string;
  created_at: string; // TIMESTAMPTZ
}

// Review types
export interface ProductReview {
  id: number;
  product_id: number;
  user_id: string; // UUID
  rating: number; // 1.0-10.0, DECIMAL(3,1)
  title: string;
  comment: string;
  recommended_scoops?: number;
  recommended_frequency?: string;
  value_for_money?: number; // 1-5
  effectiveness?: number; // 1-5
  safety_concerns?: string;
  is_verified_purchase: boolean;
  helpful_votes: number;
  created_at: string; // TIMESTAMPTZ
  updated_at: string; // TIMESTAMPTZ
  // Relations
  user?: Pick<User, 'username' | 'reputation_points' | 'role'>;
}

// Category-specific detail types (these would be in separate tables like protein_details, preworkout_details, etc.)
export interface ProteinDetails {
  product_id: number;
  protein_claim_g?: number;
  protein_type?: string;
  effective_protein_g?: number;
  whey_isolate_mg?: number;
  whey_concentrate_mg?: number;
  pea_protein_mg?: number;
  rice_protein_mg?: number;
  hemp_protein_mg?: number;
  soy_protein_mg?: number;
  casein_mg?: number;
  egg_protein_mg?: number;
  collagen_mg?: number;
  lab_tested?: boolean;
  created_at: string;
  updated_at: string;
}

export interface PreworkoutDetails {
  product_id: number;
  serving_scoops?: number;
  sugar_g?: number;
  l_citrulline_mg?: number;
  creatine_monohydrate_mg?: number;
  glycerpump_mg?: number;
  caffeine_anhydrous_mg?: number;
  l_tyrosine_mg?: number;
  betaine_anhydrous_mg?: number;
  created_at: string;
  updated_at: string;
}

export interface EnergyDrinkDetails {
  product_id: number;
  serving_size_fl_oz?: number;
  sugar_g?: number;
  caffeine_mg?: number;
  n_acetyl_l_tyrosine_mg?: number;
  alpha_gpc_mg?: number;
  l_theanine_mg?: number;
  huperzine_a_mcg?: number;
  vitamin_c_mg?: number;
  created_at: string;
  updated_at: string;
}

export interface BCAADetails {
  product_id: number;
  total_eaas_mg?: number;
  l_leucine_mg?: number;
  l_isoleucine_mg?: number;
  l_valine_mg?: number;
  coconut_water_powder_mg?: number;
  betaine_anhydrous_mg?: number;
  created_at: string;
  updated_at: string;
}

export interface EAADetails {
  product_id: number;
  total_eaas_mg?: number;
  l_leucine_mg?: number;
  l_isoleucine_mg?: number;
  l_valine_mg?: number;
  l_lysine_hcl_mg?: number;
  l_threonine_mg?: number;
  l_phenylalanine_mg?: number;
  l_tryptophan_mg?: number;
  created_at: string;
  updated_at: string;
}

export interface FatBurnerDetails {
  product_id: number;
  stimulant_based?: boolean;
  caffeine_anhydrous_mg?: number;
  green_tea_extract_mg?: number;
  l_carnitine_l_tartrate_mg?: number;
  ksm66_ashwagandha_mg?: number;
  five_htp_mg?: number;
  created_at: string;
  updated_at: string;
}

export interface AppetiteSuppressantDetails {
  product_id: number;
  five_htp_mg?: number;
  ksm66_ashwagandha_mg?: number;
  saffron_extract_mg?: number;
  created_at: string;
  updated_at: string;
}

export interface CreatineDetails {
  product_id: number;
  creatine_monohydrate_mg?: number;
  created_at: string;
  updated_at: string;
}

// Union type for all category details
export type CategoryDetails = 
  | ProteinDetails 
  | PreworkoutDetails 
  | EnergyDrinkDetails 
  | BCAADetails 
  | EAADetails 
  | FatBurnerDetails 
  | AppetiteSuppressantDetails 
  | CreatineDetails;

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}

// Form types for product submission
export interface ProductSubmission {
  name: string;
  brand: string;
  category: ProductCategory;
  description?: string;
  imageUrl: string;
  categoryDetails?: Partial<CategoryDetails>;
}

// Dashboard types
export interface DashboardStats {
  totalUsers: number;
  pendingSubmissions: number;
  pendingEdits: number;
  totalProducts: number;
  recentActivity: number;
  systemHealth?: number;
  databaseSize?: string;
  apiCalls?: number;
}

export interface PendingSubmission {
  id: string;
  productName: string;
  brandName: string;
  category: string;
  submittedBy: string;
  submittedAt: string;
  status: ContributionStatus;
}

export interface RecentActivity {
  id: string;
  type: 'submission' | 'edit' | 'approval' | 'rejection';
  description: string;
  user: string;
  timestamp: string;
}

export interface SystemLog {
  id: string;
  type: 'error' | 'warning' | 'info' | 'success';
  message: string;
  timestamp: string;
  component: string;
}

// Transparency calculator types
export interface IngredientData {
  name: string;
  amount: number; // -1 = not disclosed, 0 = not included, >0 = actual amount
  unit: string;
  disclosed: boolean;
  verified: boolean;
  source?: 'label' | 'lab_test' | 'estimated' | 'unknown';
}

export interface ProductData {
  category: string;
  ingredients: IngredientData[];
  totalIngredients: number;
  hasNutritionFacts: boolean;
  hasThirdPartyTesting: boolean;
  brandTrust: BrandTrust;
}

export interface TransparencyResult {
  score: number; // 0-100
  breakdown: {
    ingredientDisclosure: number;
    dataCompleteness: number;
    verificationLevel: number;
    brandTrust: number;
  };
  factors: string[];
}