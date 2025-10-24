'use client';

import * as adminService from '@/lib/api/services/adminService';
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

interface UserPermissions {
  canViewPending: boolean;
  canApproveSubmissions: boolean;
  canApproveEdits: boolean;
  canBanUsers: boolean;
  canRequestDeletion: boolean;
  canDeleteDirectly: boolean;
  canAccessAdminPanel: boolean;
  canAccessModeratorPanel: boolean;
  canAccessOwnerTools: boolean;
}

interface AdminAction {
  type: 'override_promote' | 'approve_submission' | 'reject_submission' | 'approve_product_edit' | 'reject_product_edit';
  userId?: string;
  targetRole?: string;
  submissionId?: string;
  editId?: string;
  notes?: string;
}

interface AuthContextType {
  user: UserProfile | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  permissions: UserPermissions | null;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<{ success: boolean; error?: string }>;
  signup: (email: string, password: string, username: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateUser: (user: UserProfile) => void;
  updateUserProfile: (updates: Partial<UserProfile>) => Promise<void>;
  refreshUser: () => Promise<void>;
  
  // Admin actions
  handleOverridePromote: (userId: string, targetRole: string) => Promise<void>;
  handleApproveSubmission: (submissionId: string, notes?: string) => Promise<void>;
  handleRejectSubmission: (submissionId: string, reason: string) => Promise<void>;
  handleApproveProductEdit: (editId: string, notes?: string) => Promise<void>;
  handleRejectProductEdit: (editId: string, reason: string) => Promise<void>;
  
  // Admin state
  isProcessing: boolean;
  lastAction: AdminAction | null;
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

// Calculate permissions based on user role
function calculatePermissions(userRole: string): UserPermissions {
  return {
    canViewPending: ['moderator', 'admin', 'owner'].includes(userRole),
    canApproveSubmissions: ['moderator', 'admin', 'owner'].includes(userRole),
    canApproveEdits: ['moderator', 'admin', 'owner'].includes(userRole),
    canBanUsers: ['admin', 'owner'].includes(userRole),
    canRequestDeletion: ['admin', 'owner'].includes(userRole),
    canDeleteDirectly: ['owner'].includes(userRole),
    canAccessAdminPanel: ['admin', 'owner'].includes(userRole),
    canAccessModeratorPanel: ['moderator', 'admin', 'owner'].includes(userRole),
    canAccessOwnerTools: ['owner'].includes(userRole),
  };
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
  const [permissions, setPermissions] = useState<UserPermissions | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastAction, setLastAction] = useState<AdminAction | null>(null);

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
        setPermissions(null);
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
        setPermissions(null);
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
        setPermissions(calculatePermissions(cachedProfile.role));
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
          setPermissions(null);
          setIsLoading(false);
          return false;
        }
        
        // For other database errors, also fail
        console.error('❌ Database error during profile fetch:', error);
        setUser(null);
        setAbility(defineAbilitiesFor('newcomer'));
        setPermissions(null);
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
      setPermissions(calculatePermissions(userProfile.role));
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
    setPermissions(calculatePermissions(updatedUser.role));
  };

  const updateUserProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return;

    try {
      // Optimistically update the user state
      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);
      
      // Recalculate permissions if role changed
      if (updates.role) {
        setPermissions(calculatePermissions(updates.role));
        setAbility(defineAbilitiesFor(updates.role));
      }

      // TODO: Make API call to update user profile
      // await fetch(`/api/users/${user.id}`, {
      //   method: 'PATCH',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(updates)
      // });
    } catch (error) {
      console.error('Error updating user profile:', error);
      // Revert optimistic update
      await fetchUserProfile(session?.user!);
    }
  };

  const refreshUser = async () => {
    if (session?.user) {
      await fetchUserProfile(session.user);
    }
  };

  // Admin action methods
  const handleOverridePromote = async (userId: string, targetRole: string) => {
    if (!permissions?.canAccessOwnerTools) {
      throw new Error('Insufficient permissions for role override');
    }

    setIsProcessing(true);
    try {
      const result = await adminService.updateUserRole({ role: targetRole });
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to update role');
      }
      
      setLastAction({
        type: 'override_promote',
        userId,
        targetRole,
      });

      console.log(`Override promoted user ${userId} to ${targetRole}`);
    } catch (error) {
      console.error('Error overriding promotion:', error);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApproveSubmission = async (submissionId: string, notes?: string) => {
    if (!permissions?.canApproveSubmissions) {
      throw new Error('Insufficient permissions to approve submissions');
    }

    setIsProcessing(true);
    try {
      const result = await adminService.approveSubmission({
        submissionId,
        adminId: user?.id || '',
        adminNotes: notes
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to approve submission');
      }
      
      setLastAction({
        type: 'approve_submission',
        submissionId,
        notes,
      });

      console.log(`Approved submission ${submissionId}`);
    } catch (error) {
      console.error('Error approving submission:', error);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRejectSubmission = async (submissionId: string, reason: string) => {
    if (!permissions?.canApproveSubmissions) {
      throw new Error('Insufficient permissions to reject submissions');
    }

    setIsProcessing(true);
    try {
      const result = await adminService.rejectSubmission({
        submissionId,
        adminId: user?.id || '',
        reason
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to reject submission');
      }
      
      setLastAction({
        type: 'reject_submission',
        submissionId,
        notes: reason,
      });

      console.log(`Rejected submission ${submissionId} for: ${reason}`);
    } catch (error) {
      console.error('Error rejecting submission:', error);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApproveProductEdit = async (editId: string, notes?: string) => {
    if (!permissions?.canApproveEdits) {
      throw new Error('Insufficient permissions to approve edits');
    }

    setIsProcessing(true);
    try {
      const result = await adminService.approveProductEdit({
        editId,
        adminId: user?.id || '',
        notes
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to approve product edit');
      }
      
      setLastAction({
        type: 'approve_product_edit',
        editId,
        notes,
      });

      console.log(`Approved product edit ${editId}`);
    } catch (error) {
      console.error('Error approving product edit:', error);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRejectProductEdit = async (editId: string, reason: string) => {
    if (!permissions?.canApproveEdits) {
      throw new Error('Insufficient permissions to reject edits');
    }

    setIsProcessing(true);
    try {
      const result = await adminService.rejectProductEdit({
        editId,
        adminId: user?.id || '',
        reason
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to reject product edit');
      }
      
      setLastAction({
        type: 'reject_product_edit',
        editId,
        notes: reason,
      });

      console.log(`Rejected product edit ${editId} for: ${reason}`);
    } catch (error) {
      console.error('Error rejecting product edit:', error);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  const value: AuthContextType = {
    user,
    session,
    isAuthenticated,
    isLoading,
    permissions,
    login,
    signup,
    logout,
    updateUser,
    updateUserProfile,
    refreshUser,
    handleOverridePromote,
    handleApproveSubmission,
    handleRejectSubmission,
    handleApproveProductEdit,
    handleRejectProductEdit,
    isProcessing,
    lastAction,
  };

  return (
    <AuthContext.Provider value={value}>
      <AbilityContext.Provider value={ability}>
        {children}
      </AbilityContext.Provider>
    </AuthContext.Provider>
  );
}