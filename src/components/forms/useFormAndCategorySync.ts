'use client';

import { useEffect, useRef } from 'react';
import { useProductForm } from './ProductFormContext';

/**
 * Custom hook to sync both form data and category back to parent component
 * This eliminates the need to pass category as props
 */
export function useFormAndCategorySync(
  onFormChange: (formData: Record<string, string>) => void,
  onCategoryChange?: (category: string) => void
) {
  const { state } = useProductForm();
  
  // Use refs to store the latest callbacks to avoid dependency issues
  const onFormChangeRef = useRef(onFormChange);
  const onCategoryChangeRef = useRef(onCategoryChange);
  const lastFormDataRef = useRef<Record<string, string>>({});
  const lastCategoryRef = useRef<string>('');
  
  // Update refs when callbacks change
  useEffect(() => {
    onFormChangeRef.current = onFormChange;
  }, [onFormChange]);
  
  useEffect(() => {
    onCategoryChangeRef.current = onCategoryChange;
  }, [onCategoryChange]);

  useEffect(() => {
    // Only sync if form data has actually changed
    const formDataString = JSON.stringify(state.formData);
    const lastFormDataString = JSON.stringify(lastFormDataRef.current);
    
    if (formDataString !== lastFormDataString) {
      lastFormDataRef.current = state.formData;
      onFormChangeRef.current(state.formData);
    }
  }, [state.formData]); // Only depend on state.formData, not the callback

  useEffect(() => {
    // Only sync if category has actually changed
    if (state.category !== lastCategoryRef.current && onCategoryChangeRef.current) {
      lastCategoryRef.current = state.category;
      onCategoryChangeRef.current(state.category);
    }
  }, [state.category]); // Only depend on state.category, not the callback
}
