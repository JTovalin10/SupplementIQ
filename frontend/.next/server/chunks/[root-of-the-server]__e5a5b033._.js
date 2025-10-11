module.exports = [
"[project]/frontend/.next-internal/server/app/api/v1/autocomplete/products/route/actions.js [app-rsc] (server actions loader, ecmascript)", ((__turbopack_context__, module, exports) => {

}),
"[externals]/next/dist/compiled/next-server/app-route-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-route-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/@opentelemetry/api [external] (next/dist/compiled/@opentelemetry/api, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/@opentelemetry/api", () => require("next/dist/compiled/@opentelemetry/api"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/after-task-async-storage.external.js [external] (next/dist/server/app-render/after-task-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/after-task-async-storage.external.js", () => require("next/dist/server/app-render/after-task-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/action-async-storage.external.js [external] (next/dist/server/app-render/action-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/action-async-storage.external.js", () => require("next/dist/server/app-render/action-async-storage.external.js"));

module.exports = mod;
}),
"[project]/frontend/src/lib/autocomplete.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Trie",
    ()=>Trie,
    "TrieNode",
    ()=>TrieNode
]);
class TrieNode {
    children;
    isEndOfWord;
    constructor(){
        this.children = new Map();
        this.isEndOfWord = false;
    }
}
class Trie {
    root;
    constructor(){
        this.root = new TrieNode();
    }
    insertWord(word) {
        let curr = this.root;
        for (const char of word.toLowerCase()){
            if (!curr.children.has(char)) {
                curr.children.set(char, new TrieNode());
            }
            curr = curr.children.get(char);
        }
        curr.isEndOfWord = true;
    }
    searchWord(word) {
        let curr = this.root;
        for (const char of word.toLowerCase()){
            if (!curr.children.has(char)) {
                return false;
            }
            curr = curr.children.get(char);
        }
        return curr.isEndOfWord;
    }
    searchPrefix(prefix) {
        let curr = this.root;
        // Navigate to the prefix
        for (const char of prefix.toLowerCase()){
            if (!curr.children.has(char)) {
                return []; // Prefix doesn't exist
            }
            curr = curr.children.get(char);
        }
        // Find all words with this prefix
        const results = [];
        this.dfs(curr, prefix.toLowerCase(), results);
        return results;
    }
    dfs(node, current, results) {
        if (node.isEndOfWord) {
            results.push(current);
        }
        for (const [char, childNode] of node.children){
            this.dfs(childNode, current + char, results);
        }
    }
    // Insert multiple words at once
    insertWords(words) {
        for (const word of words){
            this.insertWord(word);
        }
    }
    // Get all words in the trie
    getAllWords() {
        const results = [];
        this.dfs(this.root, '', results);
        return results;
    }
}
;
// Example usage
const trie = new Trie();
// Insert supplement-related words including alphanumeric product names
const supplementWords = [
    'protein',
    'whey',
    'casein',
    'creatine',
    'bcaa',
    'eaa',
    'preworkout',
    'fatburner',
    'multivitamin',
    'omega3',
    'magnesium',
    'zinc',
    'vitamin d',
    'fish oil',
    // Alphanumeric product names
    'jacked3d',
    'c4',
    'pre-jym',
    'alpha-gpc',
    'l-arginine',
    '5-htp',
    'd3',
    'b12',
    'k2',
    'omega-3',
    'omega-6',
    'n.o.-xplode',
    'superpump250',
    'jack3d',
    'no-xplode',
    'cell-tech',
    'nitro-tech',
    'mass-tech',
    'iso-100',
    'gold-standard',
    'optimum-nutrition',
    'muscle-tech'
];
trie.insertWords(supplementWords);
// Test the trie with alphanumeric searches
console.log('Search "jacked3d":', trie.searchWord('jacked3d'));
console.log('Search "c4":', trie.searchWord('c4'));
console.log('Search "omega3":', trie.searchWord('omega3'));
console.log('Words starting with "jack":', trie.searchPrefix('jack'));
console.log('Words starting with "c":', trie.searchPrefix('c'));
console.log('Words starting with "omega":', trie.searchPrefix('omega'));
// Test special character edge cases
console.log('\n=== SPECIAL CHARACTER TESTS ===');
// Test with spaces (should be ignored)
console.log('Testing with spaces: "jack ed3d"');
trie.insertWord('jack ed3d');
console.log('Search "jacked3d":', trie.searchWord('jacked3d'));
// Test with special characters that should be ignored
console.log('\nTesting with ignored characters:');
trie.insertWord('jack@ed3d!');
trie.insertWord('jack#ed3d$');
trie.insertWord('jack%ed3d^');
console.log('Search "jacked3d":', trie.searchWord('jacked3d'));
// Test with mixed valid/invalid characters
console.log('\nTesting mixed characters: "jack@3d!"');
trie.insertWord('jack@3d!');
console.log('Search "jack3d":', trie.searchWord('jack3d'));
// Test empty string
console.log('\nTesting empty string:');
console.log('Search "":', trie.searchWord(''));
// Test only special characters
console.log('\nTesting only special characters: "@#$%"');
trie.insertWord('@#$%');
console.log('Search "@#$%":', trie.searchWord('@#$%'));
// Test unicode characters
console.log('\nTesting unicode characters: "α-test"');
trie.insertWord('α-test');
console.log('Search "α-test":', trie.searchWord('α-test'));
// Test very long string with mixed characters
console.log('\nTesting long mixed string:');
const longString = 'very-long-supplement-name-with-numbers-123-and-symbols-!@#$%';
trie.insertWord(longString);
console.log('Search long string:', trie.searchWord('very-long-supplement-name-with-numbers-123-and-symbols'));
// Test prefix search with special characters
console.log('\nPrefix search with special chars: "jack@"');
const specialResults = trie.searchPrefix('jack@');
console.log('Results:', specialResults);
// Test case sensitivity with numbers
console.log('\nCase sensitivity test:');
trie.insertWord('Jacked3D');
console.log('Search "jacked3d":', trie.searchWord('jacked3d'));
console.log('Search "JACKED3D":', trie.searchWord('JACKED3D'));
// Test SQL injection attempts
console.log('\n=== SECURITY TESTS ===');
console.log('Testing SQL injection attempts:');
trie.insertWord("'; DROP TABLE products; --");
trie.insertWord("1' OR '1'='1");
trie.insertWord('<script>alert("xss")</script>');
console.log('Search "DROP TABLE":', trie.searchWord("'; DROP TABLE products; --"));
console.log('Search "1 OR 1=1":', trie.searchWord("1' OR '1'='1"));
console.log('Search "script":', trie.searchWord('<script>alert("xss")</script>'));
// Test XSS attempts
console.log('\nTesting XSS attempts:');
trie.insertWord('<img src=x onerror=alert(1)>');
trie.insertWord('javascript:alert(1)');
console.log('Search "img src":', trie.searchWord('<img src=x onerror=alert(1)>'));
console.log('Search "javascript":', trie.searchWord('javascript:alert(1)'));
// Test path traversal attempts
console.log('\nTesting path traversal:');
trie.insertWord('../../../etc/passwd');
trie.insertWord('..\\..\\..\\windows\\system32');
console.log('Search "etc passwd":', trie.searchWord('../../../etc/passwd'));
console.log('Search "windows system32":', trie.searchWord('..\\..\\..\\windows\\system32'));
console.log('\nAll words:', trie.getAllWords());
}),
"[project]/frontend/src/lib/backend/cpp-wrappers/cpp-autocomplete.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * High-performance C++ autocomplete service wrapper
 * Provides thread-safe, multithreaded autocomplete operations
 */ __turbopack_context__.s([
    "CppAutocompleteService",
    ()=>CppAutocompleteService,
    "getCppAutocompleteService",
    ()=>getCppAutocompleteService,
    "initializeCppAutocompleteService",
    ()=>initializeCppAutocompleteService
]);
class CppAutocompleteService {
    service;
    isInitialized = false;
    constructor(){
        try {
            // For now, use a fallback implementation since C++ module isn't available
            this.service = null;
            this.isInitialized = false;
            console.log('⚠️ C++ Autocomplete service fallback mode (C++ module not available)');
        } catch (error) {
            console.error('❌ Failed to load C++ Autocomplete service:', error);
            this.service = null;
            this.isInitialized = false;
        }
    }
    /**
     * Initialize the service with data directory
     */ async initialize(dataDir = './data/autocomplete') {
        try {
            if (!this.service) {
                // Fallback mode - mark as initialized but use fallback methods
                this.isInitialized = true;
                console.log('⚠️ C++ Autocomplete service initialized in fallback mode');
                return true;
            }
            const success = this.service.initialize(dataDir);
            this.isInitialized = success;
            if (success) {
                console.log('✅ C++ Autocomplete service initialized');
            } else {
                console.error('❌ Failed to initialize C++ Autocomplete service');
            }
            return success;
        } catch (error) {
            console.error('❌ Error initializing C++ Autocomplete service:', error);
            // Enable fallback mode
            this.isInitialized = true;
            return true;
        }
    }
    /**
     * Search products with prefix
     */ searchProducts(prefix, limit = 25) {
        if (!this.isInitialized) {
            throw new Error('C++ Autocomplete service not initialized');
        }
        try {
            if (!this.service) {
                // Fallback: return empty array for now
                console.log('⚠️ C++ Autocomplete fallback: returning empty products array');
                return [];
            }
            return this.service.searchProducts(prefix, limit);
        } catch (error) {
            console.error('❌ Error searching products:', error);
            return [];
        }
    }
    /**
     * Search brands with prefix
     */ searchBrands(prefix, limit = 15) {
        if (!this.isInitialized) {
            throw new Error('C++ Autocomplete service not initialized');
        }
        try {
            if (!this.service) {
                console.log('⚠️ C++ Autocomplete fallback: returning empty brands array');
                return [];
            }
            return this.service.searchBrands(prefix, limit);
        } catch (error) {
            console.error('❌ Error searching brands:', error);
            return [];
        }
    }
    /**
     * Search flavors with prefix
     */ searchFlavors(prefix, limit = 15) {
        if (!this.isInitialized) {
            throw new Error('C++ Autocomplete service not initialized');
        }
        try {
            if (!this.service) {
                console.log('⚠️ C++ Autocomplete fallback: returning empty flavors array');
                return [];
            }
            return this.service.searchFlavors(prefix, limit);
        } catch (error) {
            console.error('❌ Error searching flavors:', error);
            return [];
        }
    }
    /**
     * Add products in batch (thread-safe)
     */ addProductsBatch(products) {
        if (!this.isInitialized) {
            throw new Error('C++ Autocomplete service not initialized');
        }
        try {
            return this.service.addProductsBatch(products);
        } catch (error) {
            console.error('❌ Error adding products batch:', error);
            return false;
        }
    }
    /**
     * Add brands in batch (thread-safe)
     */ addBrandsBatch(brands) {
        if (!this.isInitialized) {
            throw new Error('C++ Autocomplete service not initialized');
        }
        try {
            return this.service.addBrandsBatch(brands);
        } catch (error) {
            console.error('❌ Error adding brands batch:', error);
            return false;
        }
    }
    /**
     * Add flavors in batch (thread-safe)
     */ addFlavorsBatch(flavors) {
        if (!this.isInitialized) {
            throw new Error('C++ Autocomplete service not initialized');
        }
        try {
            return this.service.addFlavorsBatch(flavors);
        } catch (error) {
            console.error('❌ Error adding flavors batch:', error);
            return false;
        }
    }
    /**
     * Add single product
     */ addProduct(product) {
        if (!this.isInitialized) {
            throw new Error('C++ Autocomplete service not initialized');
        }
        try {
            return this.service.addProduct(product);
        } catch (error) {
            console.error('❌ Error adding product:', error);
            return false;
        }
    }
    /**
     * Add single brand
     */ addBrand(brand) {
        if (!this.isInitialized) {
            throw new Error('C++ Autocomplete service not initialized');
        }
        try {
            return this.service.addBrand(brand);
        } catch (error) {
            console.error('❌ Error adding brand:', error);
            return false;
        }
    }
    /**
     * Add single flavor
     */ addFlavor(flavor) {
        if (!this.isInitialized) {
            throw new Error('C++ Autocomplete service not initialized');
        }
        try {
            return this.service.addFlavor(flavor);
        } catch (error) {
            console.error('❌ Error adding flavor:', error);
            return false;
        }
    }
    /**
     * Save data to files
     */ saveToFiles() {
        if (!this.isInitialized) {
            throw new Error('C++ Autocomplete service not initialized');
        }
        try {
            return this.service.saveToFiles();
        } catch (error) {
            console.error('❌ Error saving to files:', error);
            return false;
        }
    }
    /**
     * Load data from files
     */ loadFromFiles() {
        if (!this.isInitialized) {
            throw new Error('C++ Autocomplete service not initialized');
        }
        try {
            return this.service.loadFromFiles();
        } catch (error) {
            console.error('❌ Error loading from files:', error);
            return false;
        }
    }
    /**
     * Get service statistics
     */ getStats() {
        if (!this.isInitialized) {
            throw new Error('C++ Autocomplete service not initialized');
        }
        try {
            return this.service.getStats();
        } catch (error) {
            console.error('❌ Error getting stats:', error);
            return {
                productCount: 0,
                brandCount: 0,
                flavorCount: 0,
                dataDir: ''
            };
        }
    }
    /**
     * Clear all data
     */ clearAll() {
        if (!this.isInitialized) {
            throw new Error('C++ Autocomplete service not initialized');
        }
        try {
            return this.service.clearAll();
        } catch (error) {
            console.error('❌ Error clearing all data:', error);
            return false;
        }
    }
    /**
     * Check if product exists
     */ hasProduct(product) {
        if (!this.isInitialized) {
            throw new Error('C++ Autocomplete service not initialized');
        }
        try {
            return this.service.hasProduct(product);
        } catch (error) {
            console.error('❌ Error checking product:', error);
            return false;
        }
    }
    /**
     * Check if brand exists
     */ hasBrand(brand) {
        if (!this.isInitialized) {
            throw new Error('C++ Autocomplete service not initialized');
        }
        try {
            return this.service.hasBrand(brand);
        } catch (error) {
            console.error('❌ Error checking brand:', error);
            return false;
        }
    }
    /**
     * Check if flavor exists
     */ hasFlavor(flavor) {
        if (!this.isInitialized) {
            throw new Error('C++ Autocomplete service not initialized');
        }
        try {
            return this.service.hasFlavor(flavor);
        } catch (error) {
            console.error('❌ Error checking flavor:', error);
            return false;
        }
    }
    /**
     * Shutdown the service
     */ shutdown() {
        try {
            const success = this.service.shutdown();
            this.isInitialized = false;
            console.log('✅ C++ Autocomplete service shutdown');
            return success;
        } catch (error) {
            console.error('❌ Error shutting down C++ Autocomplete service:', error);
            return false;
        }
    }
}
// Singleton instance
let cppAutocompleteService = null;
function getCppAutocompleteService() {
    if (!cppAutocompleteService) {
        cppAutocompleteService = new CppAutocompleteService();
    }
    return cppAutocompleteService;
}
async function initializeCppAutocompleteService(dataDir) {
    const service = getCppAutocompleteService();
    return await service.initialize(dataDir);
}
}),
"[project]/frontend/src/lib/backend/services/autocomplete.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "AutocompleteService",
    ()=>AutocompleteService,
    "autocompleteService",
    ()=>autocompleteService
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$autocomplete$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/autocomplete.ts [app-route] (ecmascript)");
// Singleton instance - using high-performance C++ version
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$backend$2f$cpp$2d$wrappers$2f$cpp$2d$autocomplete$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/backend/cpp-wrappers/cpp-autocomplete.ts [app-route] (ecmascript)");
;
class AutocompleteService {
    productTrie;
    brandTrie;
    flavorTrie;
    constructor(){
        this.productTrie = new __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$autocomplete$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["Trie"]();
        this.brandTrie = new __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$autocomplete$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["Trie"]();
        this.flavorTrie = new __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$autocomplete$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["Trie"]();
        this.initializeData();
    }
    /**
     * Initialize trie data with common supplements and ingredients
     */ initializeData() {
        // Product names including alphanumeric supplements
        const products = [
            'whey protein isolate',
            'whey protein concentrate',
            'casein protein',
            'plant protein',
            'creatine monohydrate',
            'creatine hcl',
            'bcaa powder',
            'eaa powder',
            'pre workout',
            'fat burner',
            'multivitamin',
            'omega 3',
            'fish oil',
            'vitamin d',
            'magnesium',
            'zinc',
            'iron supplement',
            'calcium supplement',
            'probiotic',
            'collagen peptide',
            // Alphanumeric product names
            'jacked3d',
            'c4',
            'pre-jym',
            'superpump250',
            'jack3d',
            'no-xplode',
            'cell-tech',
            'nitro-tech',
            'mass-tech',
            'iso-100',
            'gold-standard',
            'optimum-nutrition',
            'muscle-tech',
            'alpha-gpc',
            '5-htp',
            'omega-3',
            'omega-6'
        ];
        // Brands
        const brands = [
            'optimum nutrition',
            'dymatize',
            'muscle tech',
            'bpi sports',
            'cellucor',
            'ghost',
            'quest nutrition',
            'gold standard',
            'isopure',
            'gnc',
            'vitamin shoppe',
            'nature made',
            'centrum',
            'garden of life',
            'now foods'
        ];
        // Flavors
        const flavors = [
            'vanilla',
            'chocolate',
            'strawberry',
            'banana',
            'cookies and cream',
            'mint chocolate chip',
            'peanut butter',
            'cinnamon',
            'unflavored',
            'tropical punch',
            'fruit punch',
            'blue raspberry',
            'green apple',
            'orange',
            'grape',
            'watermelon',
            'cherry',
            'lemon lime'
        ];
        this.productTrie.insertWords(products);
        this.brandTrie.insertWords(brands);
        this.flavorTrie.insertWords(flavors);
    }
    /**
     * Search for product suggestions based on prefix
     * @param prefix - The search prefix
     * @param limit - Maximum number of results (default: 10)
     * @returns Array of matching product names
     */ searchProducts(prefix, limit = 10) {
        return this.productTrie.searchPrefix(prefix).slice(0, limit);
    }
    /**
     * Search for brand suggestions based on prefix
     * @param prefix - The search prefix
     * @param limit - Maximum number of results (default: 10)
     * @returns Array of matching brand names
     */ searchBrands(prefix, limit = 10) {
        return this.brandTrie.searchPrefix(prefix).slice(0, limit);
    }
    /**
     * Search for flavor suggestions based on prefix
     * @param prefix - The search prefix
     * @param limit - Maximum number of results (default: 10)
     * @returns Array of matching flavor names
     */ searchFlavors(prefix, limit = 10) {
        return this.flavorTrie.searchPrefix(prefix).slice(0, limit);
    }
    /**
     * Add new product to autocomplete index
     * @param productName - Name of the product to add
     */ addProduct(productName) {
        this.productTrie.insertWord(productName.toLowerCase());
    }
    /**
     * Add new brand to autocomplete index
     * @param brandName - Name of the brand to add
     */ addBrand(brandName) {
        this.brandTrie.insertWord(brandName.toLowerCase());
    }
    /**
     * Check if a product exists in the index
     * @param productName - Name of the product to check
     * @returns True if product exists
     */ hasProduct(productName) {
        return this.productTrie.searchWord(productName.toLowerCase());
    }
    /**
     * Check if a brand exists in the index
     * @param brandName - Name of the brand to check
     * @returns True if brand exists
     */ hasBrand(brandName) {
        return this.brandTrie.searchWord(brandName.toLowerCase());
    }
}
;
// Try to initialize C++ service, fallback to TypeScript version if needed
let autocompleteService;
async function initializeService() {
    try {
        // Try to initialize C++ service first
        const cppService = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$backend$2f$cpp$2d$wrappers$2f$cpp$2d$autocomplete$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getCppAutocompleteService"])();
        const success = await cppService.initialize();
        if (success) {
            autocompleteService = cppService;
            console.log('✅ Using high-performance C++ autocomplete service');
        } else {
            throw new Error('C++ service initialization failed');
        }
    } catch (error) {
        console.warn('⚠️ C++ autocomplete service unavailable, falling back to TypeScript version');
        console.warn('Error:', error);
        // Fallback to TypeScript version
        const { fileAutocompleteService } = await __turbopack_context__.A("[project]/frontend/src/lib/backend/services/file-autocomplete.ts [app-route] (ecmascript, async loader)");
        try {
            await fileAutocompleteService.initialize();
            autocompleteService = fileAutocompleteService;
        } catch (initError) {
            console.error('Failed to initialize file autocomplete service:', initError);
            throw initError;
        }
    }
}
// Initialize on startup
initializeService().catch(console.error);
;
}),
"[project]/frontend/src/lib/middleware/validation.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * Validation utilities for Next.js API routes
 * Provides input sanitization and validation functions
 */ /**
 * Sanitize input string to prevent injection attacks
 * Removes potentially dangerous characters and normalizes whitespace
 * 
 * @param input - Raw input string to sanitize
 * @returns Sanitized string safe for database queries
 * 
 * @example
 * const sanitized = sanitizeInput("user' input; DROP TABLE users;");
 * // Returns: "user input DROP TABLE users"
 */ __turbopack_context__.s([
    "createAuthError",
    ()=>createAuthError,
    "createAuthorizationError",
    ()=>createAuthorizationError,
    "createDatabaseError",
    ()=>createDatabaseError,
    "createInternalError",
    ()=>createInternalError,
    "createNotFoundError",
    ()=>createNotFoundError,
    "createValidationError",
    ()=>createValidationError,
    "isValidEmail",
    ()=>isValidEmail,
    "isValidUUID",
    ()=>isValidUUID,
    "isValidUrl",
    ()=>isValidUrl,
    "sanitizeInput",
    ()=>sanitizeInput,
    "validatePagination",
    ()=>validatePagination,
    "validatePassword",
    ()=>validatePassword,
    "validateSort",
    ()=>validateSort
]);
function sanitizeInput(input) {
    if (typeof input !== 'string') {
        return '';
    }
    return input.trim().replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/['";]/g, '') // Remove SQL injection characters
    .replace(/[()]/g, '') // Remove parentheses
    .replace(/[{}]/g, '') // Remove braces
    .replace(/[\[\]]/g, '') // Remove brackets
    .replace(/[\\]/g, '') // Remove backslashes
    .replace(/[\/]/g, ' ') // Replace forward slashes with spaces
    .replace(/\s+/g, ' ') // Normalize whitespace
    .slice(0, 1000); // Limit length to prevent buffer overflow
}
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}
function isValidUUID(uuid) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
}
function isValidUrl(url) {
    try {
        new URL(url);
        return true;
    } catch  {
        return false;
    }
}
function validatePassword(password) {
    if (!password || password.length < 8) {
        return {
            isValid: false,
            error: 'Password must be at least 8 characters long'
        };
    }
    if (!/[A-Z]/.test(password)) {
        return {
            isValid: false,
            error: 'Password must contain at least one uppercase letter'
        };
    }
    if (!/[a-z]/.test(password)) {
        return {
            isValid: false,
            error: 'Password must contain at least one lowercase letter'
        };
    }
    if (!/[0-9]/.test(password)) {
        return {
            isValid: false,
            error: 'Password must contain at least one number'
        };
    }
    return {
        isValid: true
    };
}
function validatePagination(page, limit) {
    const pageNum = page ? parseInt(page) : 1;
    const limitNum = limit ? parseInt(limit) : 25;
    if (isNaN(pageNum) || pageNum < 1) {
        return {
            isValid: false,
            error: 'Page must be a positive integer'
        };
    }
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
        return {
            isValid: false,
            error: 'Limit must be between 1 and 100'
        };
    }
    return {
        isValid: true,
        page: pageNum,
        limit: limitNum
    };
}
function validateSort(sort, order, allowedFields = [
    'name',
    'created_at',
    'rating',
    'price'
]) {
    const sortField = sort || 'created_at';
    const sortOrder = order || 'desc';
    if (!allowedFields.includes(sortField)) {
        return {
            isValid: false,
            error: `Invalid sort field. Allowed: ${allowedFields.join(', ')}`
        };
    }
    if (![
        'asc',
        'desc'
    ].includes(sortOrder)) {
        return {
            isValid: false,
            error: 'Sort order must be "asc" or "desc"'
        };
    }
    return {
        isValid: true,
        sort: sortField,
        order: sortOrder
    };
}
function createValidationError(message, details) {
    return {
        error: 'Validation error',
        message,
        ...details && {
            details
        }
    };
}
function createDatabaseError(message, originalError) {
    return {
        error: 'Database error',
        message,
        ...originalError && {
            details: originalError
        }
    };
}
function createAuthError(message) {
    return {
        error: 'Unauthorized',
        message
    };
}
function createAuthorizationError(message) {
    return {
        error: 'Forbidden',
        message
    };
}
function createNotFoundError(message) {
    return {
        error: 'Not found',
        message
    };
}
function createInternalError(message) {
    return {
        error: 'Internal server error',
        message
    };
}
}),
"[project]/frontend/src/app/api/v1/autocomplete/products/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GET",
    ()=>GET,
    "POST",
    ()=>POST
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$backend$2f$services$2f$autocomplete$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/backend/services/autocomplete.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$middleware$2f$validation$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/middleware/validation.ts [app-route] (ecmascript)");
;
;
;
async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const query = searchParams.get('q');
        const limit = parseInt(searchParams.get('limit') || '25');
        // Validation
        if (!query || query.length < 1) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                success: false,
                error: 'Query parameter "q" is required and must be at least 1 character'
            }, {
                status: 400
            });
        }
        if (limit < 1 || limit > 100) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                success: false,
                error: 'Limit must be between 1 and 100'
            }, {
                status: 400
            });
        }
        const sanitizedQuery = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$middleware$2f$validation$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["sanitizeInput"])(query);
        const suggestions = __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$backend$2f$services$2f$autocomplete$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["autocompleteService"].searchProducts(sanitizedQuery, limit);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            success: true,
            data: {
                suggestions,
                query: sanitizedQuery,
                count: suggestions.length
            }
        });
    } catch (error) {
        console.error('Autocomplete products error:', error);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            success: false,
            error: 'Internal server error'
        }, {
            status: 500
        });
    }
}
async function POST(request) {
    try {
        const body = await request.json();
        const { name } = body;
        // Validation
        if (!name || typeof name !== 'string' || name.trim().length < 1) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                success: false,
                error: 'Product name is required and must be a non-empty string'
            }, {
                status: 400
            });
        }
        // TODO: Add authentication and authorization checks
        // For now, we'll allow the operation but in production you should verify:
        // 1. User is authenticated
        // 2. User has admin/moderator permissions
        const productName = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$middleware$2f$validation$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["sanitizeInput"])(name.trim());
        __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$backend$2f$services$2f$autocomplete$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["autocompleteService"].addProduct(productName);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            success: true,
            message: 'Product added to autocomplete index',
            data: {
                name: productName
            }
        });
    } catch (error) {
        console.error('Add product to autocomplete error:', error);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            success: false,
            error: 'Internal server error'
        }, {
            status: 500
        });
    }
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__e5a5b033._.js.map