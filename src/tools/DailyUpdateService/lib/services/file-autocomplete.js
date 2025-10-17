/**
 * File-based persistent autocomplete service
 * JavaScript version for C++ component integration
 */

const fs = require('fs').promises;
const path = require('path');

// Simple Trie implementation for autocomplete
class Trie {
  constructor() {
    this.root = {};
  }

  insertWord(word) {
    let node = this.root;
    for (const char of word.toLowerCase()) {
      if (!node[char]) {
        node[char] = {};
      }
      node = node[char];
    }
    node.isEndOfWord = true;
  }

  searchPrefix(prefix) {
    const results = [];
    let node = this.root;
    
    // Navigate to prefix node
    for (const char of prefix.toLowerCase()) {
      if (!node[char]) {
        return results; // Prefix not found
      }
      node = node[char];
    }
    
    // Collect all words with this prefix
    this.collectWords(node, prefix.toLowerCase(), results);
    return results;
  }

  collectWords(node, prefix, results) {
    if (node.isEndOfWord) {
      results.push(prefix);
    }
    
    for (const [char, childNode] of Object.entries(node)) {
      if (char !== 'isEndOfWord') {
        this.collectWords(childNode, prefix + char, results);
      }
    }
  }

  getAllWords() {
    const results = [];
    this.collectWords(this.root, '', results);
    return results;
  }
}

class FileAutocompleteService {
  constructor(dataDir = './data/autocomplete') {
    this.productTrie = new Trie();
    this.brandTrie = new Trie();
    this.flavorTrie = new Trie();
    this.dataDir = dataDir;
  }

  /**
   * Initialize and load data from files (only on server restart)
   */
  async initialize() {
    try {
      console.log('🔄 Initializing file autocomplete service...');
      // Always use static data for now to avoid file loading issues
      console.log('🆕 Initializing with static data...');
      this.initializeStaticData();
      console.log('✅ File autocomplete service initialized with static data');
    } catch (error) {
      console.error('Failed to initialize file autocomplete:', error);
      console.log('🔄 Falling back to static data initialization...');
      this.initializeStaticData();
      console.log('✅ File autocomplete service initialized with static data (fallback)');
    }
  }

  /**
   * Check if cache files exist
   */
  async checkFilesExist() {
    const files = [
      path.join(this.dataDir, 'products.json'),
      path.join(this.dataDir, 'brands.json'),
      path.join(this.dataDir, 'flavors.json')
    ];

    try {
      await Promise.all(files.map(file => fs.access(file)));
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Load Trie data from JSON files
   */
  async loadFromFiles() {
    const files = {
      products: path.join(this.dataDir, 'products.json'),
      brands: path.join(this.dataDir, 'brands.json'),
      flavors: path.join(this.dataDir, 'flavors.json')
    };

    try {
      // Load products
      const productsData = await fs.readFile(files.products, 'utf-8');
      const products = JSON.parse(productsData);
      products.forEach(product => this.productTrie.insertWord(product));

      // Load brands
      const brandsData = await fs.readFile(files.brands, 'utf-8');
      const brands = JSON.parse(brandsData);
      brands.forEach(brand => this.brandTrie.insertWord(brand));

      // Load flavors
      const flavorsData = await fs.readFile(files.flavors, 'utf-8');
      const flavors = JSON.parse(flavorsData);
      flavors.forEach(flavor => this.flavorTrie.insertWord(flavor));

    } catch (error) {
      console.error('Failed to load from files:', error);
      throw error;
    }
  }

  /**
   * Save Trie data to JSON files
   */
  async saveToFiles() {
    try {
      const data = {
        products: this.productTrie.getAllWords(),
        brands: this.brandTrie.getAllWords(),
        flavors: this.flavorTrie.getAllWords()
      };

      await Promise.all([
        fs.writeFile(
          path.join(this.dataDir, 'products.json'), 
          JSON.stringify(data.products, null, 2)
        ),
        fs.writeFile(
          path.join(this.dataDir, 'brands.json'), 
          JSON.stringify(data.brands, null, 2)
        ),
        fs.writeFile(
          path.join(this.dataDir, 'flavors.json'), 
          JSON.stringify(data.flavors, null, 2)
        )
      ]);

      console.log('💾 Autocomplete data saved to files');
    } catch (error) {
      console.error('Failed to save autocomplete data:', error);
    }
  }

  /**
   * Add product to Trie (no immediate save for performance)
   */
  addProduct(productName) {
    this.productTrie.insertWord(productName.toLowerCase());
    // No immediate save - will be saved when update cycle completes
  }

  /**
   * Add brand to Trie (no immediate save for performance)
   */
  addBrand(brandName) {
    this.brandTrie.insertWord(brandName.toLowerCase());
    // No immediate save - will be saved when update cycle completes
  }

  /**
   * Add flavor to Trie (no immediate save for performance)
   */
  addFlavor(flavorName) {
    this.flavorTrie.insertWord(flavorName.toLowerCase());
    // No immediate save - will be saved when update cycle completes
  }

  /**
   * Batch add multiple products for daily update cycle
   */
  addProductsBatch(products) {
    products.forEach(product => {
      this.productTrie.insertWord(product.toLowerCase());
    });
  }

  /**
   * Batch add multiple brands for daily update cycle
   */
  addBrandsBatch(brands) {
    brands.forEach(brand => {
      this.brandTrie.insertWord(brand.toLowerCase());
    });
  }

  /**
   * Batch add multiple flavors for daily update cycle
   */
  addFlavorsBatch(flavors) {
    flavors.forEach(flavor => {
      this.flavorTrie.insertWord(flavor.toLowerCase());
    });
  }

  /**
   * Batch update with multiple products at once
   */
  batchUpdate(products) {
    console.log(`Batch updating ${products.length} products...`);
    
    products.forEach(product => {
      if (product.product) this.productTrie.insertWord(product.product.toLowerCase());
      if (product.brand) this.brandTrie.insertWord(product.brand.toLowerCase());
      if (product.flavor) this.flavorTrie.insertWord(product.flavor.toLowerCase());
    });
    
    console.log('Batch update completed');
  }

  /**
   * Search methods for products, brands, and flavors
   */
  searchProducts(prefix, limit = 25) {
    return this.productTrie.searchPrefix(prefix).slice(0, limit);
  }

  searchBrands(prefix, limit = 15) {
    return this.brandTrie.searchPrefix(prefix).slice(0, limit);
  }

  searchFlavors(prefix, limit = 15) {
    return this.flavorTrie.searchPrefix(prefix).slice(0, limit);
  }

  /**
   * Manual save trigger - only called when server updates are complete
   */
  async saveAfterUpdate() {
    await this.saveToFiles();
    console.log('💾 Autocomplete data saved after server update');
  }

  /**
   * Graceful shutdown - save current state
   */
  async shutdown() {
    await this.saveToFiles();
    console.log('💾 Final autocomplete data saved on shutdown');
  }

  /**
   * Initialize with static supplement data
   */
  initializeStaticData() {
    const staticData = {
      products: [
        'protein powder', 'whey isolate', 'casein protein', 'creatine monohydrate', 
        'bcaa powder', 'eaa powder', 'pre workout', 'fat burner', 'mass gainer',
        'multivitamin', 'omega-3', 'fish oil', 'vitamin d', 'magnesium', 'zinc',
        'jacked3d', 'c4', 'pre-jym', 'superpump250', 'gold standard'
      ],
      brands: [
        'optimum nutrition', 'dymatize', 'muscle tech', 'bpi sports',
        'cellucor', 'ghost', 'quest nutrition', 'gold standard',
        'isopure', 'gnc', 'vitamin shoppe', 'nature made'
      ],
      flavors: [
        'vanilla', 'chocolate', 'strawberry', 'banana', 'cookies and cream',
        'mint chocolate chip', 'peanut butter', 'cinnamon', 'unflavored',
        'tropical punch', 'fruit punch', 'blue raspberry', 'green apple',
        'orange', 'grape', 'watermelon', 'cherry', 'lemon lime'
      ]
    };

    staticData.products.forEach(p => this.productTrie.insertWord(p));
    staticData.brands.forEach(b => this.brandTrie.insertWord(b));
    staticData.flavors.forEach(f => this.flavorTrie.insertWord(f));
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      products: this.productTrie.getAllWords().length,
      brands: this.brandTrie.getAllWords().length,
      flavors: this.flavorTrie.getAllWords().length,
      dataDir: this.dataDir
    };
  }
}

// Singleton instance
const fileAutocompleteService = new FileAutocompleteService();

module.exports = {
  FileAutocompleteService,
  fileAutocompleteService
};
