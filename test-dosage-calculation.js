// Test script for enhanced dosage calculation
const { calculateEnhancedDosageRating } = require('./src/lib/config/data/ingredients/enhanced-dosage-calculator');

// Test data based on Gorilla Mode Creatine Monohydrate
const testProductData = {
  category: 'creatine',
  servingsPerContainer: 100,
  servingSizeG: 5.0,
  price: 39.99,
  currency: 'USD',
  creatineType: 'Creatine Monohydrate',
  ingredients: {
    // Assuming 5g serving contains 5g creatine monohydrate (pure creatine)
    creatine_monohydrate_mg: 5000 // 5g = 5000mg
  }
};

console.log('Testing Enhanced Dosage Calculation...');
console.log('Product Data:', testProductData);

try {
  const analysis = calculateEnhancedDosageRating(testProductData);
  
  console.log('\n=== ENHANCED DOSAGE ANALYSIS ===');
  console.log('Overall Score:', analysis.overallScore);
  console.log('Overall Rating:', analysis.overallRating);
  console.log('Message:', analysis.message);
  console.log('Value Score:', analysis.valueScore);
  console.log('Serving Efficiency:', analysis.servingEfficiency);
  console.log('Price per Effective Dose:', analysis.pricePerEffectiveDose);
  
  console.log('\n=== INGREDIENT ANALYSIS ===');
  analysis.ingredientAnalysis.forEach(ingredient => {
    console.log(`\n${ingredient.displayName}:`);
    console.log(`  Actual Dosage: ${ingredient.actualDosage}mg`);
    console.log(`  Min Dosage: ${ingredient.minDosage}mg`);
    console.log(`  Max Dosage: ${ingredient.maxDosage}mg`);
    console.log(`  Score: ${ingredient.score}/100`);
    console.log(`  Rating: ${ingredient.rating}`);
    console.log(`  Message: ${ingredient.message}`);
    console.log(`  Effective: ${ingredient.isEffective}`);
    console.log(`  Dangerous: ${ingredient.isDangerous}`);
  });
  
} catch (error) {
  console.error('Error in dosage calculation:', error);
}
