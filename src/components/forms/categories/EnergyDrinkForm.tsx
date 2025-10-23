'use client';

import { categoryIngredients } from '@/lib/config/data/ingredients';
import IngredientFields from '../IngredientFields';

/**
 * Energy drink-specific form component
 * Uses context to avoid prop drilling
 * Organizes ingredients by sections for better UX
 */
export default function EnergyDrinkForm() {
  const ingredients = categoryIngredients['energy-drink'];
  
  // Group ingredients by section
  const ingredientsBySection = ingredients.reduce((acc, ingredient) => {
    const section = ingredient.section || 'Other';
    if (!acc[section]) {
      acc[section] = [];
    }
    acc[section].push(ingredient);
    return acc;
  }, {} as Record<string, typeof ingredients>);

  const sectionOrder = [
    'Basic Information',
    'Vitamins & Minerals',
    'Energy & Stimulants',
    'Performance Ingredients',
    'Additional Ingredients',
    'Other'
  ];

  return (
    <div className="space-y-12">
      <h3 className="text-xl font-semibold text-gray-900">Energy Drink Information</h3>
      
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
