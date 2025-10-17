/**
 * SupplementIQ Calculation Tools
 * Comprehensive suite of tools for calculating transparency, danger, and dosage ratings
 */

// Transparency Calculator
export {
  calculateCategoryTransparency, calculateTransparencyScore, getTransparencyColor, getTransparencyDescription, type IngredientData, type ProductData, type TransparencyResult
} from './transparency-calculator';

// Danger Calculator
export {
  calculateDangerRating, checkIngredientRestrictions, getDangerColor, getDangerDescription, type DangerResult, type DangerThresholds, type IngredientDose
} from './danger-calculator';

// Dosage Calculator
export {
  calculateDosageRating, getDosageColor, getDosageDescription, type DosageResult,
  type OptimalDosage
} from './dosage-calculator';

/**
 * Combined calculation function for all three ratings
 * @param {ProductData} productData - Product information
 * @param {IngredientDose[]} ingredients - Product ingredients
 * @param {string} category - Product category
 * @returns {object} Combined ratings and analysis
 */
export function calculateAllRatings(
  productData: any, // ProductData type
  ingredients: any[], // IngredientDose[] type
  category: string
) {
  const transparency = calculateTransparencyScore(productData);
  const danger = calculateDangerRating(ingredients, category);
  const dosage = calculateDosageRating(ingredients, category);

  return {
    transparency,
    danger,
    dosage,
    overall: {
      score: Math.round((transparency.score + (100 - danger.rating) + dosage.rating) / 3),
      breakdown: {
        transparency: transparency.score,
        safety: 100 - danger.rating,
        effectiveness: dosage.rating
      }
    }
  };
}


