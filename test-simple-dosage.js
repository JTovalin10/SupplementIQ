// Simple test for Gorilla Mode Creatine dosage calculation
const testProductData = {
  category: 'creatine',
  servingsPerContainer: 100,
  servingSizeG: 5.0,
  price: 39.99,
  currency: 'USD',
  creatineType: 'Creatine Monohydrate',
  ingredients: {
    creatine_monohydrate_mg: 5000 // 5g = 5000mg
  }
};

console.log('Testing Gorilla Mode Creatine Dosage Calculation...');
console.log('Product Data:', testProductData);

// Basic dosage analysis
const creatineDosage = testProductData.ingredients.creatine_monohydrate_mg;
const minDosage = 3000; // 3g minimum effective dose
const maxDosage = 5000; // 5g maximum safe dose
const dangerousDosage = 10000; // 10g+ dangerous

console.log('\n=== DOSAGE ANALYSIS ===');
console.log(`Actual Dosage: ${creatineDosage}mg`);
console.log(`Min Effective Dose: ${minDosage}mg`);
console.log(`Max Safe Dose: ${maxDosage}mg`);
console.log(`Dangerous Dose: ${dangerousDosage}mg`);

// Calculate score
let score = 0;
let rating = 'Poor';
let message = '';

if (creatineDosage >= dangerousDosage) {
  score = 0;
  rating = 'Dangerous';
  message = `🚨 Creatine dosage (${creatineDosage}mg) exceeds dangerous threshold (${dangerousDosage}mg)`;
} else if (creatineDosage > maxDosage) {
  score = 25;
  rating = 'Poor';
  message = `⚠️ Creatine dosage (${creatineDosage}mg) exceeds maximum safe dose (${maxDosage}mg)`;
} else if (creatineDosage >= minDosage && creatineDosage <= maxDosage) {
  // Score based on how close to optimal (max) dose
  score = Math.round(((creatineDosage - minDosage) / (maxDosage - minDosage)) * 50 + 50);
  
  if (score >= 80) rating = 'Excellent';
  else if (score >= 60) rating = 'Good';
  else rating = 'Fair';
  
  message = `✅ Creatine dosage (${creatineDosage}mg) is within effective range (${minDosage}-${maxDosage}mg)`;
} else if (creatineDosage > 0 && creatineDosage < minDosage) {
  score = 30;
  rating = 'Poor';
  message = `❌ Creatine dosage (${creatineDosage}mg) is below minimum effective dose (${minDosage}mg)`;
} else {
  score = 0;
  rating = 'Poor';
  message = 'No creatine dosage provided';
}

console.log(`\nScore: ${score}/100`);
console.log(`Rating: ${rating}`);
console.log(`Message: ${message}`);

// Calculate serving efficiency
const minDoseG = minDosage / 1000; // Convert to grams
const scoopsNeeded = minDoseG / testProductData.servingSizeG;
let servingEfficiency = 0;

if (scoopsNeeded <= 1) servingEfficiency = 100;
else if (scoopsNeeded <= 2) servingEfficiency = 80;
else if (scoopsNeeded <= 3) servingEfficiency = 60;
else servingEfficiency = Math.max(40, 100 - (scoopsNeeded - 3) * 10);

console.log(`\n=== SERVING EFFICIENCY ===`);
console.log(`Scoops needed for effective dose: ${scoopsNeeded.toFixed(1)}`);
console.log(`Serving efficiency score: ${servingEfficiency}/100`);

// Calculate value score
const pricePerServing = testProductData.price / testProductData.servingsPerContainer;
const servingsNeeded = Math.ceil(minDoseG / testProductData.servingSizeG);
const pricePerEffectiveDose = pricePerServing * servingsNeeded;

let valueScore = score; // Start with dosage score
if (pricePerServing < 1) valueScore += 20; // Very cheap
else if (pricePerServing < 2) valueScore += 10; // Cheap
else if (pricePerServing > 5) valueScore -= 20; // Expensive
else if (pricePerServing > 3) valueScore -= 10; // Moderately expensive

valueScore = Math.max(0, Math.min(100, valueScore));

console.log(`\n=== VALUE ANALYSIS ===`);
console.log(`Price per serving: $${pricePerServing.toFixed(2)}`);
console.log(`Servings needed for effective dose: ${servingsNeeded}`);
console.log(`Price per effective dose: $${pricePerEffectiveDose.toFixed(2)}`);
console.log(`Value score: ${valueScore}/100`);

// Overall assessment
const overallScore = Math.round((score + servingEfficiency + valueScore) / 3);
let overallRating = 'Poor';
if (overallScore >= 85) overallRating = 'Excellent';
else if (overallScore >= 70) overallRating = 'Good';
else if (overallScore >= 50) overallRating = 'Fair';

console.log(`\n=== OVERALL ASSESSMENT ===`);
console.log(`Overall Score: ${overallScore}/100`);
console.log(`Overall Rating: ${overallRating}`);

if (overallScore >= 80) {
  console.log(`🎯 This is an excellent creatine product!`);
} else if (overallScore >= 60) {
  console.log(`👍 This is a good creatine product.`);
} else if (overallScore >= 40) {
  console.log(`⚠️ This creatine product has some issues.`);
} else {
  console.log(`❌ This creatine product needs improvement.`);
}
