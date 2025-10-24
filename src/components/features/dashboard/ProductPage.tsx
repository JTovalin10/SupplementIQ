'use client';

import ProductPageWrapper from '@/components/features/productPage/ProductPageWrapper';
import { useProductData } from '@/hooks/useProductData';

interface ProductPageProps {
  productId: string;
}

export default function ProductPage({ productId }: ProductPageProps) {
  const { product, loading, error } = useProductData(productId, '/api/products');

  return (
    <ProductPageWrapper
      product={product}
      loading={loading}
      error={error}
      mode="product"
      productId={productId}
      showSubmissionInfo={false}
    />
  );
}
