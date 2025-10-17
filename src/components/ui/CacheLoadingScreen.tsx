'use client';

import { Clock, Loader2, Shield } from 'lucide-react';
import { useEffect, useState } from 'react';

interface CacheLoadingScreenProps {
  message?: string;
  onRetry?: () => void;
  showRetryButton?: boolean;
  retryDelay?: number;
}

export default function CacheLoadingScreen({ 
  message = "Loading security cache...", 
  onRetry,
  showRetryButton = true,
  retryDelay = 5000
}: CacheLoadingScreenProps) {
  const [retryCount, setRetryCount] = useState(0);
  const [canRetry, setCanRetry] = useState(false);

  useEffect(() => {
    // Enable retry button after delay
    const timer = setTimeout(() => {
      setCanRetry(true);
    }, retryDelay);

    return () => clearTimeout(timer);
  }, [retryDelay, retryCount]);

  const handleRetry = () => {
    if (onRetry && canRetry) {
      setRetryCount(prev => prev + 1);
      setCanRetry(false);
      onRetry();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        {/* Security Icon */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <Shield className="w-16 h-16 text-blue-600" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Clock className="w-8 h-8 text-blue-400 animate-pulse" />
            </div>
          </div>
        </div>

        {/* Loading Animation */}
        <div className="flex justify-center mb-6">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        </div>

        {/* Message */}
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Security Cache Loading
        </h2>
        <p className="text-gray-600 mb-6">
          {message}
        </p>

        {/* Additional Info */}
        <div className="bg-blue-50 rounded-lg p-4 mb-6">
          <p className="text-sm text-blue-800">
            <strong>What's happening?</strong><br />
            The system is refreshing security permissions to ensure you have the correct access level.
          </p>
        </div>

        {/* Retry Button */}
        {showRetryButton && (
          <button
            onClick={handleRetry}
            disabled={!canRetry}
            className={`w-full px-4 py-2 rounded-lg font-medium transition-colors ${
              canRetry
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {canRetry ? 'Retry Now' : `Retry in ${Math.ceil((retryDelay - (Date.now() % retryDelay)) / 1000)}s`}
          </button>
        )}

        {/* Retry Count */}
        {retryCount > 0 && (
          <p className="text-sm text-gray-500 mt-4">
            Retry attempts: {retryCount}
          </p>
        )}

        {/* Help Text */}
        <p className="text-xs text-gray-400 mt-6">
          If this persists, please contact support
        </p>
      </div>
    </div>
  );
}

