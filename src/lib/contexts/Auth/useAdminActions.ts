import * as adminService from '@/lib/api/services/adminService';
import type { AdminAction, UserPermissions } from './types';

export function useAdminActions() {
  const handleOverridePromote = async (
    userId: string, 
    targetRole: string,
    permissions: UserPermissions | null,
    setIsProcessing: (processing: boolean) => void,
    setLastAction: (action: AdminAction | null) => void
  ): Promise<void> => {
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

  const handleApproveSubmission = async (
    submissionId: string, 
    notes: string | undefined,
    permissions: UserPermissions | null,
    user: any,
    setIsProcessing: (processing: boolean) => void,
    setLastAction: (action: AdminAction | null) => void
  ): Promise<void> => {
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

  const handleRejectSubmission = async (
    submissionId: string, 
    reason: string,
    permissions: UserPermissions | null,
    user: any,
    setIsProcessing: (processing: boolean) => void,
    setLastAction: (action: AdminAction | null) => void
  ): Promise<void> => {
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

  const handleApproveProductEdit = async (
    editId: string, 
    notes: string | undefined,
    permissions: UserPermissions | null,
    user: any,
    setIsProcessing: (processing: boolean) => void,
    setLastAction: (action: AdminAction | null) => void
  ): Promise<void> => {
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

  const handleRejectProductEdit = async (
    editId: string, 
    reason: string,
    permissions: UserPermissions | null,
    user: any,
    setIsProcessing: (processing: boolean) => void,
    setLastAction: (action: AdminAction | null) => void
  ): Promise<void> => {
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

  return {
    handleOverridePromote,
    handleApproveSubmission,
    handleRejectSubmission,
    handleApproveProductEdit,
    handleRejectProductEdit,
  };
}
