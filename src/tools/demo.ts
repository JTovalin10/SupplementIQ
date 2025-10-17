/**
 * Demo file showing how to use the calculation tools
 * This file demonstrates the usage of transparency, danger, and dosage calculators
 */

import {
  calculateAllRatings,
  calculateDangerRating,
  calculateDosageRating,
  calculateTransparencyScore,
  type IngredientDose,
  type ProductData
} from './index';

// Example product data for a pre-workout supplement
const exampleProductData: ProductData = {
  category: 'pre-workout',
  ingredients: [
    {
      name: 'L-Citrulline',
      amount: 8000,
      unit: 'mg',
      disclosed: true,
      verified: true,
      source: 'label'
    },
    {
      name: 'Creatine Monohydrate',
      amount: 3000,
      unit: 'mg',
      disclosed: true,
      verified: true,
      source: 'lab_test'
    },
    {
      name: 'Caffeine Anhydrous',
      amount: 200,
      unit: 'mg',
      disclosed: true,
      verified: false,
      source: 'estimated'
    },
    {
      name: 'Beta-Alanine',
      amount: 3200,
      unit: 'mg',
      disclosed: true,
      verified: true,
      source: 'label'
    },
    {
      name: 'Proprietary Blend',
      amount: 500,
      unit: 'mg',
      disclosed: false,
      verified: false,
      source: 'unknown'
    }
  ],
  totalIngredients: 5,
  hasNutritionFacts: true,
  hasThirdPartyTesting: true,
  brandTrust: 'reputable'
};

// Example ingredient doses for calculations
const exampleIngredients: IngredientDose[] = [
  { name: 'l_citrulline', amount: 8000, unit: 'mg', category: 'pre-workout' },
  { name: 'creatine', amount: 3000, unit: 'mg', category: 'pre-workout' },
  { name: 'caffeine', amount: 200, unit: 'mg', category: 'pre-workout' },
  { name: 'beta_alanine', amount: 3200, unit: 'mg', category: 'pre-workout' },
  { name: 'l_tyrosine', amount: 1000, unit: 'mg', category: 'pre-workout' }
];

/**
 * Demo function showing all calculations
 */
export function runCalculationDemo() {
  console.log('=== SupplementIQ Calculation Tools Demo ===\n');

  // 1. Transparency Score Calculation
  console.log('1. TRANSPARENCY SCORE CALCULATION');
  console.log('=====================================');
  const transparencyResult = calculateTransparencyScore(exampleProductData);
  console.log(`Overall Transparency Score: ${transparencyResult.score}/100`);
  console.log('Breakdown:', transparencyResult.breakdown);
  console.log('Factors:', transparencyResult.factors);
  console.log('');

  // 2. Danger Rating Calculation
  console.log('2. DANGER RATING CALCULATION');
  console.log('=============================');
  const dangerResult = calculateDangerRating(exampleIngredients, 'pre-workout');
  console.log(`Danger Rating: ${dangerResult.rating}/100 (${dangerResult.level})`);
  console.log('Warnings:', dangerResult.warnings);
  console.log('Dangerous Ingredients:', dangerResult.dangerousIngredients);
  console.log('Recommendations:', dangerResult.recommendations);
  console.log('');

  // 3. Dosage Rating Calculation
  console.log('3. DOSAGE RATING CALCULATION');
  console.log('=============================');
  const dosageResult = calculateDosageRating(exampleIngredients, 'pre-workout');
  console.log(`Dosage Rating: ${dosageResult.rating}/100 (${dosageResult.effectiveness})`);
  console.log('Analysis:', dosageResult.analysis);
  console.log('Recommendations:', dosageResult.recommendations);
  console.log('');

  // 4. Combined Calculation
  console.log('4. COMBINED CALCULATION');
  console.log('=======================');
  const allRatings = calculateAllRatings(exampleProductData, exampleIngredients, 'pre-workout');
  console.log(`Overall Score: ${allRatings.overall.score}/100`);
  console.log('Overall Breakdown:', allRatings.overall.breakdown);
  console.log('');

  return {
    transparency: transparencyResult,
    danger: dangerResult,
    dosage: dosageResult,
    overall: allRatings.overall
  };
}

/**
 * Demo function for dangerous product example
 */
export function runDangerousProductDemo() {
  console.log('=== Dangerous Product Example ===\n');

  const dangerousIngredients: IngredientDose[] = [
    { name: 'caffeine', amount: 600, unit: 'mg', category: 'pre-workout' }, // Overdosed
    { name: 'n_phenethyl_dimethylamine_citrate', amount: 100, unit: 'mg', category: 'pre-workout' }, // Dangerous
    { name: 'halostachine', amount: 20, unit: 'mg', category: 'pre-workout' } // Extreme danger
  ];

  const dangerResult = calculateDangerRating(dangerousIngredients, 'pre-workout');
  console.log(`Danger Rating: ${dangerResult.rating}/100 (${dangerResult.level})`);
  console.log('Warnings:', dangerResult.warnings);
  console.log('Recommendations:', dangerResult.recommendations);

  return dangerResult;
}

/**
 * Demo function for poorly dosed product example
 */
export function runPoorDosageDemo() {
  console.log('=== Poor Dosage Example ===\n');

  const poorIngredients: IngredientDose[] = [
    { name: 'l_citrulline', amount: 2000, unit: 'mg', category: 'pre-workout' }, // Underdosed
    { name: 'creatine', amount: 1000, unit: 'mg', category: 'pre-workout' }, // Underdosed
    { name: 'caffeine', amount: 50, unit: 'mg', category: 'pre-workout' }, // Severely underdosed
    { name: 'beta_alanine', amount: 1000, unit: 'mg', category: 'pre-workout' } // Underdosed
  ];

  const dosageResult = calculateDosageRating(poorIngredients, 'pre-workout');
  console.log(`Dosage Rating: ${dosageResult.rating}/100 (${dosageResult.effectiveness})`);
  console.log('Analysis:', dosageResult.analysis);
  console.log('Recommendations:', dosageResult.recommendations);

  return dosageResult;
}

// Export demo functions for use in other files
export { runCalculationDemo, runDangerousProductDemo, runPoorDosageDemo };
