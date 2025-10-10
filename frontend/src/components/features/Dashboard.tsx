'use client';

import { useAuth } from '@/lib/contexts/AuthContext';
import { dashboardService, type DashboardStats, type PendingSubmission, type RecentActivity, type SystemLog } from '@/lib/services/dashboardService';
import {
  AlertTriangle,
  BarChart3,
  Crown,
  Database,
  Key,
  Lock,
  Settings,
  Shield,
  TrendingUp,
  Users,
  Zap
} from 'lucide-react';
import { useEffect, useState } from 'react';
import Analytics from './dashboard/Analytics';
import DashboardHeader from './dashboard/DashboardHeader';
import PendingSubmissions from './dashboard/PendingSubmissions';
import RecentActivityComponent from './dashboard/RecentActivity';
import SettingsComponent from './dashboard/Settings';
import StatsCards from './dashboard/StatsCards';
import UserManagement from './dashboard/UserManagement';

// Interfaces are now imported from dashboardService

interface DashboardProps {
  userRole: 'admin' | 'owner';
}

export default function Dashboard({ userRole }: DashboardProps) {
  const { user, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  
  const isOwner = userRole === 'owner';
  
  // Show login prompt if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="mb-6">
            <Lock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Authentication Required</h2>
            <p className="text-gray-600 mb-6">
              Please log in to access the {userRole} dashboard.
            </p>
          </div>
          <div className="space-y-3">
            <a
              href="/login"
              className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors inline-block"
            >
              Sign In
            </a>
            <a
              href="/register"
              className="w-full bg-gray-100 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors inline-block"
            >
              Create Account
            </a>
          </div>
        </div>
      </div>
    );
  }
  
  // State for real data
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    pendingSubmissions: 0,
    pendingEdits: 0,
    totalProducts: 0,
    recentActivity: 0,
    ...(isOwner && {
      systemHealth: 0,
      databaseSize: '0 GB',
      apiCalls: 0
    })
  });

  const [pendingSubmissions, setPendingSubmissions] = useState<PendingSubmission[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [systemLogs, setSystemLogs] = useState<SystemLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cacheStatus, setCacheStatus] = useState<{ hours: number; minutes: number; seconds: number } | null>(null);

  // Fetch dashboard data on component mount
  useEffect(() => {
    const fetchDashboardData = async () => {
      // Don't fetch data if user is not authenticated
      if (!isAuthenticated) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Add a timeout to prevent infinite loading
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout')), 10000)
        );

        const dataPromise = Promise.all([
          dashboardService.getDashboardStats(userRole),
          dashboardService.getPendingSubmissions(),
          dashboardService.getRecentActivity(),
          dashboardService.getSystemLogs()
        ]);

        const [statsData, submissionsData, activityData, logsData] = await Promise.race([
          dataPromise,
          timeoutPromise
        ]) as any[];

        setStats(statsData);
        setPendingSubmissions(submissionsData);
        setRecentActivity(activityData);
        setSystemLogs(logsData);

      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
        setError('Failed to load dashboard data - showing cached/fallback data');
        // Set fallback data even on error
        setStats({
          totalUsers: 0,
          pendingSubmissions: 0,
          pendingEdits: 0,
          totalProducts: 0,
          recentActivity: 0,
          ...(userRole === 'owner' && {
            systemHealth: 0,
            databaseSize: '0 GB',
            apiCalls: 0
          })
        });
        setPendingSubmissions([]);
        setRecentActivity([]);
        setSystemLogs([]);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [userRole, isAuthenticated]);

  // Update cache status timer every 5 minutes
  useEffect(() => {
    const updateCacheStatus = () => {
      setCacheStatus(dashboardService.getTimeUntilNextUpdate());
    };

    updateCacheStatus();
    const interval = setInterval(updateCacheStatus, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  // Refresh data when user performs actions
  const handleRefresh = async () => {
    try {
      setLoading(true);
      const [statsData, submissionsData] = await Promise.all([
        dashboardService.refreshStats(userRole),
        dashboardService.refreshPendingSubmissions()
      ]);
      
      setStats(statsData);
      setPendingSubmissions(submissionsData);
    } catch (err) {
      console.error('Failed to refresh data:', err);
      setError('Failed to refresh data');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'overview', name: 'Overview', icon: BarChart3 },
    { id: 'moderation', name: 'Product Moderation', icon: Shield },
    { id: 'users', name: 'User Management', icon: Users },
    { id: 'analytics', name: 'Analytics', icon: TrendingUp },
    ...(isOwner ? [
      { id: 'system', name: 'System Management', icon: Database },
      { id: 'ownership', name: 'Owner Tools', icon: Crown }
    ] : []),
    { id: 'settings', name: 'Settings', icon: Settings }
  ];

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">Pending</span>;
      case 'approved':
        return <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Approved</span>;
      case 'rejected':
        return <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">Rejected</span>;
      default:
        return null;
    }
  };

  const getLogBadge = (type: string) => {
    switch (type) {
      case 'error':
        return <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">Error</span>;
      case 'warning':
        return <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">Warning</span>;
      case 'info':
        return <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">Info</span>;
      case 'success':
        return <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Success</span>;
      default:
        return null;
    }
  };

  const handleApproveSubmission = async (submissionId: string) => {
    try {
      await dashboardService.approveSubmission(submissionId);
      // Refresh pending submissions after approval
      const updatedSubmissions = await dashboardService.refreshPendingSubmissions();
      setPendingSubmissions(updatedSubmissions);
      // Update stats to reflect the change
      const updatedStats = await dashboardService.refreshStats(userRole);
      setStats(updatedStats);
    } catch (error) {
      console.error('Failed to approve submission:', error);
      setError('Failed to approve submission');
    }
  };

  const handleRejectSubmission = async (submissionId: string) => {
    try {
      await dashboardService.rejectSubmission(submissionId);
      // Refresh pending submissions after rejection
      const updatedSubmissions = await dashboardService.refreshPendingSubmissions();
      setPendingSubmissions(updatedSubmissions);
      // Update stats to reflect the change
      const updatedStats = await dashboardService.refreshStats(userRole);
      setStats(updatedStats);
    } catch (error) {
      console.error('Failed to reject submission:', error);
      setError('Failed to reject submission');
    }
  };

  const handlePromoteToModerator = (userId: string) => {
    console.log('Promoting user to moderator:', userId);
  };

  const handlePromoteToAdmin = (userId: string) => {
    console.log('Promoting user to admin:', userId);
  };

  const handleBanUser = (userId: string) => {
    console.log('Banning user:', userId);
  };

  const handleDeleteUser = (userId: string) => {
    console.log('Deleting user:', userId);
  };

  const handleSystemRestart = () => {
    console.log('Restarting system...');
  };

  const handleDatabaseBackup = () => {
    console.log('Creating database backup...');
  };

  const handleOverridePromote = (userId: string, role: string) => {
    console.log(`Override promoting user ${userId} to ${role}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <DashboardHeader 
        isOwner={isOwner}
        cacheStatus={cacheStatus}
        loading={loading}
        onRefresh={handleRefresh}
      />

      {/* Loading and Error States */}
      {loading && (
        <div className="bg-blue-50 border-b border-blue-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span className="text-blue-800 text-sm">Loading dashboard data...</span>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border-b border-red-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <span className="text-red-800 text-sm">{error}</span>
              </div>
              <button
                onClick={handleRefresh}
                className="text-red-600 hover:text-red-800 text-sm font-medium"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      )}

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
                      : 'border-transparent text-black hover:text-blue-500 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.name}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && (
          <div className="space-y-8">
            <StatsCards stats={stats} isOwner={isOwner} />
            <RecentActivityComponent activities={recentActivity} />
          </div>
        )}

        {activeTab === 'moderation' && (
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-black mb-4">Product Moderation</h3>
              <div className="flex items-center space-x-4">
                <a 
                  href="/products?status=pending" 
                  className="px-4 py-2 bg-blue-100 text-blue-800 rounded-md hover:bg-blue-200 font-medium"
                >
                  View All Products in Review
                </a>
                <span className="text-sm text-black">
                  {stats.pendingSubmissions} pending submissions • {stats.pendingEdits} pending edits
                </span>
              </div>
            </div>

            <PendingSubmissions 
              submissions={pendingSubmissions}
              onApprove={handleApproveSubmission}
              onReject={handleRejectSubmission}
            />
          </div>
        )}

        {activeTab === 'users' && (
          <UserManagement
            isOwner={isOwner}
            onPromoteToModerator={handlePromoteToModerator}
            onPromoteToAdmin={handlePromoteToAdmin}
            onBanUser={handleBanUser}
            onDeleteUser={handleDeleteUser}
          />
        )}

        {activeTab === 'analytics' && (
          <Analytics stats={stats} isOwner={isOwner} />
        )}

        {activeTab === 'system' && isOwner && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="px-6 py-4 border-b">
                <h3 className="text-lg font-semibold text-black">System Management</h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="text-md font-medium text-black">System Actions</h4>
                    <div className="space-y-2">
                      <button
                        onClick={handleSystemRestart}
                        className="w-full px-4 py-2 text-sm font-medium bg-yellow-100 text-yellow-800 rounded hover:bg-yellow-200 flex items-center space-x-2"
                      >
                        <Zap className="w-4 h-4" />
                        <span>Restart System</span>
                      </button>
                      <button
                        onClick={handleDatabaseBackup}
                        className="w-full px-4 py-2 text-sm font-medium bg-blue-100 text-blue-800 rounded hover:bg-blue-200 flex items-center space-x-2"
                      >
                        <Database className="w-4 h-4" />
                        <span>Backup Database</span>
                      </button>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h4 className="text-md font-medium text-black">Recent System Logs</h4>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {systemLogs.map((log) => (
                        <div key={log.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <div className="flex items-center space-x-2">
                            {getLogBadge(log.type)}
                            <span className="text-sm text-black">{log.message}</span>
                          </div>
                          <span className="text-xs text-black">{formatDate(log.timestamp)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'ownership' && isOwner && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="px-6 py-4 border-b">
                <h3 className="text-lg font-semibold text-black flex items-center space-x-2">
                  <Crown className="w-5 h-5 text-yellow-500" />
                  <span>Owner-Only Tools</span>
                </h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="text-md font-medium text-black">Override Promotions</h4>
                    <p className="text-sm text-black">Bypass contribution requirements for role promotions</p>
                    <div className="space-y-2">
                      <button
                        onClick={() => handleOverridePromote('user123', 'moderator')}
                        className="w-full px-4 py-2 text-sm font-medium bg-yellow-100 text-yellow-800 rounded hover:bg-yellow-200 flex items-center space-x-2"
                      >
                        <Key className="w-4 h-4" />
                        <span>Override Promote to Moderator</span>
                      </button>
                      <button
                        onClick={() => handleOverridePromote('user123', 'admin')}
                        className="w-full px-4 py-2 text-sm font-medium bg-purple-100 text-purple-800 rounded hover:bg-purple-200 flex items-center space-x-2"
                      >
                        <Crown className="w-4 h-4" />
                        <span>Override Promote to Admin</span>
                      </button>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h4 className="text-md font-medium text-black">Platform Control</h4>
                    <p className="text-sm text-black">Ultimate platform management capabilities</p>
                    <div className="space-y-2">
                      <button
                        onClick={() => console.log('Transfer ownership')}
                        className="w-full px-4 py-2 text-sm font-medium bg-red-100 text-red-800 rounded hover:bg-red-200 flex items-center space-x-2"
                      >
                        <Lock className="w-4 h-4" />
                        <span>Transfer Ownership</span>
                      </button>
                      <button
                        onClick={() => console.log('Platform shutdown')}
                        className="w-full px-4 py-2 text-sm font-medium bg-red-100 text-red-800 rounded hover:bg-red-200 flex items-center space-x-2"
                      >
                        <AlertTriangle className="w-4 h-4" />
                        <span>Emergency Shutdown</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <SettingsComponent isOwner={isOwner} />
        )}
      </div>
    </div>
  );
}
