import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getRedis, redisPerformance } from '../../../Database/Redis/client';

interface RedisConnectionState {
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  status: string;
  connectionTime: number;
}

interface RedisHookOptions {
  autoConnect?: boolean;
  retryInterval?: number;
  maxRetries?: number;
}

/**
 * Optimized React hook for Redis connection management
 * Provides memoized connection state and performance monitoring
 */
export function useRedis(options: RedisHookOptions = {}) {
  const {
    autoConnect = true,
    retryInterval = 5000,
    maxRetries = 3,
  } = options;

  const [state, setState] = useState<RedisConnectionState>({
    isConnected: false,
    isLoading: false,
    error: null,
    status: 'disconnected',
    connectionTime: 0,
  });

  const retryCountRef = useRef(0);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Memoized connection check to avoid unnecessary re-renders
  const checkConnection = useCallback(async (): Promise<boolean> => {
    try {
      const isHealthy = await redisPerformance.healthCheck();
      const connectionStatus = redisPerformance.getConnectionStatus();
      
      setState(prev => ({
        ...prev,
        isConnected: isHealthy,
        status: connectionStatus.status,
        connectionTime: connectionStatus.connectionTime,
        error: null,
      }));

      return isHealthy;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Connection check failed';
      
      setState(prev => ({
        ...prev,
        isConnected: false,
        error: errorMessage,
        status: 'error',
      }));

      return false;
    }
  }, []);

  // Memoized connection function to prevent recreation
  const connect = useCallback(async (): Promise<void> => {
    if (state.isLoading) return;

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const client = getRedis();
      await client.connect();
      
      const isHealthy = await checkConnection();
      
      if (isHealthy) {
        retryCountRef.current = 0;
        setState(prev => ({ ...prev, isLoading: false }));
      } else {
        throw new Error('Connection established but health check failed');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Connection failed';
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
        isConnected: false,
        status: 'error',
      }));

      // Retry logic
      if (retryCountRef.current < maxRetries) {
        retryCountRef.current++;
        retryTimeoutRef.current = setTimeout(() => {
          connect();
        }, retryInterval);
      }
    }
  }, [state.isLoading, checkConnection, retryInterval, maxRetries]);

  // Memoized disconnect function
  const disconnect = useCallback(async (): Promise<void> => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }

    try {
      const client = getRedis();
      await client.quit();
      
      setState({
        isConnected: false,
        isLoading: false,
        error: null,
        status: 'disconnected',
        connectionTime: 0,
      });
    } catch (error) {
      console.error('Error disconnecting from Redis:', error);
    }
  }, []);

  // Memoized performance data
  const performanceData = useMemo(() => {
    return {
      connectionStatus: redisPerformance.getConnectionStatus(),
      poolStatus: redisPerformance.getPoolStatus(),
      healthCheck: redisPerformance.healthCheck(),
    };
  }, [state.isConnected, state.status]);

  // Auto-connect effect
  useEffect(() => {
    if (autoConnect && !state.isConnected && !state.isLoading) {
      connect();
    }

    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, [autoConnect, state.isConnected, state.isLoading, connect]);

  // Periodic health check
  useEffect(() => {
    if (!state.isConnected) return;

    const healthCheckInterval = setInterval(() => {
      checkConnection();
    }, 30000); // Check every 30 seconds

    return () => clearInterval(healthCheckInterval);
  }, [state.isConnected, checkConnection]);

  return {
    ...state,
    connect,
    disconnect,
    checkConnection,
    performanceData,
    retryCount: retryCountRef.current,
  };
}

/**
 * Hook for Redis operations with automatic connection management
 */
export function useRedisOperation<T>(
  operation: () => Promise<T>,
  dependencies: any[] = []
) {
  const { isConnected, connect, error } = useRedis();
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [operationError, setOperationError] = useState<string | null>(null);

  // Memoized operation execution
  const executeOperation = useCallback(async () => {
    if (!isConnected) {
      setOperationError('Redis not connected');
      return;
    }

    setIsLoading(true);
    setOperationError(null);

    try {
      const result = await operation();
      setData(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Operation failed';
      setOperationError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [isConnected, operation]);

  // Auto-execute when dependencies change
  useEffect(() => {
    if (isConnected) {
      executeOperation();
    }
  }, [isConnected, executeOperation, ...dependencies]);

  return {
    data,
    isLoading,
    error: operationError || error,
    executeOperation,
    isConnected,
  };
}
