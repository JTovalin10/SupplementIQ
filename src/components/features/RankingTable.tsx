'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

interface RankingItem {
  id: string;
  username: string;
  reputation_points: number;
}

interface RankingTableProps {
  category?: string;
  sortBy?: 'reputation';
  timeRange?: 'all_time' | 'yearly' | 'monthly' | 'weekly' | 'daily';
  limit?: number;
}

export default function RankingTable({ 
  category, 
  sortBy = 'reputation', 
  timeRange: initialTimeRange = 'yearly',
  limit = 10 
}: RankingTableProps) {
  const [rankings, setRankings] = useState<RankingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [timeRange, setTimeRange] = useState(initialTimeRange);
  const fetchingRef = useRef(false);
  const cacheRef = useRef<Map<string, any>>(new Map());

  // Memoize the cache key to avoid unnecessary re-computations
  const cacheKey = useMemo(() => {
    const params = new URLSearchParams();
    if (category) params.append('category', category);
    params.append('sortBy', sortBy);
    params.append('timeRange', timeRange);
    params.append('limit', limit.toString());
    params.append('page', currentPage.toString());
    params.append('_t', Date.now().toString()); // Add timestamp to bust cache
    return params.toString();
  }, [category, sortBy, timeRange, limit, currentPage]);

  // Fetch rankings data with proper caching
  const rankingsData = useMemo(() => {
    // Check if we have cached data for this exact request
    const cached = cacheRef.current.get(cacheKey);
    if (cached) {
      console.log('🚀 Using cached rankings data:', cached.rankings?.length || 0, 'users');
      return cached;
    }

    // If no cache, trigger fetch
    if (!fetchingRef.current) {
      console.log('🔄 Cache miss, triggering fetch');
      fetchingRef.current = true;
      
      const fetchRankings = async () => {
        try {
          setLoading(true);
          setError(null);
          
          console.log(`🔍 Fetching rankings: ${cacheKey}`);
          const baseUrl = typeof window !== 'undefined' 
            ? window.location.origin 
            : process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
          const response = await fetch(`${baseUrl}/api/rankings?${cacheKey}`);
          
          if (!response.ok) {
            throw new Error('Failed to fetch rankings');
          }

          const data = await response.json();
          console.log(`✅ Rankings fetched: ${data.rankings?.length || 0} items`);
          console.log('📊 Rankings data:', data.rankings);
          
          // Cache the result
          cacheRef.current.set(cacheKey, data);
          
          setRankings(data.rankings || []);
          setTotalPages(data.totalPages || 1);
          setTotalCount(data.totalCount || 0);
        } catch (err) {
          console.error('Error fetching rankings:', err);
          setError(err instanceof Error ? err.message : 'Failed to load rankings');
        } finally {
          setLoading(false);
          fetchingRef.current = false;
        }
      };

      fetchRankings();
    }

    // Return loading state while fetching
    return null;
  }, [cacheKey]);

  // Update state when we have data
  useEffect(() => {
    if (rankingsData) {
      console.log('📝 Updating state with rankings data:', rankingsData.rankings?.length || 0, 'users');
      setRankings(rankingsData.rankings || []);
      setTotalPages(rankingsData.totalPages || 1);
      setTotalCount(rankingsData.totalCount || 0);
    }
  }, [rankingsData]);

  // Retry function for error state
  const retryFetch = () => {
    // Clear cache and reset fetching state
    cacheRef.current.delete(cacheKey);
    fetchingRef.current = false;
    setError(null);
    setLoading(true);
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-600';
    if (score >= 6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBackground = (score: number) => {
    if (score >= 8) return 'bg-green-100';
    if (score >= 6) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Loading Rankings...</h3>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="border rounded-lg p-4 animate-pulse">
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
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Rankings</h3>
        </div>
        <div className="p-6">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={retryFetch}
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
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              User Rankings
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Sorted by reputation • {timeRange.replace('_', ' ')} • Top {Math.min(limit, 100)}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-600">Time Range:</label>
            <select
              value={timeRange}
              onChange={(e) => {
                setTimeRange(e.target.value as any);
                setCurrentPage(1);
              }}
              className="px-3 py-1 border border-gray-300 rounded text-sm text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all_time">All Time</option>
              <option value="yearly">Yearly</option>
              <option value="monthly">Monthly</option>
              <option value="weekly">Weekly</option>
              <option value="daily">Daily</option>
            </select>
          </div>
        </div>
      </div>
      
      {/* Update Notice for Non-Daily Ranges */}
      {timeRange !== 'daily' && (
        <div className="px-6 py-3 bg-blue-50 border-b border-blue-200">
          <div className="flex items-center">
            <svg className="w-4 h-4 text-blue-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <p className="text-sm text-blue-800">
              Rankings are updated daily at 12:00 AM PST
            </p>
          </div>
        </div>
      )}
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                Rank
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                Reputation Points
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {rankings.length > 0 ? (
              rankings.map((item, index) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    #{index + 1}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <button
                      onClick={() => window.location.href = `/user/dashboard/${item.id}`}
                      className="flex items-center hover:bg-gray-50 p-2 rounded-lg transition-colors w-full text-left"
                    >
                      <div className="h-10 w-10 rounded-full bg-gray-300 mr-3 flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-600">
                          {item.username.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{item.username}</div>
                        <div className="text-sm text-gray-500">Click to view dashboard</div>
                      </div>
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {item.reputation_points.toFixed(0)}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={3} className="px-6 py-4 text-center text-sm text-gray-900">
                  No rankings available at the moment.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-6 py-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing {((currentPage - 1) * limit) + 1} to {Math.min(currentPage * limit, totalCount)} of {totalCount} results
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Previous
              </button>
              <span className="text-sm text-gray-700">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
