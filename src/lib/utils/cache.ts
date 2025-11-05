interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  hits: number;
}

/**
 * In-memory cache implementation for SupplementIQ
 * Provides atomic operations and TTL support
 */
class SupplementIQCache {
  private cache = new Map<string, CacheEntry<any>>();
  private maxSize: number;
  private defaultTTL: number;

  constructor(maxSize: number = 1000, defaultTTL: number = 3600) {
    this.maxSize = maxSize;
    this.defaultTTL = defaultTTL * 1000; // Convert to milliseconds
  }

  /**
   * Get value from cache
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

    // Update hit count
    entry.hits++;
    return entry.data;
  }

  /**
   * Set value in cache
   */
  set<T>(key: string, data: T, ttl?: number): void {
    // Remove oldest entries if cache is full
    if (this.cache.size >= this.maxSize) {
      this.evictOldest();
    }

    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttl ? ttl * 1000 : this.defaultTTL,
      hits: 0,
    };

    this.cache.set(key, entry);
  }

  /**
   * Delete value from cache
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const entries = Array.from(this.cache.values());
    const totalHits = entries.reduce((sum, entry) => sum + entry.hits, 0);
    const avgHits = entries.length > 0 ? totalHits / entries.length : 0;

    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      totalHits,
      avgHits: Math.round(avgHits * 100) / 100,
      hitRate:
        this.cache.size > 0
          ? Math.round((totalHits / (totalHits + this.cache.size)) * 100) / 100
          : 0,
    };
  }

  /**
   * Get all cache keys
   */
  keys(): string[] {
    return Array.from(this.cache.keys());
  }

  /**
   * Check if key exists and is not expired
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Evict the oldest entry (LRU-like behavior)
   */
  private evictOldest(): void {
    let oldestKey = "";
    let oldestTime = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  /**
   * Clean up expired entries
   */
  cleanup(): number {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    return cleaned;
  }
}

// Global cache instance
export const cache = new SupplementIQCache();

/**
 * Cache key generators for different data types
 */
export const cacheKeys = {
  product: (id: string) => `product:${id}`,
  productSearch: (query: string, filters: any) =>
    `search:${JSON.stringify({ query, filters })}`,
  user: (id: string) => `user:${id}`,
  contribution: (id: string) => `contribution:${id}`,
  ingredients: () => "ingredients:all",
  transparencyRankings: (category?: string) =>
    `rankings:transparency:${category || "all"}`,
  costEfficiencyRankings: (category?: string) =>
    `rankings:cost:${category || "all"}`,
  productStats: () => "stats:products",
  userStats: () => "stats:users",
};

/**
 * Cache wrapper for async functions
 */
export function withCache<T>(
  key: string,
  fn: () => Promise<T>,
  ttl?: number,
): Promise<T> {
  return new Promise(async (resolve, reject) => {
    // Try to get from cache first
    const cached = cache.get<T>(key);
    if (cached !== null) {
      resolve(cached);
      return;
    }

    try {
      // Execute function and cache result
      const result = await fn();
      cache.set(key, result, ttl);
      resolve(result);
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Invalidate cache entries by pattern
 */
export function invalidatePattern(pattern: string): number {
  const keys = cache.keys();
  let invalidated = 0;

  for (const key of keys) {
    if (key.includes(pattern)) {
      cache.delete(key);
      invalidated++;
    }
  }

  return invalidated;
}

/**
 * Warm cache with popular data
 */
export async function warmCache(): Promise<void> {
  // This would be called during app startup or scheduled jobs
  // Implementation depends on your data fetching functions
  console.log("Cache warming initiated...");

  // Example: Pre-load popular products, ingredients, etc.
  // await loadPopularProducts();
  // await loadAllIngredients();

  console.log("Cache warming completed");
}
