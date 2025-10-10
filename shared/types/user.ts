/**
 * User-related type definitions
 * Defines interfaces for user entities, authentication, and user management
 */

export interface User {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  bio?: string;
  reputation_score: number;
  created_at: string;
  updated_at: string;
}

/**
 * Request type for updating user profile information
 */
export interface UpdateUserRequest {
  full_name?: string;
  bio?: string;
  avatar_url?: string;
}
