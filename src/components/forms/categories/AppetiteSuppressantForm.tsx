'use client';

import { categoryIngredients } from '@/lib/config/data/ingredients';
import IngredientFields from '../IngredientFields';

/**
 * Appetite suppressant-specific form component
 * Uses context to avoid prop drilling
 */
export default function AppetiteSuppressantForm() {
  const ingredients = categoryIngredients['appetite-suppressant'];

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Appetite Suppressant Ingredients</h3>
      
      <IngredientFields ingredients={ingredients} />
    </div>
  );
}
