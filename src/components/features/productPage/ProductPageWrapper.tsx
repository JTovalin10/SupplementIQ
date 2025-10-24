'use client';

import { AlertTriangle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import ProductDisplay, { ProductData } from './ProductDisplay';
import { ProductMode } from './types';

interface ProductPageWrapperProps {
  product: ProductData | null;
  loading: boolean;
  error: string | null;
  mode: ProductMode;
  productId: string;
  showSubmissionInfo?: boolean;
}

export default function ProductPageWrapper({
  product,
  loading,
  error,
  mode,
  productId,
  showSubmissionInfo = true
}: ProductPageWrapperProps) {
  const router = useRouter();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading product details...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Product</h2>
          <p className="text-gray-600 mb-4">{error || 'Product not found'}</p>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <ProductDisplay 
      product={product} 
      mode={mode} 
      showSubmissionInfo={showSubmissionInfo}
      productId={productId}
    />
  );
}
