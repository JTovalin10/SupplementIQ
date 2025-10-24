// Main AppStateContext - combines Auth + Global UI + Dashboard state
'use client';

import { ReactNode } from 'react';
import { AuthProvider } from '../AuthContext';
import { AppProvider } from './provider';

interface AppStateProviderProps {
  children: ReactNode;
}

/**
 * Main App State Provider that combines:
 * - AuthContext (user authentication, permissions, admin actions)
 * - AppStateContext (global UI state, notifications, dashboard state)
 * 
 * This eliminates the need for separate AppProvider and AppStateProvider
 */
export function AppStateProvider({ children }: AppStateProviderProps) {
  return (
    <AuthProvider>
      <AppProvider>
        {children}
      </AppProvider>
    </AuthProvider>
  );
}

// Export all hooks for convenience
export {
  useApp, useDashboard, useLoading, useNotifications, useSearch, useUI
} from './hooks';

// Re-export AuthContext hooks
export { useAuth } from '../AuthContext';
