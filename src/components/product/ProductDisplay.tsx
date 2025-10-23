'use client';

import IngredientReviewForm from '@/components/admin/IngredientReviewForm';
import { Building2, ChevronDown, ChevronUp, Package, Star } from 'lucide-react';
import { useState } from 'react';

interface ProductDisplayProps {
  product: {
    id: string;
    name: string;
    brand: {
      name: string;
      website?: string;
    };
    category: string;
    description?: string;
    imageUrl?: string;
    price?: number;
    originalPrice?: number;
    rating?: number;
    reviewCount?: number;
    servingsPerContainer?: number;
    servingSizeG?: number;
    dosageRating?: number;
    dangerRating?: number;
    communityRating?: number;
    totalReviews?: number;
    categoryDetails?: any;
  };
  isAdminReview?: boolean;
  onIngredientRating?: (ingredient: string, value: string | number) => void;
  onImageUrlUpdate?: (imageUrl: string) => void;
}

export default function ProductDisplay({ 
  product, 
  isAdminReview = false, 
  onIngredientRating,
  onImageUrlUpdate
}: ProductDisplayProps) {
  const [quantity, setQuantity] = useState(1);
  const [subscribeFrequency, setSubscribeFrequency] = useState('4 Weeks');
  const [showDescription, setShowDescription] = useState(false);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [showImageUrlInput, setShowImageUrlInput] = useState(false);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  const getIngredientRating = (ingredient: string) => {
    // This would come from the admin's ratings
    return 0; // Default rating
  };

  const renderIngredientWithRating = (key: string, value: any) => {
    if (value === null || value === undefined || value === '' || value === -1) return null;
    if (key.startsWith('lab_verified_') || ['id', 'product_id', 'temp_product_id'].includes(key)) return null;

    const rating = getIngredientRating(key);
    
    return (
      <div key={key} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
        <div className="flex-1">
          <span className="text-sm font-medium text-black capitalize">
            {key.replace(/_/g, ' ').replace(/mg|g|mcg|iu/gi, '').trim()}
          </span>
          <span className="text-sm text-black ml-2">
            {Array.isArray(value) ? value.join(', ') : `${value}${key.includes('mg') ? 'mg' : key.includes('mcg') ? 'mcg' : key.includes('iu') ? 'IU' : key.includes('g') ? 'g' : ''}`}
          </span>
        </div>
        {isAdminReview && (
          <div className="flex items-center space-x-2">
            <span className="text-xs text-gray-500">Rate:</span>
            <select 
              value={rating}
              onChange={(e) => onIngredientRating?.(key, parseInt(e.target.value))}
              className="text-xs border border-gray-300 rounded px-2 py-1"
            >
              <option value={0}>0</option>
              <option value={1}>1</option>
              <option value={2}>2</option>
              <option value={3}>3</option>
              <option value={4}>4</option>
              <option value={5}>5</option>
            </select>
          </div>
        )}
      </div>
    );
  };

  const renderIngredients = () => {
    if (!product.categoryDetails) return null;

    const details = product.categoryDetails;
    const entries = Object.entries(details).filter(([key, value]) => 
      value !== null && value !== undefined && value !== '' && 
      !key.startsWith('lab_verified_') && 
      !['id', 'product_id', 'temp_product_id'].includes(key)
    );

    if (entries.length === 0) return null;

    return (
      <div className="space-y-2">
        {entries.map(([key, value]) => renderIngredientWithRating(key, value))}
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto bg-white">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-6">
        {/* Left Panel - Product Image */}
        <div className="space-y-4">
          {/* Main Product Image */}
          <div className="relative">
            {product.imageUrl ? (
              <div className="space-y-2">
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="w-full h-96 object-contain rounded-lg border"
                />
                {isAdminReview && (
                  <div className="space-y-2">
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-sm font-medium text-black mb-1">Current Image URL:</p>
                      <p className="text-sm text-black break-all font-mono bg-white p-2 rounded border">
                        {product.imageUrl}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setShowImageUrlInput(!showImageUrlInput)}
                        className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        {showImageUrlInput ? 'Cancel' : 'Update Image URL'}
                      </button>
                      <button
                        onClick={() => {
                          if (onImageUrlUpdate) {
                            onImageUrlUpdate('');
                          }
                        }}
                        className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors"
                      >
                        Remove Image
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <div className="w-full h-96 bg-gray-200 rounded-lg flex items-center justify-center">
                  <Package className="w-16 h-16 text-gray-400" />
                </div>
                {isAdminReview && (
                  <button
                    onClick={() => setShowImageUrlInput(!showImageUrlInput)}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    {showImageUrlInput ? 'Cancel' : 'Add Image URL'}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Image URL Input (Admin Review Only) */}
          {isAdminReview && showImageUrlInput && (
            <div className="space-y-2">
              <input
                type="url"
                value={imageUrlInput}
                onChange={(e) => setImageUrlInput(e.target.value)}
                placeholder="https://example.com/product-image.jpg"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
              />
              <button
                onClick={() => {
                  if (imageUrlInput && onImageUrlUpdate) {
                    onImageUrlUpdate(imageUrlInput);
                    setImageUrlInput('');
                    setShowImageUrlInput(false);
                  }
                }}
                disabled={!imageUrlInput}
                className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                Update Image
              </button>
            </div>
          )}
        </div>

        {/* Right Panel - Product Information */}
        <div className="space-y-6">
          {/* Product Title */}
          <div>
            <h1 className="text-3xl font-bold text-black mb-2">{product.name}</h1>
            <div className="flex items-center space-x-2">
              <Building2 className="w-5 h-5 text-gray-600" />
              <span className="text-lg text-red-600 font-medium">{product.brand.name}</span>
            </div>
          </div>

          {/* Rating */}
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-5 h-5 ${
                    star <= (product.communityRating || 0) ? 'text-red-500 fill-current' : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
            <span className="text-lg font-medium text-black">{product.communityRating || 0}</span>
            <span className="text-black">({product.totalReviews || 0} Reviews)</span>
            <button className="text-blue-600 hover:text-blue-800 text-sm">See Reviews Summary</button>
          </div>

          {/* Pricing */}
          <div className="space-y-2">
            <div className="flex items-center space-x-3">
              <span className="text-3xl font-bold text-orange-500">
                {formatPrice(product.price || 31.99)}
              </span>
              {product.originalPrice && (
                <span className="text-xl text-gray-500 line-through">
                  {formatPrice(product.originalPrice)}
                </span>
              )}
            </div>
          </div>

          {/* Size/Servings */}
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-black">SIZE:</span>
            <span className="text-sm text-black">{product.servingsPerContainer || 100} Servings</span>
            <button className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600">
              {product.servingsPerContainer || 100} Servings
            </button>
          </div>

          {/* Purchase Type or Description (Admin Review) */}
          {isAdminReview ? (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-black">DESCRIPTION</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                {product.description ? (
                  <p className="text-black">{product.description}</p>
                ) : (
                  <p className="text-gray-500 italic">No description provided</p>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">PURCHASE TYPE</h3>
              <div className="space-y-3">
                {/* Subscribe & Save */}
                <div className="border border-gray-300 rounded-lg p-4">
                  <div className="flex items-center space-x-3">
                    <input
                      type="radio"
                      id="subscribe"
                      name="purchaseType"
                      defaultChecked
                      className="w-4 h-4 text-blue-600"
                    />
                    <label htmlFor="subscribe" className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">Subscribe & Save</span>
                        <span className="bg-red-500 text-white px-2 py-1 rounded text-xs">Most Popular</span>
                      </div>
                      <div className="mt-2">
                        <select
                          value={subscribeFrequency}
                          onChange={(e) => setSubscribeFrequency(e.target.value)}
                          className="text-sm border border-gray-300 rounded px-2 py-1"
                        >
                          <option value="2 Weeks">2 Weeks</option>
                          <option value="4 Weeks">4 Weeks</option>
                          <option value="6 Weeks">6 Weeks</option>
                          <option value="8 Weeks">8 Weeks</option>
                        </select>
                      </div>
                      <div className="mt-2 space-y-1">
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <span>✓</span>
                          <span>Save 20% on every subscription</span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <span>✓</span>
                          <span>Free shipping in the continental US</span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <span>✓</span>
                          <span>No commitment, cancel anytime</span>
                        </div>
                      </div>
                    </label>
                  </div>
                </div>

                {/* One Time Purchase */}
                <div className="border border-gray-300 rounded-lg p-4">
                  <div className="flex items-center space-x-3">
                    <input
                      type="radio"
                      id="onetime"
                      name="purchaseType"
                      className="w-4 h-4 text-blue-600"
                    />
                    <label htmlFor="onetime" className="flex-1">
                      <span className="font-medium">One time purchase</span>
                      <span className="ml-2 text-gray-600">{formatPrice(product.originalPrice || 39.99)}</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}


          {/* Ingredients Section (Admin Review) */}
          {isAdminReview && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-black">INGREDIENT REVIEW</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <IngredientReviewForm
                  category={product.category}
                  categoryDetails={product.categoryDetails}
                  onIngredientUpdate={onIngredientRating}
                />
              </div>
            </div>
          )}

          {/* Description Toggle */}
          <div>
            <button
              onClick={() => setShowDescription(!showDescription)}
              className="text-red-600 hover:text-red-800 font-medium flex items-center space-x-1"
            >
              <span>DESCRIPTION</span>
              {showDescription ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
            {showDescription && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <p className="text-black">{product.description || 'No description available.'}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
