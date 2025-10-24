'use client';

import { useEffect, useRef, useState } from 'react';

interface ActivityItem {
  id: string;
  action: string;
  user: string;
  timestamp: string;
  details: string;
}

export default function RecentActivity() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const hasFetchedRef = useRef(false);
  useEffect(() => {
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;
    fetchRecentActivity();
  }, []);

  const fetchRecentActivity = async () => {
    try {
      setLoading(true);
      setError(null);
      const page = 1;
      const limit = 10;
      const url = `/api/admin/dashboard/recent-activity?page=${page}&limit=${limit}`;
      const fetcher = async () => {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to load');
        return response.json();
      };
      const json = await fetcher();
      const mapped: ActivityItem[] = (json.activities || []).map((a: any) => {
        const ts = a.timestamp ?? a.created_at;
        if (a.type === 'product_approved') {
          return {
            id: a.id,
            action: 'Product approved',
            user: a.user?.username ?? 'Unknown',
            timestamp: ts,
            details: a.product ? `${a.product.name} approved` : 'Product approved',
          };
        }
        if (a.type === 'product_created') {
          return {
            id: a.id,
            action: 'Product created',
            user: a.user?.username ?? 'System',
            timestamp: ts,
            details: a.product ? `New product: ${a.product.name}` : 'New product created',
          };
        }
        return {
          id: a.id,
          action: 'Comment',
          user: a.user?.username ?? 'Unknown',
          timestamp: ts,
          details: a.metadata?.title ?? 'New comment',
        };
      });
      setActivities(mapped);
    } catch (err) {
      console.error('Failed to fetch recent activity:', err);
      setError('Failed to load recent activity');
    } finally {
      setLoading(false);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
        </div>
        <div className="p-6">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={fetchRecentActivity}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 text-sm"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b">
        <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
      </div>
      <div className="p-6">
        {activities.length > 0 ? (
          <div className="space-y-4">
            {activities.slice(0, 5).map((activity) => (
              <div key={activity.id} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                  <p className="text-sm text-gray-500">{activity.details}</p>
                  <p className="text-xs text-gray-400">by {activity.user}</p>
                </div>
                <span className="text-xs text-gray-400">{formatTimestamp(activity.timestamp)}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No recent activity</p>
        )}
      </div>
    </div>
  );
}