'use client';

import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';

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

interface UserContextType {
  user: UserProfile | null;
  permissions: UserPermissions | null;
  isLoading: boolean;
  refreshUser: () => Promise<void>;
  updateUserProfile: (updates: Partial<UserProfile>) => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}

interface UserProviderProps {
  children: ReactNode;
}

export function UserProvider({ children }: UserProviderProps) {
  const { user: authUser, isAuthenticated } = useAuth();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [permissions, setPermissions] = useState<UserPermissions | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const calculatePermissions = (userRole: string): UserPermissions => {
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
  };

  const fetchUserProfile = async () => {
    if (!authUser) {
      setUser(null);
      setPermissions(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      
      // Use the auth user data directly since it's already fetched in AuthContext
      const userProfile: UserProfile = {
        id: authUser.id,
        email: authUser.email,
        role: authUser.role,
        username: authUser.username,
        bio: authUser.bio,
        reputation_points: authUser.reputation_points,
        created_at: authUser.created_at,
      };

      setUser(userProfile);
      setPermissions(calculatePermissions(userProfile.role));
    } catch (error) {
      console.error('Error fetching user profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshUser = async () => {
    await fetchUserProfile();
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
      await fetchUserProfile();
    }
  };

  useEffect(() => {
    fetchUserProfile();
  }, [authUser, isAuthenticated]);

  const value: UserContextType = {
    user,
    permissions,
    isLoading,
    refreshUser,
    updateUserProfile,
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}
