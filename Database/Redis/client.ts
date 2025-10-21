import Redis from 'ioredis';

let redis: Redis | null = null;

export function getRedis(): Redis {
  if (redis) return redis;
  
  const host = process.env.REDIS_HOST!;
  const port = Number(process.env.REDIS_PORT!);
  const username = process.env.REDIS_USERNAME || 'default';
  const password = process.env.REDIS_PASSWORD!;
  
  redis = new Redis({
    host,
    port,
    username,
    password,
    enableReadyCheck: false,
    maxRetriesPerRequest: 3,
    lazyConnect: true,
    connectTimeout: 5000,
    commandTimeout: 2000,
    family: 4,
  });
  
  redis.on('error', (err) => {
    console.error('Redis Client Error:', err);
  });
  
  redis.on('connect', () => {
    console.log('✅ Redis connected successfully');
  });
  
  redis.on('ready', () => {
    console.log('🚀 Redis ready for operations');
  });
  
  redis.on('close', () => {
    console.log('❌ Redis connection closed');
  });
  
  return redis;
}

// Initialize connection on module load
export function initializeRedis(): Promise<void> {
  return new Promise((resolve, reject) => {
    const client = getRedis();
    
    client.connect().then(() => {
      console.log('🔌 Redis connection initialized');
      resolve();
    }).catch((err) => {
      console.error('❌ Failed to initialize Redis:', err);
      reject(err);
    });
  });
}

// Graceful shutdown
export async function closeRedis(): Promise<void> {
  if (redis) {
    await redis.quit();
    redis = null;
    console.log('🔌 Redis connection closed gracefully');
  }
}


