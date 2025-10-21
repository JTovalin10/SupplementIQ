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
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
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
    case 'user':
    default:
      can('read', ['Product', 'Brand', 'Ingredient']);
      can('create', ['Submission', 'Review']);
      can('update', ['Submission', 'Review']);
      cannot('moderate', 'all');
      cannot('manage', ['User', 'Admin', 'Moderator']);
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
  const [ability, setAbility] = useState<Ability>(defineAbilitiesFor('user'));

  const isAuthenticated = !!user && !!session;

  // Initialize auth state
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        fetchUserProfile(session.user);
      } else {
        setIsLoading(false);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      
      if (session?.user) {
        await fetchUserProfile(session.user);
      } else {
        setUser(null);
        setAbility(defineAbilitiesFor('user'));
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (authUser: User) => {
    try {
      // Fetch user profile from your users table
      const { data: profile, error } = await supabase
        .from('users')
        .select('role, username, bio, reputation_points, created_at')
        .eq('id', authUser.id)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);
        
        // If user doesn't exist in users table, create a default profile
        if (error.code === 'PGRST116') { // No rows returned
          console.log('User not found in users table, creating default profile...');
          
          const defaultProfile = {
            id: authUser.id,
            email: authUser.email || '',
            role: 'user',
            username: authUser.email?.split('@')[0] || 'user',
            bio: '',
            reputation_points: 0,
            created_at: new Date().toISOString(),
          };

          // Try to create the user profile
          const { error: insertError } = await supabase
            .from('users')
            .insert({
              id: authUser.id,
              email: authUser.email,
              username: defaultProfile.username,
              role: 'user',
              reputation_points: 0,
            });

          if (insertError) {
            console.error('Error creating user profile:', insertError);
            // Use default profile even if insert fails
            setUser(defaultProfile);
            setAbility(defineAbilitiesFor('user'));
          } else {
            setUser(defaultProfile);
            setAbility(defineAbilitiesFor('user'));
          }
        } else {
          // Other errors - use default profile
          const defaultProfile = {
            id: authUser.id,
            email: authUser.email || '',
            role: 'user',
            username: authUser.email?.split('@')[0] || 'user',
            bio: '',
            reputation_points: 0,
            created_at: new Date().toISOString(),
          };
          setUser(defaultProfile);
          setAbility(defineAbilitiesFor('user'));
        }
      } else if (profile) {
        // Profile found successfully
        const userProfile = {
          id: authUser.id,
          email: authUser.email || '',
          role: profile.role,
          username: profile.username,
          bio: profile.bio,
          reputation_points: profile.reputation_points,
          created_at: profile.created_at,
        };

        setUser(userProfile);
        setAbility(defineAbilitiesFor(profile.role));
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      // Fallback to default profile
      const defaultProfile = {
        id: authUser.id,
        email: authUser.email || '',
        role: 'user',
        username: authUser.email?.split('@')[0] || 'user',
        bio: '',
        reputation_points: 0,
        created_at: new Date().toISOString(),
      };
      setUser(defaultProfile);
      setAbility(defineAbilitiesFor('user'));
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase().trim(),
        password,
      });

      if (error) {
        return { success: false, error: error.message };
      }

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
            role: 'user',
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
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Logout error:', error);
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