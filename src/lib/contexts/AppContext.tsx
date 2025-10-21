'use client';

import { ReactNode } from 'react';
import { AdminProvider } from './AdminContext';
import { AuthProvider } from './AuthContext';
import { DashboardProvider } from './DashboardContext';
import { UserProvider } from './UserContext';

interface AppProviderProps {
  children: ReactNode;
  initialTab?: string;
}

/**
 * Main App Provider that wraps all context providers
 * This eliminates the need to wrap components with multiple providers
 * and provides a clean hierarchy for context access
 */
export function AppProvider({ children, initialTab }: AppProviderProps) {
  return (
    <AuthProvider>
      <UserProvider>
        <DashboardProvider initialTab={initialTab}>
          <AdminProvider>
            {children}
          </AdminProvider>
        </DashboardProvider>
      </UserProvider>
    </AuthProvider>
  );
}

// Re-export all hooks for convenience
export { useAdmin } from './AdminContext';
export { useAuth } from './AuthContext';
export { useDashboard } from './DashboardContext';
export { useUser } from './UserContext';

