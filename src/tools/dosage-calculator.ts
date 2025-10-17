/**
 * Dosage Rating Calculator
 * Calculates dosage ratings (0-100) based on ingredient amounts vs optimal dosages
 * 100 = Perfect dosing, 0 = No effective ingredients
 */

export interface IngredientDose {
  name: string;
  amount: number;
  unit: string;
  category: string;
}

export interface OptimalDosage {
  min: number;
  optimal: number;
  max: number;
  unit: string;
  category: string;
  importance: 'critical' | 'high' | 'medium' | 'low';
  description: string;
}

export interface DosageResult {
  rating: number; // 0-100
  score: number; // Raw score
  maxScore: number; // Maximum possible score
  effectiveness: 'excellent' | 'good' | 'fair' | 'poor' | 'ineffective';
  analysis: Array<{
    ingredient: string;
    actual: number;
    optimal: number;
    score: number;
    status: 'optimal' | 'underdosed' | 'overdosed' | 'missing';
    importance: string;
  }>;
  recommendations: string[];
}

// Optimal dosages for different supplement categories
const OPTIMAL_DOSAGES: Record<string, Record<string, OptimalDosage>> = {
  'protein': {
    'protein_content': {
      min: 20,
      optimal: 25,
      max: 30,
      unit: 'g',
      category: 'protein',
      importance: 'critical',
      description: 'Total protein per serving'
    },
    'bcaa_ratio': {
      min: 2,
      optimal: 2.5,
      max: 3,
      unit: 'ratio',
      category: 'protein',
      importance: 'high',
      description: 'Leucine to Isoleucine to Valine ratio'
    }
  },

  'pre-workout': {
    'l_citrulline': {
      min: 6000,
      optimal: 8000,
      max: 10000,
      unit: 'mg',
      category: 'pre-workout',
      importance: 'critical',
      description: 'Vasodilator for pump and performance'
    },
    'creatine': {
      min: 2500,
      optimal: 3000,
      max: 5000,
      unit: 'mg',
      category: 'pre-workout',
      importance: 'high',
      description: 'Strength and power enhancement'
    },
    'caffeine': {
      min: 150,
      optimal: 200,
      max: 300,
      unit: 'mg',
      category: 'pre-workout',
      importance: 'critical',
      description: 'Energy and focus enhancement'
    },
    'beta_alanine': {
      min: 2000,
      optimal: 3200,
      max: 5000,
      unit: 'mg',
      category: 'pre-workout',
      importance: 'high',
      description: 'Endurance and muscle buffer'
    },
    'l_tyrosine': {
      min: 500,
      optimal: 1000,
      max: 2000,
      unit: 'mg',
      category: 'pre-workout',
      importance: 'medium',
      description: 'Focus and mental performance'
    },
    'betaine': {
      min: 1500,
      optimal: 2500,
      max: 3000,
      unit: 'mg',
      category: 'pre-workout',
      importance: 'medium',
      description: 'Power and strength enhancement'
    },
    'agmatine': {
      min: 500,
      optimal: 1000,
      max: 1500,
      unit: 'mg',
      category: 'pre-workout',
      importance: 'medium',
      description: 'Pump and nitric oxide enhancement'
    }
  },

  'fat-burner': {
    'caffeine': {
      min: 150,
      optimal: 200,
      max: 400,
      unit: 'mg',
      category: 'fat-burner',
      importance: 'critical',
      description: 'Metabolism and energy boost'
    },
    'l_carnitine': {
      min: 1000,
      optimal: 2000,
      max: 3000,
      unit: 'mg',
      category: 'fat-burner',
      importance: 'high',
      description: 'Fat transport and metabolism'
    },
    'green_tea_extract': {
      min: 300,
      optimal: 500,
      max: 800,
      unit: 'mg',
      category: 'fat-burner',
      importance: 'high',
      description: 'Antioxidant and metabolism support'
    },
    'capsimax': {
      min: 50,
      optimal: 100,
      max: 200,
      unit: 'mg',
      category: 'fat-burner',
      importance: 'medium',
      description: 'Thermogenic and appetite suppression'
    },
    'synephrine': {
      min: 20,
      optimal: 30,
      max: 50,
      unit: 'mg',
      category: 'fat-burner',
      importance: 'high',
      description: 'Thermogenic and energy enhancement'
    }
  },

  'creatine': {
    'creatine_monohydrate': {
      min: 2500,
      optimal: 3000,
      max: 5000,
      unit: 'mg',
      category: 'creatine',
      importance: 'critical',
      description: 'Creatine monohydrate content'
    },
    'creatine_purity': {
      min: 95,
      optimal: 99,
      max: 100,
      unit: '%',
      category: 'creatine',
      importance: 'critical',
      description: 'Creatine purity percentage'
    }
  },

  'bcaa': {
    'l_leucine': {
      min: 2500,
      optimal: 3000,
      max: 4000,
      unit: 'mg',
      category: 'bcaa',
      importance: 'critical',
      description: 'Most important BCAA for muscle protein synthesis'
    },
    'l_isoleucine': {
      min: 1250,
      optimal: 1500,
      max: 2000,
      unit: 'mg',
      category: 'bcaa',
      importance: 'high',
      description: 'Important for muscle recovery'
    },
    'l_valine': {
      min: 1250,
      optimal: 1500,
      max: 2000,
      unit: 'mg',
      category: 'bcaa',
      importance: 'high',
      description: 'Important for muscle energy'
    }
  },

  'multivitamin': {
    'vitamin_d': {
      min: 1000,
      optimal: 2000,
      max: 4000,
      unit: 'IU',
      category: 'multivitamin',
      importance: 'high',
      description: 'Vitamin D for bone health and immunity'
    },
    'vitamin_b12': {
      min: 100,
      optimal: 250,
      max: 1000,
      unit: 'mcg',
      category: 'multivitamin',
      importance: 'high',
      description: 'B12 for energy and nerve function'
    },
    'magnesium': {
      min: 200,
      optimal: 400,
      max: 600,
      unit: 'mg',
      category: 'multivitamin',
      importance: 'high',
      description: 'Magnesium for muscle and nerve function'
    }
  }
};

/**
 * Calculate dosage rating for a product
 * @param {IngredientDose[]} ingredients - Array of ingredient doses
 * @param {string} category - Product category
 * @returns {DosageResult} Dosage rating with analysis and recommendations
 */
export function calculateDosageRating(ingredients: IngredientDose[], category: string): DosageResult {
  const categoryDosages = OPTIMAL_DOSAGES[category] || {};
  const analysis: DosageResult['analysis'] = [];
  let totalScore = 0;
  let maxScore = 0;

  // Analyze each ingredient against optimal dosages
  for (const ingredient of ingredients) {
    const optimal = categoryDosages[ingredient.name.toLowerCase()];
    if (!optimal) continue;

    const actual = convertToUnit(ingredient.amount, ingredient.unit, optimal.unit);
    const score = calculateIngredientScore(actual, optimal);
    const status = getIngredientStatus(actual, optimal);
    
    // Weight score by importance
    const importanceWeight = getImportanceWeight(optimal.importance);
    const weightedScore = score * importanceWeight;
    
    analysis.push({
      ingredient: ingredient.name,
      actual,
      optimal: optimal.optimal,
      score: weightedScore,
      status,
      importance: optimal.importance
    });

    totalScore += weightedScore;
    maxScore += 100 * importanceWeight; // Max score per ingredient * weight
  }

  // Calculate final rating
  const rating = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;
  const effectiveness = getEffectivenessLevel(rating);
  
  // Generate recommendations
  const recommendations = generateDosageRecommendations(analysis, category);

  return {
    rating: Math.min(100, Math.max(0, rating)),
    score: totalScore,
    maxScore,
    effectiveness,
    analysis,
    recommendations
  };
}

/**
 * Calculate score for individual ingredient
 * @param {number} actual - Actual dosage
 * @param {OptimalDosage} optimal - Optimal dosage range
 * @returns {number} Score 0-100
 */
function calculateIngredientScore(actual: number, optimal: OptimalDosage): number {
  if (actual === 0) return 0;
  
  // Perfect score if within optimal range
  if (actual >= optimal.min && actual <= optimal.max) {
    return 100;
  }
  
  // Score decreases as we move away from optimal
  if (actual < optimal.min) {
    // Underdosed - score decreases linearly
    return Math.max(0, (actual / optimal.min) * 100);
  } else {
    // Overdosed - score decreases but less severely
    const excess = actual - optimal.max;
    const maxExcess = optimal.max * 2; // Allow up to 2x max before hitting 0
    return Math.max(0, 100 - (excess / maxExcess) * 100);
  }
}

/**
 * Get ingredient status
 * @param {number} actual - Actual dosage
 * @param {OptimalDosage} optimal - Optimal dosage range
 * @returns {string} Status description
 */
function getIngredientStatus(actual: number, optimal: OptimalDosage): DosageResult['analysis'][0]['status'] {
  if (actual === 0) return 'missing';
  if (actual >= optimal.min && actual <= optimal.max) return 'optimal';
  if (actual < optimal.min) return 'underdosed';
  return 'overdosed';
}

/**
 * Get importance weight
 * @param {string} importance - Importance level
 * @returns {number} Weight multiplier
 */
function getImportanceWeight(importance: string): number {
  const weights: Record<string, number> = {
    'critical': 1.0,
    'high': 0.8,
    'medium': 0.6,
    'low': 0.4
  };
  return weights[importance] || 0.5;
}

/**
 * Get effectiveness level
 * @param {number} rating - Dosage rating
 * @returns {string} Effectiveness level
 */
function getEffectivenessLevel(rating: number): DosageResult['effectiveness'] {
  if (rating >= 90) return 'excellent';
  if (rating >= 75) return 'good';
  if (rating >= 60) return 'fair';
  if (rating >= 30) return 'poor';
  return 'ineffective';
}

/**
 * Generate dosage recommendations
 * @param {DosageResult['analysis']} analysis - Ingredient analysis
 * @param {string} category - Product category
 * @returns {string[]} Array of recommendations
 */
function generateDosageRecommendations(analysis: DosageResult['analysis'], category: string): string[] {
  const recommendations: string[] = [];

  // Check for missing critical ingredients
  const missingCritical = analysis.filter(item => item.status === 'missing' && item.importance === 'critical');
  if (missingCritical.length > 0) {
    recommendations.push(`Missing critical ingredients: ${missingCritical.map(i => i.ingredient).join(', ')}`);
  }

  // Check for underdosed ingredients
  const underdosed = analysis.filter(item => item.status === 'underdosed');
  if (underdosed.length > 0) {
    recommendations.push(`Underdosed ingredients: ${underdosed.map(i => `${i.ingredient} (${i.actual} vs ${i.optimal} optimal)`).join(', ')}`);
  }

  // Check for overdosed ingredients
  const overdosed = analysis.filter(item => item.status === 'overdosed');
  if (overdosed.length > 0) {
    recommendations.push(`Overdosed ingredients: ${overdosed.map(i => `${i.ingredient} (${i.actual} vs ${i.optimal} optimal)`).join(', ')}`);
  }

  // Category-specific recommendations
  if (category === 'pre-workout') {
    recommendations.push('Ensure proper caffeine dosing (150-300mg)');
    recommendations.push('Include citrulline for pump enhancement');
    recommendations.push('Add beta-alanine for endurance');
  } else if (category === 'protein') {
    recommendations.push('Aim for 20-30g protein per serving');
    recommendations.push('Include complete amino acid profile');
    recommendations.push('Consider BCAA ratios (2:1:1 or 3:1:1)');
  } else if (category === 'fat-burner') {
    recommendations.push('Include proven thermogenics (caffeine, green tea)');
    recommendations.push('Add l-carnitine for fat transport');
    recommendations.push('Avoid excessive stimulant stacking');
  }

  return recommendations;
}

/**
 * Convert amount to target unit
 * @param {number} amount - Amount to convert
 * @param {string} fromUnit - Source unit
 * @param {string} toUnit - Target unit
 * @returns {number} Converted amount
 */
function convertToUnit(amount: number, fromUnit: string, toUnit: string): number {
  if (fromUnit === toUnit) return amount;
  
  const conversions: Record<string, Record<string, number>> = {
    'mg': {
      'g': amount / 1000,
      'mcg': amount * 1000,
      'IU': amount // Approximate for most vitamins
    },
    'g': {
      'mg': amount * 1000,
      'mcg': amount * 1000000
    },
    'mcg': {
      'mg': amount / 1000,
      'g': amount / 1000000
    },
    'IU': {
      'mg': amount,
      'mcg': amount * 1000
    }
  };

  return conversions[fromUnit]?.[toUnit] || amount;
}

/**
 * Get dosage rating description
 * @param {number} rating - Dosage rating (0-100)
 * @returns {string} Description of dosage effectiveness
 */
export function getDosageDescription(rating: number): string {
  if (rating >= 90) return 'Excellent dosing - All ingredients optimally dosed';
  if (rating >= 75) return 'Good dosing - Most ingredients well-dosed';
  if (rating >= 60) return 'Fair dosing - Some ingredients could be better dosed';
  if (rating >= 30) return 'Poor dosing - Many ingredients under or over-dosed';
  return 'Ineffective dosing - Ingredients poorly dosed or missing';
}

/**
 * Get dosage color class for UI
 * @param {number} rating - Dosage rating (0-100)
 * @returns {string} CSS color class
 */
export function getDosageColor(rating: number): string {
  if (rating >= 80) return 'text-green-600';
  if (rating >= 60) return 'text-yellow-600';
  if (rating >= 40) return 'text-orange-600';
  return 'text-red-600';
}


