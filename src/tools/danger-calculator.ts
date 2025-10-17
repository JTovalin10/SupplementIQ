/**
 * Danger Rating Calculator
 * Calculates danger ratings (0-100) based on potentially harmful ingredient overdoses
 * 0 = Safe, 50 = Warning, 75 = Dangerous, 100 = Extreme danger
 */

export interface IngredientDose {
  name: string;
  amount: number;
  unit: string; // 'mg', 'mcg', 'g'
}

export interface DangerThresholds {
  warning: number;
  danger: number;
  extreme: number;
  unit: string;
  description: string;
}

export interface DangerResult {
  rating: number; // 0-100
  level: 'safe' | 'warning' | 'danger' | 'extreme';
  warnings: string[];
  dangerousIngredients: Array<{
    name: string;
    amount: number;
    threshold: 'warning' | 'danger' | 'extreme';
    severity: number;
  }>;
  recommendations: string[];
}

// Comprehensive danger thresholds for various ingredients
const DANGER_THRESHOLDS: Record<string, DangerThresholds> = {
  // Stimulants
  'caffeine': {
    warning: 200,
    danger: 400,
    extreme: 600,
    unit: 'mg',
    description: 'Can cause jitters, anxiety, insomnia, and heart issues'
  },
  'caffeine_anhydrous': {
    warning: 200,
    danger: 400,
    extreme: 600,
    unit: 'mg',
    description: 'Pure caffeine - very potent, can cause serious side effects'
  },
  'n_phenethyl_dimethylamine_citrate': {
    warning: 50,
    danger: 75,
    extreme: 100,
    unit: 'mg',
    description: 'DMAA-like stimulant, banned in many countries'
  },
  'halostachine': {
    warning: 8,
    danger: 12,
    extreme: 20,
    unit: 'mg',
    description: 'Potent stimulant, can cause cardiovascular issues'
  },
  'rauwolscine': {
    warning: 0.5,
    danger: 1,
    extreme: 2,
    unit: 'mcg',
    description: 'Very potent alpha-2 antagonist, can cause severe side effects'
  },

  // Nootropics
  'huperzine_a': {
    warning: 100,
    danger: 200,
    extreme: 300,
    unit: 'mcg',
    description: 'Can cause cholinergic crisis in high doses'
  },
  'alpha_gpc': {
    warning: 1200,
    danger: 1800,
    extreme: 2400,
    unit: 'mg',
    description: 'Can cause headaches and gastrointestinal issues'
  },

  // Amino Acids
  'l_tyrosine': {
    warning: 2000,
    danger: 3000,
    extreme: 5000,
    unit: 'mg',
    description: 'Can cause anxiety and increased blood pressure'
  },
  'beta_alanine': {
    warning: 3200,
    danger: 4800,
    extreme: 6400,
    unit: 'mg',
    description: 'Can cause paresthesia and tingling'
  },
  'taurine': {
    warning: 3000,
    danger: 5000,
    extreme: 8000,
    unit: 'mg',
    description: 'Generally safe but high doses can cause issues'
  },

  // Fat Burners
  'synephrine': {
    warning: 30,
    danger: 50,
    extreme: 100,
    unit: 'mg',
    description: 'Can cause cardiovascular issues and blood pressure spikes'
  },
  'yohimbine': {
    warning: 5,
    danger: 10,
    extreme: 20,
    unit: 'mg',
    description: 'Can cause severe anxiety, panic attacks, and cardiovascular issues'
  },
  'green_tea_extract': {
    warning: 400,
    danger: 800,
    extreme: 1200,
    unit: 'mg',
    description: 'High doses can cause liver toxicity'
  },

  // Other
  'creatine': {
    warning: 5000,
    danger: 10000,
    extreme: 15000,
    unit: 'mg',
    description: 'Generally safe but very high doses can cause kidney stress'
  },
  'l_carnitine': {
    warning: 2000,
    danger: 4000,
    extreme: 6000,
    unit: 'mg',
    description: 'Can cause gastrointestinal issues and fishy body odor'
  }
};

/**
 * Calculate danger rating for a product
 * @param {IngredientDose[]} ingredients - Array of ingredient doses
 * @param {string} category - Product category for context
 * @returns {DangerResult} Danger rating with warnings and recommendations
 */
export function calculateDangerRating(ingredients: IngredientDose[], category: string): DangerResult {
  const dangerousIngredients: DangerResult['dangerousIngredients'] = [];
  const warnings: string[] = [];
  let maxSeverity = 0;

  // Check each ingredient against danger thresholds
  for (const ingredient of ingredients) {
    const threshold = DANGER_THRESHOLDS[ingredient.name.toLowerCase()];
    if (!threshold) continue;

    // Convert units if necessary
    const amountInThresholdUnit = convertToUnit(ingredient.amount, ingredient.unit, threshold.unit);
    
    if (amountInThresholdUnit >= threshold.extreme) {
      dangerousIngredients.push({
        name: ingredient.name,
        amount: ingredient.amount,
        threshold: 'extreme',
        severity: 100
      });
      warnings.push(`${ingredient.name}: EXTREME DANGER - ${ingredient.amount}${ingredient.unit} exceeds safe limits`);
      maxSeverity = Math.max(maxSeverity, 100);
    } else if (amountInThresholdUnit >= threshold.danger) {
      dangerousIngredients.push({
        name: ingredient.name,
        amount: ingredient.amount,
        threshold: 'danger',
        severity: 75
      });
      warnings.push(`${ingredient.name}: DANGER - ${ingredient.amount}${ingredient.unit} may cause serious side effects`);
      maxSeverity = Math.max(maxSeverity, 75);
    } else if (amountInThresholdUnit >= threshold.warning) {
      dangerousIngredients.push({
        name: ingredient.name,
        amount: ingredient.amount,
        threshold: 'warning',
        severity: 50
      });
      warnings.push(`${ingredient.name}: WARNING - ${ingredient.amount}${ingredient.unit} may cause side effects`);
      maxSeverity = Math.max(maxSeverity, 50);
    }
  }

  // Determine danger level
  const level = maxSeverity >= 100 ? 'extreme' : 
                maxSeverity >= 75 ? 'danger' : 
                maxSeverity >= 50 ? 'warning' : 'safe';

  // Generate recommendations
  const recommendations = generateDangerRecommendations(dangerousIngredients, level);

  return {
    rating: maxSeverity,
    level,
    warnings,
    dangerousIngredients,
    recommendations
  };
}

/**
 * Convert amount to target unit
 * @param {number} amount - Amount to convert
 * @param {string} fromUnit - Source unit
 * @param {string} toUnit - Target unit
 * @returns {number} Converted amount
 */
function convertToUnit(amount: number, fromUnit: string, toUnit: string): number {
  const conversions: Record<string, Record<string, number>> = {
    'mg': {
      'mcg': amount * 1000,
      'g': amount / 1000
    },
    'mcg': {
      'mg': amount / 1000,
      'g': amount / 1000000
    },
    'g': {
      'mg': amount * 1000,
      'mcg': amount * 1000000
    }
  };

  if (fromUnit === toUnit) return amount;
  return conversions[fromUnit]?.[toUnit] || amount;
}

/**
 * Generate danger recommendations
 * @param {DangerResult['dangerousIngredients']} dangerousIngredients - List of dangerous ingredients
 * @param {string} level - Danger level
 * @returns {string[]} Array of recommendations
 */
function generateDangerRecommendations(
  dangerousIngredients: DangerResult['dangerousIngredients'],
  level: string
): string[] {
  const recommendations: string[] = [];

  if (level === 'extreme') {
    recommendations.push('DO NOT USE - Contains extremely dangerous ingredient doses');
    recommendations.push('Consult a healthcare professional immediately');
  } else if (level === 'danger') {
    recommendations.push('Use with extreme caution - High risk of side effects');
    recommendations.push('Consider reducing dosage or avoiding this product');
    recommendations.push('Monitor for adverse effects closely');
  } else if (level === 'warning') {
    recommendations.push('Use with caution - May cause mild to moderate side effects');
    recommendations.push('Start with lower doses if possible');
    recommendations.push('Discontinue use if adverse effects occur');
  } else {
    recommendations.push('Generally safe for most users');
    recommendations.push('Follow recommended dosage guidelines');
  }

  // Specific recommendations for dangerous ingredients
  for (const ingredient of dangerousIngredients) {
    const threshold = DANGER_THRESHOLDS[ingredient.name.toLowerCase()];
    if (threshold) {
      recommendations.push(`${ingredient.name}: ${threshold.description}`);
    }
  }

  return recommendations;
}

/**
 * Get danger level description
 * @param {number} rating - Danger rating (0-100)
 * @returns {string} Description of danger level
 */
export function getDangerDescription(rating: number): string {
  if (rating >= 100) return 'EXTREME DANGER - Do not use';
  if (rating >= 75) return 'HIGH DANGER - Use with extreme caution';
  if (rating >= 50) return 'MODERATE DANGER - Use with caution';
  if (rating >= 25) return 'LOW DANGER - Generally safe with monitoring';
  return 'SAFE - No significant danger detected';
}

/**
 * Get danger color class for UI
 * @param {number} rating - Danger rating (0-100)
 * @returns {string} CSS color class
 */
export function getDangerColor(rating: number): string {
  if (rating >= 75) return 'text-red-600';
  if (rating >= 50) return 'text-orange-600';
  if (rating >= 25) return 'text-yellow-600';
  return 'text-green-600';
}

/**
 * Check if ingredient is banned or restricted
 * @param {string} ingredientName - Name of ingredient
 * @returns {object} Banned/restricted status
 */
export function checkIngredientRestrictions(ingredientName: string): {
  banned: boolean;
  restricted: boolean;
  countries: string[];
  warnings: string[];
} {
  const restrictedIngredients: Record<string, {
    banned: boolean;
    restricted: boolean;
    countries: string[];
    warnings: string[];
  }> = {
    'n_phenethyl_dimethylamine_citrate': {
      banned: true,
      restricted: true,
      countries: ['US', 'Canada', 'Australia', 'EU'],
      warnings: ['Banned in many countries', 'Linked to serious health issues']
    },
    'dmha': {
      banned: true,
      restricted: true,
      countries: ['US', 'Canada', 'Australia'],
      warnings: ['Banned stimulant', 'Can cause severe side effects']
    },
    'yohimbine': {
      banned: false,
      restricted: true,
      countries: ['EU'],
      warnings: ['Restricted in some countries', 'Requires medical supervision']
    }
  };

  const ingredient = restrictedIngredients[ingredientName.toLowerCase()];
  return ingredient || {
    banned: false,
    restricted: false,
    countries: [],
    warnings: []
  };
}


