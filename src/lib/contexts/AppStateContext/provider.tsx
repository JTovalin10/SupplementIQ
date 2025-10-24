import { createContext, useReducer } from 'react';
import { appReducer, initialState } from './reducer';
import { AppContextType, AppProviderProps, DashboardNotification } from './types';

// Create context
export const AppContext = createContext<AppContextType | undefined>(undefined);

/**
 * Global app state provider using reducer pattern
 * Manages loading states, notifications, UI preferences, and global filters
 */
export function AppProvider({ children }: AppProviderProps) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Global UI methods
  const setLoading = (loading: boolean) => {
    dispatch({ type: 'SET_LOADING', loading });
  };

  const setError = (error: string | null) => {
    dispatch({ type: 'SET_ERROR', error });
  };

  const setSuccessMessage = (message: string | null) => {
    dispatch({ type: 'SET_SUCCESS_MESSAGE', message });
  };

  const addNotification = (type: 'success' | 'error' | 'warning' | 'info', message: string) => {
    const id = Math.random().toString(36).substr(2, 9);
    dispatch({ type: 'SET_NOTIFICATION', notification: { type, message, id } });
    
    // Auto-remove notification after 5 seconds
    setTimeout(() => {
      dispatch({ type: 'REMOVE_NOTIFICATION', id });
    }, 5000);
  };

  const removeNotification = (id: string) => {
    dispatch({ type: 'REMOVE_NOTIFICATION', id });
  };

  const clearAllNotifications = () => {
    dispatch({ type: 'CLEAR_ALL_NOTIFICATIONS' });
  };

  const setSidebarOpen = (open: boolean) => {
    dispatch({ type: 'SET_SIDEBAR_OPEN', open });
  };

  const toggleSidebar = () => {
    dispatch({ type: 'SET_SIDEBAR_OPEN', open: !state.sidebarOpen });
  };

  const setTheme = (theme: 'light' | 'dark' | 'system') => {
    dispatch({ type: 'SET_THEME', theme });
  };

  const setSearchQuery = (query: string) => {
    dispatch({ type: 'SET_SEARCH_QUERY', query });
  };

  const setFilters = (filters: Record<string, any>) => {
    dispatch({ type: 'SET_FILTERS', filters });
  };

  const resetAppState = () => {
    dispatch({ type: 'RESET_APP_STATE' });
  };

  // Dashboard-specific methods
  const setActiveTab = (tab: string) => {
    dispatch({ type: 'SET_ACTIVE_TAB', tab });
  };

  const setCacheLoading = (loading: boolean) => {
    dispatch({ type: 'SET_CACHE_LOADING', loading });
  };

  const triggerRefresh = () => {
    dispatch({ type: 'TRIGGER_REFRESH' });
  };

  const toggleDashboardSidebar = () => {
    dispatch({ type: 'SET_DASHBOARD_SIDEBAR_COLLAPSED', collapsed: !state.dashboardSidebarCollapsed });
  };

  const addDashboardNotification = (notification: Omit<DashboardNotification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: DashboardNotification = {
      ...notification,
      id: Date.now().toString(),
      timestamp: new Date(),
      read: false,
    };
    dispatch({ type: 'ADD_DASHBOARD_NOTIFICATION', notification: newNotification });
  };

  const removeDashboardNotification = (id: string) => {
    dispatch({ type: 'REMOVE_DASHBOARD_NOTIFICATION', id });
  };

  const markDashboardNotificationRead = (id: string) => {
    dispatch({ type: 'MARK_DASHBOARD_NOTIFICATION_READ', id });
  };

  const clearAllDashboardNotifications = () => {
    dispatch({ type: 'CLEAR_ALL_DASHBOARD_NOTIFICATIONS' });
  };

  const value: AppContextType = {
    state,
    setLoading,
    setError,
    setSuccessMessage,
    addNotification,
    removeNotification,
    clearAllNotifications,
    setSidebarOpen,
    toggleSidebar,
    setTheme,
    setSearchQuery,
    setFilters,
    resetAppState,
    // Dashboard-specific methods
    setActiveTab,
    setCacheLoading,
    triggerRefresh,
    toggleDashboardSidebar,
    addDashboardNotification,
    removeDashboardNotification,
    markDashboardNotificationRead,
    clearAllDashboardNotifications
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}
