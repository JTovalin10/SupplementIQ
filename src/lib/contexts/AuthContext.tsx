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
      console.log('🔍 Auth state change:', event);
      
      setSession(session);
      
      if (session?.user) {
        await fetchUserProfile(session.user);
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
      console.log('🔍 Fetching profile for user:', authUser.id);
      
      // Use Supabase's built-in auth - it automatically handles JWT tokens
      const { data: profile, error } = await supabase
        .from('users')
        .select('role, username, bio, reputation_points, created_at')
        .eq('id', authUser.id)
        .single();

      console.log('🔍 Profile query result:', {
        hasProfile: !!profile,
        hasError: !!error,
        errorCode: error?.code,
        errorMessage: error?.message
      });

      if (error) {
        console.error('🔍 ERROR DETAILS:');
        console.error('Message:', error.message);
        console.error('Code:', error.code);
        console.error('Details:', error.details);
        console.error('Hint:', error.hint);
        console.error('Full Error Object:', JSON.stringify(error, null, 2));
        
        // Only handle specific "user not found" error
        if (error.code === 'PGRST116') { // No rows returned
          console.log('✅ User not found in users table, creating default profile...');

          // Determine role based on email (for special accounts)
          let defaultRole = 'newcomer';
          let reputationPoints = 0;

          if (authUser.email === 'jtovalin10@gmail.com') {
            defaultRole = 'owner';
            reputationPoints = 1000;
          }

          const defaultProfile = {
            id: authUser.id,
            email: authUser.email || '',
            role: defaultRole,
            username: authUser.email?.split('@')[0] || 'user',
            bio: '',
            reputation_points: reputationPoints,
            created_at: new Date().toISOString(),
          };

          // Create user profile using Supabase's built-in auth
          console.log('🔍 Creating user profile...');
          
          const { error: insertError } = await supabase
            .from('users')
            .insert({
              id: authUser.id,
              email: authUser.email,
              username: defaultProfile.username,
              role: defaultRole,
              reputation_points: reputationPoints,
            });

          if (insertError) {
            console.error('❌ Error creating user profile:', {
              message: insertError.message,
              code: insertError.code,
              details: insertError.details,
              hint: insertError.hint
            });
            // Use default profile even if insert fails
            setUser(defaultProfile);
            setAbility(defineAbilitiesFor(defaultRole));
            return true; // Profile created successfully
          } else {
            console.log('✅ User profile created successfully');
            setUser(defaultProfile);
            setAbility(defineAbilitiesFor(defaultRole));
            return true; // Profile created successfully
          }
        } else {
          // Other errors - log and fail gracefully
          console.error('❌ This is not a "user not found" error, failing authentication');
          
          // Don't create a default profile for other errors
          setUser(null);
          setAbility(defineAbilitiesFor('newcomer'));
          return false; // Profile fetch failed
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
        return true; // Profile fetched successfully
      }
      
      return false; // No profile found
    } catch (error) {
      console.error('❌ Unexpected error in fetchUserProfile:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        fullError: JSON.stringify(error, null, 2)
      });
      // Fallback to default profile
      const defaultProfile = {
        id: authUser.id,
        email: authUser.email || '',
        role: 'newcomer',
        username: authUser.email?.split('@')[0] || 'user',
        bio: '',
        reputation_points: 0,
        created_at: new Date().toISOString(),
      };
      setUser(defaultProfile);
      setAbility(defineAbilitiesFor('newcomer'));
      return false; // Profile fetch failed
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

      // Wait for the auth state change to complete and profile to be fetched
      return new Promise((resolve) => {
        const timeout = setTimeout(() => {
          resolve({ success: false, error: 'Login timeout - please try again' });
        }, 10000); // 10 second timeout

        // Listen for auth state change
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
          if (event === 'SIGNED_IN' && session?.user) {
            try {
              // Wait for profile to be fetched
              const profileSuccess = await fetchUserProfile(session.user);
              
              clearTimeout(timeout);
              subscription.unsubscribe();
              
              if (profileSuccess) {
                resolve({ success: true });
              } else {
                resolve({ success: false, error: 'Failed to load user profile' });
              }
            } catch (profileError) {
              clearTimeout(timeout);
              subscription.unsubscribe();
              console.error('Profile fetch error during login:', profileError);
              resolve({ success: false, error: 'Failed to load user profile' });
            }
          } else if (event === 'SIGNED_OUT') {
            clearTimeout(timeout);
            subscription.unsubscribe();
            resolve({ success: false, error: 'Authentication failed' });
          }
        });
      });
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