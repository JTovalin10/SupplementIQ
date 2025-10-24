import { AppAction } from './actions';
import { AppState } from './types';

// Initial state
export const initialState: AppState = {
  loading: false,
  error: null,
  successMessage: null,
  notifications: [],
  sidebarOpen: false,
  theme: 'system',
  searchQuery: '',
  filters: {},
  // Dashboard-specific initial state
  activeTab: 'overview',
  cacheLoading: false,
  refreshTrigger: 0,
  dashboardSidebarCollapsed: false,
  dashboardNotifications: []
};

// Reducer function
export function appReducer(state: AppState, action: AppAction): AppState {
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
    
    // Dashboard-specific cases
    case 'SET_ACTIVE_TAB':
      return { ...state, activeTab: action.tab };
    
    case 'SET_CACHE_LOADING':
      return { ...state, cacheLoading: action.loading };
    
    case 'TRIGGER_REFRESH':
      return { ...state, refreshTrigger: state.refreshTrigger + 1 };
    
    case 'SET_DASHBOARD_SIDEBAR_COLLAPSED':
      return { ...state, dashboardSidebarCollapsed: action.collapsed };
    
    case 'ADD_DASHBOARD_NOTIFICATION':
      return {
        ...state,
        dashboardNotifications: [...state.dashboardNotifications, action.notification]
      };
    
    case 'REMOVE_DASHBOARD_NOTIFICATION':
      return {
        ...state,
        dashboardNotifications: state.dashboardNotifications.filter(n => n.id !== action.id)
      };
    
    case 'MARK_DASHBOARD_NOTIFICATION_READ':
      return {
        ...state,
        dashboardNotifications: state.dashboardNotifications.map(n => 
          n.id === action.id ? { ...n, read: true } : n
        )
      };
    
    case 'CLEAR_ALL_DASHBOARD_NOTIFICATIONS':
      return { ...state, dashboardNotifications: [] };
    
    default:
      return state;
  }
}
