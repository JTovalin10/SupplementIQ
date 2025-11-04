import type { UserPermissions } from './types';

// Define abilities based on user role
// Simple role-based permissions
export function getUserPermissions(role: string): UserPermissions {
  return {
    canViewPending: ['owner', 'admin', 'moderator'].includes(role),
    canApproveSubmissions: ['owner', 'admin', 'moderator'].includes(role),
    canApproveEdits: ['owner', 'admin', 'moderator'].includes(role),
    canBanUsers: ['owner', 'admin'].includes(role),
    canRequestDeletion: ['owner', 'admin'].includes(role),
    canDeleteDirectly: role === 'owner',
    canAccessAdminPanel: ['owner', 'admin'].includes(role),
    canAccessModeratorPanel: ['owner', 'admin', 'moderator'].includes(role),
    canAccessOwnerTools: role === 'owner',
  };
}

// Calculate permissions based on user role
export function calculatePermissions(userRole: string): UserPermissions {
  return getUserPermissions(userRole);
}
