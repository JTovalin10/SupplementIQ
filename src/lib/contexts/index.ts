/**
 * Context exports - centralized exports for all context providers and hooks
 */

// Export main AppStateProvider (combines Auth + Global UI + Dashboard)
export { AppStateProvider } from './AppStateContext/index';

// Export all hooks from AppStateContext
export {
    useApp,
    useDashboard, useLoading, useNotifications, useSearch, useUI
} from './AppStateContext/index';

// Export Auth context from new Auth folder
export { AuthProvider, useAuth } from './Auth';

// Export OwnerDashboard context
export { OwnerDashboardProvider, useOwnerDashboard } from './OwnerDashboardContext';

// Export other specialized contexts
export { ModalProvider, useModal } from './ModalContext';
export {
    useLayoutPreferences,
    useNotificationPreferences, UserPreferencesProvider, useSearchPreferences, useUserPreferences
} from './UserPreferencesContext';

