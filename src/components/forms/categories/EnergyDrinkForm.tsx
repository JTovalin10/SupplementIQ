'use client';

import { categoryIngredients } from '@/lib/config/data/ingredients';
import IngredientFields from '../IngredientFields';

/**
 * Energy drink-specific form component
 * Uses context to avoid prop drilling
 */
export default function EnergyDrinkForm() {
  const ingredients = categoryIngredients['energy-drink'];

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Energy Drink Ingredients</h3>
      
      <IngredientFields ingredients={ingredients} />
    </div>
  );
}
