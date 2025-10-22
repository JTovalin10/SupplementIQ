'use client';

import { IngredientField as IngredientFieldType } from '@/lib/config/data/ingredients';
import IngredientFieldComponent from './IngredientField';

interface IngredientFieldsProps {
  ingredients: IngredientFieldType[];
}

/**
 * Component for rendering a list of ingredient fields
 * Uses context to avoid prop drilling
 */
export default function IngredientFields({ ingredients }: IngredientFieldsProps) {
  return (
    <>
      {ingredients.map((ingredient) => (
        <IngredientFieldComponent
          key={ingredient.name}
          ingredient={ingredient}
        />
      ))}
    </>
  );
}
