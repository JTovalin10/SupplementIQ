/**
 * Transparency Score Calculator
 * Calculates transparency scores (0-100) based on ingredient disclosure and data completeness
 */

// Ingredient amount constants for easy future modification
const INGREDIENT_AMOUNTS = {
  NOT_INCLUDED: 0,        // Ingredient is disclosed as not being in the product
  NOT_DISCLOSED: -1       // Ingredient is hidden in proprietary blend or not disclosed
} as const;

export interface IngredientData {
  name: string;
  amount: number; // INGREDIENT_AMOUNTS.NOT_INCLUDED = not included, INGREDIENT_AMOUNTS.NOT_DISCLOSED = not disclosed/blend, >0 = actual amount
  unit: string;
  disclosed: boolean; // true if amount > 0, false if amount = NOT_DISCLOSED, true if amount = NOT_INCLUDED
  verified: boolean;
  source?: string; // 'label', 'lab_test', 'estimated', 'unknown'
}

export interface ProductData {
  category: string;
  ingredients: IngredientData[];
  totalIngredients: number;
  hasNutritionFacts: boolean;
  hasThirdPartyTesting: boolean;
  brandTrust: 'new' | 'reputable' | 'controversial';
}

export interface TransparencyResult {
  score: number; // 0-100
  breakdown: {
    ingredientDisclosure: number;
    dataCompleteness: number;
    verificationLevel: number;
    brandTrust: number;
  };
  factors: string[];
}

/**
 * Calculate transparency score for a product
 * @param {ProductData} productData - Product information and ingredients
 * @returns {TransparencyResult} Calculated transparency score with breakdown
 */
export function calculateTransparencyScore(productData: ProductData): TransparencyResult {
  const { ingredients, totalIngredients, hasNutritionFacts, hasThirdPartyTesting, brandTrust } = productData;
  
  // 1. Ingredient Disclosure Score (40% weight)
  const disclosedIngredients = ingredients.filter(ing => isIngredientDisclosed(ing)).length;
  const ingredientDisclosure = totalIngredients > 0 
    ? Math.round((disclosedIngredients / totalIngredients) * 100)
    : 0;

  // 2. Data Completeness Score (30% weight)
  let dataCompleteness = 0;
  if (hasNutritionFacts) dataCompleteness += 50;
  if (hasThirdPartyTesting) dataCompleteness += 50;

  // 3. Verification Level Score (30% weight)
  const verifiedIngredients = ingredients.filter(ing => ing.verified && isIngredientDisclosed(ing)).length;
  const verificationLevel = ingredients.filter(ing => isIngredientDisclosed(ing)).length > 0 
    ? Math.round((verifiedIngredients / ingredients.filter(ing => isIngredientDisclosed(ing)).length) * 100)
    : 0;

  // 4. Brand Trust Score (new brands have no impact, reputable adds +10, controversial adds -10)
  let brandTrustScore = 0;
  if (brandTrust === 'reputable') {
    brandTrustScore = 10;
  } else if (brandTrust === 'controversial') {
    brandTrustScore = -10;
  }
  // new brands = 0 (no impact)

  // Calculate weighted total
  const totalScore = Math.round(
    (ingredientDisclosure * 0.4) +
    (dataCompleteness * 0.3) +
    (verificationLevel * 0.3)
  ) + brandTrustScore;

  // Generate factors
  const factors = generateFactors(ingredientDisclosure, dataCompleteness, verificationLevel, brandTrust);

  return {
    score: Math.min(100, Math.max(0, totalScore)),
    breakdown: {
      ingredientDisclosure,
      dataCompleteness,
      verificationLevel,
      brandTrust: brandTrustScore
    },
    factors
  };
}

/**
 * Determine if an ingredient is disclosed based on its amount value
 * @param {IngredientData} ingredient - Ingredient data with amount
 * @returns {boolean} True if ingredient is disclosed (amount > 0 or amount = NOT_INCLUDED but not NOT_DISCLOSED)
 */
function isIngredientDisclosed(ingredient: IngredientData): boolean {
  // amount > 0 = disclosed with actual amount
  // amount = NOT_INCLUDED = disclosed as not included
  // amount = NOT_DISCLOSED = not disclosed (proprietary blend, hidden, etc.)
  return ingredient.amount !== INGREDIENT_AMOUNTS.NOT_DISCLOSED;
}

/**
 * Get ingredient disclosure status description
 * @param {IngredientData} ingredient - Ingredient data with amount
 * @returns {string} Description of disclosure status
 */
function getIngredientDisclosureStatus(ingredient: IngredientData): string {
  if (ingredient.amount > 0) {
    return `Disclosed: ${ingredient.amount}${ingredient.unit}`;
  } else if (ingredient.amount === INGREDIENT_AMOUNTS.NOT_INCLUDED) {
    return 'Not included';
  } else {
    return 'Not disclosed (proprietary blend)';
  }
}

/**
 * Generate transparency factors based on individual scores
 * @param {number} ingredientDisclosure - Ingredient disclosure score (0-100)
 * @param {number} dataCompleteness - Data completeness score (0-100)
 * @param {number} verificationLevel - Verification level score (0-100)
 * @param {string} brandTrust - Brand trust level ('new', 'reputable', 'controversial')
 * @returns {string[]} Array of descriptive transparency factors
 */
function generateFactors(
  ingredientDisclosure: number,
  dataCompleteness: number,
  verificationLevel: number,
  brandTrust: string
): string[] {
  const factors: string[] = [];

  // Ingredient disclosure factors
  if (ingredientDisclosure >= 90) {
    factors.push('Excellent ingredient disclosure');
  } else if (ingredientDisclosure >= 70) {
    factors.push('Good ingredient disclosure');
  } else if (ingredientDisclosure >= 50) {
    factors.push('Partial ingredient disclosure');
  } else {
    factors.push('Poor ingredient disclosure');
  }

  // Data completeness factors
  if (dataCompleteness >= 75) {
    factors.push('Comprehensive product data available');
  } else if (dataCompleteness >= 50) {
    factors.push('Moderate product data available');
  } else {
    factors.push('Limited product data available');
  }

  // Verification factors
  if (verificationLevel >= 80) {
    factors.push('High verification level');
  } else if (verificationLevel >= 50) {
    factors.push('Moderate verification level');
  } else {
    factors.push('Low verification level');
  }

  // Brand trust factors
  if (brandTrust === 'reputable') {
    factors.push('Reputable brand - adds trust bonus');
  } else if (brandTrust === 'controversial') {
    factors.push('Controversial brand - reduces trust');
  } else {
    factors.push('New brand - no impact on score');
  }

  return factors;
}


/**
 * Calculate transparency score for a specific supplement category based on ingredient disclosure
 * This measures how much the brand discloses about ingredients, not whether dosages are correct
 * @param {string} category - Product category (e.g., 'protein', 'pre-workout', 'fat-burner')
 * @param {IngredientData[]} ingredients - Array of ingredient data with disclosure status
 * @returns {number} Category-specific transparency score (0-100) based purely on disclosure
 */
export function calculateCategoryTransparency(category: string, ingredients: IngredientData[]): number {
  // Define category-specific important ingredients that should be disclosed
  const categoryIngredients: Record<string, string[]> = {
    'protein': [
      'protein_claim_g',
      'effective_protein_g',
      'protein_sources',
      'whey_protein',
      'casein_protein',
      'amino_acids',
      'bcaa',
      'sweeteners',
      'flavors'
    ],
    'pre-workout': [
      'caffeine',
      'l_citrulline',
      'creatine',
      'beta_alanine',
      'l_tyrosine',
      'betaine',
      'agmatine',
      'stimulants',
      'sweeteners'
    ],
    'fat-burner': [
      'caffeine',
      'green_tea_extract',
      'l_carnitine',
      'synephrine',
      'yohimbine',
      'capsimax',
      'stimulants',
      'thermogenics'
    ],
    'vitamin': [
      'vitamin_d',
      'vitamin_b12',
      'magnesium',
      'zinc',
      'iron',
      'calcium',
      'vitamin_c',
      'multivitamin'
    ],
    'creatine': [
      'creatine_monohydrate',
      'creatine_hcl',
      'creatine_ethyl_ester',
      'purity',
      'contaminants'
    ],
    'bcaa': [
      'l_leucine',
      'l_isoleucine',
      'l_valine',
      'amino_acids',
      'ratio'
    ]
  };

  const importantIngredients = categoryIngredients[category] || [];
  
  if (importantIngredients.length === 0) {
    // If category not defined, just count disclosed vs total ingredients
    const disclosedCount = ingredients.filter(ing => isIngredientDisclosed(ing)).length;
    const totalCount = ingredients.length;
    return totalCount > 0 ? Math.round((disclosedCount / totalCount) * 100) : 0;
  }

  // Check how many category-important ingredients are disclosed
  const disclosedImportantIngredients = ingredients.filter(ing => {
    const ingredientName = ing.name.toLowerCase();
    return isIngredientDisclosed(ing) && importantIngredients.some(important => 
      ingredientName.includes(important.toLowerCase()) || 
      important.toLowerCase().includes(ingredientName)
    );
  }).length;

  // Calculate transparency based on disclosed important ingredients vs total important ingredients
  const totalImportantInProduct = ingredients.filter(ing => {
    const ingredientName = ing.name.toLowerCase();
    return importantIngredients.some(important => 
      ingredientName.includes(important.toLowerCase()) || 
      important.toLowerCase().includes(ingredientName)
    );
  }).length;

  if (totalImportantInProduct === 0) {
    // If no category-important ingredients found, fall back to general disclosure
    const disclosedCount = ingredients.filter(ing => isIngredientDisclosed(ing)).length;
    const totalCount = ingredients.length;
    return totalCount > 0 ? Math.round((disclosedCount / totalCount) * 100) : 0;
  }

  return Math.round((disclosedImportantIngredients / totalImportantInProduct) * 100);
}

/**
 * Get human-readable description of transparency score level
 * @param {number} score - Transparency score (0-100)
 * @returns {string} Descriptive text of the transparency level (e.g., 'Excellent transparency')
 */
export function getTransparencyDescription(score: number): string {
  if (score >= 90) return 'Excellent transparency - Full disclosure and verification';
  if (score >= 80) return 'Very good transparency - Most data available and verified';
  if (score >= 70) return 'Good transparency - Good disclosure with some gaps';
  if (score >= 60) return 'Fair transparency - Basic disclosure with limitations';
  if (score >= 50) return 'Poor transparency - Limited disclosure and verification';
  return 'Very poor transparency - Minimal disclosure and verification';
}

/**
 * Get CSS color class for transparency score display in UI
 * @param {number} score - Transparency score (0-100)
 * @returns {string} Tailwind CSS color class (e.g., 'text-green-600', 'text-red-600')
 */
export function getTransparencyColor(score: number): string {
  if (score >= 80) return 'text-green-600';
  if (score >= 60) return 'text-yellow-600';
  if (score >= 40) return 'text-orange-600';
  return 'text-red-600';
}
