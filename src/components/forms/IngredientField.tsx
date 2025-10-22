'use client';

import { IngredientField } from '@/lib/config/data/ingredients';
import { useProductForm } from './ProductFormContext';

interface IngredientFieldProps {
  ingredient: IngredientField;
}

/**
 * Individual ingredient field component
 * Uses reducer-based context to avoid prop drilling
 */
export default function IngredientFieldComponent({ ingredient }: IngredientFieldProps) {
  const { state, setField, setIngredientAction } = useProductForm();
  
  const value = state.formData[ingredient.name] || '';
  const isNotInProduct = value === 'not_in_product';
  const isNotSpecified = value === 'not_specified';
  
  return (
    <div key={ingredient.name}>
      <label htmlFor={ingredient.name} className="block text-sm font-medium text-black mb-2">
        {ingredient.label} ({ingredient.unit})
        {ingredient.required && ' *'}
      </label>
      <div className="flex gap-2">
        <input
          type="number"
          id={ingredient.name}
          name={ingredient.name}
          step={ingredient.step || "1"}
          value={isNotInProduct || isNotSpecified ? '' : value}
          onChange={(e) => setField(ingredient.name, e.target.value)}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black placeholder:text-gray-400"
          placeholder={ingredient.placeholder}
          disabled={isNotInProduct || isNotSpecified}
          required={ingredient.required}
        />
        <button
          type="button"
          onClick={() => setIngredientAction(ingredient.name, 'not_in_product')}
          className={`px-3 py-2 text-xs rounded-lg border ${
            isNotInProduct 
              ? 'bg-red-100 border-red-300 text-red-700' 
              : 'bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100'
          }`}
        >
          Not in product
        </button>
        <button
          type="button"
          onClick={() => setIngredientAction(ingredient.name, 'not_specified')}
          className={`px-3 py-2 text-xs rounded-lg border ${
            isNotSpecified 
              ? 'bg-yellow-100 border-yellow-300 text-yellow-700' 
              : 'bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100'
          }`}
        >
          Not specified
        </button>
      </div>
      {ingredient.description && (
        <p className="text-sm text-gray-500 mt-1">
          {ingredient.description}
        </p>
      )}
    </div>
  );
}
