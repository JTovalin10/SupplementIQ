// Application startup initialization
// This ensures all critical services are ready before the app starts serving requests

import { ensureRedisConnection, getRedisStatus } from './redis-init';

let isInitialized = false;
let initPromise: Promise<void> | null = null;

/**
 * Initialize all critical services at startup
 */
export async function initializeApp(): Promise<void> {
  if (isInitialized) return;
  
  if (initPromise) return initPromise;
  
  initPromise = (async () => {
    console.log('🚀 Starting application initialization...');
    const startTime = Date.now();
    
    try {
      // Initialize Redis connection
      console.log('📡 Initializing Redis connection...');
      await ensureRedisConnection();
      
      // Verify Redis is working
      const redisStatus = getRedisStatus();
      console.log('📊 Redis status:', redisStatus);
      
      const duration = Date.now() - startTime;
      console.log(`✅ Application initialization completed in ${duration}ms`);
      
      isInitialized = true;
    } catch (error) {
      console.error('❌ Application initialization failed:', error);
      isInitialized = false;
      initPromise = null;
      throw error;
    }
  })();
  
  return initPromise;
}

/**
 * Check if the application is fully initialized
 */
export function isAppInitialized(): boolean {
  return isInitialized;
}

/**
 * Get initialization status
 */
export function getInitializationStatus() {
  return {
    isInitialized,
    redisStatus: getRedisStatus(),
  };
}

// Auto-initialize on server startup
if (typeof window === 'undefined' && process.env.NODE_ENV !== 'test') {
  initializeApp().catch((error) => {
    console.error('❌ Failed to initialize application:', error);
  });
}
