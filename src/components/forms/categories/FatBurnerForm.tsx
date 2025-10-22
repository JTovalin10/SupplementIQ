'use client';

import { categoryIngredients } from '@/lib/config/data/ingredients';
import IngredientFields from '../IngredientFields';

/**
 * Fat burner-specific form component
 * Uses context to avoid prop drilling
 */
export default function FatBurnerForm() {
  const ingredients = categoryIngredients['fat-burner'];

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Fat Burner Ingredients</h3>
      
      <IngredientFields ingredients={ingredients} />
    </div>
  );
}
