'use client';

import ProductPageWrapper from '@/components/features/productPage/ProductPageWrapper';
import { useProductData } from '@/hooks/useProductData';

interface ProductReviewPageProps {
  productId: string;
}

export default function ProductReviewPage({ productId }: ProductReviewPageProps) {
  const { product, loading, error } = useProductData(productId, '/api/admin/products');

  return (
    <ProductPageWrapper
      product={product}
      loading={loading}
      error={error}
      mode="review"
      productId={productId}
    />
  );
}
