// Simple enhanced dosage calculation without cache
export interface ProductDosageAnalysis {
  overallScore: number;
  overallRating: 'Excellent' | 'Good' | 'Fair' | 'Poor' | 'Dangerous';
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
  rating: 'Excellent' | 'Good' | 'Fair' | 'Poor' | 'Dangerous';
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
  rating: 'Excellent' | 'Good' | 'Fair' | 'Poor' | 'Dangerous';
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
export function calculateEnhancedDosageRating(productData: ProductData): ProductDosageAnalysis {
  const { category, servingsPerContainer, servingSizeG, price, currency = 'USD', creatineType, ingredients } = productData;

  // Get ingredient configurations based on category
  const ingredientConfigs = getIngredientConfigsForCategory(category, creatineType);
  
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

function getIngredientConfigsForCategory(category: string, creatineType?: string): Record<string, any> {
  const configs: Record<string, any> = {};

  // Add creatine supplements
  if (category === 'creatine' || category === 'pre-workout') {
    // Basic creatine monohydrate config
    configs['creatine_monohydrate_mg'] = {
      name: 'creatine_monohydrate_mg',
      label: 'Creatine Monohydrate',
      placeholder: '5000',
      unit: 'mg',
      description: 'Most researched form of creatine for muscle strength and power',
      section: 'Creatine',
      minDailyDosage: 3000,
      maxDailyDosage: 5000,
      dangerousDosage: 10000,
      dosageNotes: 'Most researched form. Loading phase: 20g/day for 5-7 days, then 3-5g maintenance.',
      cautions: 'High doses (10g+) may cause GI distress, bloating, or cramping. Take with plenty of water.',
      precaution_people: ['kidney disease', 'diabetes', 'bipolar disorder', 'taking medications that affect kidney function'],
      dosage_citation: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC2048496/',
      cautions_citation: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC2048496/'
    };
  }

  return configs;
}

function analyzeIngredient(ingredientName: string, actualDosage: number, config: any): IngredientAnalysis {
  const minDosage = config.minDailyDosage || 0;
  const maxDosage = config.maxDailyDosage || 0;
  const dangerousDosage = config.dangerousDosage || 0;

  let score = 0;
  let rating: IngredientAnalysis['rating'] = 'Poor';
  let message = '';
  let isEffective = false;
  let isDangerous = false;

  // Check for dangerous dosage
  if (actualDosage >= dangerousDosage && dangerousDosage > 0) {
    score = 0;
    rating = 'Dangerous';
    message = `🚨 ${config.label} dosage (${actualDosage}mg) exceeds dangerous threshold (${dangerousDosage}mg)`;
    isDangerous = true;
  }
  // Check if above maximum safe dose
  else if (actualDosage > maxDosage && maxDosage > 0) {
    score = 25;
    rating = 'Poor';
    message = `⚠️ ${config.label} dosage (${actualDosage}mg) exceeds maximum safe dose (${maxDosage}mg)`;
  }
  // Check if within effective range
  else if (actualDosage >= minDosage && actualDosage <= maxDosage) {
    // Score based on how close to optimal (max) dose
    score = Math.round(((actualDosage - minDosage) / (maxDosage - minDosage)) * 50 + 50);
    
    if (score >= 80) rating = 'Excellent';
    else if (score >= 60) rating = 'Good';
    else rating = 'Fair';
    
    message = `✅ ${config.label} dosage (${actualDosage}mg) is within effective range (${minDosage}-${maxDosage}mg)`;
    isEffective = true;
  }
  // Check if below minimum effective dose
  else if (actualDosage > 0 && actualDosage < minDosage) {
    score = 30;
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
  currency: string = 'USD'
): number {
  if (!price || servingsPerContainer <= 0) return 50; // Neutral score if no price data

  // Calculate total effective ingredients value
  let totalEffectiveValue = 0;
  let effectiveIngredientCount = 0;

  for (const analysis of ingredientAnalysis) {
    if (analysis.isEffective) {
      // Value based on how close to optimal dose
      const valueMultiplier = analysis.score / 100;
      totalEffectiveValue += valueMultiplier;
      effectiveIngredientCount++;
    }
  }

  if (effectiveIngredientCount === 0) return 0;

  const averageValue = totalEffectiveValue / effectiveIngredientCount;
  const pricePerServing = price / servingsPerContainer;
  
  // Score based on value proposition
  // Higher score for products with good dosing at reasonable prices
  let valueScore = averageValue * 100;
  
  // Adjust for price (this is a simplified model - you might want to add market price comparisons)
  if (pricePerServing < 1) valueScore += 20; // Very cheap
  else if (pricePerServing < 2) valueScore += 10; // Cheap
  else if (pricePerServing > 5) valueScore -= 20; // Expensive
  else if (pricePerServing > 3) valueScore -= 10; // Moderately expensive

  return Math.max(0, Math.min(100, valueScore));
}

function calculatePricePerEffectiveDose(
  ingredientAnalysis: IngredientAnalysis[], 
  servingsPerContainer: number, 
  price?: number
): number {
  if (!price || servingsPerContainer <= 0) return 0;

  // Simple calculation: price per scoop
  return price / servingsPerContainer;
}

function calculateManufacturerDosageAnalysis(
  ingredientAnalysis: IngredientAnalysis[], 
  servingsPerContainer: number, 
  price?: number,
  dosageType: 'min' | 'max' = 'min'
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

  const pricePerScoop = price / servingsPerContainer;
  
  // For manufacturer dosage, we assume 1 scoop = manufacturer's recommended serving
  const scoopsNeeded = 1;
  
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
      pricePerScoop
    };
  }

  const primaryIngredient = effectiveIngredients.reduce((prev, current) => 
    prev.score > current.score ? prev : current
  );

  // Calculate score based on manufacturer's dosage effectiveness
  let score = 0;
  let rating: 'Excellent' | 'Good' | 'Fair' | 'Poor' | 'Dangerous' = 'Poor';
  let message = '';
  let isEffective = false;
  let isDangerous = false;

  if (dosageType === 'min') {
    // For min dosage, check if manufacturer's serving meets minimum effective dose
    if (primaryIngredient.actualDosage >= primaryIngredient.minDosage) {
      score = 100;
      rating = 'Excellent';
      message = `✅ Manufacturer's serving (${primaryIngredient.actualDosage}mg) meets minimum effective dose (${primaryIngredient.minDosage}mg)`;
      isEffective = true;
    } else {
      score = Math.round((primaryIngredient.actualDosage / primaryIngredient.minDosage) * 70);
      rating = 'Poor';
      message = `❌ Manufacturer's serving (${primaryIngredient.actualDosage}mg) below minimum effective dose (${primaryIngredient.minDosage}mg)`;
    }
  } else {
    // For max dosage, check if manufacturer's serving is within safe range
    if (primaryIngredient.actualDosage <= primaryIngredient.maxDosage) {
      if (primaryIngredient.actualDosage >= primaryIngredient.minDosage) {
        score = 100;
        rating = 'Excellent';
        message = `✅ Manufacturer's serving (${primaryIngredient.actualDosage}mg) is within optimal range (${primaryIngredient.minDosage}-${primaryIngredient.maxDosage}mg)`;
        isEffective = true;
      } else {
        score = Math.round((primaryIngredient.actualDosage / primaryIngredient.minDosage) * 70);
        rating = 'Poor';
        message = `❌ Manufacturer's serving (${primaryIngredient.actualDosage}mg) below minimum effective dose (${primaryIngredient.minDosage}mg)`;
      }
    } else if (primaryIngredient.actualDosage >= primaryIngredient.dangerousDosage) {
      score = 100; // Still effective but dangerous
      rating = 'Excellent';
      message = `✅ Manufacturer's serving (${primaryIngredient.actualDosage}mg) is effective but exceeds dangerous threshold (${primaryIngredient.dangerousDosage}mg)`;
      isEffective = true;
      isDangerous = true;
    } else {
      score = 80; // Above max but not dangerous
      rating = 'Good';
      message = `⚠️ Manufacturer's serving (${primaryIngredient.actualDosage}mg) exceeds max safe dose (${primaryIngredient.maxDosage}mg) but is effective`;
      isEffective = true;
    }
  }

  return {
    score,
    rating,
    message,
    isEffective,
    isDangerous,
    scoopsNeeded,
    pricePerScoop
  };
}

function determineOverallRating(
  overallScore: number, 
  dangerousIngredientCount: number, 
  valueScore: number
): ProductDosageAnalysis['overallRating'] {
  // If any ingredient is dangerous, overall rating is dangerous
  if (dangerousIngredientCount > 0) return 'Dangerous';
  
  // Factor in value score
  const adjustedScore = (overallScore + valueScore) / 2;
  
  if (adjustedScore >= 85) return 'Excellent';
  if (adjustedScore >= 70) return 'Good';
  if (adjustedScore >= 50) return 'Fair';
  if (adjustedScore >= 25) return 'Poor';
  return 'Dangerous';
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
