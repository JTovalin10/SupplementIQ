'use client';

import { ProductData } from '../types';

interface ProductDetailsProps {
  product: ProductData;
  className?: string;
}

export default function ProductDetails({ product, className = '' }: ProductDetailsProps) {
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Product Name and Brand */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {product.productName.toUpperCase()}
        </h1>
        <p className="text-lg text-gray-600 mb-4">
          {product.brand.name}
        </p>
        <div className="flex items-center space-x-4 text-sm text-gray-500">
          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">
            {product.category}
          </span>
        </div>
      </div>

      {/* Description */}
      {product.description && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Description</h3>
          <p className="text-gray-600">{product.description}</p>
        </div>
      )}
    </div>
  );
}
