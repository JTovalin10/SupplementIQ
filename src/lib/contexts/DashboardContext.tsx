'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

interface DashboardState {
  activeTab: string;
  cacheLoading: boolean;
  refreshTrigger: number;
}

interface DashboardContextType {
  state: DashboardState;
  setActiveTab: (tab: string) => void;
  setCacheLoading: (loading: boolean) => void;
  triggerRefresh: () => void;
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

  const value: DashboardContextType = {
    state,
    setActiveTab,
    setCacheLoading,
    triggerRefresh,
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
