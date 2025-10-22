'use client';

import { createContext, ReactNode, useContext, useReducer } from 'react';

// Action types for the global app reducer
type AppAction =
  | { type: 'SET_LOADING'; loading: boolean }
  | { type: 'SET_ERROR'; error: string | null }
  | { type: 'SET_SUCCESS_MESSAGE'; message: string | null }
  | { type: 'SET_NOTIFICATION'; notification: { type: 'success' | 'error' | 'warning' | 'info'; message: string; id: string } }
  | { type: 'REMOVE_NOTIFICATION'; id: string }
  | { type: 'CLEAR_ALL_NOTIFICATIONS' }
  | { type: 'SET_SIDEBAR_OPEN'; open: boolean }
  | { type: 'SET_THEME'; theme: 'light' | 'dark' | 'system' }
  | { type: 'SET_SEARCH_QUERY'; query: string }
  | { type: 'SET_FILTERS'; filters: Record<string, any> }
  | { type: 'RESET_APP_STATE' };

// State interface
interface AppState {
  loading: boolean;
  error: string | null;
  successMessage: string | null;
  notifications: Array<{ type: 'success' | 'error' | 'warning' | 'info'; message: string; id: string }>;
  sidebarOpen: boolean;
  theme: 'light' | 'dark' | 'system';
  searchQuery: string;
  filters: Record<string, any>;
}

// Initial state
const initialState: AppState = {
  loading: false,
  error: null,
  successMessage: null,
  notifications: [],
  sidebarOpen: false,
  theme: 'system',
  searchQuery: '',
  filters: {}
};

// Reducer function
function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.loading };
    
    case 'SET_ERROR':
      return { ...state, error: action.error };
    
    case 'SET_SUCCESS_MESSAGE':
      return { ...state, successMessage: action.message };
    
    case 'SET_NOTIFICATION':
      return {
        ...state,
        notifications: [...state.notifications, action.notification]
      };
    
    case 'REMOVE_NOTIFICATION':
      return {
        ...state,
        notifications: state.notifications.filter(n => n.id !== action.id)
      };
    
    case 'CLEAR_ALL_NOTIFICATIONS':
      return { ...state, notifications: [] };
    
    case 'SET_SIDEBAR_OPEN':
      return { ...state, sidebarOpen: action.open };
    
    case 'SET_THEME':
      return { ...state, theme: action.theme };
    
    case 'SET_SEARCH_QUERY':
      return { ...state, searchQuery: action.query };
    
    case 'SET_FILTERS':
      return { ...state, filters: action.filters };
    
    case 'RESET_APP_STATE':
      return initialState;
    
    default:
      return state;
  }
}

// Context type
interface AppContextType {
  state: AppState;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setSuccessMessage: (message: string | null) => void;
  addNotification: (type: 'success' | 'error' | 'warning' | 'info', message: string) => void;
  removeNotification: (id: string) => void;
  clearAllNotifications: () => void;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  setSearchQuery: (query: string) => void;
  setFilters: (filters: Record<string, any>) => void;
  resetAppState: () => void;
}

// Create context
const AppContext = createContext<AppContextType | undefined>(undefined);

// Provider component
interface AppProviderProps {
  children: ReactNode;
}

/**
 * Global app state provider using reducer pattern
 * Manages loading states, notifications, UI preferences, and global filters
 */
export function AppProvider({ children }: AppProviderProps) {
  const [state, dispatch] = useReducer(appReducer, initialState);

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

  return (
    <AppContext.Provider value={{
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
      resetAppState
    }}>
      {children}
    </AppContext.Provider>
  );
}

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
