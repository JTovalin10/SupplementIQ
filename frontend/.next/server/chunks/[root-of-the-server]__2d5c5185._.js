module.exports = [
"[externals]/fs [external] (fs, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("fs", () => require("fs"));

module.exports = mod;
}),
"[externals]/path [external] (path, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("path", () => require("path"));

module.exports = mod;
}),
"[project]/frontend/src/lib/backend/services/file-autocomplete.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "FileAutocompleteService",
    ()=>FileAutocompleteService,
    "fileAutocompleteService",
    ()=>fileAutocompleteService
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$fs__$5b$external$5d$__$28$fs$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/fs [external] (fs, cjs)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/path [external] (path, cjs)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$autocomplete$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/autocomplete.ts [app-route] (ecmascript)");
;
;
;
class FileAutocompleteService {
    productTrie;
    brandTrie;
    flavorTrie;
    dataDir;
    constructor(dataDir = './data/autocomplete'){
        this.productTrie = new __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$autocomplete$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["Trie"]();
        this.brandTrie = new __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$autocomplete$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["Trie"]();
        this.flavorTrie = new __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$autocomplete$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["Trie"]();
        this.dataDir = dataDir;
    }
    /**
     * Initialize and load data from files (only on server restart)
     */ async initialize() {
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
     */ async checkFilesExist() {
        const files = [
            __TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__["join"](this.dataDir, 'products.json'),
            __TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__["join"](this.dataDir, 'brands.json'),
            __TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__["join"](this.dataDir, 'flavors.json')
        ];
        try {
            await Promise.all(files.map((file)=>__TURBOPACK__imported__module__$5b$externals$5d2f$fs__$5b$external$5d$__$28$fs$2c$__cjs$29$__["promises"].access(file)));
            return true;
        } catch  {
            return false;
        }
    }
    /**
     * Load Trie data from JSON files
     */ async loadFromFiles() {
        const files = {
            products: __TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__["join"](this.dataDir, 'products.json'),
            brands: __TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__["join"](this.dataDir, 'brands.json'),
            flavors: __TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__["join"](this.dataDir, 'flavors.json')
        };
        try {
            // Load products
            const productsData = await __TURBOPACK__imported__module__$5b$externals$5d2f$fs__$5b$external$5d$__$28$fs$2c$__cjs$29$__["promises"].readFile(files.products, 'utf-8');
            const products = JSON.parse(productsData);
            products.forEach((product)=>this.productTrie.insertWord(product));
            // Load brands
            const brandsData = await __TURBOPACK__imported__module__$5b$externals$5d2f$fs__$5b$external$5d$__$28$fs$2c$__cjs$29$__["promises"].readFile(files.brands, 'utf-8');
            const brands = JSON.parse(brandsData);
            brands.forEach((brand)=>this.brandTrie.insertWord(brand));
            // Load flavors
            const flavorsData = await __TURBOPACK__imported__module__$5b$externals$5d2f$fs__$5b$external$5d$__$28$fs$2c$__cjs$29$__["promises"].readFile(files.flavors, 'utf-8');
            const flavors = JSON.parse(flavorsData);
            flavors.forEach((flavor)=>this.flavorTrie.insertWord(flavor));
        } catch (error) {
            console.error('Failed to load from files:', error);
            throw error;
        }
    }
    /**
     * Save Trie data to JSON files
     */ async saveToFiles() {
        try {
            const data = {
                products: this.productTrie.getAllWords(),
                brands: this.brandTrie.getAllWords(),
                flavors: this.flavorTrie.getAllWords()
            };
            await Promise.all([
                __TURBOPACK__imported__module__$5b$externals$5d2f$fs__$5b$external$5d$__$28$fs$2c$__cjs$29$__["promises"].writeFile(__TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__["join"](this.dataDir, 'products.json'), JSON.stringify(data.products, null, 2)),
                __TURBOPACK__imported__module__$5b$externals$5d2f$fs__$5b$external$5d$__$28$fs$2c$__cjs$29$__["promises"].writeFile(__TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__["join"](this.dataDir, 'brands.json'), JSON.stringify(data.brands, null, 2)),
                __TURBOPACK__imported__module__$5b$externals$5d2f$fs__$5b$external$5d$__$28$fs$2c$__cjs$29$__["promises"].writeFile(__TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__["join"](this.dataDir, 'flavors.json'), JSON.stringify(data.flavors, null, 2))
            ]);
            console.log('💾 Autocomplete data saved to files');
        } catch (error) {
            console.error('Failed to save autocomplete data:', error);
        }
    }
    /**
     * Add product to Trie (no immediate save for performance)
     */ addProduct(productName) {
        this.productTrie.insertWord(productName.toLowerCase());
    // No immediate save - will be saved when update cycle completes
    }
    /**
     * Add brand to Trie (no immediate save for performance)
     */ addBrand(brandName) {
        this.brandTrie.insertWord(brandName.toLowerCase());
    // No immediate save - will be saved when update cycle completes
    }
    /**
     * Add flavor to Trie (no immediate save for performance)
     */ addFlavor(flavorName) {
        this.flavorTrie.insertWord(flavorName.toLowerCase());
    // No immediate save - will be saved when update cycle completes
    }
    /**
     * Batch add multiple products for daily update cycle
     */ addProductsBatch(products) {
        products.forEach((product)=>{
            this.productTrie.insertWord(product.toLowerCase());
        });
    }
    /**
     * Batch add multiple brands for daily update cycle
     */ addBrandsBatch(brands) {
        brands.forEach((brand)=>{
            this.brandTrie.insertWord(brand.toLowerCase());
        });
    }
    /**
     * Batch add multiple flavors for daily update cycle
     */ addFlavorsBatch(flavors) {
        flavors.forEach((flavor)=>{
            this.flavorTrie.insertWord(flavor.toLowerCase());
        });
    }
    /**
     * Search methods for products, brands, and flavors
     */ searchProducts(prefix, limit = 25) {
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
     * No periodic saving to maintain performance
     */ async saveAfterUpdate() {
        await this.saveToFiles();
        console.log('💾 Autocomplete data saved after server update');
    }
    /**
     * Graceful shutdown - save current state
     */ async shutdown() {
        await this.saveToFiles();
        console.log('💾 Final autocomplete data saved on shutdown');
    }
    /**
     * Initialize with static supplement data
     */ initializeStaticData() {
        const staticData = {
            products: [
                'protein powder',
                'whey isolate',
                'casein protein',
                'creatine monohydrate',
                'bcaa powder',
                'eaa powder',
                'pre workout',
                'fat burner',
                'mass gainer',
                'multivitamin',
                'omega-3',
                'fish oil',
                'vitamin d',
                'magnesium',
                'zinc',
                'jacked3d',
                'c4',
                'pre-jym',
                'superpump250',
                'gold standard'
            ],
            brands: [
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
                'nature made'
            ],
            flavors: [
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
            ]
        };
        staticData.products.forEach((p)=>this.productTrie.insertWord(p));
        staticData.brands.forEach((b)=>this.brandTrie.insertWord(b));
        staticData.flavors.forEach((f)=>this.flavorTrie.insertWord(f));
    }
    /**
     * Get cache statistics
     */ getStats() {
        return {
            products: this.productTrie.getAllWords().length,
            brands: this.brandTrie.getAllWords().length,
            flavors: this.flavorTrie.getAllWords().length,
            dataDir: this.dataDir
        };
    }
}
const fileAutocompleteService = new FileAutocompleteService();
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__2d5c5185._.js.map