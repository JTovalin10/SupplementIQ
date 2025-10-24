'use client';

import { supabase } from '@/lib/database/supabase/client';
import { ProductData } from '@/components/features/productPage/types';
import { useEffect, useState } from 'react';

interface UseProductDataResult {
  product: ProductData | null;
  loading: boolean;
  error: string | null;
}

export function useProductData(productId: string, apiEndpoint: string): UseProductDataResult {
  const [product, setProduct] = useState<ProductData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get the current session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !session) {
          throw new Error('No active session found. Please log in again.');
        }

        const response = await fetch(`${apiEndpoint}/${productId}`, {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(`HTTP ${response.status}: ${errorData.error || response.statusText}`);
        }

        const data = await response.json();
        setProduct(data.product);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load product');
      } finally {
        setLoading(false);
      }
    };

    if (productId) {
      fetchProduct();
    }
  }, [productId, apiEndpoint]);

  return { product, loading, error };
}
