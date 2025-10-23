'use client';

import ProductForm from './ProductForm';
import { ProductFormProvider } from './ProductFormContext';
import { useFormAndCategorySync } from './useFormAndCategorySync';

interface ProductFormWrapperProps {
  category: string;
  initialFormData: Record<string, string>;
  onFormChange: (formData: Record<string, string>) => void;
}

/**
 * Wrapper component that handles form synchronization
 * Simplified to reduce re-renders
 */
function ProductFormContent({ onFormChange }: { onFormChange: (formData: Record<string, string>) => void }) {
  useFormAndCategorySync(onFormChange);
  return <ProductForm />;
}

export default function ProductFormWrapper({ 
  category, 
  initialFormData, 
  onFormChange 
}: ProductFormWrapperProps) {
  return (
    <ProductFormProvider 
      initialFormData={initialFormData}
      initialCategory={category}
    >
      <ProductFormContent onFormChange={onFormChange} />
    </ProductFormProvider>
  );
}
