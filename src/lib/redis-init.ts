// Optimized Redis initialization for Next.js with proper memoization
// This ensures Redis connection is established early in the application lifecycle

import { initializeRedis, redisPerformance } from '../../Database/Redis/client';

// Memoized initialization state
let isInitialized = false;
let initPromise: Promise<void> | null = null;

// Memoized Redis connection with proper error handling
export const ensureRedisConnection = (() => {
  return async (): Promise<void> => {
    if (isInitialized) return;
    
    // Return existing promise if initialization is in progress
    if (initPromise) return initPromise;
    
    initPromise = (async () => {
      try {
        console.log('🔌 Starting Redis connection initialization...');
        const startTime = Date.now();
        
        await initializeRedis();
        
        const duration = Date.now() - startTime;
        console.log(`🔌 Redis connection ensured in ${duration}ms`);
        
        // Verify connection health
        const isHealthy = await redisPerformance.healthCheck();
        if (!isHealthy) {
          throw new Error('Redis health check failed');
        }
        
        isInitialized = true;
        console.log('✅ Redis connection fully initialized and healthy');
      } catch (error) {
        console.error('❌ Failed to ensure Redis connection:', error);
        // Reset state on failure to allow retry
        isInitialized = false;
        initPromise = null;
        // Don't throw - let the app continue without Redis
      }
    })();
    
    return initPromise;
  };
})();

// Performance monitoring for Redis
export const getRedisStatus = () => {
  return {
    isInitialized,
    connectionStatus: redisPerformance.getConnectionStatus(),
    poolStatus: redisPerformance.getPoolStatus(),
    healthCheck: redisPerformance.healthCheck(),
  };
};

// Auto-initialize Redis connection with proper environment check
if (typeof window === 'undefined' && process.env.NODE_ENV !== 'test') {
  // Only run on server side and not in tests
  console.log('🚀 Starting Redis pre-initialization...');
  ensureRedisConnection().then(() => {
    console.log('✅ Redis pre-initialization completed successfully');
  }).catch((error) => {
    console.error('❌ Redis pre-initialization failed:', error);
  });
}
