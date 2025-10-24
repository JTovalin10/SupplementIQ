'use client';

import { useState } from 'react';
import ImageManager from './components/ImageManager';
import ProductDetails from './components/ProductDetails';
import ProductDosageDetails from './components/ProductDosageDetails';
import ProductHeader from './components/ProductHeader';
import ProductImage from './components/ProductImage';
import ProductRatings from './components/ProductRatings';
import ProductSpecs from './components/ProductSpecs';
import ProductSubmissionInfo from './components/ProductSubmissionInfo';
import { ProductData, ProductMode } from './types';

interface ProductDisplayProps {
  product: ProductData;
  mode: ProductMode;
  showBackButton?: boolean;
  showSubmissionInfo?: boolean;
  className?: string;
}

export default function ProductDisplay({
  product,
  mode,
  showBackButton = true,
  showSubmissionInfo = true,
  className = ''
}: ProductDisplayProps) {
  const [currentImageUrl, setCurrentImageUrl] = useState(product.imageUrl);
  return (
    <div className={`min-h-screen bg-gray-50 ${className}`}>
      {/* Header */}
      <ProductHeader mode={mode} showBackButton={showBackButton} />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-8">
            {/* Left Column - Product Image */}
            <ProductImage 
              imageUrl={currentImageUrl}
              productName={product.productName}
            />

            {/* Right Column - Product Details */}
            <div className="space-y-6">
              <ProductDetails product={product} />
              
              <ProductSpecs product={product} />
              
              <ProductRatings product={product} />
              
              {showSubmissionInfo && (
                <ProductSubmissionInfo 
                  product={product} 
                  mode={mode} 
                />
              )}
              
              {/* Show detailed dosage information in review mode */}
              {mode === 'review' && product.dosageDetails && (
                <ProductDosageDetails 
                  dosageDetails={product.dosageDetails}
                  category={product.category as any}
                />
              )}
              
              {/* Image management for review mode */}
              {mode === 'review' && (
                <ImageManager 
                  currentImageUrl={currentImageUrl}
                  onImageChange={setCurrentImageUrl}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
