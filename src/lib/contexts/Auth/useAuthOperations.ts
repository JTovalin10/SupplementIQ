import { supabase } from '@/lib/database/supabase/client';
import { useSupabaseWithColdStart } from '@/lib/hooks/useSupabaseWithColdStart';
import { calculatePermissions } from './permissions';
import type { UserProfile } from './types';

export function useAuthOperations() {
  const { executeSupabaseOperation } = useSupabaseWithColdStart();

  const login = async (
    email: string, 
    password: string, 
    rememberMe: boolean = false,
    session: any
  ): Promise<{ success: boolean; error?: string }> => {
    const startTime = Date.now();
    console.log('🔍 [LOGIN] Starting login attempt...');
    console.log('📧 [LOGIN] Email:', email);
    console.log('💾 [LOGIN] Remember me:', rememberMe);
    
    try {
      // If user is already logged in and trying to log in with different credentials,
      // sign them out first to ensure clean state
      if (session?.user && session.user.email !== email.toLowerCase().trim()) {
        console.log('🔄 [LOGIN] Different user detected, signing out current session...');
        const signOutStartTime = Date.now();
        await executeSupabaseOperation(
          () => supabase.auth.signOut({ scope: 'local' }),
          'Sign Out Current User'
        );
        console.log(`⏱️ [LOGIN] Sign out took ${Date.now() - signOutStartTime}ms`);
      }
      
      console.log('⏱️ [LOGIN] Starting sign in with password...');
      const signInStartTime = Date.now();
      
      const { data, error } = await executeSupabaseOperation(
        () => supabase.auth.signInWithPassword({
          email: email.toLowerCase().trim(),
          password,
        }),
        'User Login'
      );
      
      console.log(`⏱️ [LOGIN] Sign in took ${Date.now() - signInStartTime}ms`);

      if (error) {
        console.error('❌ [LOGIN] Login error:', error.message);
        
        // Handle specific authentication errors with user-friendly messages
        if (error.message.includes('Invalid login credentials') || 
            error.message.includes('Email not confirmed') ||
            error.message.includes('User not found')) {
          console.log(`⏱️ [LOGIN] Login failed in ${Date.now() - startTime}ms`);
          return { success: false, error: 'Invalid email or password. Please check your credentials or sign up if you don\'t have an account.' };
        }
        
        console.log(`⏱️ [LOGIN] Login failed in ${Date.now() - startTime}ms`);
        return { success: false, error: error.message };
      }

      // If authentication successful, let the auth state change handler deal with profile loading
      console.log(`✅ [LOGIN] Login completed successfully in ${Date.now() - startTime}ms`);
      return { success: true };
    } catch (error) {
      console.error('❌ [LOGIN] Unexpected error:', error);
      console.log(`⏱️ [LOGIN] Login failed in ${Date.now() - startTime}ms`);
      return { success: false, error: 'Network error occurred' };
    }
  };

  const signup = async (
    email: string, 
    password: string, 
    username: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      // Sign up with Supabase Auth using cold start handler
      const { data, error } = await executeSupabaseOperation(
        () => supabase.auth.signUp({
          email: email.toLowerCase().trim(),
          password,
          options: {
            data: {
              username,
            },
          },
        }),
        'User Signup'
      );

      if (error) {
        return { success: false, error: error.message };
      }

      // If user was created, also create profile in users table
      if (data.user) {
        const { error: profileError } = await executeSupabaseOperation(
          async () => {
            const result = await supabase
              .from('users')
              .insert({
                id: data.user.id,
                email: data.user.email,
                username,
                role: 'newcomer',
                reputation_points: 0,
              });
            return result;
          },
          'Create User Profile'
        );

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
      const { error } = await executeSupabaseOperation(
        () => supabase.auth.signOut({ scope: 'local' }),
        'User Logout'
      );
      
      if (error) {
        console.error('Logout error:', error);
        throw error;
      }
      
      console.log('✅ Logout completed successfully');
      
      // Redirect to home page
      if (typeof window !== 'undefined') {
        window.location.href = '/';
      }
    } catch (error) {
      console.error('Logout error:', error);
      
      if (typeof window !== 'undefined') {
        window.location.href = '/';
      }
    }
  };

  const updateUserProfile = async (
    user: UserProfile,
    updates: Partial<UserProfile>,
    setUser: (user: UserProfile | null) => void,
    setPermissions: (permissions: any) => void,
    session: any,
    fetchUserProfile: any
  ): Promise<void> => {
    if (!user) return;

    try {
      // Optimistically update the user state
      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);
      
      // Recalculate permissions if role changed
      if (updates.role) {
        setPermissions(calculatePermissions(updates.role));
      }

      // Update user profile in database using cold start handler
      await executeSupabaseOperation(
        async () => {
          const result = await supabase
            .from('users')
            .update(updates)
            .eq('id', user.id);
          return result;
        },
        'Update User Profile'
      );
    } catch (error) {
      console.error('Error updating user profile:', error);
      // Revert optimistic update
      await fetchUserProfile(session?.user!);
    }
  };

  return { login, signup, logout, updateUserProfile };
}
