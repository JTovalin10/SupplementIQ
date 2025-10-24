/**
 * Simple role-based routing utilities
 * Check user role on login and use Next.js dynamic routes
 */

export interface UserRole {
  id: string;
  email: string;
  username: string;
  role: 'newcomer' | 'contributor' | 'trusted_editor' | 'moderator' | 'admin' | 'owner';
}

/**
 * Get dashboard route based on user role
 */
export function getDashboardRoute(userRole: string): string {
  switch (userRole) {
    case 'owner':
    case 'admin':
      return '/admin/dashboard';
    case 'moderator':
      return '/moderator/dashboard';
    default:
      return '/user/dashboard';
  }
}

/**
 * Check if user has access to a specific role
 */
export function hasRoleAccess(userRole: string, requiredRole: string): boolean {
  const roleHierarchy = {
    'newcomer': 1,
    'contributor': 2,
    'trusted_editor': 3,
    'moderator': 4,
    'admin': 5,
    'owner': 6,
  } as const;
  
  const userLevel = roleHierarchy[userRole as keyof typeof roleHierarchy] || 0;
  const requiredLevel = roleHierarchy[requiredRole as keyof typeof roleHierarchy] || 999;
  
  return userLevel >= requiredLevel;
}

/**
 * Get available tabs based on user role
 */
export function getAvailableTabs(userRole: string) {
  const baseTabs = [
    { id: 'overview', name: 'Overview' },
  ];

  // Moderators can access submissions
  if (hasRoleAccess(userRole, 'moderator')) {
    baseTabs.push({ id: 'submissions', name: 'Submissions' });
  }

  // Admins and owners can access user management
  if (hasRoleAccess(userRole, 'admin')) {
    baseTabs.push({ id: 'users', name: 'User Management' });
  }

  // Only owners can access system logs
  if (hasRoleAccess(userRole, 'owner')) {
    baseTabs.push({ id: 'system', name: 'System' });
  }

  return baseTabs;
}
