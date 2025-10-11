import { NextRequest } from 'next/server';
import { supabase } from '../backend/supabase';

/**
 * Authentication middleware for Next.js API routes
 * Extracts and validates JWT tokens from Authorization header
 */

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: string;
  username?: string;
  full_name?: string;
}

/**
 * Get authenticated user from request headers
 * 
 * @param request - Next.js request object
 * @returns AuthenticatedUser object or null if not authenticated
 */
export async function getAuthenticatedUser(request: NextRequest): Promise<AuthenticatedUser | null> {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader) {
      return null;
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return null;
    }

    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return null;
    }

    return {
      id: user.id,
      email: user.email || '',
      role: user.app_metadata?.role || 'user',
      username: user.user_metadata?.username,
      full_name: user.user_metadata?.full_name,
    };

  } catch (error) {
    console.error('Authentication error:', error);
    return null;
  }
}

/**
 * Require authentication middleware
 * Throws error if user is not authenticated
 * 
 * @param request - Next.js request object
 * @returns AuthenticatedUser object
 * @throws Error if not authenticated
 */
export async function requireAuth(request: NextRequest): Promise<AuthenticatedUser> {
  const user = await getAuthenticatedUser(request);
  
  if (!user) {
    throw new Error('Authentication required');
  }
  
  return user;
}

/**
 * Require admin role middleware
 * Throws error if user is not authenticated or not admin
 * 
 * @param request - Next.js request object
 * @returns AuthenticatedUser object with admin role
 * @throws Error if not authenticated or not admin
 */
export async function requireAdmin(request: NextRequest): Promise<AuthenticatedUser> {
  const user = await requireAuth(request);
  
  if (user.role !== 'admin' && user.role !== 'owner') {
    throw new Error('Admin access required');
  }
  
  return user;
}

/**
 * Require owner role middleware
 * Throws error if user is not authenticated or not owner
 * 
 * @param request - Next.js request object
 * @returns AuthenticatedUser object with owner role
 * @throws Error if not authenticated or not owner
 */
export async function requireOwner(request: NextRequest): Promise<AuthenticatedUser> {
  const user = await requireAuth(request);
  
  if (user.role !== 'owner') {
    throw new Error('Owner access required');
  }
  
  return user;
}

/**
 * Check if user has required role
 * 
 * @param user - Authenticated user object
 * @param requiredRole - Required role ('user', 'moderator', 'admin', 'owner')
 * @returns boolean indicating if user has required role
 */
export function hasRole(user: AuthenticatedUser, requiredRole: string): boolean {
  const roleHierarchy = {
    'user': 0,
    'moderator': 1,
    'admin': 2,
    'owner': 3,
  };

  const userLevel = roleHierarchy[user.role as keyof typeof roleHierarchy] || 0;
  const requiredLevel = roleHierarchy[requiredRole as keyof typeof roleHierarchy] || 0;

  return userLevel >= requiredLevel;
}

/**
 * Check if user is admin or owner
 * 
 * @param user - Authenticated user object
 * @returns boolean indicating if user is admin or owner
 */
export function isAdmin(user: AuthenticatedUser): boolean {
  return user.role === 'admin' || user.role === 'owner';
}

/**
 * Check if user is owner
 * 
 * @param user - Authenticated user object
 * @returns boolean indicating if user is owner
 */
export function isOwner(user: AuthenticatedUser): boolean {
  return user.role === 'owner';
}