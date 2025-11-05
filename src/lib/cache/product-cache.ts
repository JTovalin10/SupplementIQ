/**
 * Product cache utility for caching product listings
 * Uses Redis for server-side caching and localStorage for client-side caching
 */

import { getRedis } from "../../../Database/Redis/client";

const CACHE_PREFIX = "products";
const CACHE_VERSION = "v1";
const CACHE_TTL = 3600; // 1 hour
const PAGES_TO_CACHE = 3;
const PRODUCTS_PER_PAGE = 25;

export interface CachedProduct {
  id: number;
  name: string;
  image_url?: string;
  category: string;
  slug: string;
  dosage_rating?: number;
  danger_rating?: number;
  community_rating?: number;
  total_reviews?: number;
  brand?: {
    id: number;
    name: string;
  };
}

export interface ProductCacheKey {
  page: number;
  category?: string;
  search?: string;
}

export class ProductCache {
  private redis: ReturnType<typeof getRedis> | null = null;

  constructor() {
    try {
      this.redis = getRedis();
      // Check Redis connection status
      if (this.redis.status !== "ready") {
        console.log("⏳ Redis connecting...");
      }
    } catch (error) {
      console.warn("Redis not available, using localStorage only:", error);
    }
  }

  /**
   * Generate a cache key for a product listing
   */
  private getCacheKey(key: ProductCacheKey): string {
    const { page, category, search } = key;
    let keyStr = `${CACHE_PREFIX}:${CACHE_VERSION}:page:${page}`;
    if (category) keyStr += `:category:${category}`;
    if (search) keyStr += `:search:${search}`;
    return keyStr;
  }

  /**
   * Get products from cache (Redis or localStorage)
   */
  async get(key: ProductCacheKey): Promise<CachedProduct[] | null> {
    const cacheKey = this.getCacheKey(key);

    // Try Redis first (check if connected or connecting)
    if (
      this.redis &&
      (this.redis.status === "ready" ||
        this.redis.status === "connect" ||
        this.redis.status === "connecting")
    ) {
      try {
        const cached = await this.redis.get(cacheKey);
        if (cached) {
          console.log(`✅ [REDIS] Cache hit: ${cacheKey}`);
          return JSON.parse(cached);
        }
      } catch (error) {
        console.warn("Redis get failed, falling back to localStorage:", error);
      }
    }

    // Try localStorage as fallback (browser/client-side)
    if (typeof window !== "undefined") {
      try {
        const item = localStorage.getItem(cacheKey);
        if (item) {
          const data = JSON.parse(item);
          // Check if cache is still valid (localStorage doesn't have TTL)
          if (
            data.timestamp &&
            Date.now() - data.timestamp < CACHE_TTL * 1000
          ) {
            console.log(`✅ [LOCALSTORAGE] Cache hit: ${cacheKey}`);
            return data.products;
          }
        }
      } catch (error) {
        console.warn("localStorage get failed:", error);
      }
    }

    console.log(`❌ [CACHE MISS] No cache found for: ${cacheKey}`);
    return null;
  }

  /**
   * Set products in cache (Redis and localStorage)
   */
  async set(key: ProductCacheKey, products: CachedProduct[]): Promise<void> {
    const cacheKey = this.getCacheKey(key);

    // Only cache first 3 pages
    if (key.page > PAGES_TO_CACHE) {
      console.log(
        `⏭️ [SKIP CACHE] Page ${key.page} > ${PAGES_TO_CACHE}, not caching`,
      );
      return;
    }

    console.log(`💾 [CACHE] Storing products for page ${key.page}`);

    // Try Redis first (check if connected or connecting)
    if (
      this.redis &&
      (this.redis.status === "ready" ||
        this.redis.status === "connect" ||
        this.redis.status === "connecting")
    ) {
      try {
        await this.redis.set(
          cacheKey,
          JSON.stringify(products),
          "EX",
          CACHE_TTL,
        );
        console.log(`✅ [REDIS] Cached page ${key.page}`);
      } catch (error) {
        console.warn("Redis set failed:", error);
      }
    } else {
      console.log(
        `⚠️ [REDIS] Not connected (status: ${this.redis?.status}), skipping Redis cache`,
      );
    }

    // Also cache in localStorage (browser/client-side)
    if (typeof window !== "undefined") {
      try {
        const data = {
          products,
          timestamp: Date.now(),
        };
        localStorage.setItem(cacheKey, JSON.stringify(data));
        console.log(`✅ [LOCALSTORAGE] Cached page ${key.page}`);
      } catch (error) {
        console.warn("localStorage set failed:", error);
      }
    }
  }

  /**
   * Check if a key should be cached (first 3 pages)
   */
  shouldCache(key: ProductCacheKey): boolean {
    return key.page <= PAGES_TO_CACHE;
  }

  /**
   * Clear all product cache
   */
  async clear(): Promise<void> {
    // Clear Redis
    if (this.redis && this.redis.status === "ready") {
      try {
        // Get all keys matching the pattern
        const keys = await this.redis.keys(
          `${CACHE_PREFIX}:${CACHE_VERSION}:*`,
        );
        if (keys.length > 0) {
          await this.redis.del(...keys);
        }
      } catch (error) {
        console.warn("Redis clear failed:", error);
      }
    }

    // Clear localStorage
    if (typeof window !== "undefined") {
      try {
        const keys = Object.keys(localStorage);
        keys.forEach((key) => {
          if (key.startsWith(`${CACHE_PREFIX}:${CACHE_VERSION}:`)) {
            localStorage.removeItem(key);
          }
        });
      } catch (error) {
        console.warn("localStorage clear failed:", error);
      }
    }
  }
}

export const productCache = new ProductCache();
