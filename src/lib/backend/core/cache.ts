import { cache, cacheKeys } from '../../utils/cache';

/**
 * Cache utility functions for products API
 * Provides caching for the first few pages of product listings
 */

interface ProductCacheKey {
  page: number;
  limit: number;
  category?: string;
  search?: string;
  sort?: string;
  order?: string;
}

/**
 * Generate cache key for products
 */
function getProductCacheKey(
  page: number,
  limit: number,
  category?: string,
  search?: string,
  sort?: string,
  order?: string
): string {
  const parts = [
    `page:${page}`,
    `limit:${limit}`,
    ...(category ? [`category:${category}`] : []),
    ...(search ? [`search:${search}`] : []),
    ...(sort ? [`sort:${sort}`] : []),
    ...(order ? [`order:${order}`] : [])
  ];
  return `products:${parts.join('|')}`;
}

/**
 * Get cached products if available
 */
export function getCachedProducts(
  page: number,
  limit: number,
  category?: string,
  search?: string,
  sort?: string,
  order?: string
): any | null {
  const key = getProductCacheKey(page, limit, category, search, sort, order);
  return cache.get(key);
}

/**
 * Set products in cache
 */
export function setCachedProducts(
  page: number,
  limit: number,
  data: any,
  category?: string,
  search?: string,
  sort?: string,
  order?: string,
  ttl: number = 3600
): void {
  const key = getProductCacheKey(page, limit, category, search, sort, order);
  cache.set(key, data, ttl);
}


