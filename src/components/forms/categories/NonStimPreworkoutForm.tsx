'use client';

import { categoryIngredients } from '@/lib/config/data/ingredients';
import IngredientFields from '../IngredientFields';

/**
 * Non-stim preworkout-specific form component
 * Uses context to avoid prop drilling
 */
export default function NonStimPreworkoutForm() {
  const ingredients = categoryIngredients['non-stim-pre-workout'];

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Non-Stim Preworkout Ingredients</h3>
      
      <IngredientFields ingredients={ingredients} />
    </div>
  );
}
