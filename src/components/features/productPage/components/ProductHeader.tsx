'use client';

import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ProductMode } from '../types';

interface ProductHeaderProps {
  mode: ProductMode;
  showBackButton?: boolean;
}

export default function ProductHeader({ mode, showBackButton = true }: ProductHeaderProps) {
  const router = useRouter();

  const getStatusBadge = () => {
    if (mode === 'review') {
      return (
        <span className="px-3 py-1 text-sm font-medium bg-yellow-100 text-yellow-800 rounded-full">
          Pending Review
        </span>
      );
    }
    
    return null;
  };

  return (
    <div className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-4">
            {showBackButton && (
              <>
                <button
                  onClick={() => router.back()}
                  className="flex items-center text-gray-600 hover:text-gray-900"
                >
                  <ArrowLeft className="h-5 w-5 mr-2" />
                  Back
                </button>
                <div className="h-6 w-px bg-gray-300"></div>
              </>
            )}
            <h1 className="text-xl font-semibold text-gray-900">
              {mode === 'review' ? 'Product Review' : 'Product Details'}
            </h1>
          </div>
          <div className="flex items-center space-x-4">
            {getStatusBadge()}
          </div>
        </div>
      </div>
    </div>
  );
}
