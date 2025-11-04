'use client';

import { useEffect, useState } from 'react';

interface ColdStartHandlerOptions {
  timeout?: number; // Time in ms before showing cold start message
  retryDelay?: number; // Delay between retries
  maxRetries?: number; // Maximum number of retries
}

export function useColdStartHandler(options: ColdStartHandlerOptions = {}) {
  const [retryCount, setRetryCount] = useState(0);
  const [isRetryingOperation, setIsRetryingOperation] = useState(false);
  const [showColdStartMessage, setShowColdStartMessage] = useState(false);
  
  const {
    timeout = 3000, // Reduced to 3 seconds for faster cold start detection
    retryDelay = 1000, // Reduced retry delay
    maxRetries = 2 // Reduced max retries
  } = options;

  // Reset retry count when operation completes
  useEffect(() => {
    if (!isRetryingOperation) {
      setRetryCount(0);
      setShowColdStartMessage(false);
    }
  }, [isRetryingOperation]);

  const executeWithColdStartHandling = async <T>(
    operation: () => Promise<T>,
    operationName: string = 'operation'
  ): Promise<T> => {
    try {
      setIsRetryingOperation(true);
      setShowColdStartMessage(false); // Reset message
      console.log(`🔄 Executing ${operationName}...`);
      
      // Show cold start message after 1 second if still loading
      const coldStartTimer = setTimeout(() => {
        console.log(`⚠️ Slow response detected for ${operationName} - showing cold start message`);
        setShowColdStartMessage(true);
      }, 1000);
      
      // Add timeout wrapper to detect slow responses
      const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => {
          console.log(`⏱️ Operation ${operationName} timed out after ${timeout}ms`);
          reject(new Error('Operation timeout - possible cold start'));
        }, timeout)
      );
      
      const result = await Promise.race([operation(), timeoutPromise]);
      clearTimeout(coldStartTimer);
      console.log(`✅ ${operationName} completed successfully`);
      setIsRetryingOperation(false);
      setRetryCount(0);
      setShowColdStartMessage(false);
      return result;
    } catch (error) {
      // Check if this is a cold start error (timeout, connection issues, or slow response)
      const isColdStartError = error instanceof Error && (
        error.message.includes('timeout') ||
        error.message.includes('connection') ||
        error.message.includes('network') ||
        error.message.includes('cold start') ||
        error.message.includes('Operation timeout')
      );

      if (isColdStartError) {
        console.log(`🔄 Cold start detected for ${operationName}, retrying...`);
      } else {
        console.error(`❌ ${operationName} failed:`, error);
      }

      if (isColdStartError && retryCount < maxRetries) {
        console.log(`🔄 Cold start detected, retrying ${operationName} (attempt ${retryCount + 1}/${maxRetries})`);
        setRetryCount(prev => prev + 1);
        setShowColdStartMessage(true);
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        
        // Retry the operation
        return executeWithColdStartHandling(operation, operationName);
      }
      
      setIsRetryingOperation(false);
      throw error;
    }
  };

  const handleRetry = () => {
    setRetryCount(0);
    setIsRetryingOperation(false);
    // Trigger a page reload to reset the cold start state
    window.location.reload();
  };

  return {
    isRetrying: isRetryingOperation,
    showColdStartMessage: showColdStartMessage || (isRetryingOperation && retryCount > 0),
    retryCount,
    executeWithColdStartHandling,
    handleRetry,
    isColdStartDetected: showColdStartMessage || (isRetryingOperation && retryCount > 0)
  };
}
