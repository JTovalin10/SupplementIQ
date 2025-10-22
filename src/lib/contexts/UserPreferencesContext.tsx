'use client';

import { createContext, ReactNode, useContext, useEffect, useReducer } from 'react';

// Action types for user preferences reducer
type UserPreferencesAction =
  | { type: 'SET_PREFERENCES'; preferences: UserPreferences }
  | { type: 'UPDATE_PREFERENCE'; key: string; value: any }
  | { type: 'RESET_PREFERENCES' }
  | { type: 'SET_DASHBOARD_LAYOUT'; layout: 'grid' | 'list' | 'compact' }
  | { type: 'SET_PRODUCTS_PER_PAGE'; count: number }
  | { type: 'SET_DEFAULT_CATEGORY'; category: string }
  | { type: 'SET_SHOW_ADVANCED_FILTERS'; show: boolean }
  | { type: 'SET_AUTO_SAVE'; enabled: boolean }
  | { type: 'SET_NOTIFICATION_SETTINGS'; settings: NotificationSettings };

// User preferences interface
interface UserPreferences {
  dashboardLayout: 'grid' | 'list' | 'compact';
  productsPerPage: number;
  defaultCategory: string;
  showAdvancedFilters: boolean;
  autoSave: boolean;
  notificationSettings: NotificationSettings;
  recentSearches: string[];
  favoriteCategories: string[];
  customFilters: Record<string, any>;
}

interface NotificationSettings {
  emailNotifications: boolean;
  pushNotifications: boolean;
  contributionUpdates: boolean;
  productApprovals: boolean;
  reputationChanges: boolean;
  weeklyDigest: boolean;
}

// Initial state
const initialPreferences: UserPreferences = {
  dashboardLayout: 'grid',
  productsPerPage: 20,
  defaultCategory: '',
  showAdvancedFilters: false,
  autoSave: true,
  notificationSettings: {
    emailNotifications: true,
    pushNotifications: true,
    contributionUpdates: true,
    productApprovals: true,
    reputationChanges: true,
    weeklyDigest: false
  },
  recentSearches: [],
  favoriteCategories: [],
  customFilters: {}
};

// Reducer function
function userPreferencesReducer(state: UserPreferences, action: UserPreferencesAction): UserPreferences {
  switch (action.type) {
    case 'SET_PREFERENCES':
      return action.preferences;
    
    case 'UPDATE_PREFERENCE':
      return {
        ...state,
        [action.key]: action.value
      };
    
    case 'RESET_PREFERENCES':
      return initialPreferences;
    
    case 'SET_DASHBOARD_LAYOUT':
      return { ...state, dashboardLayout: action.layout };
    
    case 'SET_PRODUCTS_PER_PAGE':
      return { ...state, productsPerPage: action.count };
    
    case 'SET_DEFAULT_CATEGORY':
      return { ...state, defaultCategory: action.category };
    
    case 'SET_SHOW_ADVANCED_FILTERS':
      return { ...state, showAdvancedFilters: action.show };
    
    case 'SET_AUTO_SAVE':
      return { ...state, autoSave: action.enabled };
    
    case 'SET_NOTIFICATION_SETTINGS':
      return { ...state, notificationSettings: action.settings };
    
    default:
      return state;
  }
}

// Context type
interface UserPreferencesContextType {
  preferences: UserPreferences;
  updatePreference: (key: string, value: any) => void;
  setDashboardLayout: (layout: 'grid' | 'list' | 'compact') => void;
  setProductsPerPage: (count: number) => void;
  setDefaultCategory: (category: string) => void;
  setShowAdvancedFilters: (show: boolean) => void;
  setAutoSave: (enabled: boolean) => void;
  setNotificationSettings: (settings: NotificationSettings) => void;
  addRecentSearch: (query: string) => void;
  addFavoriteCategory: (category: string) => void;
  removeFavoriteCategory: (category: string) => void;
  saveCustomFilter: (name: string, filter: Record<string, any>) => void;
  loadCustomFilter: (name: string) => Record<string, any> | null;
  resetPreferences: () => void;
}

// Create context
const UserPreferencesContext = createContext<UserPreferencesContextType | undefined>(undefined);

// Provider component
interface UserPreferencesProviderProps {
  children: ReactNode;
  userId?: string;
}

/**
 * User preferences provider using reducer pattern
 * Manages user-specific settings and preferences
 */
export function UserPreferencesProvider({ children, userId }: UserPreferencesProviderProps) {
  const [preferences, dispatch] = useReducer(userPreferencesReducer, initialPreferences);

  // Load preferences from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedPreferences = localStorage.getItem(`user-preferences-${userId || 'default'}`);
      if (savedPreferences) {
        try {
          const parsed = JSON.parse(savedPreferences);
          dispatch({ type: 'SET_PREFERENCES', preferences: parsed });
        } catch (error) {
          console.error('Failed to parse saved preferences:', error);
        }
      }
    }
  }, [userId]);

  // Save preferences to localStorage whenever they change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(`user-preferences-${userId || 'default'}`, JSON.stringify(preferences));
    }
  }, [preferences, userId]);

  const updatePreference = (key: string, value: any) => {
    dispatch({ type: 'UPDATE_PREFERENCE', key, value });
  };

  const setDashboardLayout = (layout: 'grid' | 'list' | 'compact') => {
    dispatch({ type: 'SET_DASHBOARD_LAYOUT', layout });
  };

  const setProductsPerPage = (count: number) => {
    dispatch({ type: 'SET_PRODUCTS_PER_PAGE', count });
  };

  const setDefaultCategory = (category: string) => {
    dispatch({ type: 'SET_DEFAULT_CATEGORY', category });
  };

  const setShowAdvancedFilters = (show: boolean) => {
    dispatch({ type: 'SET_SHOW_ADVANCED_FILTERS', show });
  };

  const setAutoSave = (enabled: boolean) => {
    dispatch({ type: 'SET_AUTO_SAVE', enabled });
  };

  const setNotificationSettings = (settings: NotificationSettings) => {
    dispatch({ type: 'SET_NOTIFICATION_SETTINGS', settings });
  };

  const addRecentSearch = (query: string) => {
    const recentSearches = [...preferences.recentSearches];
    const index = recentSearches.indexOf(query);
    if (index > -1) {
      recentSearches.splice(index, 1);
    }
    recentSearches.unshift(query);
    const limitedSearches = recentSearches.slice(0, 10); // Keep only last 10
    
    dispatch({ type: 'UPDATE_PREFERENCE', key: 'recentSearches', value: limitedSearches });
  };

  const addFavoriteCategory = (category: string) => {
    if (!preferences.favoriteCategories.includes(category)) {
      const favoriteCategories = [...preferences.favoriteCategories, category];
      dispatch({ type: 'UPDATE_PREFERENCE', key: 'favoriteCategories', value: favoriteCategories });
    }
  };

  const removeFavoriteCategory = (category: string) => {
    const favoriteCategories = preferences.favoriteCategories.filter(c => c !== category);
    dispatch({ type: 'UPDATE_PREFERENCE', key: 'favoriteCategories', value: favoriteCategories });
  };

  const saveCustomFilter = (name: string, filter: Record<string, any>) => {
    const customFilters = { ...preferences.customFilters, [name]: filter };
    dispatch({ type: 'UPDATE_PREFERENCE', key: 'customFilters', value: customFilters });
  };

  const loadCustomFilter = (name: string) => {
    return preferences.customFilters[name] || null;
  };

  const resetPreferences = () => {
    dispatch({ type: 'RESET_PREFERENCES' });
  };

  return (
    <UserPreferencesContext.Provider value={{
      preferences,
      updatePreference,
      setDashboardLayout,
      setProductsPerPage,
      setDefaultCategory,
      setShowAdvancedFilters,
      setAutoSave,
      setNotificationSettings,
      addRecentSearch,
      addFavoriteCategory,
      removeFavoriteCategory,
      saveCustomFilter,
      loadCustomFilter,
      resetPreferences
    }}>
      {children}
    </UserPreferencesContext.Provider>
  );
}

/**
 * Hook to access user preferences context
 * Throws error if used outside of UserPreferencesProvider
 */
export function useUserPreferences() {
  const context = useContext(UserPreferencesContext);
  if (context === undefined) {
    throw new Error('useUserPreferences must be used within a UserPreferencesProvider');
  }
  return context;
}

/**
 * Hook for dashboard preferences only
 */
export function useDashboardPreferences() {
  const { preferences, setDashboardLayout, setProductsPerPage } = useUserPreferences();
  return {
    layout: preferences.dashboardLayout,
    productsPerPage: preferences.productsPerPage,
    setLayout: setDashboardLayout,
    setProductsPerPage
  };
}

/**
 * Hook for notification preferences only
 */
export function useNotificationPreferences() {
  const { preferences, setNotificationSettings } = useUserPreferences();
  return {
    settings: preferences.notificationSettings,
    updateSettings: setNotificationSettings
  };
}

/**
 * Hook for search preferences only
 */
export function useSearchPreferences() {
  const { preferences, addRecentSearch, addFavoriteCategory, removeFavoriteCategory } = useUserPreferences();
  return {
    recentSearches: preferences.recentSearches,
    favoriteCategories: preferences.favoriteCategories,
    addRecentSearch,
    addFavoriteCategory,
    removeFavoriteCategory
  };
}
