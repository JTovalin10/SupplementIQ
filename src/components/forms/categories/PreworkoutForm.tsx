'use client';

import { categoryIngredients } from '@/lib/config/data/ingredients';
import IngredientFields from '../IngredientFields';

/**
 * Preworkout-specific form component
 * Uses context to avoid prop drilling
 */
export default function PreworkoutForm() {
  const ingredients = categoryIngredients['pre-workout'];

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Preworkout Ingredients</h3>
      
      <IngredientFields ingredients={ingredients} />
    </div>
  );
}
