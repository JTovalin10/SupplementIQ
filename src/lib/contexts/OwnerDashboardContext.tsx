'use client';

import { useAuth } from '@/lib/contexts';

import { supabase } from '@/lib/database/supabase/client';
import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';

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
  slug: string;
  productName: string;
  brandName: string;
  category: string;
  submittedBy: string;
  submittedAt: string;
  status: 'pending' | 'approved' | 'rejected';
}

// RecentActivity interface removed - no longer used in Owner Dashboard

interface OwnerDashboardContextType {
  stats: OwnerStats;
  pendingSubmissions: PendingSubmission[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  handleApproveSubmission: (submissionId: string) => Promise<void>;
  handleRejectSubmission: (submissionId: string) => Promise<void>;
  handlePromoteToModerator: (userId: string) => void;
  handlePromoteToAdmin: (userId: string) => void;
  handleOverridePromote: (userId: string, role: string) => void;
  
  // Data refresh
  refreshData: () => Promise<void>;
}

const OwnerDashboardContext = createContext<OwnerDashboardContextType | undefined>(undefined);

export function useOwnerDashboard() {
  const context = useContext(OwnerDashboardContext);
  if (context === undefined) {
    throw new Error('useOwnerDashboard must be used within an OwnerDashboardProvider');
  }
  return context;
}

interface OwnerDashboardProviderProps {
  children: React.ReactNode;
}

export function OwnerDashboardProvider({ children }: OwnerDashboardProviderProps) {
  const { user, permissions } = useAuth();
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
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const didFetchRef = useRef(false);

  // Validate that user is owner before allowing access
  if (!user || !permissions?.canAccessOwnerTools) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600">
              You must be an owner to access this dashboard.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Memoized data fetching function
  const fetchDashboardData = useMemo(() => async () => {
    if (didFetchRef.current) return;
    didFetchRef.current = true;
    
    console.log('🔄 Starting to fetch dashboard data...');
    setIsLoading(true);
    setError(null);
    
    try {
      // Get the current session and access token
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        throw new Error('No active session found. Please log in again.');
      }

      console.log('📡 Fetching pending submissions...');
      // Fetch pending submissions with pagination
      const pendingResponse = await fetch('/api/admin/dashboard/pending-submissions?page=1&limit=10', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });
      
      console.log('📡 Pending submissions response:', pendingResponse.status);
      
      if (pendingResponse.ok) {
        const pendingJson = await pendingResponse.json();
        console.log('📡 Pending submissions data:', pendingJson);
        const mapped = (pendingJson.submissions || []).map((s: any) => ({
          id: String(s.id),
          slug: s.slug ?? 'unknown-slug',
          productName: s.productName ?? s.name ?? 'Unknown',
          brandName: s.brandName ?? 'Unknown',
          category: s.category ?? 'Unknown',
          submittedBy: s.submittedBy ?? 'Unknown',
          submittedAt: s.submittedAt,
          status: s.status ?? 'pending',
        }));
        setPendingSubmissions(mapped);
        console.log('✅ Successfully loaded submissions:', mapped.length);
      } else {
        const errorText = await pendingResponse.text();
        console.error('❌ Failed to fetch pending submissions:', pendingResponse.status, errorText);
        throw new Error(`Failed to fetch pending submissions: ${pendingResponse.status}`);
      }

      // Recent activity is no longer used in Owner Dashboard
      // Removed recent activity fetch to prevent unnecessary API calls
    } catch (error) {
      console.error('❌ Failed to fetch dashboard data', error);
      setError('Failed to fetch dashboard data');
    } finally {
      console.log('🏁 Finished fetching dashboard data');
      setIsLoading(false);
    }
  }, []);

  // Initial data fetch
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Memoized action handlers
  const handleApproveSubmission = useMemo(() => async (submissionId: string) => {
    try {
      const response = await fetch('/api/admin/submission-action', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          submissionId,
          action: 'approve',
          adminId: user?.id,
          notes: 'Approved by owner'
        }),
      });

      const result = await response.json();

      if (result.success) {
        await refreshData();
        alert(`Product "${result.data.productName}" approved successfully!`);
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Error approving submission:', error);
      alert('Failed to approve submission');
    }
  }, [user?.id]);

  const handleRejectSubmission = useMemo(() => async (submissionId: string) => {
    const reason = prompt('Please provide a reason for rejection:');
    if (!reason) return;

    try {
      const response = await fetch('/api/admin/submission-action', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          submissionId,
          action: 'reject',
          adminId: user?.id,
          reason,
          notes: 'Rejected by owner'
        }),
      });

      const result = await response.json();

      if (result.success) {
        await refreshData();
        alert(`Product "${result.data.productName}" rejected successfully!`);
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Error rejecting submission:', error);
      alert('Failed to reject submission');
    }
  }, [user?.id]);

  const handlePromoteToModerator = useMemo(() => (targetUserId: string) => {
    console.log(`Owner ${user.id} promoting user ${targetUserId} to moderator`);
    // TODO: Implement promotion logic with owner validation
    // API call should include owner ID for audit trail
  }, [user.id]);

  const handlePromoteToAdmin = useMemo(() => (targetUserId: string) => {
    console.log(`Owner ${user.id} promoting user ${targetUserId} to admin`);
    // TODO: Implement promotion logic with owner validation
    // API call should include owner ID for audit trail
  }, [user.id]);


  const handleOverridePromote = useMemo(() => (targetUserId: string, role: string) => {
    console.log(`Owner ${user.id} override promoting user ${targetUserId} to ${role}`);
    // TODO: Implement override promotion with owner validation
    // API call should include owner ID for audit trail
  }, [user.id]);


  const refreshData = useMemo(() => async () => {
    didFetchRef.current = false;
    await fetchDashboardData();
  }, [fetchDashboardData]);

  const value = useMemo(() => ({
    stats,
    pendingSubmissions,
    isLoading,
    error,
    handleApproveSubmission,
    handleRejectSubmission,
    handlePromoteToModerator,
    handlePromoteToAdmin,
    handleOverridePromote,
    refreshData,
  }), [
    stats,
    pendingSubmissions,
    isLoading,
    error,
    handleApproveSubmission,
    handleRejectSubmission,
    handlePromoteToModerator,
    handlePromoteToAdmin,
    handleOverridePromote,
    refreshData,
  ]);

  return (
    <OwnerDashboardContext.Provider value={value}>
      {children}
    </OwnerDashboardContext.Provider>
  );
}
