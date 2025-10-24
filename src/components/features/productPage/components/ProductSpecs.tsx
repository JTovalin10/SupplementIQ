'use client';

import { useEffect } from 'react';
import { useConfirmation } from '../ConfirmationContext';
import { ProductData, ProductMode } from '../types';
import EditableField from './EditableField';

interface ProductSpecsProps {
  product: ProductData;
  mode?: ProductMode;
  className?: string;
}

export default function ProductSpecs({ product, mode = 'product', className = '' }: ProductSpecsProps) {
  const { setTotalFields, resetTotalFields } = useConfirmation();

  // Set total fields count on mount
  useEffect(() => {
    resetTotalFields(); // Reset first
    const fieldCount = [product.servingsPerContainer, product.servingSizeG, product.price].filter(field => field !== undefined && field !== null).length;
    setTotalFields(fieldCount);
  }, [product, setTotalFields, resetTotalFields]);

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center space-x-3">
        <div className="w-1 h-6 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full"></div>
        <h3 className="text-lg font-semibold text-gray-900">Product Specifications</h3>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {product.servingsPerContainer !== undefined && product.servingsPerContainer !== null && (
          <EditableField
            fieldId="servingsPerContainer"
            label="Servings"
            value={product.servingsPerContainer}
            unit=" per container"
            mode={mode}
            type="number"
          />
        )}
        {product.servingSizeG !== undefined && product.servingSizeG !== null && (
          <EditableField
            fieldId="servingSizeG"
            label="Serving Size"
            value={product.servingSizeG}
            unit="g"
            mode={mode}
            type="number"
          />
        )}
        {product.price !== undefined && product.price !== null && (
          <EditableField
            fieldId="price"
            label="Price"
            value={product.price}
            unit={` ${product.currency}`}
            mode={mode}
            type="number"
          />
        )}
      </div>
    </div>
  );
}
