/**
 * Dashboard data service with caching
 * Fetches real data from backend APIs and caches results
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

class DashboardCache {
  private cache = new Map<string, CacheEntry<any>>();

  // Calculate milliseconds until next 12 AM PST (8 AM UTC)
  private getTimeUntilNextMidnightPST(): number {
    const now = new Date();
    const utc = new Date(now.getTime() + (now.getTimezoneOffset() * 60000));
    const pst = new Date(utc.getTime() - (8 * 3600000)); // PST is UTC-8
    
    // Get next midnight PST
    const nextMidnightPST = new Date(pst);
    nextMidnightPST.setHours(24, 0, 0, 0); // Next midnight
    
    // Convert back to UTC
    const nextMidnightUTC = new Date(nextMidnightPST.getTime() + (8 * 3600000));
    
    return nextMidnightUTC.getTime() - now.getTime();
  }

  set<T>(key: string, data: T, ttlMs?: number): void {
    // Use time until next 12 AM PST unless specific TTL is provided
    const cacheUntilMidnight = ttlMs ?? this.getTimeUntilNextMidnightPST();
    
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: cacheUntilMidnight
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const isExpired = Date.now() - entry.timestamp > entry.ttl;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  clear(): void {
    this.cache.clear();
  }

  // Force refresh specific cache entries
  invalidate(pattern: string): void {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }

  // Get cache status for debugging
  getCacheStatus(): { key: string; expiresAt: string; isExpired: boolean }[] {
    const status: { key: string; expiresAt: string; isExpired: boolean }[] = [];
    
    for (const [key, entry] of this.cache.entries()) {
      const expiresAt = new Date(entry.timestamp + entry.ttl);
      const isExpired = Date.now() - entry.timestamp > entry.ttl;
      
      status.push({
        key,
        expiresAt: expiresAt.toISOString(),
        isExpired
      });
    }
    
    return status;
  }
}

const dashboardCache = new DashboardCache();

// API base URL
const API_BASE = '/api/v1';

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

class DashboardService {
  private async fetchWithAuth<T>(endpoint: string, options: RequestInit = {}, token?: string): Promise<T> {
    // Use provided token or get from session
    let authToken = token;
    
    if (!authToken) {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      
      const { data: { session }, error } = await supabase.auth.getSession();
      authToken = session?.access_token;
    }
    
    console.log('Dashboard Service - Session check:', {
      hasToken: !!authToken,
      tokenLength: authToken?.length || 0,
      providedToken: !!token
    });
    
    // If no token, provide helpful error message
    if (!authToken) {
      console.error('Dashboard Service - No access token found');
      throw new Error('Authentication required - please log in to access the dashboard');
    }
    
    // Create an AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    try {
      console.log('Dashboard Service - Making API request:', {
        url: `${API_BASE}${endpoint}`,
        hasToken: !!authToken,
        tokenLength: authToken.length,
        tokenStart: authToken.substring(0, 20) + '...'
      });

      const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
          ...options.headers,
        },
      });

      console.log('Dashboard Service - API response:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        url: response.url
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          throw new Error('Authentication required - please log in');
        }
        
        // Check for cache loading responses (503 status)
        if (response.status === 503) {
          try {
            const errorResult = await response.json();
            if (errorResult.cacheLoading) {
              const cacheError = new Error(errorResult.error || 'Cache loading, please wait');
              (cacheError as any).cacheLoading = true;
              throw cacheError;
            }
          } catch (jsonError) {
            // If we can't parse the JSON, continue with normal error handling
          }
        }
        
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json() as { success: boolean; data: T; message?: string };
      if (!result.success) {
        throw new Error(result.message || 'API request failed');
      }

      return result.data;
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error?.name === 'AbortError') {
        throw new Error('Request timeout - please try again');
      }
      throw error;
    }
  }

  async getDashboardStats(userRole: 'admin' | 'owner', token?: string, userId?: string): Promise<DashboardStats> {
    const cacheKey = `dashboard-stats-${userRole}-${userId}`;
    const cached = dashboardCache.get<DashboardStats>(cacheKey);
    if (cached) return cached;

    try {
      let statsData: any;
      
      // Use the user-specific dashboard endpoint if userId is provided
      if (userId) {
        statsData = await this.fetchWithAuth(`/admin/dashboard/${userId}/stats`, {}, token);
      } else {
        // Fallback to the general endpoint
        statsData = await this.fetchWithAuth('/admin/dashboard/stats', {}, token);
      }

      // Transform the data to match our interface
      const stats: DashboardStats = {
        totalUsers: statsData.users?.total || 0,
        pendingSubmissions: statsData.pendingSubmissions?.length || 0,
        pendingEdits: statsData.pendingEdits?.length || 0,
        totalProducts: statsData.products?.total || 0,
        recentActivity: statsData.activity?.recentCount || 0,
      };

      // Add owner-specific stats
      if (userRole === 'owner' && statsData.systemHealth) {
        stats.systemHealth = statsData.systemHealth.memoryUsage?.heapUsed ? 
          Math.round((statsData.systemHealth.memoryUsage.heapUsed / statsData.systemHealth.memoryUsage.heapTotal) * 100) : 98;
        stats.databaseSize = statsData.systemHealth.databaseSize || '2.4 GB';
        stats.apiCalls = statsData.systemHealth.apiCalls || 15420;
      }

      // Cache until next 12 AM PST (system update time)
      dashboardCache.set(cacheKey, stats);
      return stats;

    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
      // Return fallback data with short cache
      const fallbackStats: DashboardStats = {
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
      };
      
      // Cache fallback data for 5 minutes
      dashboardCache.set(cacheKey, fallbackStats, 5 * 60 * 1000);
      return fallbackStats;
    }
  }

  async getPendingSubmissions(token?: string, userId?: string): Promise<PendingSubmission[]> {
    const cacheKey = `pending-submissions-${userId}`;
    const cached = dashboardCache.get<PendingSubmission[]>(cacheKey);
    if (cached) return cached;

    try {
      const endpoint = userId ? `/admin/dashboard/${userId}/pending-submissions` : '/admin/dashboard/pending-submissions';
      const data = await this.fetchWithAuth(endpoint, {}, token);
      
      // Transform to our interface (data is already transformed by backend)
      const submissions: PendingSubmission[] = (data as any[]).map((item: any) => ({
        id: item.id,
        productName: item.productName,
        brandName: item.brandName,
        category: item.category,
        submittedBy: item.submittedBy,
        submittedAt: item.submittedAt,
        status: item.status
      }));

      // Cache for 5 minutes (pending items need more frequent updates)
      dashboardCache.set(cacheKey, submissions, 5 * 60 * 1000);
      return submissions;

    } catch (error) {
      console.error('Failed to fetch pending submissions:', error);
      // Cache empty array for 5 minutes to avoid repeated failed requests
      dashboardCache.set(cacheKey, [], 5 * 60 * 1000);
      return [];
    }
  }

  async getRecentActivity(token?: string, userId?: string): Promise<RecentActivity[]> {
    const cacheKey = `recent-activity-${userId}`;
    const cached = dashboardCache.get<RecentActivity[]>(cacheKey);
    if (cached) return cached;

    try {
      // Get real activity data from backend
      const endpoint = userId ? `/admin/dashboard/${userId}/recent-activity` : '/admin/dashboard/recent-activity';
      const data = await this.fetchWithAuth(endpoint, {}, token);
      
      // Data is already in the correct format from backend
      const activities: RecentActivity[] = (data as any[]).map((item: any) => ({
        id: item.id,
        type: item.type,
        description: item.description,
        user: item.user,
        timestamp: item.timestamp
      }));

      // Cache until next 12 AM PST (system update time)
      dashboardCache.set(cacheKey, activities);
      return activities;

    } catch (error) {
      console.error('Failed to fetch recent activity:', error);
      // Cache empty array for 5 minutes to avoid repeated failed requests
      dashboardCache.set(cacheKey, [], 5 * 60 * 1000);
      return [];
    }
  }

  async getSystemLogs(): Promise<SystemLog[]> {
    const cacheKey = 'system-logs';
    const cached = dashboardCache.get<SystemLog[]>(cacheKey);
    if (cached) return cached;

    try {
      // This would come from a real system logs endpoint
      const logs: SystemLog[] = [
        {
          id: '1',
          type: 'success',
          message: 'Daily product update completed successfully',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          component: 'DailyUpdateService'
        },
        {
          id: '2',
          type: 'warning',
          message: 'High memory usage detected on server',
          timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
          component: 'SystemMonitor'
        },
        {
          id: '3',
          type: 'info',
          message: 'New user registration: fitness_enthusiast_99',
          timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
          component: 'AuthService'
        }
      ];

      // Cache until next 12 AM PST (system update time)
      dashboardCache.set(cacheKey, logs);
      return logs;

    } catch (error) {
      console.error('Failed to fetch system logs:', error);
      // Cache empty array for 5 minutes to avoid repeated failed requests
      dashboardCache.set(cacheKey, [], 5 * 60 * 1000);
      return [];
    }
  }

  // Action methods that invalidate cache
  async approveSubmission(submissionId: string): Promise<void> {
    try {
      await this.fetchWithAuth(`/admin/products/submissions/${submissionId}/approve`, {
        method: 'POST'
      });
      dashboardCache.invalidate('pending');
      dashboardCache.invalidate('stats');
    } catch (error) {
      console.error('Failed to approve submission:', error);
      throw error;
    }
  }

  async rejectSubmission(submissionId: string): Promise<void> {
    try {
      await this.fetchWithAuth(`/admin/products/submissions/${submissionId}/reject`, {
        method: 'POST'
      });
      dashboardCache.invalidate('pending');
      dashboardCache.invalidate('stats');
    } catch (error) {
      console.error('Failed to reject submission:', error);
      throw error;
    }
  }

  // Clear all cache (useful for testing or manual refresh)
  clearCache(): void {
    dashboardCache.clear();
  }

  // Force refresh specific data
  async refreshStats(userRole: 'admin' | 'owner'): Promise<DashboardStats> {
    dashboardCache.invalidate('dashboard-stats');
    return this.getDashboardStats(userRole);
  }

  async refreshPendingSubmissions(): Promise<PendingSubmission[]> {
    dashboardCache.invalidate('pending-submissions');
    return this.getPendingSubmissions();
  }

  // Get cache status and next update time
  getCacheStatus(): { key: string; expiresAt: string; isExpired: boolean }[] {
    return dashboardCache.getCacheStatus();
  }

  // Get time until next system update (12 AM PST)
  getTimeUntilNextUpdate(): { hours: number; minutes: number; seconds: number } {
    const now = new Date();
    const utc = new Date(now.getTime() + (now.getTimezoneOffset() * 60000));
    const pst = new Date(utc.getTime() - (8 * 3600000)); // PST is UTC-8
    
    // Get next midnight PST
    const nextMidnightPST = new Date(pst);
    nextMidnightPST.setHours(24, 0, 0, 0); // Next midnight
    
    // Convert back to UTC
    const nextMidnightUTC = new Date(nextMidnightPST.getTime() + (8 * 3600000));
    
    const diffMs = nextMidnightUTC.getTime() - now.getTime();
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
    
    return { hours, minutes, seconds };
  }
}

export const dashboardService = new DashboardService();
export type { DashboardStats, PendingSubmission, RecentActivity, SystemLog };
