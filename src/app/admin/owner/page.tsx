'use client';

import { useNextAuth } from '@/lib/contexts/NextAuthContext';
import {
  Activity,
  AlertTriangle,
  Ban,
  BarChart3,
  CheckCircle,
  Clock,
  Crown,
  Database,
  FileText,
  Globe,
  Key,
  Lock,
  Shield,
  Trash2,
  UserPlus,
  Users,
  XCircle,
  Zap
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface OwnerStats {
  totalUsers: number;
  pendingSubmissions: number;
  pendingEdits: number;
  totalProducts: number;
  recentActivity: number;
  systemHealth: number;
  databaseSize: string;
  apiCalls: number;
}

interface PendingSubmission {
  id: string;
  productName: string;
  brandName: string;
  category: string;
  submittedBy: string;
  submittedAt: string;
  status: 'pending' | 'approved' | 'rejected';
}

interface RecentActivity {
  id: string;
  type: 'submission' | 'edit' | 'approval' | 'rejection';
  description: string;
  user: string;
  timestamp: string;
}

interface SystemLog {
  id: string;
  type: 'error' | 'warning' | 'info' | 'success';
  message: string;
  timestamp: string;
  component: string;
}

export default function OwnerDashboard() {
  const { user } = useNextAuth();
  const [activeTab, setActiveTab] = useState('overview');
  // Remove dummy data
  const [stats, setStats] = useState<OwnerStats>({
    totalUsers: 0,
    pendingSubmissions: 0,
    pendingEdits: 0,
    totalProducts: 0,
    recentActivity: 0,
    systemHealth: 0,
    databaseSize: '',
    apiCalls: 0
  });

  const [pendingSubmissions, setPendingSubmissions] = useState<PendingSubmission[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);

  // Fetch logic
  const didFetchRef = useRef(false);
  useEffect(() => {
    if (didFetchRef.current) return;
    didFetchRef.current = true;
    async function fetchDashboardData() {
      try {
        // TODO: Implement stats endpoint; keep zero defaults for now

        // Fetch pending submissions with pagination
        const pendingResponse = await fetch('/api/admin/dashboard/pending-submissions?page=1&limit=10');
        if (pendingResponse.ok) {
          const pendingJson = await pendingResponse.json();
          const mapped = (pendingJson.submissions || []).map((s: any) => ({
            id: String(s.id),
            productName: s.productName ?? s.name ?? 'Unknown',
            brandName: s.brand?.name ?? 'Unknown',
            category: s.category ?? 'Unknown',
            submittedBy: s.submittedBy ?? 'Unknown',
            submittedAt: s.submittedAt,
            status: s.status ?? 'pending',
          }));
          setPendingSubmissions(mapped);
        }

        // Fetch recent activity with pagination
        const activityResponse = await fetch('/api/admin/dashboard/recent-activity?page=1&limit=10');
        if (activityResponse.ok) {
          const activityJson = await activityResponse.json();
          const mapped = (activityJson.activities || []).map((a: any) => ({
            id: a.id,
            type: a.type,
            description:
              a.type === 'product_approved' && a.product?.name
                ? `${a.product.name} approved`
                : a.type === 'product_created' && a.product?.name
                ? `New product: ${a.product.name}`
                : a.metadata?.title ?? 'Activity',
            user: a.user?.username ?? 'Unknown',
            timestamp: a.timestamp ?? a.created_at,
          }));
          setRecentActivity(mapped);
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data', error);
      }
    }

    fetchDashboardData();
  }, []);

  // Ensure tabs only include desired components
  const tabs = [
    { id: 'recent activity', name: 'Recent Activity', icon: BarChart3 },
    { id: 'moderation', name: 'Product Moderation', icon: Shield },
    { id: 'users', name: 'User Management', icon: Users }
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

  const handleApproveSubmission = (submissionId: string) => {
    console.log('Approving submission:', submissionId);
    // TODO: Implement approval logic
  };

  const handleRejectSubmission = (submissionId: string) => {
    console.log('Rejecting submission:', submissionId);
    // TODO: Implement rejection logic
  };

  const handlePromoteToModerator = (userId: string) => {
    console.log('Promoting user to moderator:', userId);
    // TODO: Implement promotion logic
  };

  const handlePromoteToAdmin = (userId: string) => {
    console.log('Promoting user to admin:', userId);
    // TODO: Implement promotion logic
  };

  const handleBanUser = (userId: string) => {
    console.log('Banning user:', userId);
    // TODO: Implement ban logic
  };

  const handleDeleteUser = (userId: string) => {
    console.log('Deleting user:', userId);
    // TODO: Implement delete logic
  };

  const handleOverridePromote = (userId: string, role: string) => {
    console.log(`Override promoting user ${userId} to ${role}`);
    // TODO: Implement override promotion
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <div className="flex items-center space-x-2">
                <Crown className="w-6 h-6 text-yellow-500" />
                <h1 className="text-2xl font-bold text-black">Owner Dashboard</h1>
              </div>
              <p className="text-black mt-1">
                Complete platform control and management
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Crown className="w-5 h-5 text-yellow-500" />
              <span className="text-black font-medium">Owner</span>
            </div>
          </div>
        </div>
      </div>

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
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <Clock className="w-6 h-6 text-yellow-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-black">Pending Submissions</p>
                    <p className="text-2xl font-bold text-black">{stats.pendingSubmissions}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <FileText className="w-6 h-6 text-orange-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-black">Pending Edits</p>
                    <p className="text-2xl font-bold text-black">{stats.pendingEdits}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-black">Total Products</p>
                    <p className="text-2xl font-bold text-black">{stats.totalProducts}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Activity className="w-6 h-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-black">Recent Activity</p>
                    <p className="text-2xl font-bold text-black">{stats.recentActivity}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Owner-specific System Health Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Zap className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Database className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Globe className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="px-6 py-4 border-b">
                <h3 className="text-lg font-semibold text-black">Recent Activity</h3>
              </div>
              <div className="divide-y divide-gray-200">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-full ${
                          activity.type === 'approval' ? 'bg-green-100' :
                          activity.type === 'submission' ? 'bg-blue-100' :
                          activity.type === 'edit' ? 'bg-yellow-100' : 'bg-red-100'
                        }`}>
                          {activity.type === 'approval' ? <CheckCircle className="w-4 h-4 text-green-600" /> :
                           activity.type === 'submission' ? <FileText className="w-4 h-4 text-blue-600" /> :
                           activity.type === 'edit' ? <FileText className="w-4 h-4 text-yellow-600" /> : <XCircle className="w-4 h-4 text-red-600" />}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-black">{activity.description}</p>
                          <p className="text-sm text-black">by {activity.user}</p>
                        </div>
                      </div>
                      <span className="text-sm text-black">{formatDate(activity.timestamp)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'moderation' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="px-6 py-4 border-b">
                <h3 className="text-lg font-semibold text-black">Pending Product Submissions</h3>
              </div>
              <div className="divide-y divide-gray-200">
                {pendingSubmissions.map((submission) => (
                  <div key={submission.id} className="px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-4">
                          <div>
                            <h4 className="text-sm font-medium text-black">{submission.productName}</h4>
                            <p className="text-sm text-black">Brand: {submission.brandName}</p>
                            <p className="text-sm text-black">Category: {submission.category}</p>
                          </div>
                          <div className="text-sm text-black">
                            <p>Submitted by: {submission.submittedBy}</p>
                            <p>{formatDate(submission.submittedAt)}</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        {getStatusBadge(submission.status)}
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleApproveSubmission(submission.id)}
                            className="px-3 py-1 text-xs font-medium bg-green-100 text-green-800 rounded hover:bg-green-200"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleRejectSubmission(submission.id)}
                            className="px-3 py-1 text-xs font-medium bg-red-100 text-red-800 rounded hover:bg-red-200"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="px-6 py-4 border-b">
                <h3 className="text-lg font-semibold text-black">User Management</h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="text-md font-medium text-black">Promote Users</h4>
                    <div className="space-y-2">
                      <button
                        onClick={() => handlePromoteToModerator('user123')}
                        className="w-full px-4 py-2 text-sm font-medium bg-blue-100 text-blue-800 rounded hover:bg-blue-200 flex items-center space-x-2"
                      >
                        <UserPlus className="w-4 h-4" />
                        <span>Promote to Moderator</span>
                      </button>
                      <button
                        onClick={() => handlePromoteToAdmin('user123')}
                        className="w-full px-4 py-2 text-sm font-medium bg-purple-100 text-purple-800 rounded hover:bg-purple-200 flex items-center space-x-2"
                      >
                        <Crown className="w-4 h-4" />
                        <span>Promote to Admin</span>
                      </button>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h4 className="text-md font-medium text-black">User Actions</h4>
                    <div className="space-y-2">
                      <button
                        onClick={() => handleBanUser('user123')}
                        className="w-full px-4 py-2 text-sm font-medium bg-red-100 text-red-800 rounded hover:bg-red-200 flex items-center space-x-2"
                      >
                        <Ban className="w-4 h-4" />
                        <span>Ban User</span>
                      </button>
                      <button
                        onClick={() => handleDeleteUser('user123')}
                        className="w-full px-4 py-2 text-sm font-medium bg-red-100 text-red-800 rounded hover:bg-red-200 flex items-center space-x-2"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Delete User</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'ownership' && (
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
      </div>
    </div>
  );
}