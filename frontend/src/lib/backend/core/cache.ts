/**
 * Simple in-memory cache utility for product pagination
 * In production, you would use Redis or another caching solution
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

class SimpleCache {
  private cache = new Map<string, CacheEntry<any>>();

  /**
   * Set a cache entry with TTL
   * 
   * @param key - Cache key
   * @param data - Data to cache
   * @param ttlSeconds - Time to live in seconds (default: 1 hour)
   */
  set<T>(key: string, data: T, ttlSeconds: number = 3600): void {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttlSeconds * 1000,
    };
    this.cache.set(key, entry);
  }

  /**
   * Get a cache entry if it exists and hasn't expired
   * 
   * @param key - Cache key
   * @returns Cached data or null if not found/expired
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Delete a cache entry
   * 
   * @param key - Cache key to delete
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Generate cache key for product pagination
   * 
   * @param page - Page number
   * @param limit - Items per page
   * @param category - Optional category filter
   * @param search - Optional search query
   * @param sort - Sort field
   * @param order - Sort order
   * @returns Cache key string
   */
  generateProductKey(
    page: number,
    limit: number,
    category?: string,
    search?: string,
    sort: string = 'created_at',
    order: string = 'desc'
  ): string {
    const params = [
      `page:${page}`,
      `limit:${limit}`,
      `sort:${sort}`,
      `order:${order}`,
    ];

    if (category) {
      params.push(`category:${category}`);
    }

    if (search) {
      params.push(`search:${search}`);
    }

    return `products:${params.join('|')}`;
  }

  /**
   * Get cache statistics
   * 
   * @returns Cache statistics object
   */
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

// Export singleton instance
export const cache = new SimpleCache();

/**
 * Cache middleware for product routes
 * Checks cache for first 2 pages only
 */
export const getCachedProducts = <T>(
  page: number,
  limit: number,
  category?: string,
  search?: string,
  sort: string = 'created_at',
  order: string = 'desc'
): T | null => {
  // Only cache first 2 pages
  if (page > 2) {
    return null;
  }

  const key = cache.generateProductKey(page, limit, category, search, sort, order);
  return cache.get<T>(key);
};

/**
 * Cache products response
 */
export const setCachedProducts = <T>(
  page: number,
  limit: number,
  data: T,
  category?: string,
  search?: string,
  sort: string = 'created_at',
  order: string = 'desc',
  ttlSeconds: number = 3600
): void => {
  // Only cache first 2 pages
  if (page > 2) {
    return;
  }

  const key = cache.generateProductKey(page, limit, category, search, sort, order);
  cache.set(key, data, ttlSeconds);
};
