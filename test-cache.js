// Test script for ingredient dosage cache
const { ingredientDosageCache } = require('./src/lib/cache/ingredient-dosage-cache');

async function testCache() {
  console.log('Testing Ingredient Dosage Cache...\n');

  try {
    // Test cache stats before loading
    console.log('Initial cache stats:', ingredientDosageCache.getCacheStats());

    // Test getting creatine monohydrate config
    console.log('\n1. Testing creatine monohydrate config...');
    const creatineConfig = await ingredientDosageCache.getIngredientConfig('creatine_monohydrate_mg');
    
    if (creatineConfig) {
      console.log('✅ Found creatine config:');
      console.log(`   Name: ${creatineConfig.name}`);
      console.log(`   Label: ${creatineConfig.label}`);
      console.log(`   Min Dosage: ${creatineConfig.minDailyDosage}mg`);
      console.log(`   Max Dosage: ${creatineConfig.maxDailyDosage}mg`);
      console.log(`   Dangerous Dosage: ${creatineConfig.dangerousDosage}mg`);
    } else {
      console.log('❌ Creatine config not found');
    }

    // Test getting creatine type config
    console.log('\n2. Testing creatine type config...');
    const creatineTypeConfig = await ingredientDosageCache.getCreatineTypeConfig('Creatine Monohydrate');
    
    if (creatineTypeConfig) {
      console.log('✅ Found creatine type config:');
      console.log(`   Type: ${creatineTypeConfig.type}`);
      console.log(`   Min Dosage: ${creatineTypeConfig.minDailyDosage}mg`);
      console.log(`   Max Dosage: ${creatineTypeConfig.maxDailyDosage}mg`);
      console.log(`   Bioavailability: ${creatineTypeConfig.bioavailability}%`);
    } else {
      console.log('❌ Creatine type config not found');
    }

    // Test getting configs for creatine category
    console.log('\n3. Testing category configs...');
    const categoryConfigs = await ingredientDosageCache.getIngredientConfigsForCategory('creatine');
    console.log(`✅ Found ${categoryConfigs.size} configs for creatine category`);
    
    for (const [name, config] of categoryConfigs) {
      console.log(`   - ${name}: ${config.label}`);
    }

    // Test cache stats after loading
    console.log('\n4. Final cache stats:');
    console.log(ingredientDosageCache.getCacheStats());

    // Test cache performance
    console.log('\n5. Testing cache performance...');
    const startTime = Date.now();
    
    for (let i = 0; i < 100; i++) {
      await ingredientDosageCache.getIngredientConfig('creatine_monohydrate_mg');
    }
    
    const endTime = Date.now();
    console.log(`✅ 100 cache lookups completed in ${endTime - startTime}ms`);
    console.log(`   Average: ${(endTime - startTime) / 100}ms per lookup`);

  } catch (error) {
    console.error('❌ Error testing cache:', error);
  }
}

testCache();
