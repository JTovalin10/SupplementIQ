import Redis from 'ioredis';

// Memoized Redis configuration to avoid recreating objects
const getRedisConfig = (() => {
  let config: any = null;
  
  return () => {
    if (config) return config;
    
    config = {
      host: process.env.REDIS_HOST!,
      port: Number(process.env.REDIS_PORT!),
      username: process.env.REDIS_USERNAME || 'default',
      password: process.env.REDIS_PASSWORD!,
      enableReadyCheck: false,
      maxRetriesPerRequest: 3,
      lazyConnect: false, // Connect immediately
      connectTimeout: 5000,
      commandTimeout: 2000,
      family: 4,
      retryDelayOnClusterDown: 50,
      retryDelayOnFailover: 100,
      keepAlive: 60000, // 1 minute
      enableOfflineQueue: true, // Enable offline queue
      enableAutoPipelining: true,
      maxLoadingTimeout: 2000,
      stringNumbers: true,
    };
    
    return config;
  };
})();

// Singleton Redis instance with proper memoization
let redis: Redis | null = null;
let redisPool: Redis[] = [];
let poolIndex = 0;
const POOL_SIZE = 3;

// Memoized Redis instance creation
export const getRedis = (() => {
  let instance: Redis | null = null;
  
  return (): Redis => {
    if (instance) return instance;
    
    instance = new Redis(getRedisConfig());
    
    // Memoized event handlers to avoid recreating functions
    const errorHandler = (err: Error) => {
      console.error('Redis Client Error:', err);
    };
    
    const connectHandler = () => {
      console.log('✅ Redis connected successfully');
    };
    
    const readyHandler = () => {
      console.log('🚀 Redis ready for operations');
    };
    
    const closeHandler = () => {
      console.log('❌ Redis connection closed');
    };
    
    instance.on('error', errorHandler);
    instance.on('connect', connectHandler);
    instance.on('ready', readyHandler);
    instance.on('close', closeHandler);
    
    return instance;
  };
})();

// Optimized Redis pool with proper round-robin and memoization
export const getRedisFromPool = (() => {
  let pool: Redis[] = [];
  let currentIndex = 0;
  
  return (): Redis => {
    if (pool.length === 0) {
      // Initialize pool with memoized configuration
      const config = getRedisConfig();
      pool = Array.from({ length: POOL_SIZE }, () => new Redis(config));
    }
    
    // Round-robin selection with proper indexing
    const instance = pool[currentIndex];
    currentIndex = (currentIndex + 1) % pool.length;
    
    return instance;
  };
})();

// Memoized initialization promise to prevent multiple initializations
let initPromise: Promise<void> | null = null;

// Initialize connection on module load with pre-connection
export function initializeRedis(): Promise<void> {
  if (initPromise) return initPromise;
  
  initPromise = new Promise((resolve, reject) => {
    const client = getRedis();
    
    // Pre-connect and keep alive
    client.connect().then(() => {
      console.log('🔌 Redis connection initialized');
      
      // Send a ping to ensure connection is active
      return client.ping();
    }).then(() => {
      console.log('🏓 Redis ping successful - connection ready');
      resolve();
    }).catch((err) => {
      console.error('❌ Failed to initialize Redis:', err);
      initPromise = null; // Reset promise on failure
      reject(err);
    });
  });
  
  return initPromise;
}

// Performance monitoring and graceful shutdown
export async function closeRedis(): Promise<void> {
  const startTime = Date.now();
  
  try {
    // Close main instance
    const mainInstance = getRedis();
    if (mainInstance && mainInstance.status === 'ready') {
      await mainInstance.quit();
      console.log('🔌 Main Redis connection closed gracefully');
    }
    
    // Close pool connections
    const pool = getRedisFromPool();
    if (pool && Array.isArray(pool)) {
      await Promise.all(pool.map(async (client) => {
        if (client.status === 'ready') {
          await client.quit();
        }
      }));
      console.log('🔌 Redis pool connections closed gracefully');
    }
    
    // Reset singleton instances
    redis = null;
    redisPool = [];
    poolIndex = 0;
    initPromise = null;
    
    const duration = Date.now() - startTime;
    console.log(`🔌 Redis shutdown completed in ${duration}ms`);
  } catch (error) {
    console.error('❌ Error during Redis shutdown:', error);
    throw error;
  }
}

// Performance monitoring utilities
export const redisPerformance = {
  getConnectionStatus: () => {
    const client = getRedis();
    return {
      status: client.status,
      isConnected: client.status === 'ready',
      connectionTime: 0, // Remove private property access
    };
  },
  
  getPoolStatus: () => {
    const pool = getRedisFromPool();
    return {
      poolSize: POOL_SIZE,
      currentIndex: poolIndex,
      instances: Array.isArray(pool) ? pool.length : 0,
    };
  },
  
  // Health check with memoized result
  healthCheck: (() => {
    let lastCheck: { result: boolean; timestamp: number } | null = null;
    const CACHE_DURATION = 5000; // 5 seconds
    
    return async (): Promise<boolean> => {
      const now = Date.now();
      
      // Return cached result if still valid
      if (lastCheck && (now - lastCheck.timestamp) < CACHE_DURATION) {
        return lastCheck.result;
      }
      
      try {
        const client = getRedis();
        const result = await client.ping();
        const isHealthy = result === 'PONG';
        
        lastCheck = { result: isHealthy, timestamp: now };
        return isHealthy;
      } catch (error) {
        lastCheck = { result: false, timestamp: now };
        return false;
      }
    };
  })(),
};


