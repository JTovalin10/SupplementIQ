import { useContext } from 'react';
import { AppContext } from './provider';

/**
 * Hook to access global app context
 * Throws error if used outside of AppProvider
 */
export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}

/**
 * Hook for notifications only
 */
export function useNotifications() {
  const { state, addNotification, removeNotification, clearAllNotifications } = useApp();
  return {
    notifications: state.notifications,
    addNotification,
    removeNotification,
    clearAllNotifications
  };
}

/**
 * Hook for loading states only
 */
export function useLoading() {
  const { state, setLoading } = useApp();
  return {
    loading: state.loading,
    setLoading
  };
}

/**
 * Hook for UI state only
 */
export function useUI() {
  const { state, setSidebarOpen, toggleSidebar, setTheme } = useApp();
  return {
    sidebarOpen: state.sidebarOpen,
    theme: state.theme,
    setSidebarOpen,
    toggleSidebar,
    setTheme
  };
}

/**
 * Hook for search and filters
 */
export function useSearch() {
  const { state, setSearchQuery, setFilters } = useApp();
  return {
    searchQuery: state.searchQuery,
    filters: state.filters,
    setSearchQuery,
    setFilters
  };
}

/**
 * Hook for dashboard state and actions
 */
export function useDashboard() {
  const {
    state,
    setActiveTab,
    setCacheLoading,
    triggerRefresh,
    toggleDashboardSidebar,
    addDashboardNotification,
    removeDashboardNotification,
    markDashboardNotificationRead,
    clearAllDashboardNotifications
  } = useApp();
  
  return {
    state: {
      activeTab: state.activeTab,
      cacheLoading: state.cacheLoading,
      refreshTrigger: state.refreshTrigger,
      sidebarCollapsed: state.dashboardSidebarCollapsed,
      notifications: state.dashboardNotifications
    },
    setActiveTab,
    setCacheLoading,
    triggerRefresh,
    toggleSidebar: toggleDashboardSidebar,
    addNotification: addDashboardNotification,
    removeNotification: removeDashboardNotification,
    markNotificationRead: markDashboardNotificationRead,
    clearAllNotifications: clearAllDashboardNotifications
  };
}
