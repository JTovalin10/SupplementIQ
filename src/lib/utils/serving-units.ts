/**
 * Utility functions for handling serving units based on product form
 */

export type ProductForm = 'powder' | 'pill' | 'bar' | 'liquid' | 'capsule' | 'tablet' | 'drink' | 'energy_shot';

export interface ServingUnitInfo {
  unit: string;
  pluralUnit: string;
  description: string;
  examples: string[];
}

export const PRODUCT_FORM_UNITS: Record<ProductForm, ServingUnitInfo> = {
  powder: {
    unit: 'scoop',
    pluralUnit: 'scoops',
    description: 'Scoop(s)',
    examples: ['1 scoop', '1.5 scoops', '2 scoops']
  },
  pill: {
    unit: 'pill',
    pluralUnit: 'pills',
    description: 'Pill(s)',
    examples: ['1 pill', '2 pills', '6 pills']
  },
  bar: {
    unit: 'bar',
    pluralUnit: 'bars',
    description: 'Bar(s)',
    examples: ['1 bar', '2 bars']
  },
  liquid: {
    unit: 'serving',
    pluralUnit: 'servings',
    description: 'Serving(s)',
    examples: ['1 serving', '2 servings']
  },
  capsule: {
    unit: 'capsule',
    pluralUnit: 'capsules',
    description: 'Capsule(s)',
    examples: ['1 capsule', '2 capsules', '3 capsules']
  },
  tablet: {
    unit: 'tablet',
    pluralUnit: 'tablets',
    description: 'Tablet(s)',
    examples: ['1 tablet', '2 tablets', '4 tablets']
  },
  drink: {
    unit: 'drink',
    pluralUnit: 'drinks',
    description: 'Drink(s)',
    examples: ['1 drink', '2 drinks']
  },
  energy_shot: {
    unit: 'shot',
    pluralUnit: 'shots',
    description: 'Energy Shot(s)',
    examples: ['1 shot', '2 shots']
  }
};

/**
 * Get serving unit information based on product form
 */
export function getServingUnitInfo(productForm: string): ServingUnitInfo {
  const form = productForm.toLowerCase() as ProductForm;
  return PRODUCT_FORM_UNITS[form] || PRODUCT_FORM_UNITS.liquid;
}

/**
 * Get the appropriate unit text for a serving size
 */
export function getServingUnitText(productForm: string, servingSize: number): string {
  const unitInfo = getServingUnitInfo(productForm);
  return servingSize === 1 ? unitInfo.unit : unitInfo.pluralUnit;
}

/**
 * Format serving size with appropriate unit
 */
export function formatServingSize(productForm: string, servingSize: number): string {
  const unitText = getServingUnitText(productForm, servingSize);
  return `${servingSize} ${unitText}`;
}

/**
 * Format serving range with appropriate units
 */
export function formatServingRange(productForm: string, minSize: number, maxSize: number): string {
  const unitInfo = getServingUnitInfo(productForm);
  
  if (minSize === maxSize) {
    return formatServingSize(productForm, minSize);
  }
  
  const minUnit = minSize === 1 ? unitInfo.unit : unitInfo.pluralUnit;
  const maxUnit = maxSize === 1 ? unitInfo.unit : unitInfo.pluralUnit;
  
  return `${minSize} ${minUnit} - ${maxSize} ${maxUnit}`;
}

/**
 * Get placeholder text for serving size input
 */
export function getServingSizePlaceholder(productForm: string): string {
  const unitInfo = getServingUnitInfo(productForm);
  return unitInfo.examples[0] || '1';
}

/**
 * Get description text for serving size field
 */
export function getServingSizeDescription(productForm: string): string {
  const unitInfo = getServingUnitInfo(productForm);
  return `Minimum recommended serving (e.g., ${unitInfo.examples.join(', ')})`;
}
