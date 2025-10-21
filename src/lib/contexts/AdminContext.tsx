'use client';

import { createContext, ReactNode, useContext, useState } from 'react';
import { useUser } from './UserContext';

interface AdminAction {
  type: 'override_promote' | 'ban_user' | 'delete_user' | 'approve_submission' | 'reject_submission';
  userId?: string;
  targetRole?: string;
  submissionId?: string;
  notes?: string;
}

interface AdminContextType {
  // User management
  handleOverridePromote: (userId: string, targetRole: string) => Promise<void>;
  handleBanUser: (userId: string, reason: string) => Promise<void>;
  handleDeleteUser: (userId: string, reason: string) => Promise<void>;
  
  // Submission management
  handleApproveSubmission: (submissionId: string, notes?: string) => Promise<void>;
  handleRejectSubmission: (submissionId: string, reason: string) => Promise<void>;
  
  // Product management
  handleApproveProductEdit: (editId: string, notes?: string) => Promise<void>;
  handleRejectProductEdit: (editId: string, reason: string) => Promise<void>;
  
  // State
  isProcessing: boolean;
  lastAction: AdminAction | null;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export function useAdmin() {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
}

interface AdminProviderProps {
  children: ReactNode;
}

export function AdminProvider({ children }: AdminProviderProps) {
  const { permissions } = useUser();
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastAction, setLastAction] = useState<AdminAction | null>(null);

  const handleOverridePromote = async (userId: string, targetRole: string) => {
    if (!permissions?.canAccessOwnerTools) {
      throw new Error('Insufficient permissions for role override');
    }

    setIsProcessing(true);
    try {
      // TODO: Replace with actual API call
      // const response = await fetch(`/api/admin/users/${userId}/override-promote`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ targetRole })
      // });
      
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

  const handleBanUser = async (userId: string, reason: string) => {
    if (!permissions?.canBanUsers) {
      throw new Error('Insufficient permissions to ban users');
    }

    setIsProcessing(true);
    try {
      // TODO: Replace with actual API call
      // const response = await fetch(`/api/admin/users/${userId}/ban`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ reason })
      // });
      
      setLastAction({
        type: 'ban_user',
        userId,
        notes: reason,
      });

      console.log(`Banned user ${userId} for: ${reason}`);
    } catch (error) {
      console.error('Error banning user:', error);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteUser = async (userId: string, reason: string) => {
    if (!permissions?.canDeleteDirectly) {
      throw new Error('Insufficient permissions to delete users');
    }

    setIsProcessing(true);
    try {
      // TODO: Replace with actual API call
      // const response = await fetch(`/api/admin/users/${userId}`, {
      //   method: 'DELETE',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ reason })
      // });
      
      setLastAction({
        type: 'delete_user',
        userId,
        notes: reason,
      });

      console.log(`Deleted user ${userId} for: ${reason}`);
    } catch (error) {
      console.error('Error deleting user:', error);
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
      // TODO: Replace with actual API call
      // const response = await fetch(`/api/admin/submissions/${submissionId}/approve`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ notes })
      // });
      
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
      // TODO: Replace with actual API call
      // const response = await fetch(`/api/admin/submissions/${submissionId}/reject`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ reason })
      // });
      
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
      // TODO: Replace with actual API call
      // const response = await fetch(`/api/admin/edits/${editId}/approve`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ notes })
      // });
      
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
      // TODO: Replace with actual API call
      // const response = await fetch(`/api/admin/edits/${editId}/reject`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ reason })
      // });
      
      console.log(`Rejected product edit ${editId} for: ${reason}`);
    } catch (error) {
      console.error('Error rejecting product edit:', error);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  const value: AdminContextType = {
    handleOverridePromote,
    handleBanUser,
    handleDeleteUser,
    handleApproveSubmission,
    handleRejectSubmission,
    handleApproveProductEdit,
    handleRejectProductEdit,
    isProcessing,
    lastAction,
  };

  return (
    <AdminContext.Provider value={value}>
      {children}
    </AdminContext.Provider>
  );
}
