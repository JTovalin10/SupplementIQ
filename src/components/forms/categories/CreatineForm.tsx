'use client';

import { categoryIngredients, creatineTypes } from '@/lib/config/data/ingredients';
import IngredientFields from '../IngredientFields';
import { useProductForm } from '../ProductFormContext';

/**
 * Creatine-specific form component
 * Uses reducer-based context to avoid prop drilling
 */
export default function CreatineForm() {
  const { state, setField } = useProductForm();
  const ingredients = categoryIngredients['creatine'];

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Creatine Information</h3>
      
      {/* Creatine Type Selection */}
      <div>
        <label htmlFor="creatine_type_name" className="block text-sm font-medium text-black mb-2">
          Creatine Type *
        </label>
        <select
          id="creatine_type_name"
          name="creatine_type_name"
          value={state.formData['creatine_type_name'] || ''}
          onChange={(e) => setField('creatine_type_name', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
          required
        >
          <option value="">Select creatine type</option>
          {creatineTypes.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
        <p className="text-sm text-gray-500 mt-1">
          Choose the type of creatine used in the product
        </p>
      </div>

      {/* Other creatine fields */}
      <IngredientFields
        ingredients={ingredients.filter(ing => ing.name !== 'creatine_type_name')}
      />
    </div>
  );
}
