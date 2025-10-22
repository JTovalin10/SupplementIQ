'use client';

import { categoryIngredients } from '@/lib/config/data/ingredients';
import IngredientFields from '../IngredientFields';

/**
 * Amino acid-specific form component
 * Uses context to avoid prop drilling
 */
export default function AminoAcidForm() {
  // Combine BCAA and EAA ingredients since they share the same database table
  const bcaaIngredients = categoryIngredients['bcaa'];
  const eaaIngredients = categoryIngredients['eaa'];
  
  // Deduplicate ingredients by name to avoid duplicate React keys
  const allIngredients = [...bcaaIngredients, ...eaaIngredients];
  const uniqueIngredients = allIngredients.filter((ingredient, index, self) => 
    index === self.findIndex(i => i.name === ingredient.name)
  );

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Amino Acid Ingredients</h3>
      
      <IngredientFields ingredients={uniqueIngredients} />
    </div>
  );
}
