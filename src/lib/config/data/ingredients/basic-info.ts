import { IngredientField } from './types';

// Basic product information fields that are common across all categories
export const basicInfoIngredients: IngredientField[] = [
  {
    name: 'serving_size_g',
    label: 'Serving Size',
    placeholder: '30',
    unit: 'g',
    step: '0.1',
    description: 'Serving size in grams',
    required: true,
    section: 'Basic Information'
  },
  {
    name: 'serving_size_fl_oz',
    label: 'Serving Size',
    placeholder: '16',
    unit: 'fl oz',
    step: '0.1',
    description: 'Serving size in fluid ounces',
    required: true,
    section: 'Basic Information'
  },
  {
    name: 'serving_scoops',
    label: 'Serving Scoops',
    placeholder: '2',
    unit: 'scoops',
    step: '0.5',
    description: 'Number of scoops per serving',
    required: true,
    section: 'Basic Information'
  },
  {
    name: 'servings_per_container',
    label: 'Servings Per Container',
    placeholder: '30',
    unit: 'servings',
    step: '1',
    description: 'Number of servings per container',
    required: true,
    section: 'Basic Information'
  },
  {
    name: 'price',
    label: 'Price',
    placeholder: '29.99',
    unit: '$',
    step: '0.01',
    description: 'Product price for bang for your buck calculations',
    required: true,
    section: 'Basic Information'
  },
  {
    name: 'calories',
    label: 'Calories',
    placeholder: '120',
    unit: 'cal',
    description: 'Calories per serving',
    required: true,
    section: 'Basic Information'
  },
  {
    name: 'sugar_g',
    label: 'Sugar',
    placeholder: '1',
    unit: 'g',
    step: '0.1',
    description: 'Sugar content per serving',
    required: true,
    section: 'Basic Information'
  },
  {
    name: 'total_carbohydrate_g',
    label: 'Total Carbohydrate',
    placeholder: '3',
    unit: 'g',
    step: '0.1',
    description: 'Total carbohydrates per serving',
    required: true,
    section: 'Basic Information'
  },
  {
    name: 'fat_g',
    label: 'Total Fat',
    placeholder: '1',
    unit: 'g',
    step: '0.1',
    description: 'Total fat content per serving',
    required: true,
    section: 'Basic Information'
  },
  {
    name: 'saturated_fat_g',
    label: 'Saturated Fat',
    placeholder: '0.5',
    unit: 'g',
    step: '0.1',
    description: 'Saturated fat content per serving',
    required: true,
    section: 'Basic Information'
  },
  {
    name: 'fiber_g',
    label: 'Dietary Fiber',
    placeholder: '0',
    unit: 'g',
    step: '0.1',
    description: 'Dietary fiber content per serving',
    required: true,
    section: 'Basic Information'
  },
  {
    name: 'sodium_mg',
    label: 'Sodium',
    placeholder: '140',
    unit: 'mg',
    description: 'Sodium content per serving',
    required: true,
    section: 'Basic Information'
  },
  {
    name: 'cholesterol_mg',
    label: 'Cholesterol',
    placeholder: '5',
    unit: 'mg',
    description: 'Cholesterol content per serving',
    required: true,
    section: 'Basic Information'
  }
];
