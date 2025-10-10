/**
 * Simple test to isolate the cache loading issue
 */

const fs = require('fs').promises;
const path = require('path');

async function testCacheLoading() {
  console.log('🧪 Testing cache file loading...\n');
  
  try {
    const dataDir = './data/autocomplete';
    const files = {
      products: path.join(dataDir, 'products.json'),
      brands: path.join(dataDir, 'brands.json'),
      flavors: path.join(dataDir, 'flavors.json')
    };

    console.log('1. Checking if data directory exists...');
    try {
      await fs.access(dataDir);
      console.log('   ✅ Data directory exists');
    } catch (err) {
      console.log('   ❌ Data directory does not exist:', err.message);
      return;
    }

    console.log('\n2. Checking cache files...');
    for (const [type, filePath] of Object.entries(files)) {
      try {
        await fs.access(filePath);
        console.log(`   ✅ ${type}.json exists`);
      } catch (err) {
        console.log(`   ❌ ${type}.json missing:`, err.message);
      }
    }

    console.log('\n3. Testing file reading...');
    try {
      const productsData = await fs.readFile(files.products, 'utf-8');
      console.log('   ✅ Successfully read products.json');
      console.log(`   Content length: ${productsData.length} characters`);
      
      const products = JSON.parse(productsData);
      console.log(`   Parsed ${products.length} products`);
    } catch (err) {
      console.log('   ❌ Failed to read/parse products.json:', err.message);
    }

    console.log('\n4. Testing Trie import...');
    try {
      const { Trie } = require('./tools/autocomplete');
      const trie = new Trie();
      console.log('   ✅ Trie imported successfully');
      
      // Test inserting a word
      trie.insertWord('test');
      const results = trie.searchPrefix('test');
      console.log(`   ✅ Trie working: inserted 'test', found ${results.length} results`);
    } catch (err) {
      console.log('   ❌ Trie import/usage failed:', err.message);
    }

    console.log('\n✅ Cache loading test complete!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
  }
}

testCacheLoading();
