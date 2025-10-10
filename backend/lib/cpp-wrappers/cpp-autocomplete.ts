
/**
 * High-performance C++ autocomplete service wrapper
 * Provides thread-safe, multithreaded autocomplete operations
 */
export class CppAutocompleteService {
    private service: any;
    private isInitialized: boolean = false;

    constructor() {
        try {
            this.service = new NativeAutocompleteService();
            console.log('✅ C++ Autocomplete service loaded');
        } catch (error) {
            console.error('❌ Failed to load C++ Autocomplete service:', error);
            throw error;
        }
    }

    /**
     * Initialize the service with data directory
     */
    async initialize(dataDir: string = './data/autocomplete'): Promise<boolean> {
        try {
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
            return false;
        }
    }

    /**
     * Search products with prefix
     */
    searchProducts(prefix: string, limit: number = 25): string[] {
        if (!this.isInitialized) {
            throw new Error('C++ Autocomplete service not initialized');
        }
        
        try {
            return this.service.searchProducts(prefix, limit);
        } catch (error) {
            console.error('❌ Error searching products:', error);
            return [];
        }
    }

    /**
     * Search brands with prefix
     */
    searchBrands(prefix: string, limit: number = 15): string[] {
        if (!this.isInitialized) {
            throw new Error('C++ Autocomplete service not initialized');
        }
        
        try {
            return this.service.searchBrands(prefix, limit);
        } catch (error) {
            console.error('❌ Error searching brands:', error);
            return [];
        }
    }

    /**
     * Search flavors with prefix
     */
    searchFlavors(prefix: string, limit: number = 15): string[] {
        if (!this.isInitialized) {
            throw new Error('C++ Autocomplete service not initialized');
        }
        
        try {
            return this.service.searchFlavors(prefix, limit);
        } catch (error) {
            console.error('❌ Error searching flavors:', error);
            return [];
        }
    }

    /**
     * Add products in batch (thread-safe)
     */
    addProductsBatch(products: string[]): boolean {
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
     */
    addBrandsBatch(brands: string[]): boolean {
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
     */
    addFlavorsBatch(flavors: string[]): boolean {
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
     */
    addProduct(product: string): boolean {
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
     */
    addBrand(brand: string): boolean {
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
     */
    addFlavor(flavor: string): boolean {
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
     */
    saveToFiles(): boolean {
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
     */
    loadFromFiles(): boolean {
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
     */
    getStats(): { productCount: number; brandCount: number; flavorCount: number; dataDir: string } {
        if (!this.isInitialized) {
            throw new Error('C++ Autocomplete service not initialized');
        }
        
        try {
            return this.service.getStats();
        } catch (error) {
            console.error('❌ Error getting stats:', error);
            return { productCount: 0, brandCount: 0, flavorCount: 0, dataDir: '' };
        }
    }

    /**
     * Clear all data
     */
    clearAll(): boolean {
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
     */
    hasProduct(product: string): boolean {
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
     */
    hasBrand(brand: string): boolean {
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
     */
    hasFlavor(flavor: string): boolean {
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
     */
    shutdown(): boolean {
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
let cppAutocompleteService: CppAutocompleteService | null = null;

/**
 * Get the singleton C++ autocomplete service instance
 */
export function getCppAutocompleteService(): CppAutocompleteService {
    if (!cppAutocompleteService) {
        cppAutocompleteService = new CppAutocompleteService();
    }
    return cppAutocompleteService;
}

/**
 * Initialize the C++ autocomplete service
 */
export async function initializeCppAutocompleteService(dataDir?: string): Promise<boolean> {
    const service = getCppAutocompleteService();
    return await service.initialize(dataDir);
}
