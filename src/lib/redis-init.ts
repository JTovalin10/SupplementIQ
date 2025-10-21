// Redis initialization for Next.js
// This ensures Redis connection is established early in the application lifecycle

import { initializeRedis } from '../../Database/Redis/client';

let isInitialized = false;

export async function ensureRedisConnection(): Promise<void> {
  if (isInitialized) return;
  
  try {
    await initializeRedis();
    isInitialized = true;
    console.log('🔌 Redis connection ensured');
  } catch (error) {
    console.error('❌ Failed to ensure Redis connection:', error);
    // Don't throw - let the app continue without Redis
  }
}

// Auto-initialize Redis connection
if (typeof window === 'undefined') {
  // Only run on server side
  ensureRedisConnection().catch(console.error);
}
