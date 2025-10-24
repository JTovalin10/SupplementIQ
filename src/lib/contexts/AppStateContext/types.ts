// Types for AppStateContext
export interface AppState {
  // Global UI state
  loading: boolean;
  error: string | null;
  successMessage: string | null;
  notifications: Array<{ type: 'success' | 'error' | 'warning' | 'info'; message: string; id: string }>;
  sidebarOpen: boolean;
  theme: 'light' | 'dark' | 'system';
  searchQuery: string;
  filters: Record<string, any>;
  
  // Dashboard-specific state
  activeTab: string;
  cacheLoading: boolean;
  refreshTrigger: number;
  dashboardSidebarCollapsed: boolean;
  dashboardNotifications: DashboardNotification[];
}

export interface DashboardNotification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
}

export interface AppContextType {
  state: AppState;
  
  // Global UI methods
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
  
  // Dashboard-specific methods
  setActiveTab: (tab: string) => void;
  setCacheLoading: (loading: boolean) => void;
  triggerRefresh: () => void;
  toggleDashboardSidebar: () => void;
  addDashboardNotification: (notification: Omit<DashboardNotification, 'id' | 'timestamp' | 'read'>) => void;
  removeDashboardNotification: (id: string) => void;
  markDashboardNotificationRead: (id: string) => void;
  clearAllDashboardNotifications: () => void;
}

export interface AppProviderProps {
  children: React.ReactNode;
}
