'use client';

import { categoryIngredients } from '@/lib/config/data/ingredients';
import IngredientFields from '../IngredientFields';

/**
 * Amino acid-specific form component
 * Uses context to avoid prop drilling
 * Organizes ingredients by sections for better UX
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

  // Group ingredients by section
  const ingredientsBySection = uniqueIngredients.reduce((acc, ingredient) => {
    const section = ingredient.section || 'Other';
    if (!acc[section]) {
      acc[section] = [];
    }
    acc[section].push(ingredient);
    return acc;
  }, {} as Record<string, typeof uniqueIngredients>);

  const sectionOrder = [
    'Basic Information',
    'BCAA Ingredients',
    'EAA Ingredients',
    'Additional Ingredients',
    'Other'
  ];

  return (
    <div className="space-y-12">
      <h3 className="text-xl font-semibold text-gray-900">Amino Acid Information</h3>
      
      {sectionOrder.map((sectionName) => {
        const sectionIngredients = ingredientsBySection[sectionName];
        if (!sectionIngredients || sectionIngredients.length === 0) return null;
        
        return (
          <div key={sectionName} className="space-y-6">
            <h4 className="text-lg font-medium text-gray-800 border-b border-gray-200 pb-3">
              {sectionName}
            </h4>
            <IngredientFields ingredients={sectionIngredients} />
          </div>
        );
      })}
    </div>
  );
}
