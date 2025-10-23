/**
 * Context exports - centralized exports for all context providers and hooks
 */

// Export all providers
export { AdminProvider } from './AdminContext';
export { AuthProvider } from './AuthContext';
export { DashboardProvider } from './DashboardContext';
export { UserProvider } from './UserContext';

// Export all hooks
export { useAdmin } from './AdminContext';
export { useAuth } from './AuthContext';
export { useDashboard } from './DashboardContext';
export { useUser } from './UserContext';

// Export other contexts
export { AppStateProvider, useApp } from './AppStateContext';
export { ModalProvider, useModal } from './ModalContext';
export { UserPreferencesProvider, useUserPreferences } from './UserPreferencesContext';

