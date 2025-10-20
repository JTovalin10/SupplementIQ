'use client';

import type { UserRole } from '@/lib/utils/cache/securityCache/securityHelper';
import type { Session } from 'next-auth';
import { signIn, signOut, useSession } from 'next-auth/react';
import { createContext, useContext, useEffect, useState } from 'react';

/**
 * NextAuthContext - Simplified authentication context using NextAuth
 * 
 * Features:
 * - Built-in session management with NextAuth
 * - Role-based access control with intelligent caching
 * - Automatic token refresh via NextAuth
 * - Cross-tab session synchronization
 * - Optimized role caching to reduce database calls
 */

// Role caching to reduce API calls - stores role with timestamp for TTL
const roleCache = new Map<string, { role: UserRole; timestamp: number }>();
const ROLE_CACHE_TTL_MS = 5 * 60_000; // 5 minutes cache to balance freshness vs performance

// Extend NextAuth Session with our custom fields
interface AppSession extends Session {
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role?: string;
  };
}

interface NextAuthContextType {
  session: AppSession | null;
  user: AppSession['user'] | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (email: string, password: string, username: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const NextAuthContext = createContext<NextAuthContextType | undefined>(undefined);

/**
 * useNextAuth - Hook to access NextAuth context
 * @throws Error if used outside of NextAuthProvider
 * @returns NextAuthContextType - Authentication state and methods
 */
export function useNextAuth() {
  const context = useContext(NextAuthContext);
  if (context === undefined) {
    throw new Error('useNextAuth must be used within a NextAuthProvider');
  }
  return context;
}

interface NextAuthProviderProps {
  children: React.ReactNode;
}

/**
 * NextAuthProvider - Main authentication provider component using NextAuth
 * 
 * Manages:
 * - User session state with NextAuth
 * - Role-based access control with intelligent caching
 * - Cross-tab session synchronization (built into NextAuth)
 * - Automatic token refresh (built into NextAuth)
 * - Optimized role caching to reduce server load
 */
export function NextAuthProvider({ children }: NextAuthProviderProps) {
  // Use NextAuth's built-in session management
  const { data: session, status } = useSession();
  
  // Authentication state management
  const [isLoading, setIsLoading] = useState(status === 'loading');

  // Computed authentication state
  const isAuthenticated = !!session && status === 'authenticated';
  const user = session?.user || null;

  // Update loading state when NextAuth status changes
  useEffect(() => {
    setIsLoading(status === 'loading');
  }, [status]);

  /**
   * Login user with email and password using NextAuth
   * @param email - User's email address
   * @param password - User's password
   * @returns Promise<{success: boolean, error?: string}> - Login result
   */
  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        return { success: false, error: result.error };
      }

      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Network error' };
    }
  };

  /**
   * Sign up new user with email, password, and username
   * Creates account via Supabase and automatically logs in via NextAuth
   * @param email - User's email address
   * @param password - User's password
   * @param username - Desired username
   * @returns Promise<{success: boolean, error?: string}> - Signup result
   */
  const signup = async (email: string, password: string, username: string): Promise<{ success: boolean; error?: string }> => {
    try {
      // Create user via Supabase
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, username }),
      });

      const result = await response.json();
      
      if (!result.success) {
        return { success: false, error: result.error };
      }

      // Check if email confirmation is required
      if (result.requiresConfirmation) {
        return { 
          success: true, 
          error: 'Please check your email and click the confirmation link before signing in.' 
        };
      }

      // Auto-login after successful signup (only if no confirmation required)
      return await login(email, password);
    } catch (error) {
      console.error('Signup error:', error);
      return { success: false, error: 'Network error' };
    }
  };

  /**
   * Logout current user and clear all cached data
   * Clears session, user state, and role cache
   */
  const logout = async (): Promise<void> => {
    // Clear role cache
    roleCache.clear();
    
    // Sign out via NextAuth
    await signOut({ redirect: false });
  };

  // Context value object - provides all auth state and methods to children
  const value: NextAuthContextType = {
    session: session as AppSession | null,
    user,
    isAuthenticated,
    isLoading,
    login,
    signup,
    logout,
  };

  return (
    <NextAuthContext.Provider value={value}>
      {children}
    </NextAuthContext.Provider>
  );
}
