'use client';

import { createContext, ReactNode, useContext, useState } from 'react';

interface DashboardState {
  activeTab: string;
  cacheLoading: boolean;
  refreshTrigger: number;
  sidebarCollapsed: boolean;
  notifications: Notification[];
}

interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
}

interface DashboardContextType {
  state: DashboardState;
  setActiveTab: (tab: string) => void;
  setCacheLoading: (loading: boolean) => void;
  triggerRefresh: () => void;
  toggleSidebar: () => void;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  removeNotification: (id: string) => void;
  markNotificationRead: (id: string) => void;
  clearAllNotifications: () => void;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

interface DashboardProviderProps {
  children: ReactNode;
  initialTab?: string;
}

export function DashboardProvider({ children, initialTab = 'overview' }: DashboardProviderProps) {
  const [state, setState] = useState<DashboardState>({
    activeTab: initialTab,
    cacheLoading: false,
    refreshTrigger: 0,
    sidebarCollapsed: false,
    notifications: [],
  });

  const setActiveTab = (tab: string) => {
    setState(prev => ({ ...prev, activeTab: tab }));
  };

  const setCacheLoading = (loading: boolean) => {
    setState(prev => ({ ...prev, cacheLoading: loading }));
  };

  const triggerRefresh = () => {
    setState(prev => ({ ...prev, refreshTrigger: prev.refreshTrigger + 1 }));
  };

  const toggleSidebar = () => {
    setState(prev => ({ ...prev, sidebarCollapsed: !prev.sidebarCollapsed }));
  };

  const addNotification = (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      timestamp: new Date(),
      read: false,
    };
    
    setState(prev => ({
      ...prev,
      notifications: [...prev.notifications, newNotification]
    }));
  };

  const removeNotification = (id: string) => {
    setState(prev => ({
      ...prev,
      notifications: prev.notifications.filter(n => n.id !== id)
    }));
  };

  const markNotificationRead = (id: string) => {
    setState(prev => ({
      ...prev,
      notifications: prev.notifications.map(n => 
        n.id === id ? { ...n, read: true } : n
      )
    }));
  };

  const clearAllNotifications = () => {
    setState(prev => ({ ...prev, notifications: [] }));
  };

  const value: DashboardContextType = {
    state,
    setActiveTab,
    setCacheLoading,
    triggerRefresh,
    toggleSidebar,
    addNotification,
    removeNotification,
    markNotificationRead,
    clearAllNotifications,
  };

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (context === undefined) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
}
