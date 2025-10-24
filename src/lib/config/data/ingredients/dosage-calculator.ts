import { getCreatineTypeDosage } from './creatine-dosages';
import { DosageRating } from './types';

// Helper function to get ingredient by name from all supplement files
export function getIngredientByName(name: string): any {
  // This will be implemented when we create the main index file
  // For now, return undefined
  return undefined;
}

// Dosage rating calculation based on scientific recommendations
export function calculateDosageRating(
  ingredientName: string, 
  dosage: number, 
  unit: string = 'mg',
  creatineType?: string, // For creatine-specific calculations
  supplementData?: any // For comprehensive supplement data
): DosageRating {
  // Special handling for creatine type selection
  if (ingredientName === 'creatine_type_name') {
    return {
      score: 100,
      rating: 'Excellent',
      message: 'Creatine type selected. Dosage recommendations will be based on the specific type chosen.'
    };
  }

  // Special handling for creatine supplements with specific type
  if (ingredientName.includes('creatine') && creatineType) {
    const creatineDosage = getCreatineTypeDosage(creatineType);
    if (creatineDosage) {
      return calculateCreatineDosageRating(dosage, unit, creatineDosage);
    }
  }

  // Default creatine monohydrate dosing if no specific type
  if (ingredientName.includes('creatine')) {
    const creatineDosage = getCreatineTypeDosage('Creatine Monohydrate');
    if (creatineDosage) {
      return calculateCreatineDosageRating(dosage, unit, creatineDosage);
    }
  }

  // Use comprehensive supplement data if available
  if (supplementData) {
    return calculateSupplementDosageRating(dosage, unit, supplementData);
  }

  // For other ingredients, we'll implement this when we have the full ingredient database
  return {
    score: 0,
    rating: 'Poor',
    message: 'No dosage data available for this ingredient'
  };
}

// Calculate dosage rating for specific creatine types
function calculateCreatineDosageRating(
  dosage: number, 
  unit: string, 
  creatineDosage: any
): DosageRating {
  // Convert dosage to mg if needed
  let dosageMg = dosage;
  if (unit === 'g') {
    dosageMg = dosage * 1000;
  } else if (unit === 'mcg') {
    dosageMg = dosage / 1000;
  }

  const minDose = creatineDosage.minDailyDosage;
  const maxDose = creatineDosage.maxDailyDosage;
  const dangerousDose = creatineDosage.dangerousDosage;

  // Calculate rating
  if (dosageMg >= dangerousDose) {
    return {
      score: 0,
      rating: 'Dangerous',
      message: `${creatineDosage.type} dosage (${dosageMg}mg) exceeds dangerous threshold (${dangerousDose}mg). ${creatineDosage.dosageNotes} ${creatineDosage.cautions ? `⚠️ ${creatineDosage.cautions}` : ''}`
    };
  } else if (dosageMg > maxDose) {
    return {
      score: 25,
      rating: 'Poor',
      message: `${creatineDosage.type} dosage (${dosageMg}mg) exceeds maximum safe dose (${maxDose}mg). May cause side effects. ${creatineDosage.cautions ? `⚠️ ${creatineDosage.cautions}` : ''}`
    };
  } else if (dosageMg >= minDose && dosageMg <= maxDose) {
    const score = Math.round(((dosageMg - minDose) / (maxDose - minDose)) * 50 + 50);
    return {
      score,
      rating: score >= 75 ? 'Excellent' : score >= 60 ? 'Good' : 'Fair',
      message: `${creatineDosage.type} dosage (${dosageMg}mg) is within effective range (${minDose}-${maxDose}mg). ${creatineDosage.dosageNotes}`
    };
  } else if (dosageMg > 0 && dosageMg < minDose) {
    return {
      score: 30,
      rating: 'Poor',
      message: `${creatineDosage.type} dosage (${dosageMg}mg) is below minimum effective dose (${minDose}mg). May not provide benefits.`
    };
  } else {
    return {
      score: 0,
      rating: 'Poor',
      message: `No ${creatineDosage.type} dosage provided`
    };
  }
}

// Calculate dosage rating for any supplement with comprehensive data
function calculateSupplementDosageRating(
  dosage: number,
  unit: string,
  supplement: any
): DosageRating {
  // Convert dosage to mg if needed
  let dosageMg = dosage;
  if (unit === 'g') {
    dosageMg = dosage * 1000;
  } else if (unit === 'mcg') {
    dosageMg = dosage / 1000;
  }

  const minDose = supplement.minDailyDosage;
  const maxDose = supplement.maxDailyDosage;
  const dangerousDose = supplement.dangerousDosage;

  // Check if ingredient is banned (all doses are 0)
  if (minDose === 0 && maxDose === 0 && dangerousDose === 0) {
    return {
      score: 0,
      rating: 'Dangerous',
      message: `🚨 ${supplement.label} is BANNED BY FDA. Any amount is illegal and dangerous. ${supplement.cautions || ''}`
    };
  }

  if (!minDose || !maxDose) {
    return {
      score: 0,
      rating: 'Poor',
      message: 'No dosage data available for this ingredient'
    };
  }

  // Calculate rating
  if (dosageMg >= dangerousDose) {
    return {
      score: 0,
      rating: 'Dangerous',
      message: `${supplement.label} dosage (${dosageMg}mg) exceeds dangerous threshold (${dangerousDose}mg). ${supplement.dosageNotes || ''} ${supplement.cautions ? `⚠️ ${supplement.cautions}` : ''}`
    };
  } else if (dosageMg > maxDose) {
    return {
      score: 25,
      rating: 'Poor',
      message: `${supplement.label} dosage (${dosageMg}mg) exceeds maximum safe dose (${maxDose}mg). May cause side effects. ${supplement.cautions ? `⚠️ ${supplement.cautions}` : ''}`
    };
  } else if (dosageMg >= minDose && dosageMg <= maxDose) {
    const score = Math.round(((dosageMg - minDose) / (maxDose - minDose)) * 50 + 50);
    return {
      score,
      rating: score >= 75 ? 'Excellent' : score >= 60 ? 'Good' : 'Fair',
      message: `${supplement.label} dosage (${dosageMg}mg) is within effective range (${minDose}-${maxDose}mg). ${supplement.dosageNotes || ''}`
    };
  } else if (dosageMg > 0 && dosageMg < minDose) {
    return {
      score: 30,
      rating: 'Poor',
      message: `${supplement.label} dosage (${dosageMg}mg) is below minimum effective dose (${minDose}mg). May not provide benefits.`
    };
  } else {
    return {
      score: 0,
      rating: 'Poor',
      message: `No ${supplement.label} dosage provided`
    };
  }
}

// Calculate overall product dosage rating
export function calculateProductDosageRating(
  ingredients: { name: string; dosage: number; unit?: string; creatineType?: string }[]
): DosageRating {
  if (ingredients.length === 0) {
    return {
      score: 0,
      rating: 'Poor',
      message: 'No ingredients to evaluate'
    };
  }

  const ratings = ingredients.map(ing => 
    calculateDosageRating(ing.name, ing.dosage, ing.unit, ing.creatineType)
  );

  // Calculate average score
  const averageScore = Math.round(
    ratings.reduce((sum, rating) => sum + rating.score, 0) / ratings.length
  );

  // Determine overall rating
  let overallRating: DosageRating['rating'];
  if (averageScore >= 80) overallRating = 'Excellent';
  else if (averageScore >= 60) overallRating = 'Good';
  else if (averageScore >= 40) overallRating = 'Fair';
  else if (averageScore >= 20) overallRating = 'Poor';
  else overallRating = 'Dangerous';

  // Count dangerous ingredients
  const dangerousCount = ratings.filter(r => r.rating === 'Dangerous').length;
  const poorCount = ratings.filter(r => r.rating === 'Poor').length;

  let message = `Overall dosage rating: ${averageScore}/100. `;
  if (dangerousCount > 0) {
    message += `${dangerousCount} ingredient(s) exceed dangerous thresholds. `;
  }
  if (poorCount > 0) {
    message += `${poorCount} ingredient(s) have poor dosing. `;
  }
  message += `${ratings.filter(r => r.rating === 'Excellent' || r.rating === 'Good').length} ingredient(s) are well-dosed.`;

  return {
    score: averageScore,
    rating: overallRating,
    message
  };
}
