# Pagination & Caching Configuration

## 📄 **Pagination Settings**

### **25 Products Per Page**
- **Default Limit**: 25 products per page (increased from 20)
- **Maximum Limit**: 100 products per page
- **Configuration**: Updated in `shared/constants.ts`

```typescript
export const PAGINATION_DEFAULTS = {
  PAGE: 1,
  LIMIT: 25, // 25 products per page
  MAX_LIMIT: 100,
} as const;
```

### **Enhanced Pagination Response**
The API now returns comprehensive pagination information:

```typescript
{
  products: [...],
  pagination: {
    page: 1,
    limit: 25,
    total: 150,
    pages: 6,
    hasNext: true,
    hasPrev: false,
    cached: true // Indicates if response was cached
  }
}
```

## 🚀 **Caching Strategy**

### **First 2 Pages Only**
- **Cache Target**: Only the first 2 pages (pages 1-2)
- **Cache Duration**: 1 hour (3600 seconds)
- **Cache Logic**: Pages 3+ are not cached for real-time data

```typescript
export const CACHE_PAGINATION = {
  CACHE_FIRST_PAGES: 2, // Cache only the first 2 pages
  PRODUCTS_PER_PAGE: 25, // 25 products per page
} as const;
```

### **Cache Implementation**

#### **1. In-Memory Cache Utility**
- **File**: `backend/lib/cache.ts`
- **Features**:
  - TTL-based expiration
  - Cache key generation
  - Statistics and monitoring
  - Automatic cleanup

#### **2. Cache Headers**
The API sets appropriate cache headers:

```http
# For cached pages (1-2)
Cache-Control: public, max-age=3600
X-Cache-Status: hit

# For non-cached pages (3+)
Cache-Control: no-cache
X-Cache-Status: not-cached
```

#### **3. Cache Key Generation**
Cache keys include all relevant parameters:
```
products:page:1|limit:25|sort:created_at|order:desc|category:protein|search:whey
```

## 🔧 **Implementation Details**

### **Backend Changes**

#### **1. Products Route (`backend/routes/products.ts`)**
- ✅ Updated default limit to 25
- ✅ Added caching logic for first 2 pages
- ✅ Enhanced pagination response
- ✅ Added cache headers
- ✅ Comprehensive JSDoc documentation

#### **2. Cache Utility (`backend/lib/cache.ts`)**
- ✅ Simple in-memory cache implementation
- ✅ TTL-based expiration
- ✅ Cache key generation
- ✅ Statistics and monitoring

#### **3. Shared Constants (`shared/constants.ts`)**
- ✅ Updated pagination defaults
- ✅ Added cache configuration constants

### **Type Definitions**

#### **1. Enhanced API Types (`shared/types/api.ts`)**
```typescript
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
    cached?: boolean; // Indicates if response was cached
  };
}
```

## 📊 **Performance Benefits**

### **Caching Advantages**
1. **Reduced Database Load** - First 2 pages served from cache
2. **Faster Response Times** - Cached responses are instant
3. **Better User Experience** - Quick loading for popular pages
4. **Scalability** - Reduces server load during peak traffic

### **Selective Caching Benefits**
1. **Real-Time Data** - Pages 3+ show fresh data
2. **Memory Efficiency** - Only cache frequently accessed pages
3. **Balanced Performance** - Optimize where it matters most

## 🎯 **Usage Examples**

### **API Requests**

#### **Page 1 (Cached)**
```bash
GET /api/v1/products?page=1&limit=25
# Response includes: "cached": true, X-Cache-Status: hit
```

#### **Page 2 (Cached)**
```bash
GET /api/v1/products?page=2&limit=25
# Response includes: "cached": true, X-Cache-Status: hit
```

#### **Page 3+ (Not Cached)**
```bash
GET /api/v1/products?page=3&limit=25
# Response includes: "cached": false, X-Cache-Status: not-cached
```

### **With Filters**
```bash
GET /api/v1/products?page=1&limit=25&category=protein&search=whey
# Cache key: products:page:1|limit:25|sort:created_at|order:desc|category:protein|search:whey
```

## 🔄 **Cache Management**

### **Cache Statistics**
```typescript
// Get cache statistics
const stats = cache.getStats();
console.log(`Cache size: ${stats.size}, Keys: ${stats.keys}`);
```

### **Cache Invalidation**
```typescript
// Clear specific cache entry
cache.delete('products:page:1|limit:25|...');

// Clear all cache
cache.clear();
```

## 🚀 **Future Enhancements**

### **Production Considerations**
1. **Redis Integration** - Replace in-memory cache with Redis
2. **Cache Warming** - Pre-populate cache during low traffic
3. **Cache Analytics** - Monitor hit rates and performance
4. **Dynamic TTL** - Adjust cache duration based on data freshness needs

### **Advanced Features**
1. **Smart Caching** - Cache based on user behavior patterns
2. **Partial Caching** - Cache only frequently accessed fields
3. **Cache Compression** - Compress cached data for memory efficiency
4. **Distributed Caching** - Multi-server cache synchronization

## 📝 **Configuration Summary**

| Setting | Value | Purpose |
|---------|-------|---------|
| **Products per page** | 25 | Optimal balance of content and loading |
| **Cache pages** | First 2 only | Performance without stale data |
| **Cache duration** | 1 hour | Balance between performance and freshness |
| **Max page limit** | 100 | Prevent excessive data requests |
| **Cache TTL** | 3600 seconds | Automatic cache expiration |

This configuration provides excellent performance for the most common use cases while maintaining data freshness for deeper pagination! 🎉
