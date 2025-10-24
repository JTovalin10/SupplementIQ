'use client';

import DosageDetails from './components/DosageDetails';
import ProductDetails from './components/ProductDetails';
import ProductHeader from './components/ProductHeader';
import ProductImage from './components/ProductImage';
import ProductRatings from './components/ProductRatings';
import ProductReviewActions from './components/ProductReviewActions';
import ProductSpecs from './components/ProductSpecs';
import ProductSubmissionInfo from './components/ProductSubmissionInfo';
import { ConfirmationProvider, useConfirmation } from './ConfirmationContext';
import { ProductData, ProductMode } from './types';

interface ProductDisplayProps {
  product: ProductData;
  mode: ProductMode;
  showBackButton?: boolean;
  showSubmissionInfo?: boolean;
  className?: string;
  productId?: string;
}

function ProductDisplayContent({
  product,
  mode,
  showBackButton = true,
  showSubmissionInfo = true,
  className = '',
  productId
}: ProductDisplayProps) {
  const { confirmedFields, totalFields } = useConfirmation();

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
              imageUrl={product.imageUrl}
              productName={product.productName}
              mode={mode}
            />

            {/* Right Column - Product Details */}
            <div className="space-y-6">
              <ProductDetails product={product} />
              
              <ProductSpecs product={product} mode={mode} />
              
              <ProductRatings product={product} />
              
              {/* Show dosage details for everyone */}
              {product.dosageDetails ? (
                <DosageDetails 
                  dosageDetails={product.dosageDetails}
                  category={product.category as any}
                  mode={mode}
                />
              ) : (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-yellow-800">No dosage details available for this product.</p>
                  <p className="text-yellow-600 text-sm">Category: {product.category}</p>
                </div>
              )}
              
              {showSubmissionInfo && (
                <ProductSubmissionInfo 
                  product={product} 
                  mode={mode} 
                />
              )}
              
              {/* Review actions for review mode */}
              {mode === 'review' && productId && (
                <ProductReviewActions 
                  productId={productId}
                  productName={product.productName}
                  confirmedFields={confirmedFields}
                  totalFields={totalFields}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProductDisplay(props: ProductDisplayProps) {
  return (
    <ConfirmationProvider>
      <ProductDisplayContent {...props} />
    </ConfirmationProvider>
  );
}
