'use client';

import { Star } from 'lucide-react';
import { ProductData } from '../types';

interface ProductRatingsProps {
  product: ProductData;
  className?: string;
}

export default function ProductRatings({ product, className = '' }: ProductRatingsProps) {
  const getRatingColor = (rating: number) => {
    if (rating >= 80) return 'text-green-600';
    if (rating >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getRatingLabel = (rating: number) => {
    if (rating >= 80) return 'Excellent';
    if (rating >= 60) return 'Good';
    if (rating >= 40) return 'Fair';
    return 'Poor';
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900">Quality Ratings</h3>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold text-gray-900">Dosage Rating</h4>
            <div className="flex items-center">
              <Star className="h-4 w-4 text-yellow-400 mr-1" />
              <span className={`font-semibold ${getRatingColor(product.dosageRating)}`}>
                {product.dosageRating}/100
              </span>
            </div>
          </div>
          <p className="text-sm text-gray-600">{getRatingLabel(product.dosageRating)}</p>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold text-gray-900">Safety Rating</h4>
            <div className="flex items-center">
              <Star className="h-4 w-4 text-yellow-400 mr-1" />
              <span className={`font-semibold ${getRatingColor(product.dangerRating)}`}>
                {product.dangerRating}/100
              </span>
            </div>
          </div>
          <p className="text-sm text-gray-600">{getRatingLabel(product.dangerRating)}</p>
        </div>
      </div>
    </div>
  );
}
