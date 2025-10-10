/**
 * Authentication-related type definitions
 * Defines interfaces for login, registration, and authentication responses
 */

import { User } from './user';

/**
 * Request type for user login
 */
export interface LoginRequest {
  email: string;
  password: string;
}

/**
 * Request type for user registration
 */
export interface RegisterRequest {
  email: string;
  password: string;
  full_name: string;
}

/**
 * Response type for successful authentication
 */
export interface AuthResponse {
  user: User;
  session: {
    access_token: string;
    refresh_token: string;
    expires_at: number;
  };
}
