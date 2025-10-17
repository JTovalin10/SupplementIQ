'use client';

import {
  AlertTriangle,
  BarChart3,
  Database,
  Lock,
  Settings,
  Shield,
  TrendingUp,
  Users,
  Zap
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useJWTAuth } from '../../lib/contexts/JWTAuthContext';
import CacheLoadingScreen from '../ui/CacheLoadingScreen';

// Mock data interfaces
interface DashboardStats {
  totalUsers: number;
  pendingSubmissions: number;
  pendingEdits: number;
  totalProducts: number;
  recentActivity: number;
  systemHealth?: number;
  databaseSize?: string;
  apiCalls?: number;
}

interface PendingSubmission {
  id: string;
  title: string;
  user: string;
  submittedAt: string;
  type: 'product' | 'edit' | 'review';
}

interface RecentActivity {
  id: string;
  action: string;
  user: string;
  timestamp: string;
  details: string;
}

interface SystemLog {
  id: string;
  type: 'info' | 'warning' | 'error';
  message: string;
  timestamp: string;
}

interface DashboardProps {
  userRole: 'admin' | 'owner';
}

export default function JWTDashboard({ userRole }: DashboardProps) {
  const { user, isAuthenticated, isLoading, getAccessToken } = useJWTAuth();
  const [activeTab, setActiveTab] = useState('overview');
  
  const isOwner = userRole === 'owner';
  
  // Show loading state while authentication is being checked
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-black">Loading...</div>
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
              Please log in to access the {userRole} dashboard.
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

  // TODO: Replace with database-driven role check
  // Check if user has the correct role
  // if (!hasAdminAccess(user.role)) {
  //   return (
  //     <div className="min-h-screen bg-gray-50 flex items-center justify-center">
  //       <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
  //         <div className="mb-6">
  //           <Shield className="w-16 h-16 text-red-400 mx-auto mb-4" />
  //           <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
  //           <p className="text-gray-600">
  //             You don't have permission to access this dashboard.
  //           </p>
  //         </div>
  //       </div>
  //     );
  //   }
  // }

  // Dashboard state
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    pendingSubmissions: 0,
    pendingEdits: 0,
    totalProducts: 0,
    recentActivity: 0,
    // TODO: Add system metrics based on user permissions from database
    systemHealth: 0,
    databaseSize: '0 GB',
    apiCalls: 0
  });

  const [pendingSubmissions, setPendingSubmissions] = useState<PendingSubmission[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [systemLogs, setSystemLogs] = useState<SystemLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cacheLoading, setCacheLoading] = useState(false);

  // Fetch dashboard data using JWT
  const fetchDashboardData = async () => {
    if (!isAuthenticated || !user) return;

    try {
      setLoading(true);
      setError(null);

      const token = getAccessToken();
      if (!token) {
        setError('No authentication token available');
        return;
      }

      // TODO: Implement actual API endpoints for dashboard data
      // For now, using mock data since the v1 API endpoints were removed
      const mockStats = {
        totalUsers: 1250,
        pendingSubmissions: 23,
        pendingEdits: 8,
        totalProducts: 3420,
        recentActivity: 156,
        systemHealth: 95,
        databaseSize: '2.1 GB',
        apiCalls: 15420
      };

      const mockSubmissions = [
        {
          id: '1',
          productName: 'Optimum Nutrition Gold Standard Whey',
          submitterName: 'John Doe',
          submitDate: new Date().toISOString(),
          status: 'pending'
        }
      ];

      const mockActivity = [
        {
          id: '1',
          action: 'Product approved',
          user: 'Admin User',
          timestamp: new Date().toISOString(),
          details: 'Optimum Nutrition Gold Standard Whey approved'
        }
      ];

      const mockLogs = [
        {
          id: '1',
          level: 'info',
          message: 'System running normally',
          timestamp: new Date().toISOString()
        }
      ];

      // Set mock data
      setStats(mockStats);
      setPendingSubmissions(mockSubmissions);
      setRecentActivity(mockActivity);
      setSystemLogs(mockLogs);

    } catch (err: any) {
      console.error('Failed to fetch dashboard data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      fetchDashboardData();
    }
  }, [isAuthenticated, user?.id, userRole]);

  // Set up periodic data refresh every 20 seconds
  useEffect(() => {
    if (!isAuthenticated || !user?.id) return;

    const interval = setInterval(() => {
      fetchDashboardData();
    }, 20000); // 20 seconds

    return () => clearInterval(interval);
  }, [isAuthenticated, user?.id, userRole]);

  // Navigation tabs
  const tabs = [
    { id: 'overview', name: 'Overview', icon: BarChart3 },
    { id: 'submissions', name: 'Submissions', icon: Database },
    // TODO: Add system tab based on user permissions from database
    { id: 'system', name: 'System', icon: Settings },
    { id: 'settings', name: 'Settings', icon: Settings },
  ];

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
                  Admin Dashboard
                </h1>
                <p className="text-sm text-gray-500">
                  Welcome back, {user.username}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">
                Role: {user.role}
              </span>
              <button
                onClick={fetchDashboardData}
                disabled={loading}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Refreshing...' : 'Refresh'}
              </button>
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
            fetchDashboardData();
          }}
          retryDelay={5000}
        />
      )}

      {/* Loading and Error States */}
      {loading && !cacheLoading && (
        <div className="bg-blue-50 border-b border-blue-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span className="text-blue-800 text-sm">Loading dashboard data...</span>
            </div>
          </div>
        </div>
      )}

      {error && !cacheLoading && (
        <div className="bg-red-50 border-b border-red-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <span className="text-red-800 text-sm">{error}</span>
              </div>
              <button
                onClick={fetchDashboardData}
                className="text-red-600 hover:text-red-800 text-sm font-medium"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
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
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                      <Users className="h-8 w-8 text-blue-600" />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-500">Total Users</p>
                        <p className="text-2xl font-semibold text-gray-900">{stats.totalUsers}</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                      <Database className="h-8 w-8 text-green-600" />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-500">Pending Submissions</p>
                        <p className="text-2xl font-semibold text-gray-900">{stats.pendingSubmissions}</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                      <TrendingUp className="h-8 w-8 text-purple-600" />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-500">Total Products</p>
                        <p className="text-2xl font-semibold text-gray-900">{stats.totalProducts}</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                      <Zap className="h-8 w-8 text-yellow-600" />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-500">System Health</p>
                        <p className="text-2xl font-semibold text-gray-900">{stats.systemHealth || 0}%</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-white rounded-lg shadow">
                  <div className="px-6 py-4 border-b">
                    <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
                  </div>
                  <div className="p-6">
                    {recentActivity.length > 0 ? (
                      <div className="space-y-4">
                        {recentActivity.slice(0, 5).map((activity) => (
                          <div key={activity.id} className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                              <p className="text-sm text-gray-500">{activity.details}</p>
                            </div>
                            <span className="text-xs text-gray-400">{activity.timestamp}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500">No recent activity</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'submissions' && (
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b">
                  <h3 className="text-lg font-semibold text-gray-900">Pending Submissions</h3>
                </div>
                <div className="p-6">
                  {pendingSubmissions.length > 0 ? (
                    <div className="space-y-4">
                      {pendingSubmissions.map((submission) => (
                        <div key={submission.id} className="border rounded-lg p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-medium text-gray-900">{submission.title}</h4>
                              <p className="text-sm text-gray-500">by {submission.user}</p>
                              <p className="text-xs text-gray-400">{submission.submittedAt}</p>
                            </div>
                            <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                              {submission.type}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">No pending submissions</p>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'system' && (
              <div className="space-y-6">
                <div className="bg-white rounded-lg shadow">
                  <div className="px-6 py-4 border-b">
                    <h3 className="text-lg font-semibold text-gray-900">System Logs</h3>
                  </div>
                  <div className="p-6">
                    {systemLogs.length > 0 ? (
                      <div className="space-y-2">
                        {systemLogs.map((log) => (
                          <div key={log.id} className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                log.type === 'error' ? 'bg-red-100 text-red-800' :
                                log.type === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-green-100 text-green-800'
                              }`}>
                                {log.type}
                              </span>
                              <span className="text-sm text-gray-900">{log.message}</span>
                            </div>
                            <span className="text-xs text-gray-400">{log.timestamp}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500">No system logs</p>
                    )}
                  </div>
                </div>
              </div>
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
