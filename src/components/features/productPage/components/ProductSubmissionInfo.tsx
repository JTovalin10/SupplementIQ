'use client';

import { Calendar, User } from 'lucide-react';
import { ProductData, ProductMode } from '../types';

interface ProductSubmissionInfoProps {
  product: ProductData;
  mode: ProductMode;
  className?: string;
}

export default function ProductSubmissionInfo({ 
  product, 
  mode, 
  className = '' 
}: ProductSubmissionInfoProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Don't render if no submission info and not in review mode
  if (!product.submittedBy && !product.submittedAt && mode !== 'review') {
    return null;
  }

  return (
    <div className={`border-t pt-6 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        {mode === 'review' ? 'Submission Details' : 'Product Information'}
      </h3>
      <div className="space-y-3">
        {product.submittedBy && (
          <div className="flex items-center text-sm text-gray-600">
            <User className="h-4 w-4 mr-2" />
            <span>
              {mode === 'review' ? 'Submitted by:' : 'Added by:'} 
              <strong className="ml-1">{product.submittedBy.username}</strong>
            </span>
          </div>
        )}
        {product.submittedAt && (
          <div className="flex items-center text-sm text-gray-600">
            <Calendar className="h-4 w-4 mr-2" />
            <span>
              {mode === 'review' ? 'Submitted on:' : 'Added on:'} 
              <strong className="ml-1">{formatDate(product.submittedAt)}</strong>
            </span>
          </div>
        )}
        {product.brand.website && (
          <div className="flex items-center text-sm text-gray-600">
            <span>Brand Website: </span>
            <a
              href={product.brand.website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 ml-1"
            >
              {product.brand.website}
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
