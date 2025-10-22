'use client';

import { CategorySync } from './CategorySync';
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
 * Eliminates all prop drilling by managing state internally
 */
function ProductFormContent({ category, onFormChange }: Omit<ProductFormWrapperProps, 'initialFormData'>) {
  // Don't sync category changes back to parent since CategorySync handles it
  useFormAndCategorySync(onFormChange);
  return (
    <>
      <CategorySync category={category} />
      <ProductForm />
    </>
  );
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
      <ProductFormContent category={category} onFormChange={onFormChange} />
    </ProductFormProvider>
  );
}
