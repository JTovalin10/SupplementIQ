'use client';

import CacheLoadingScreen from '@/components/ui/CacheLoadingScreen';
import { getAvailableTabs } from '@/lib/auth/role-routing';
import { useNextAuth } from '@/lib/contexts/NextAuthContext';
import {
  BarChart3,
  Lock,
  Settings,
  Shield
} from 'lucide-react';
import PendingSubmissions from './dashboard/PendingSubmissions';
import RecentActivity from './dashboard/RecentActivity';
import UserManagement from './dashboard/UserManagement';

interface DashboardProps {
  userRole?: 'user' | 'moderator' | 'admin' | 'owner';
}

export default function JWTDashboard({ userRole }: DashboardProps) {
  const { user, isAuthenticated, isLoading } = useNextAuth();
  const { state, setActiveTab, setCacheLoading } = useDashboard();
  const { activeTab, cacheLoading } = state;
  const effectiveRole = (userRole ?? user?.role ?? 'user') as 'user' | 'moderator' | 'admin' | 'owner';
  
  // Show loading state while authentication is being checked
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-900">Loading...</div>
      </div>
    );
  }
  
  // Show login prompt if not authenticated
  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="mb-6">
            <Lock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Authentication Required</h2>
            <p className="text-gray-600">
              Please log in to access the {effectiveRole} dashboard.
            </p>
          </div>
          <div className="space-y-4">
            <a
              href="/login"
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors block"
            >
              Login
            </a>
            <a
              href="/signup"
              className="w-full bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors block"
            >
              Create Account
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Get role-based navigation tabs
  const tabConfigs = getAvailableTabs(effectiveRole);
  const tabs = tabConfigs.map(tab => ({
    ...tab,
    icon: tab.id === 'overview' ? BarChart3 : Settings
  }));

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Shield className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <h1 className="text-2xl font-bold text-gray-900">
                  {effectiveRole.charAt(0).toUpperCase() + effectiveRole.slice(1)} Dashboard
                </h1>
                <p className="text-sm text-gray-500">
                  Welcome back, {(user as any).username || user.name || user.email}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">
                Role: {user.role}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Cache Loading Screen */}
      {cacheLoading && (
        <CacheLoadingScreen 
          message="Security cache is refreshing..."
          onRetry={() => {
            setCacheLoading(false);
          }}
          retryDelay={5000}
        />
      )}

      {/* Main Dashboard Content - Only show if cache is not loading */}
      {!cacheLoading && (
        <>
          {/* Navigation Tabs */}
          <div className="bg-white border-b">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <nav className="flex space-x-8">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                        activeTab === tab.id
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{tab.name}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Dashboard Content */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {activeTab === 'overview' && (
              <div className="space-y-8">
                <RecentActivity />
              </div>
            )}

            {activeTab === 'submissions' && (
              <PendingSubmissions />
            )}

            {activeTab === 'users' && (
              <UserManagement />
            )}

            {activeTab === 'settings' && (
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b">
                  <h3 className="text-lg font-semibold text-gray-900">Settings</h3>
                </div>
                <div className="p-6">
                  <p className="text-gray-500">Settings panel coming soon...</p>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
