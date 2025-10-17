/**
 * Simple in-memory cache utility for product pagination
 * JavaScript version for C++ component integration
 */

class SimpleCache {
  constructor() {
    this.cache = new Map();
  }

  /**
   * Set a cache entry with TTL
   */
  set(key, data, ttlSeconds = 3600) {
    const entry = {
      data,
      timestamp: Date.now(),
      ttl: ttlSeconds * 1000,
    };
    this.cache.set(key, entry);
  }

  /**
   * Get a cache entry if it exists and hasn't expired
   */
  get(key) {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  /**
   * Delete a cache entry
   */
  delete(key) {
    this.cache.delete(key);
  }

  /**
   * Clear all cache entries
   */
  clear() {
    this.cache.clear();
    console.log('SimpleCache cleared');
  }

  /**
   * Generate cache key for product pagination
   */
  generateProductKey(page, limit, category, search, sort = 'created_at', order = 'desc') {
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
   */
  getStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

// Export singleton instance
const cache = new SimpleCache();

/**
 * Cache middleware for product routes
 */
const getCachedProducts = (page, limit, category, search, sort = 'created_at', order = 'desc') => {
  // Only cache first 2 pages
  if (page > 2) {
    return null;
  }

  const key = cache.generateProductKey(page, limit, category, search, sort, order);
  return cache.get(key);
};

/**
 * Cache products response
 */
const setCachedProducts = (page, limit, data, category, search, sort = 'created_at', order = 'desc', ttlSeconds = 3600) => {
  // Only cache first 2 pages
  if (page > 2) {
    return;
  }

  const key = cache.generateProductKey(page, limit, category, search, sort, order);
  cache.set(key, data, ttlSeconds);
};

module.exports = {
  cache,
  getCachedProducts,
  setCachedProducts
};
