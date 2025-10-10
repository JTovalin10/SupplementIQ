import { Trie } from '../../../tools/autocomplete';

/**
 * Autocomplete service using Trie data structure for fast prefix matching
 * Provides supplement name and ingredient autocomplete functionality
 */
export class AutocompleteService {
    private productTrie: Trie;
    private brandTrie: Trie;
    private flavorTrie: Trie;

    constructor() {
        this.productTrie = new Trie();
        this.brandTrie = new Trie();
        this.flavorTrie = new Trie();
        
        this.initializeData();
    }

    /**
     * Initialize trie data with common supplements and ingredients
     */
    private initializeData(): void {
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
            'vanilla', 'chocolate', 'strawberry', 'banana', 'cookies and cream',
            'mint chocolate chip', 'peanut butter', 'cinnamon', 'unflavored',
            'tropical punch', 'fruit punch', 'blue raspberry', 'green apple',
            'orange', 'grape', 'watermelon', 'cherry', 'lemon lime'
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
     */
    searchProducts(prefix: string, limit: number = 10): string[] {
        return this.productTrie.searchPrefix(prefix).slice(0, limit);
    }


    /**
     * Search for brand suggestions based on prefix
     * @param prefix - The search prefix
     * @param limit - Maximum number of results (default: 10)
     * @returns Array of matching brand names
     */
    searchBrands(prefix: string, limit: number = 10): string[] {
        return this.brandTrie.searchPrefix(prefix).slice(0, limit);
    }

    /**
     * Search for flavor suggestions based on prefix
     * @param prefix - The search prefix
     * @param limit - Maximum number of results (default: 10)
     * @returns Array of matching flavor names
     */
    searchFlavors(prefix: string, limit: number = 10): string[] {
        return this.flavorTrie.searchPrefix(prefix).slice(0, limit);
    }

    /**
     * Add new product to autocomplete index
     * @param productName - Name of the product to add
     */
    addProduct(productName: string): void {
        this.productTrie.insertWord(productName.toLowerCase());
    }


    /**
     * Add new brand to autocomplete index
     * @param brandName - Name of the brand to add
     */
    addBrand(brandName: string): void {
        this.brandTrie.insertWord(brandName.toLowerCase());
    }

    /**
     * Check if a product exists in the index
     * @param productName - Name of the product to check
     * @returns True if product exists
     */
    hasProduct(productName: string): boolean {
        return this.productTrie.searchWord(productName.toLowerCase());
    }


    /**
     * Check if a brand exists in the index
     * @param brandName - Name of the brand to check
     * @returns True if brand exists
     */
    hasBrand(brandName: string): boolean {
        return this.brandTrie.searchWord(brandName.toLowerCase());
    }
}

// Singleton instance - using high-performance C++ version
import { getCppAutocompleteService } from '../cpp-wrappers/cpp-autocomplete';

// Try to initialize C++ service, fallback to TypeScript version if needed
let autocompleteService: any;

async function initializeService() {
    try {
        // Try to initialize C++ service first
        const cppService = getCppAutocompleteService();
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
        const { fileAutocompleteService } = await import('./file-autocomplete');
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

export { autocompleteService };
