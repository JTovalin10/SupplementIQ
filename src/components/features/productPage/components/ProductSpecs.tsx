'use client';

import { formatServingRange, getServingUnitInfo } from '@/lib/utils/serving-units';
import { useEffect } from 'react';
import { useConfirmation } from '../ConfirmationContext';
import { ProductData, ProductMode } from '../types';
import EditableField from './EditableField';
import ServingSizeSlider from './ServingSizeSlider';

interface ProductSpecsProps {
  product: ProductData;
  mode?: ProductMode;
  className?: string;
  currentServingSize?: number;
  isMinMode?: boolean;
  onServingSizeChange?: (servingSize: number, isMin: boolean) => void;
}

export default function ProductSpecs({ 
  product, 
  mode = 'product', 
  className = '',
  currentServingSize,
  isMinMode = true,
  onServingSizeChange
}: ProductSpecsProps) {
  const { setTotalFields, resetTotalFields, localValues } = useConfirmation();

  // Get serving unit info based on product form
  const productForm = product.productForm || 'powder'; // Default to powder if not specified
  const servingUnitInfo = getServingUnitInfo(productForm);

  // Set total fields count on mount
  useEffect(() => {
    resetTotalFields(); // Reset first
    const fieldCount = [product.productForm, product.servingsPerContainer, product.servingSizeG, product.minServingSize, product.maxServingSize, product.price].filter(field => field !== undefined && field !== null).length;
    setTotalFields(fieldCount);
  }, [product, setTotalFields, resetTotalFields]);

  // Get current values (use local values if available, otherwise use original product values)
  const currentPrice = localValues.get('price') ?? product.price;
  const currentServings = localValues.get('servingsPerContainer') ?? product.servingsPerContainer;

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center space-x-3">
        <div className="w-1 h-6 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full"></div>
        <h3 className="text-lg font-semibold text-gray-900">Product Specifications</h3>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Product Form Field */}
        <EditableField
          fieldId="productForm"
          label="Product Form"
          value={product.productForm || 'powder'}
          mode={mode}
          type="product-form-dropdown"
          options={[
            { value: 'powder', label: 'Powder' },
            { value: 'pill', label: 'Pill' },
            { value: 'bar', label: 'Bar' },
            { value: 'liquid', label: 'Liquid' },
            { value: 'capsule', label: 'Capsule' },
            { value: 'tablet', label: 'Tablet' },
            { value: 'drink', label: 'Drink' },
            { value: 'energy_shot', label: 'Energy Shot' }
          ]}
        />
        
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
            unit=" g"
            mode={mode}
            type="number"
          />
        )}
        {product.minServingSize !== undefined && product.minServingSize !== null && (
          <EditableField
            fieldId="minServingSize"
            label={`Min ${servingUnitInfo.description}`}
            value={product.minServingSize}
            unit={` ${servingUnitInfo.unit}`}
            mode={mode}
            type="number"
            productForm={productForm}
          />
        )}
        {product.maxServingSize !== undefined && product.maxServingSize !== null && (
          <EditableField
            fieldId="maxServingSize"
            label={`Max ${servingUnitInfo.description}`}
            value={product.maxServingSize}
            unit={` ${servingUnitInfo.unit}`}
            mode={mode}
            type="number"
            productForm={productForm}
          />
        )}
        {/* Show range if min and max are different */}
        {product.minServingSize !== undefined && product.maxServingSize !== undefined && 
         product.minServingSize !== null && product.maxServingSize !== null && 
         product.minServingSize !== product.maxServingSize && (
          <div className="bg-blue-50 border border-blue-200/60 p-4 rounded-lg">
            <div className="flex items-center space-x-3 mb-2">
              <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
              <h4 className="font-semibold text-gray-900">
                {currentServingSize ? 'Current' : 'Available'} {servingUnitInfo.description} Range
              </h4>
            </div>
            {currentServingSize ? (
              <div className="ml-5 space-y-2">
                <p className="text-sm text-gray-600">
                  <strong>Currently analyzing:</strong> {currentServingSize} {servingUnitInfo.unit}{currentServingSize !== 1 ? 's' : ''} 
                  <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                    {isMinMode ? 'Min Product' : 'Max Product'}
                  </span>
                </p>
                <p className="text-xs text-gray-500">
                  Range: {formatServingRange(productForm, product.minServingSize, product.maxServingSize)} per use
                </p>
              </div>
            ) : (
              <p className="text-sm text-gray-600 ml-5">
                {formatServingRange(productForm, product.minServingSize, product.maxServingSize)} per use
              </p>
            )}
            <p className="text-xs text-blue-600 ml-5 mt-1">
              {currentServingSize ? 'Use slider above to analyze different serving sizes' : 'Manufacturer recommends flexible serving sizes'}
            </p>
          </div>
        )}
        
        {/* Serving Size Analyzer Slider - Only for powder/pills/bars (not drinks) */}
        {product.minServingSize !== undefined && product.maxServingSize !== undefined && 
         product.minServingSize !== null && product.maxServingSize !== null && 
         product.minServingSize !== product.maxServingSize &&
         productForm !== 'drink' && productForm !== 'liquid' && productForm !== 'energy_shot' && (
          <div className="col-span-full">
            <ServingSizeSlider
              productForm={productForm}
              minServingSize={product.minServingSize}
              maxServingSize={product.maxServingSize}
              onServingSizeChange={onServingSizeChange || (() => {})}
            />
          </div>
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
        {currentPrice !== undefined && currentPrice !== null && currentServings !== undefined && currentServings !== null && (
          <div className="bg-white border border-blue-200/60 p-4 rounded-lg">
            <div className="flex items-center space-x-3 mb-2">
              <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
              <h4 className="font-semibold text-gray-900">Price per {servingUnitInfo.unit}</h4>
            </div>
            <p className="text-sm text-gray-600 ml-5">
              {product.currency} {(currentPrice / currentServings).toFixed(2)}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
