'use client';

import { ReactNode } from 'react';
import {
  AdminProvider,
  AuthProvider,
  DashboardProvider,
  UserProvider
} from './index';

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
export {
  useAdmin,
  useAuth,
  useDashboard,
  useUser
} from './index';

