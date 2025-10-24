'use client';

import { createContext, ReactNode, useContext, useEffect, useReducer, useState } from 'react';

// Action types for user preferences reducer
type UserPreferencesAction =
  | { type: 'SET_PREFERENCES'; preferences: UserPreferences }
  | { type: 'UPDATE_PREFERENCE'; key: string; value: any }
  | { type: 'RESET_PREFERENCES' }
  | { type: 'SET_DEFAULT_CATEGORY'; category: string }
  | { type: 'SET_SHOW_ADVANCED_FILTERS'; show: boolean }
  | { type: 'SET_AUTO_SAVE'; enabled: boolean }
  | { type: 'SET_NOTIFICATION_SETTINGS'; settings: NotificationSettings }
  | { type: 'SET_LAYOUT_PREFERENCES'; layout: 'grid' | 'list' | 'compact'; productsPerPage: number };

// User preferences interface
interface UserPreferences {
  // Layout preferences (moved from dashboard-specific to general UI)
  layout: 'grid' | 'list' | 'compact';
  productsPerPage: number;
  
  // Filter preferences
  defaultCategory: string;
  showAdvancedFilters: boolean;
  
  // General settings
  autoSave: boolean;
  
  // Notification preferences (settings only, not active notifications)
  notificationSettings: NotificationSettings;
  
  // Search & discovery
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
  layout: 'grid',
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
    
    case 'SET_NOTIFICATION_SETTINGS':
      return { ...state, notificationSettings: action.settings };
    
    case 'SET_LAYOUT_PREFERENCES':
      return { 
        ...state, 
        layout: action.layout,
        productsPerPage: action.productsPerPage 
      };
    
    default:
      return state;
  }
}

// Context type
interface UserPreferencesContextType {
  preferences: UserPreferences;
  updatePreference: (key: string, value: any) => void;
  setLayoutPreferences: (layout: 'grid' | 'list' | 'compact', productsPerPage: number) => void;
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
  const [isInitialized, setIsInitialized] = useState(false);

  // Load preferences from localStorage on mount with better error handling
  useEffect(() => {
    if (typeof window !== 'undefined' && !isInitialized) {
      const storageKey = `user-preferences-${userId || 'default'}`;
      try {
        const savedPreferences = localStorage.getItem(storageKey);
        if (savedPreferences) {
          const parsed = JSON.parse(savedPreferences);
          // Validate the parsed preferences
          if (parsed && typeof parsed === 'object') {
            dispatch({ type: 'SET_PREFERENCES', preferences: parsed });
          }
        }
      } catch (error) {
        console.error('Failed to load preferences from localStorage:', error);
        // Clear corrupted data
        try {
          localStorage.removeItem(storageKey);
        } catch (clearError) {
          console.error('Failed to clear corrupted preferences:', clearError);
        }
      } finally {
        setIsInitialized(true);
      }
    }
  }, [userId, isInitialized]);

  // Save preferences to localStorage with debouncing and error handling
  useEffect(() => {
    if (typeof window !== 'undefined' && isInitialized) {
      const storageKey = `user-preferences-${userId || 'default'}`;
      try {
        localStorage.setItem(storageKey, JSON.stringify(preferences));
      } catch (error) {
        console.error('Failed to save preferences to localStorage:', error);
        // Handle quota exceeded or other storage errors
        if (error instanceof Error && error.name === 'QuotaExceededError') {
          console.warn('localStorage quota exceeded, clearing old data');
          try {
            // Clear old preferences and try again
            localStorage.removeItem(storageKey);
            localStorage.setItem(storageKey, JSON.stringify(preferences));
          } catch (retryError) {
            console.error('Failed to retry saving preferences:', retryError);
          }
        }
      }
    }
  }, [preferences, userId, isInitialized]);

  const updatePreference = (key: string, value: any) => {
    dispatch({ type: 'UPDATE_PREFERENCE', key, value });
  };

  const setLayoutPreferences = (layout: 'grid' | 'list' | 'compact', productsPerPage: number) => {
    dispatch({ type: 'SET_LAYOUT_PREFERENCES', layout, productsPerPage });
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
      setLayoutPreferences,
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
 * Hook for layout preferences only
 */
export function useLayoutPreferences() {
  const { preferences, setLayoutPreferences } = useUserPreferences();
  return {
    layout: preferences.layout,
    productsPerPage: preferences.productsPerPage,
    setLayoutPreferences
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
