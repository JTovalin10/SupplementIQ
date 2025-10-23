'use client';

import { IngredientField } from '@/lib/config/data/ingredients';
import { useProductForm } from './ProductFormContext';

interface IngredientFieldProps {
  ingredient: IngredientField;
}

/**
 * Individual ingredient field component
 * Uses reducer-based context to avoid prop drilling
 * Compact layout for grid display - auto-handles empty fields as "not in product"
 * Includes "Not specified" button for prop blends
 */
export default function IngredientFieldComponent({ ingredient }: IngredientFieldProps) {
  const { state, setField, setIngredientAction } = useProductForm();
  
  const value = state.formData[ingredient.name] || '';
  const isNotSpecified = value === 'not_specified';
  
  return (
    <div className="space-y-2">
      <label htmlFor={ingredient.name} className="block text-sm font-medium text-gray-700">
        {ingredient.label} ({ingredient.unit})
        {ingredient.required && ' *'}
      </label>
      
      <div className="space-y-2">
        <input
          type="number"
          id={ingredient.name}
          name={ingredient.name}
          step={ingredient.step || "1"}
          value={isNotSpecified ? '' : value}
          onChange={(e) => setField(ingredient.name, e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black placeholder:text-gray-400"
          placeholder={ingredient.placeholder}
          disabled={isNotSpecified}
          required={ingredient.required}
        />
        
        {/* Only show "Not specified" button for non-required fields */}
        {!ingredient.required && (
          <button
            type="button"
            onClick={() => setIngredientAction(ingredient.name, 'not_specified')}
            className={`w-full px-3 py-1 text-xs rounded border ${
              isNotSpecified 
                ? 'bg-red-100 border-red-300 text-red-700' 
                : 'bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100'
            }`}
          >
            Not specified (proprietary blends)
          </button>
        )}
      </div>
      
      {ingredient.description && (
        <p className="text-xs text-gray-500">
          {ingredient.description}
        </p>
      )}
    </div>
  );
}
