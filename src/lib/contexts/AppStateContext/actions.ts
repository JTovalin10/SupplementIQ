// Action types for the global app reducer
export type AppAction =
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
  | { type: 'RESET_APP_STATE' }
  // Dashboard-specific actions
  | { type: 'SET_ACTIVE_TAB'; tab: string }
  | { type: 'SET_CACHE_LOADING'; loading: boolean }
  | { type: 'TRIGGER_REFRESH' }
  | { type: 'SET_DASHBOARD_SIDEBAR_COLLAPSED'; collapsed: boolean }
  | { type: 'ADD_DASHBOARD_NOTIFICATION'; notification: import('./types').DashboardNotification }
  | { type: 'REMOVE_DASHBOARD_NOTIFICATION'; id: string }
  | { type: 'MARK_DASHBOARD_NOTIFICATION_READ'; id: string }
  | { type: 'CLEAR_ALL_DASHBOARD_NOTIFICATIONS' };
