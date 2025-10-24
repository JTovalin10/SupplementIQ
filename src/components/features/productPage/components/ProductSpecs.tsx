'use client';

import { ProductData } from '../types';

interface ProductSpecsProps {
  product: ProductData;
  className?: string;
}

export default function ProductSpecs({ product, className = '' }: ProductSpecsProps) {
  return (
    <div className={`grid grid-cols-2 gap-4 ${className}`}>
      {product.servingsPerContainer && (
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-semibold text-gray-900">Servings</h4>
          <p className="text-gray-600">{product.servingsPerContainer} per container</p>
        </div>
      )}
      {product.servingSizeG && (
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-semibold text-gray-900">Serving Size</h4>
          <p className="text-gray-600">{product.servingSizeG}g</p>
        </div>
      )}
      {product.price && (
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-semibold text-gray-900">Price</h4>
          <p className="text-gray-600">
            {product.currency} {product.price.toFixed(2)}
          </p>
        </div>
      )}
    </div>
  );
}
