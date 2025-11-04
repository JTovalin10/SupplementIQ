'use client';

import ProductDisplay from '@/components/features/productPage/ProductDisplay';
import { ArrowLeft } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface ProductData {
  id: string;
  productName: string;
  brand: {
    id: number;
    name: string;
    website?: string;
  };
  category: string;
  description: string; // Required field
  imageUrl?: string;
  servingsPerContainer?: number;
  servingSizeG?: number;
  dosageRating: number;
  dangerRating: number;
  communityRating?: number;
  totalReviews?: number;
  dosageDetails?: any;
  dosageAnalysis?: any;
  productForm?: string;
  minServingSize?: number;
  maxServingSize?: number;
}

export default function ProductPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params?.slug as string;
  
  const [product, setProduct] = useState<ProductData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!slug) return;

      try {
        setLoading(true);
        // Fetch product by slug
        const response = await fetch(`/api/products/${slug}`);
        
        if (!response.ok) {
          throw new Error('Product not found');
        }

        const data = await response.json();
        
        if (data.product) {
          setProduct(data.product);
        } else {
          setError('Product not found');
        }
      } catch (err) {
        console.error('Error fetching product:', err);
        setError('Failed to load product');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading product...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{error || 'Product not found'}</p>
          <button
            onClick={() => router.push('/products')}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Back to Products
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with back button */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center py-4">
            <button
              onClick={() => router.push('/products')}
              className="p-2 text-gray-400 hover:text-gray-600 mr-4"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-2xl font-bold text-gray-900">{product.productName}</h1>
          </div>
        </div>
      </div>

      {/* Product Display */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ProductDisplay 
          product={product}
          mode="product" // Use 'product' mode, not 'review'
          showBackButton={false} // Already showing back button in header
          showSubmissionInfo={false} // Hide submission info for public users
          productId={product.id}
        />
      </div>
    </div>
  );
}
