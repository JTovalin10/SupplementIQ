import ProductReviewPage from '@/components/features/dashboard/ProductReviewPage';

interface ProductReviewPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ProductReviewRoute({ params }: ProductReviewPageProps) {
  const { id } = await params;
  return <ProductReviewPage productId={id} />;
}
