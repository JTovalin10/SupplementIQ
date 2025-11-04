'use client';

import { supabase } from '@/lib/database/supabase/client';
import { useSupabaseWithColdStart } from '@/lib/hooks/useSupabaseWithColdStart';
import type { Session } from '@supabase/supabase-js';
import { createContext, useContext, useEffect, useState } from 'react';
import { calculatePermissions } from './permissions';
import type { AuthContextType, AuthProviderProps, UserProfile } from './types';
import { useAdminActions } from './useAdminActions';
import { useAuthOperations } from './useAuthOperations';
import { useUserProfile } from './useUserProfile';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { executeSupabaseOperation } = useSupabaseWithColdStart();
  const { fetchUserProfile } = useUserProfile();
  const authOperations = useAuthOperations();
  const { signup, logout, updateUserProfile } = authOperations;
  const {
    handleOverridePromote,
    handleApproveSubmission,
    handleRejectSubmission,
    handleApproveProductEdit,
    handleRejectProductEdit,
  } = useAdminActions();

  const [user, setUser] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [profileCache, setProfileCache] = useState<Map<string, UserProfile>>(new Map());
  const [permissions, setPermissions] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastAction, setLastAction] = useState<any>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const [showColdStartMessage, setShowColdStartMessage] = useState(false);

  const isAuthenticated = !!user && !!session;

  // Cold start detection logic
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isLoading && isRetrying) {
      timer = setTimeout(() => {
        setShowColdStartMessage(true);
      }, 3000); // Show message after 3 seconds if still loading/retrying
    } else {
      setShowColdStartMessage(false);
    }

    return () => clearTimeout(timer);
  }, [isLoading, isRetrying]);

  // Initialize auth state using Supabase's built-in system
  useEffect(() => {
    const initializeAuth = async () => {
      const startTime = Date.now();
      console.log('⏱️ [AUTH] Starting auth initialization...');
      
      try {
        setIsRetrying(true);
        console.log('⏱️ [AUTH] Checking session...');
        
        // Use cold start handler for session check
        const sessionStartTime = Date.now();
        const { data: { session }, error } = await executeSupabaseOperation(
          () => supabase.auth.getSession(),
          'Initial Session Check'
        );
        console.log(`⏱️ [AUTH] Session check took ${Date.now() - sessionStartTime}ms`);
        
        if (error) {
          console.error('❌ [AUTH] Session check failed:', error);
          setIsLoading(false);
          setIsRetrying(false);
          return;
        }
        
        console.log('✅ [AUTH] Session retrieved, user:', !!session?.user);
        setSession(session);
        
        if (session?.user) {
          console.log('⏱️ [AUTH] Fetching user profile...');
          const profileStartTime = Date.now();
          
          await fetchUserProfile(
            session.user,
            profileCache,
            setUser,
            setPermissions,
            setIsLoading,
            setProfileCache
          );
          
          console.log(`⏱️ [AUTH] Profile fetch took ${Date.now() - profileStartTime}ms`);
        } else {
          console.log('⚠️ [AUTH] No user session found');
          setUser(null);
          setPermissions(null);
          setIsLoading(false);
        }
        
        setIsRetrying(false);
        console.log(`✅ [AUTH] Auth initialization completed in ${Date.now() - startTime}ms`);
      } catch (error) {
        console.error('❌ [AUTH] Auth initialization failed:', error);
        setIsLoading(false);
        setIsRetrying(false);
      }
    };

    console.log('🚀 [AUTH] Initializing auth...');
    initializeAuth();

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
          setPermissions(calculatePermissions(existingUser.role));
          setIsLoading(false);
        } else {
          await fetchUserProfile(
            session.user,
            profileCache,
            setUser,
            setPermissions,
            setIsLoading,
            setProfileCache
          );
        }
      } else {
        setUser(null);
        setPermissions(null);
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateUser = (updatedUser: UserProfile) => {
    setUser(updatedUser);
    setPermissions(calculatePermissions(updatedUser.role));
  };

  const refreshUser = async () => {
    if (session?.user) {
      await fetchUserProfile(
        session.user,
        profileCache,
        setUser,
        setPermissions,
        setIsLoading,
        setProfileCache
      );
    }
  };

  const value: AuthContextType = {
    user,
    session,
    isAuthenticated,
    isLoading,
    permissions,
    login: (email, password, rememberMe) => authOperations.login(email, password, rememberMe, session),
    signup,
    logout,
    updateUser,
    updateUserProfile: (updates) => updateUserProfile(user, updates, setUser, setPermissions, session, fetchUserProfile),
    refreshUser,
    handleOverridePromote: (userId, targetRole) => handleOverridePromote(userId, targetRole, permissions, setIsProcessing, setLastAction),
    handleApproveSubmission: (submissionId, notes) => handleApproveSubmission(submissionId, notes, permissions, user, setIsProcessing, setLastAction),
    handleRejectSubmission: (submissionId, reason) => handleRejectSubmission(submissionId, reason, permissions, user, setIsProcessing, setLastAction),
    handleApproveProductEdit: (editId, notes) => handleApproveProductEdit(editId, notes, permissions, user, setIsProcessing, setLastAction),
    handleRejectProductEdit: (editId, reason) => handleRejectProductEdit(editId, reason, permissions, user, setIsProcessing, setLastAction),
    isProcessing,
    lastAction,
    isRetrying,
    showColdStartMessage,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}