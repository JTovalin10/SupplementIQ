'use client';

import { categoryIngredients } from '@/lib/config/data/ingredients';
import IngredientFields from '../IngredientFields';

/**
 * Protein-specific form component
 * Uses context to avoid prop drilling
 */
export default function ProteinForm() {
  const ingredients = categoryIngredients['protein'];

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Protein Information</h3>
      
      <IngredientFields ingredients={ingredients} />
    </div>
  );
}
