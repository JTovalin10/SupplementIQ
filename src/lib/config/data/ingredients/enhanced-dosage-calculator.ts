import { CachedIngredientConfig, ingredientDosageCache } from '../../../cache/ingredient-dosage-cache';
import { aminoAcidSupplements, creatineSupplements, stimulantSupplements } from './index';
import { DosageRating } from './types';

export interface ProductDosageAnalysis {
  overallScore: number;
  overallRating: DosageRating['rating'];
  message: string;
  ingredientAnalysis: IngredientAnalysis[];
  valueScore: number;
  servingEfficiency: number;
  pricePerEffectiveDose: number;
  manufacturerMinDosage: ManufacturerDosageAnalysis;
  manufacturerMaxDosage: ManufacturerDosageAnalysis;
}

export interface IngredientAnalysis {
  ingredientName: string;
  displayName: string;
  actualDosage: number;
  minDosage: number;
  maxDosage: number;
  dangerousDosage: number;
  score: number;
  rating: DosageRating['rating'];
  message: string;
  isEffective: boolean;
  isDangerous: boolean;
  unit: string;
  dosageNotes?: string;
  cautions?: string;
  precautionPeople?: string[];
  dosageCitation?: string;
  cautionsCitation?: string;
}

export interface ManufacturerDosageAnalysis {
  score: number;
  rating: DosageRating['rating'];
  message: string;
  isEffective: boolean;
  isDangerous: boolean;
  scoopsNeeded: number;
  pricePerScoop: number;
}

export interface ProductData {
  category: string;
  servingsPerContainer: number;
  servingSizeG: number;
  price?: number;
  currency?: string;
  creatineType?: string;
  ingredients: Record<string, number>; // ingredient_name: dosage_in_mg
}

/**
 * Enhanced dosage calculation that considers:
 * 1. Min/max dosage recommendations
 * 2. Serving size efficiency
 * 3. Price per effective dose
 * 4. Value proposition for multi-scoop products
 */
export async function calculateEnhancedDosageRating(productData: ProductData): Promise<ProductDosageAnalysis> {
  const { category, servingsPerContainer, servingSizeG, price, currency = 'USD', creatineType, ingredients } = productData;

  // Get ingredient configurations based on category
  const ingredientConfigs = await getIngredientConfigsForCategory(category, creatineType);
  
  const ingredientAnalysis: IngredientAnalysis[] = [];
  let totalScore = 0;
  let effectiveIngredientCount = 0;
  let dangerousIngredientCount = 0;

  // Analyze each ingredient
  for (const [ingredientName, actualDosage] of Object.entries(ingredients)) {
    if (actualDosage <= 0) continue;

    const config = ingredientConfigs[ingredientName];
    if (!config) continue;

    const analysis = analyzeIngredient(ingredientName, actualDosage, config);
    ingredientAnalysis.push(analysis);

    if (analysis.isEffective) {
      totalScore += analysis.score;
      effectiveIngredientCount++;
    }

    if (analysis.isDangerous) {
      dangerousIngredientCount++;
    }
  }

  // Calculate overall score
  const overallScore = effectiveIngredientCount > 0 
    ? Math.round(totalScore / effectiveIngredientCount) 
    : 0;

  // Calculate serving efficiency (how many scoops needed for effective dose)
  const servingEfficiency = calculateServingEfficiency(ingredientAnalysis, servingSizeG);
  
  // Calculate value score based on price per effective dose
  const valueScore = calculateValueScore(ingredientAnalysis, servingsPerContainer, price, currency, category);

  // Determine overall rating
  const overallRating = determineOverallRating(overallScore, dangerousIngredientCount, valueScore);

  // Generate comprehensive message
          const message = generateAnalysisMessage(
            overallScore,
            ingredientAnalysis,
            servingEfficiency,
            valueScore,
            dangerousIngredientCount
          );

          // Calculate manufacturer dosage analysis
          const manufacturerMinDosage = calculateManufacturerDosageAnalysis(
            ingredientAnalysis, 
            servingsPerContainer, 
            price, 
            'min',
            category
          );
          const manufacturerMaxDosage = calculateManufacturerDosageAnalysis(
            ingredientAnalysis, 
            servingsPerContainer, 
            price, 
            'max',
            category
          );

          return {
            overallScore,
            overallRating,
            message,
            ingredientAnalysis,
            valueScore,
            servingEfficiency,
            pricePerEffectiveDose: calculatePricePerEffectiveDose(ingredientAnalysis, servingsPerContainer, price, category),
            manufacturerMinDosage,
            manufacturerMaxDosage
          };
}

async function getIngredientConfigsForCategory(category: string, creatineType?: string): Promise<Record<string, CachedIngredientConfig>> {
  // Use cache for fast access
  const cachedConfigs = await ingredientDosageCache.getIngredientConfigsForCategory(category, creatineType);
  
  // Convert Map to Record for compatibility
  const configs: Record<string, CachedIngredientConfig> = {};
  for (const [name, config] of cachedConfigs) {
    configs[name] = config;
  }

  // Fallback to hardcoded data if cache is empty
  if (Object.keys(configs).length === 0) {
    console.warn('Cache empty, falling back to hardcoded ingredient data');
    
    // Add creatine supplements
    if (category === 'creatine' || category === 'pre-workout') {
      creatineSupplements.forEach(supplement => {
        configs[supplement.name] = {
          name: supplement.name,
          label: supplement.label,
          placeholder: supplement.placeholder,
          unit: supplement.unit,
          description: supplement.description,
          section: supplement.section,
          minDailyDosage: supplement.minDailyDosage,
          maxDailyDosage: supplement.maxDailyDosage,
          dangerousDosage: supplement.dangerousDosage,
          dosageNotes: supplement.dosageNotes,
          cautions: supplement.cautions,
          precaution_people: supplement.precaution_people,
          dosage_citation: supplement.dosage_citation,
          cautions_citation: supplement.cautions_citation
        };
      });
    }

    // Add amino acid supplements
    if (category === 'bcaa' || category === 'eaa' || category === 'pre-workout') {
      aminoAcidSupplements.forEach(supplement => {
        configs[supplement.name] = {
          name: supplement.name,
          label: supplement.label,
          placeholder: supplement.placeholder,
          unit: supplement.unit,
          description: supplement.description,
          section: supplement.section,
          minDailyDosage: supplement.minDailyDosage,
          maxDailyDosage: supplement.maxDailyDosage,
          dangerousDosage: supplement.dangerousDosage,
          dosageNotes: supplement.dosageNotes,
          cautions: supplement.cautions,
          precaution_people: supplement.precaution_people,
          dosage_citation: supplement.dosage_citation,
          cautions_citation: supplement.cautions_citation
        };
      });
    }

    // Add stimulant supplements
    if (category === 'pre-workout' || category === 'energy-drink' || category === 'fat-burner') {
      stimulantSupplements.forEach(supplement => {
        configs[supplement.name] = {
          name: supplement.name,
          label: supplement.label,
          placeholder: supplement.placeholder,
          unit: supplement.unit,
          description: supplement.description,
          section: supplement.section,
          minDailyDosage: supplement.minDailyDosage,
          maxDailyDosage: supplement.maxDailyDosage,
          dangerousDosage: supplement.dangerousDosage,
          dosageNotes: supplement.dosageNotes,
          cautions: supplement.cautions,
          precaution_people: supplement.precaution_people,
          dosage_citation: supplement.dosage_citation,
          cautions_citation: supplement.cautions_citation
        };
      });
    }
  }

  return configs;
}

function analyzeIngredient(ingredientName: string, actualDosage: number, config: any): IngredientAnalysis {
  const minDosage = config.minDailyDosage || 0;
  const maxDosage = config.maxDailyDosage || 0;
  const dangerousDosage = config.dangerousDosage || 0;

  let score = 0;
  let rating: DosageRating['rating'] = 'Poor';
  let message = '';
  let isEffective = false;
  let isDangerous = false;

  // Check for dangerous dosage - immediately set dangerous rating to 100%
  if (actualDosage >= dangerousDosage && dangerousDosage > 0) {
    score = 100; // Full score for dosage effectiveness
    rating = 'Excellent'; // Dosage is excellent, but dangerous
    message = `✅ ${config.label} dosage (${actualDosage}mg) is optimal but exceeds dangerous threshold (${dangerousDosage}mg)`;
    isDangerous = true; // Flag for safety rating
    isEffective = true;
  }
  // Check if above maximum safe dose - still score well but flag for safety
  else if (actualDosage > maxDosage && maxDosage > 0) {
    // Use logarithmic scale from 70% to 100% based on how much over max
    const overMaxRatio = actualDosage / maxDosage;
    const logScore = 70 + (Math.log(overMaxRatio) / Math.log(2)) * 10; // Logarithmic scaling
    score = Math.round(Math.min(100, Math.max(70, logScore)));
    
    if (score >= 90) rating = 'Excellent';
    else if (score >= 80) rating = 'Good';
    else rating = 'Fair';
    
    message = `✅ ${config.label} dosage (${actualDosage}mg) exceeds max safe dose (${maxDosage}mg) but is effective`;
    isEffective = true;
  }
  // Check if within effective range
  else if (actualDosage >= minDosage && actualDosage <= maxDosage) {
    // Logarithmic scale from 70% at min to 100% at max
    const ratio = (actualDosage - minDosage) / (maxDosage - minDosage);
    const logScore = 70 + (Math.log(1 + ratio) / Math.log(2)) * 30; // Logarithmic scaling
    score = Math.round(Math.min(100, Math.max(70, logScore)));
    
    if (score >= 90) rating = 'Excellent';
    else if (score >= 80) rating = 'Good';
    else rating = 'Fair';
    
    message = `✅ ${config.label} dosage (${actualDosage}mg) is within effective range (${minDosage}-${maxDosage}mg)`;
    isEffective = true;
  }
  // Check if below minimum effective dose
  else if (actualDosage > 0 && actualDosage < minDosage) {
    // Linear scale from 0% to 70% based on how close to minimum
    score = Math.round((actualDosage / minDosage) * 70);
    rating = 'Poor';
    message = `❌ ${config.label} dosage (${actualDosage}mg) is below minimum effective dose (${minDosage}mg)`;
  }
  // No dosage provided
  else {
    score = 0;
    rating = 'Poor';
    message = `No ${config.label} dosage provided`;
  }

  return {
    ingredientName,
    displayName: config.label,
    actualDosage,
    minDosage,
    maxDosage,
    dangerousDosage,
    score,
    rating,
    message,
    isEffective,
    isDangerous,
    unit: config.unit,
    dosageNotes: config.dosageNotes,
    cautions: config.cautions,
    precautionPeople: config.precaution_people,
    dosageCitation: config.dosage_citation,
    cautionsCitation: config.cautions_citation
  };
}

function calculateServingEfficiency(ingredientAnalysis: IngredientAnalysis[], servingSizeG: number): number {
  if (servingSizeG <= 0) return 0;

  // Find the ingredient that requires the most scoops for effective dose
  let maxScoopsNeeded = 0;

  for (const analysis of ingredientAnalysis) {
    if (analysis.isEffective && analysis.minDosage > 0) {
      // Convert mg to g and calculate scoops needed
      const minDoseG = analysis.minDosage / 1000;
      const scoopsNeeded = minDoseG / servingSizeG;
      maxScoopsNeeded = Math.max(maxScoopsNeeded, scoopsNeeded);
    }
  }

  // Score based on efficiency (1 scoop = 100, 2 scoops = 80, 3+ scoops = 60)
  if (maxScoopsNeeded <= 1) return 100;
  if (maxScoopsNeeded <= 2) return 80;
  if (maxScoopsNeeded <= 3) return 60;
  return Math.max(40, 100 - (maxScoopsNeeded - 3) * 10);
}

function calculateValueScore(
  ingredientAnalysis: IngredientAnalysis[], 
  servingsPerContainer: number, 
  price?: number, 
  currency: string = 'USD',
  category?: string
): number {
  if (!price || servingsPerContainer <= 0) return 50; // Neutral score if no price data

  // Simple calculation: price per serving (scoop for powders, serving for liquids)
  const pricePerServing = price / servingsPerContainer;
  
  // Calculate value score based on price per serving
  let valueScore = 100;
  
  // Adjust score based on price per serving
  if (pricePerServing <= 0.25) {
    valueScore = 100; // Excellent value - $0.25 or less per serving
  } else if (pricePerServing <= 0.50) {
    valueScore = 90; // Very good value - $0.50 or less per serving
  } else if (pricePerServing <= 1.00) {
    valueScore = 80; // Good value - $1.00 or less per serving
  } else if (pricePerServing <= 2.00) {
    valueScore = 60; // Fair value - $2.00 or less per serving
  } else if (pricePerServing <= 3.00) {
    valueScore = 40; // Poor value - $3.00 or less per serving
  } else {
    valueScore = 20; // Very poor value - over $3.00 per serving
  }

  return Math.max(0, Math.min(100, valueScore));
}

function calculatePricePerEffectiveDose(
  ingredientAnalysis: IngredientAnalysis[], 
  servingsPerContainer: number, 
  price?: number,
  category?: string
): number {
  if (!price || servingsPerContainer <= 0) return 0;

  // Simple calculation: price per serving (scoop for powders, serving for liquids)
  return price / servingsPerContainer;
}

function calculateManufacturerDosageAnalysis(
  ingredientAnalysis: IngredientAnalysis[], 
  servingsPerContainer: number, 
  price?: number,
  dosageType: 'min' | 'max' = 'min',
  category?: string
): ManufacturerDosageAnalysis {
  if (!price || servingsPerContainer <= 0) {
    return {
      score: 0,
      rating: 'Poor',
      message: 'No price data available',
      isEffective: false,
      isDangerous: false,
      scoopsNeeded: 0,
      pricePerScoop: 0
    };
  }

  const pricePerServing = price / servingsPerContainer;
  
  // Determine appropriate terminology and serving size based on category
  const isLiquidProduct = ['energy-drink', 'protein'].includes(category || '');
  const servingTerm = isLiquidProduct ? 'serving' : 'scoop';
  const servingsNeeded = 1;
  
  // Find the primary ingredient (highest scoring effective ingredient)
  const effectiveIngredients = ingredientAnalysis.filter(ing => ing.isEffective);
  if (effectiveIngredients.length === 0) {
    return {
      score: 0,
      rating: 'Poor',
      message: 'No effective ingredients found',
      isEffective: false,
      isDangerous: false,
      scoopsNeeded: 1,
      pricePerScoop: pricePerServing
    };
  }

  const primaryIngredient = effectiveIngredients.reduce((prev, current) => 
    prev.score > current.score ? prev : current
  );

  // Calculate score based on manufacturer's dosage effectiveness
  let score = 0;
  let rating: DosageRating['rating'] = 'Poor';
  let message = '';
  let isEffective = false;
  let isDangerous = false;

  if (dosageType === 'min') {
    // For min dosage, check if manufacturer's serving meets minimum effective dose
    if (primaryIngredient.actualDosage >= primaryIngredient.minDosage) {
      score = 100;
      rating = 'Excellent';
      message = `✅ Manufacturer's ${servingTerm} (${primaryIngredient.actualDosage}mg) meets minimum effective dose (${primaryIngredient.minDosage}mg)`;
      isEffective = true;
    } else {
      score = Math.round((primaryIngredient.actualDosage / primaryIngredient.minDosage) * 70);
      rating = 'Poor';
      message = `❌ Manufacturer's ${servingTerm} (${primaryIngredient.actualDosage}mg) below minimum effective dose (${primaryIngredient.minDosage}mg)`;
    }
  } else {
    // For max dosage, check if manufacturer's serving is within safe range
    if (primaryIngredient.actualDosage <= primaryIngredient.maxDosage) {
      if (primaryIngredient.actualDosage >= primaryIngredient.minDosage) {
        score = 100;
        rating = 'Excellent';
        message = `✅ Manufacturer's ${servingTerm} (${primaryIngredient.actualDosage}mg) is within optimal range (${primaryIngredient.minDosage}-${primaryIngredient.maxDosage}mg)`;
        isEffective = true;
      } else {
        score = Math.round((primaryIngredient.actualDosage / primaryIngredient.minDosage) * 70);
        rating = 'Poor';
        message = `❌ Manufacturer's ${servingTerm} (${primaryIngredient.actualDosage}mg) below minimum effective dose (${primaryIngredient.minDosage}mg)`;
      }
    } else if (primaryIngredient.actualDosage >= primaryIngredient.dangerousDosage) {
      score = 100; // Still effective but dangerous
      rating = 'Excellent';
      message = `✅ Manufacturer's ${servingTerm} (${primaryIngredient.actualDosage}mg) is effective but exceeds dangerous threshold (${primaryIngredient.dangerousDosage}mg)`;
      isEffective = true;
      isDangerous = true;
    } else {
      score = 80; // Above max but not dangerous
      rating = 'Good';
      message = `⚠️ Manufacturer's ${servingTerm} (${primaryIngredient.actualDosage}mg) exceeds max safe dose (${primaryIngredient.maxDosage}mg) but is effective`;
      isEffective = true;
    }
  }

  return {
    score,
    rating,
    message,
    isEffective,
    isDangerous,
    scoopsNeeded: servingsNeeded,
    pricePerScoop: pricePerServing
  };
}

function determineOverallRating(
  overallScore: number, 
  dangerousIngredientCount: number, 
  valueScore: number
): DosageRating['rating'] {
  // Factor in value score for dosage rating
  const adjustedScore = (overallScore + valueScore) / 2;
  
  if (adjustedScore >= 90) return 'Excellent';
  if (adjustedScore >= 80) return 'Good';
  if (adjustedScore >= 70) return 'Fair';
  if (adjustedScore >= 50) return 'Poor';
  return 'Poor';
}

function generateAnalysisMessage(
  overallScore: number,
  ingredientAnalysis: IngredientAnalysis[],
  servingEfficiency: number,
  valueScore: number,
  dangerousIngredientCount: number
): string {
  const effectiveIngredients = ingredientAnalysis.filter(ing => ing.isEffective);
  const poorIngredients = ingredientAnalysis.filter(ing => ing.rating === 'Poor');
  const excellentIngredients = ingredientAnalysis.filter(ing => ing.rating === 'Excellent');

  let message = `Overall dosage rating: ${overallScore}/100. `;
  
  if (dangerousIngredientCount > 0) {
    message += `🚨 ${dangerousIngredientCount} ingredient(s) exceed dangerous thresholds. `;
  }
  
  if (excellentIngredients.length > 0) {
    message += `✅ ${excellentIngredients.length} ingredient(s) are excellently dosed. `;
  }
  
  if (poorIngredients.length > 0) {
    message += `❌ ${poorIngredients.length} ingredient(s) have poor dosing. `;
  }

  // Add serving efficiency info
  if (servingEfficiency >= 80) {
    message += `🎯 Efficient serving size - effective dose achievable with 1-2 scoops. `;
  } else if (servingEfficiency >= 60) {
    message += `⚠️ May require multiple scoops for effective dosing. `;
  }

  // Add value assessment
  if (valueScore >= 80) {
    message += `💰 Excellent value for money.`;
  } else if (valueScore >= 60) {
    message += `💰 Good value for money.`;
  } else if (valueScore <= 40) {
    message += `💰 Poor value for money.`;
  }

  return message;
}

/**
 * Legacy function for backward compatibility
 */
export function calculateDosageRating(
  ingredientName: string, 
  dosage: number, 
  unit: string = 'mg',
  creatineType?: string,
  supplementData?: any
): DosageRating {
  // This maintains backward compatibility with the existing system
  // while providing enhanced analysis when needed
  
  if (supplementData) {
    const analysis = analyzeIngredient(ingredientName, dosage, supplementData);
    return {
      score: analysis.score,
      rating: analysis.rating,
      message: analysis.message
    };
  }

  // Fallback to basic calculation
  return {
    score: 0,
    rating: 'Poor',
    message: 'No dosage data available for this ingredient'
  };
}