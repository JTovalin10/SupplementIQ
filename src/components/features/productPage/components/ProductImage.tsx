'use client';

import { Package } from 'lucide-react';

interface ProductImageProps {
  imageUrl?: string;
  productName: string;
  className?: string;
}

export default function ProductImage({ imageUrl, productName, className = '' }: ProductImageProps) {
  return (
    <div className={`space-y-4 ${className}`}>
      <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={productName}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <Package className="h-24 w-24" />
          </div>
        )}
      </div>
    </div>
  );
}
