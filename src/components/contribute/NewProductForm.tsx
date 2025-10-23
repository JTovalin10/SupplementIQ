'use client';

import ProductFormWrapper from '@/components/forms/ProductFormWrapper';
import Card from '@/components/ui/card';

interface NewProductFormProps {
  category: string;
  formData: Record<string, string>;
  onFormChange: (formData: Record<string, string>) => void;
}

export default function NewProductForm({
  category,
  formData,
  onFormChange
}: NewProductFormProps) {
  return (
    <Card padding="lg">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">
        {category ? `${category.charAt(0).toUpperCase() + category.slice(1).replace('-', ' ')} Information` : 'Nutrition Information'}
      </h2>
      
      {category ? (
        <ProductFormWrapper
          category={category}
          initialFormData={formData}
          onFormChange={onFormChange}
        />
      ) : (
        <div className="space-y-4">
          <p className="text-gray-600">
            Select a category above to see ingredient fields for that product type.
          </p>
        </div>
      )}
    </Card>
  );
}
