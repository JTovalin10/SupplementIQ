'use client';

import { IngredientField as IngredientFieldType } from '@/lib/config/data/ingredients';
import IngredientFieldComponent from './IngredientField';

interface IngredientFieldsProps {
  ingredients: IngredientFieldType[];
}

/**
 * Component for rendering a list of ingredient fields in a grid layout
 * Uses context to avoid prop drilling
 */
export default function IngredientFields({ ingredients }: IngredientFieldsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {ingredients.map((ingredient) => (
        <IngredientFieldComponent
          key={ingredient.name}
          ingredient={ingredient}
        />
      ))}
    </div>
  );
}
