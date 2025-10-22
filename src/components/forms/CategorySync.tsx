'use client';

import { useEffect, useRef } from 'react';
import { useProductForm } from './ProductFormContext';

interface CategorySyncProps {
  category: string;
}

/**
 * Component that syncs category changes from parent to context
 * This allows the form to automatically update when category changes
 */
export function CategorySync({ category }: CategorySyncProps) {
  const { setCategory, state } = useProductForm();
  const lastCategoryRef = useRef<string>('');

  useEffect(() => {
    // Only update if category has actually changed and is different from current context state
    if (category && category !== lastCategoryRef.current && category !== state.category) {
      lastCategoryRef.current = category;
      setCategory(category);
    }
  }, [category, state.category]); // Include state.category to prevent unnecessary updates

  return null; // This component doesn't render anything
}
