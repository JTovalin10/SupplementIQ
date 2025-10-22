/**
 * Cache entry interface
 */
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  hits: number;
}

/**
 * Enhanced in-memory cache implementation for SupplementIQ
 * Provides atomic operations, TTL support, and dependency tracking
 */
class SupplementIQCache {
  private cache = new Map<string, CacheEntry<any>>();
  private dependencies = new Map<string, Set<string>>(); // key -> dependencies
  private dependents = new Map<string, Set<string>>(); // dependency -> keys that depend on it
  private maxSize: number;
  private defaultTTL: number;

  constructor(maxSize: number = 1000, defaultTTL: number = 3600) {
    this.maxSize = maxSize;
    this.defaultTTL = defaultTTL * 1000; // Convert to milliseconds
  }

  /**
   * Get value from cache with dependency tracking
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.delete(key);
      return null;
    }

    // Update hit count
    entry.hits++;
    return entry.data;
  }

  /**
   * Set value in cache with optional dependencies
   */
  set<T>(key: string, data: T, ttl?: number, dependencies: string[] = []): void {
    // Remove oldest entries if cache is full
    if (this.cache.size >= this.maxSize) {
      this.evictOldest();
    }

    // Clear existing dependencies
    this.clearDependencies(key);

    // Set new dependencies
    dependencies.forEach(dep => {
      this.addDependency(key, dep);
    });

    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttl ? ttl * 1000 : this.defaultTTL,
      hits: 0,
    };

    this.cache.set(key, entry);
  }

  /**
   * Delete value from cache and clean up dependencies
   */
  delete(key: string): boolean {
    this.clearDependencies(key);
    return this.cache.delete(key);
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
    this.dependencies.clear();
    this.dependents.clear();
  }

  /**
   * Invalidate cache entries by dependency
   */
  invalidateByDependency(dependency: string): number {
    const keysToInvalidate = this.dependents.get(dependency) || new Set();
    let invalidated = 0;

    for (const key of keysToInvalidate) {
      if (this.cache.delete(key)) {
        invalidated++;
      }
    }

    // Clear dependency tracking
    this.dependents.delete(dependency);
    
    return invalidated;
  }

  /**
   * Add dependency relationship
   */
  private addDependency(key: string, dependency: string): void {
    // Add to dependencies map
    if (!this.dependencies.has(key)) {
      this.dependencies.set(key, new Set());
    }
    this.dependencies.get(key)!.add(dependency);

    // Add to dependents map
    if (!this.dependents.has(dependency)) {
      this.dependents.set(dependency, new Set());
    }
    this.dependents.get(dependency)!.add(key);
  }

  /**
   * Clear all dependencies for a key
   */
  private clearDependencies(key: string): void {
    const deps = this.dependencies.get(key);
    if (deps) {
      for (const dep of deps) {
        const dependents = this.dependents.get(dep);
        if (dependents) {
          dependents.delete(key);
          if (dependents.size === 0) {
            this.dependents.delete(dep);
          }
        }
      }
      this.dependencies.delete(key);
    }
  }

  /**
   * Get cache statistics with dependency information
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
      dependencies: this.dependencies.size,
      dependents: this.dependents.size,
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
      this.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Evict the oldest entry (LRU-like behavior)
   */
  private evictOldest(): void {
    let oldestKey = '';
    let oldestTime = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.delete(oldestKey);
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
        this.delete(key);
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
  ingredients: () => 'ingredients:all',
  transparencyRankings: (category?: string) =>
    `rankings:transparency:${category || 'all'}`,
  costEfficiencyRankings: (category?: string) =>
    `rankings:cost:${category || 'all'}`,
  userRankings: (timeRange: string, limit: number) =>
    `rankings:users:${timeRange}:${limit}`,
  productStats: () => 'stats:products',
  userStats: () => 'stats:users',
};

/**
 * Enhanced cache wrapper for async functions with dependency tracking
 */
export function withCache<T>(
  key: string,
  fn: () => Promise<T>,
  ttl?: number,
  dependencies: string[] = []
): Promise<T> {
  return new Promise(async (resolve, reject) => {
    // Try to get from cache first
    const cached = cache.get<T>(key);
    if (cached !== null) {
      resolve(cached);
      return;
    }

    try {
      // Execute function and cache result with dependencies
      const result = await fn();
      cache.set(key, result, ttl, dependencies);
      resolve(result);
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Enhanced cache invalidation with dependency support
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
 * Invalidate cache entries by dependency
 */
export function invalidateByDependency(dependency: string): number {
  return cache.invalidateByDependency(dependency);
}

/**
 * Enhanced cache warming with dependency tracking
 */
export async function warmCache(): Promise<void> {
  console.log('Cache warming initiated...');
  
  try {
    // Warm cache with proper dependency tracking
    const warmingTasks = [
      // Example: Pre-load popular products with user dependency
      // withCache(cacheKeys.product('popular'), loadPopularProducts, 3600, ['users']),
      // withCache(cacheKeys.ingredients(), loadAllIngredients, 7200, ['products']),
    ];

    await Promise.all(warmingTasks);
    console.log('Cache warming completed');
  } catch (error) {
    console.error('Cache warming failed:', error);
  }
}
