/**
 * Contribution-related type definitions
 * Defines interfaces for user contributions, reviews, and fact-checking
 */

export interface Contribution {
  id: string;
  product_id: string;
  user_id: string;
  type: 'review' | 'rating' | 'fact_check' | 'transparency_score';
  content?: string;
  rating?: number;
  transparency_score?: number;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
  users?: {
    full_name: string;
    avatar_url?: string;
  };
  products?: {
    name: string;
    brand?: string;
  };
}

/**
 * Request type for creating a new contribution
 */
export interface CreateContributionRequest {
  product_id: string;
  type: 'review' | 'rating' | 'fact_check' | 'transparency_score';
  content?: string;
  rating?: number;
  transparency_score?: number;
}
