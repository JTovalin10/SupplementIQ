import ProductPage from '@/components/features/dashboard/ProductPage';

interface ProductPageRouteProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ProductPageRoute({ params }: ProductPageRouteProps) {
  const { id } = await params;
  return <ProductPage productId={id} />;
}
