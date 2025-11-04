'use client';

import { useColdStartHandler } from '@/lib/hooks/useColdStartHandler';

interface ColdStartHandlerProps {
  children: React.ReactNode;
  isLoading: boolean;
  maxRetries?: number;
  timeoutMs?: number;
}

export default function ColdStartHandler({ 
  children, 
  isLoading, 
  maxRetries = 2, 
  timeoutMs = 3000 // Reduced default timeout for faster cold start detection
}: ColdStartHandlerProps) {
  const { 
    isRetrying, 
    showColdStartMessage, 
    retryCount, 
    handleRetry 
  } = useColdStartHandler({ 
    timeout: timeoutMs, 
    maxRetries 
  });

  if (isLoading && showColdStartMessage) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="mb-6">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Cold Start Detected
            </h2>
            <p className="text-gray-600 mb-4">
              Our servers are warming up. This usually takes 3-5 seconds on first load.
            </p>
            <div className="text-sm text-gray-500 mb-4">
              Attempt {retryCount + 1} of {maxRetries + 1}
            </div>
          </div>
          
          <div className="space-y-3">
            {retryCount < maxRetries && (
              <button
                onClick={handleRetry}
                disabled={isRetrying}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isRetrying ? 'Retrying...' : 'Try Again'}
              </button>
            )}
            
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Refresh Page
            </button>
          </div>
          
          <div className="mt-4 text-xs text-gray-400">
            <p>If this persists, try:</p>
            <ul className="mt-1 space-y-1">
              <li>• Clearing your browser cache</li>
              <li>• Checking your internet connection</li>
              <li>• Trying again in a few minutes</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
