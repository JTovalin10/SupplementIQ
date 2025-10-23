'use client';

import { supabase } from '@/lib/database/supabase/client';
import { Ability, AbilityBuilder } from '@casl/ability';
import { createContextualCan } from '@casl/react';
import type { Session, User } from '@supabase/supabase-js';
import { createContext, useContext, useEffect, useState } from 'react';

interface UserProfile {
  id: string;
  email: string;
  role: string;
  username: string;
  bio?: string;
  reputation_points: number;
  created_at: string;
}

interface AuthContextType {
  user: UserProfile | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<{ success: boolean; error?: string }>;
  signup: (email: string, password: string, username: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateUser: (user: UserProfile) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Define abilities based on user role
function defineAbilitiesFor(role: string) {
  const { can, cannot, build } = new AbilityBuilder(Ability);

  switch (role) {
    case 'owner':
      can('manage', 'all'); // Owner can do everything
      break;
    case 'admin':
      can('read', 'all');
      can('create', 'all');
      can('update', 'all');
      can('delete', 'all');
      cannot('manage', 'owner'); // Cannot manage owners
      break;
    case 'moderator':
      can('read', 'all');
      can('create', ['Product', 'Submission']);
      can('update', ['Product', 'Submission']);
      can('moderate', 'all');
      cannot('delete', 'all');
      cannot('manage', ['User', 'Admin']);
      break;
    case 'trusted_editor':
      can('read', 'all');
      can('create', ['Product', 'Submission']);
      can('update', ['Product', 'Submission']);
      can('moderate', ['Product', 'Submission']);
      cannot('delete', 'all');
      cannot('manage', ['User', 'Admin', 'Moderator']);
      break;
    case 'contributor':
      can('read', 'all');
      can('create', ['Submission', 'Review']);
      can('update', ['Submission', 'Review']);
      cannot('moderate', 'all');
      cannot('manage', ['User', 'Admin', 'Moderator', 'TrustedEditor']);
      break;
    case 'newcomer':
    case 'user':
    default:
      can('read', ['Product', 'Brand', 'Ingredient']);
      can('create', ['Submission', 'Review']);
      can('update', ['Submission', 'Review']);
      cannot('moderate', 'all');
      cannot('manage', ['User', 'Admin', 'Moderator', 'TrustedEditor', 'Contributor']);
      break;
  }

  return build();
}

// Create ability context
export const AbilityContext = createContext<Ability | undefined>(undefined);

// Create contextual can function
export const Can = createContextualCan(AbilityContext.Consumer);

// Hook to use abilities
export function useAbility() {
  const ability = useContext(AbilityContext);
  if (!ability) {
    throw new Error('useAbility must be used within AbilityProvider');
  }
  return ability;
}

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [ability, setAbility] = useState<Ability>(defineAbilitiesFor('newcomer'));
  const [profileCache, setProfileCache] = useState<Map<string, UserProfile>>(new Map());

  const isAuthenticated = !!user && !!session;

  // Initialize auth state using Supabase's built-in system
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        fetchUserProfile(session.user);
      } else {
        setUser(null);
        setAbility(defineAbilitiesFor('newcomer'));
        setIsLoading(false);
      }
    });

    // Listen for auth changes using Supabase's built-in system
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      // Only log significant auth changes
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
        console.log('🔍 Auth state change:', event, 'Session:', !!session, 'User:', !!session?.user);
      }
      
      setSession(session);
      
      if (session?.user) {
        // Check if we already have user data to avoid unnecessary profile fetch
        const existingUser = profileCache.get(session.user.id);
        if (existingUser) {
          setUser(existingUser);
          setAbility(defineAbilitiesFor(existingUser.role));
          setIsLoading(false);
        } else {
          await fetchUserProfile(session.user);
        }
      } else {
        setUser(null);
        setAbility(defineAbilitiesFor('newcomer'));
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (authUser: User): Promise<boolean> => {
    try {
      // Check cache first
      const cachedProfile = profileCache.get(authUser.id);
      if (cachedProfile) {
        setUser(cachedProfile);
        setAbility(defineAbilitiesFor(cachedProfile.role));
        setIsLoading(false);
        return true;
      }

      // Fetch user profile from database
      const { data: profile, error } = await supabase
        .from('users')
        .select('role, username, bio, reputation_points, created_at')
        .eq('id', authUser.id)
        .single();

      if (error) {
        console.error('Profile fetch error:', error.message);
        
        // If user not found, return false - profile should only be created during signup
        if (error.code === 'PGRST116') {
          console.error('❌ User profile not found in database. User must sign up first.');
          setUser(null);
          setAbility(defineAbilitiesFor('newcomer'));
          setIsLoading(false);
          return false;
        }
        
        // For other database errors, also fail
        console.error('❌ Database error during profile fetch:', error);
        setUser(null);
        setAbility(defineAbilitiesFor('newcomer'));
        setIsLoading(false);
        return false;
      }

      // Profile found successfully
      const userProfile = {
        id: authUser.id,
        email: authUser.email || '',
        role: profile.role,
        username: profile.username,
        bio: profile.bio,
        reputation_points: profile.reputation_points,
        created_at: profile.created_at
      };

      setUser(userProfile);
      setAbility(defineAbilitiesFor(userProfile.role));
      setIsLoading(false);
      profileCache.set(authUser.id, userProfile);
      return true;
    } catch (error) {
      console.error('❌ Unexpected error in fetchUserProfile:', error);
      
      // More detailed error logging
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      } else {
        console.error('Non-Error object:', error);
      }
      
      // Fallback to default profile with newcomer role
      const defaultProfile = {
        id: authUser.id,
        email: authUser.email || '',
        role: 'newcomer', // Safe default role
        username: authUser.email?.split('@')[0] || 'user',
        bio: '',
        reputation_points: 0, // Safe default reputation
        created_at: new Date().toISOString(),
      };
      
      console.log('🔧 Using fallback profile with newcomer role');
      setUser(defaultProfile);
      setAbility(defineAbilitiesFor('newcomer'));
      
      // Cache the fallback profile
      setProfileCache(prev => new Map(prev).set(authUser.id, defaultProfile));
      
      return false; // Profile fetch failed
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string, rememberMe: boolean = false): Promise<{ success: boolean; error?: string }> => {
    try {
      console.log('🔍 Login attempt with rememberMe:', rememberMe);
      
      // If user is already logged in and trying to log in with different credentials,
      // sign them out first to ensure clean state
      if (session?.user && session.user.email !== email.toLowerCase().trim()) {
        console.log('🔍 Different user detected, signing out current session first...');
        await supabase.auth.signOut({ scope: 'local' });
      }
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase().trim(),
        password,
      });

      if (error) {
        console.error('🔍 Login error:', error.message);
        
        // Handle specific authentication errors with user-friendly messages
        if (error.message.includes('Invalid login credentials') || 
            error.message.includes('Email not confirmed') ||
            error.message.includes('User not found')) {
          return { success: false, error: 'Invalid email or password. Please check your credentials or sign up if you don\'t have an account.' };
        }
        
        return { success: false, error: error.message };
      }

      // If authentication successful, let the auth state change handler deal with profile loading
      console.log('✅ Login completed successfully');
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Network error occurred' };
    }
  };

  const signup = async (email: string, password: string, username: string): Promise<{ success: boolean; error?: string }> => {
    try {
      // Sign up with Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email: email.toLowerCase().trim(),
        password,
        options: {
          data: {
            username,
          },
        },
      });

      if (error) {
        return { success: false, error: error.message };
      }

      // If user was created, also create profile in users table
      if (data.user) {
        const { error: profileError } = await supabase
          .from('users')
          .insert({
            id: data.user.id,
            email: data.user.email,
            username,
            role: 'newcomer',
            reputation_points: 0,
          });

        if (profileError) {
          console.error('Error creating user profile:', profileError);
          return { success: false, error: 'Account created but profile setup failed' };
        }
      }

      return { success: true };
    } catch (error) {
      console.error('Signup error:', error);
      return { success: false, error: 'Network error occurred' };
    }
  };

  const logout = async (): Promise<void> => {
    try {
      console.log('🔍 Starting logout process...');
      
      // Sign out from Supabase with scope 'local' to clear all sessions
      // This ensures the user is logged out regardless of "Remember Me" setting
      const { error } = await supabase.auth.signOut({ scope: 'local' });
      
      if (error) {
        console.error('Logout error:', error);
        throw error;
      }
      
      console.log('✅ Logout completed successfully');
      
      // Clear local state immediately
      setUser(null);
      setSession(null);
      setAbility(defineAbilitiesFor('newcomer'));
      setIsLoading(false);
      
      // Redirect to home page
      if (typeof window !== 'undefined') {
        window.location.href = '/';
      }
    } catch (error) {
      console.error('Logout error:', error);
      
      // Even if there's an error, clear local state
      setUser(null);
      setSession(null);
      setAbility(defineAbilitiesFor('newcomer'));
      setIsLoading(false);
      
      if (typeof window !== 'undefined') {
        window.location.href = '/';
      }
    }
  };

  const updateUser = (updatedUser: UserProfile) => {
    setUser(updatedUser);
    setAbility(defineAbilitiesFor(updatedUser.role));
  };

  const value: AuthContextType = {
    user,
    session,
    isAuthenticated,
    isLoading,
    login,
    signup,
    logout,
    updateUser,
  };

  return (
    <AuthContext.Provider value={value}>
      <AbilityContext.Provider value={ability}>
        {children}
      </AbilityContext.Provider>
    </AuthContext.Provider>
  );
}