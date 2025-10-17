import { supabase } from './supabase';

/**
 * Daily Update Service
 * Handles the daily server update cycle that refreshes autocomplete data
 * Only saves to files once after all updates are complete
 */
export class DailyUpdateService {
    private isUpdating: boolean = false;
    private lastUpdateTime: Date | null = null;

    /**
     * Trigger daily update cycle
     * This should be called once per day (e.g., via cron job or scheduler)
     * Uses intelligent incremental updates with granular component checking
     */
    async performDailyUpdate(): Promise<void> {
        if (this.isUpdating) {
            console.log('⚠️ Daily update already in progress, skipping...');
            return;
        }

        this.isUpdating = true;
        console.log('🚀 Starting intelligent daily autocomplete update cycle...');

        try {
            // Step 1: Get comprehensive update data
            console.log('📊 Fetching comprehensive update data...');
            const updateData = await this.fetchComprehensiveUpdateData();
            
            // Step 2: Intelligent component-by-component updates
            console.log('🧠 Performing intelligent component updates...');
            await this.performIntelligentUpdates(updateData);

            // Step 3: Add any new static data (only if not already present)
            console.log('💊 Checking for new static supplement data...');
            this.addNewStaticData();

            // Step 4: Save everything to files (ONCE at the end)
            console.log('💾 Saving autocomplete data to files...');
            await fileAutocompleteService.saveAfterUpdate();

            this.lastUpdateTime = new Date();
            console.log('🎉 Intelligent daily autocomplete update completed successfully!');

        } catch (error) {
            console.error('❌ Daily update failed:', error);
            throw error;
        } finally {
            this.isUpdating = false;
        }
    }

    /**
     * Fetch minimal update data - only IDs and timestamps, check Trie for existence
     */
    private async fetchComprehensiveUpdateData(): Promise<{
        newProducts: Array<{name: string, brand_name: string, flavor?: string, created_at: string, updated_at: string}>;
        existingProducts: Array<{name: string, brand_name: string, flavor?: string, updated_at: string}>;
    }> {
        const sinceDate = this.lastUpdateTime || new Date(Date.now() - 24 * 60 * 60 * 1000);
        
        // Strategy: Fetch minimal data first, then use Trie to filter
        const [newProductsData, updatedProductsData] = await Promise.all([
            // Query 1: Only NEW products - minimal data
            supabase
                .from('products')
                .select('name, brand_name, flavor, created_at, updated_at')
                .gte('created_at', sinceDate.toISOString())
                .limit(2000), // Much smaller limit - only truly new products
            
            // Query 2: Only UPDATED products - minimal data  
            supabase
                .from('products')
                .select('name, brand_name, flavor, updated_at')
                .gte('updated_at', sinceDate.toISOString())
                .lt('created_at', sinceDate.toISOString())
                .limit(1000) // Very small limit - only recent updates
        ]);

        if (newProductsData.error) {
            console.warn(`⚠️ Failed to fetch new products: ${newProductsData.error.message}`);
        }
        
        if (updatedProductsData.error) {
            console.warn(`⚠️ Failed to fetch updated products: ${updatedProductsData.error.message}`);
        }

        // Filter out items that already exist in Trie (most efficient approach)
        const newProducts = (newProductsData.data || []).filter(product => 
            !this.itemExistsInTrie(product.name, product.brand_name, product.flavor)
        );
        
        const existingProducts = (updatedProductsData.data || []).filter(product => 
            !this.itemExistsInTrie(product.name, product.brand_name, product.flavor)
        );

        console.log(`🔍 Filtered: ${newProducts.length}/${newProductsData.data?.length || 0} new products need Trie updates`);
        console.log(`🔍 Filtered: ${existingProducts.length}/${updatedProductsData.data?.length || 0} updated products need Trie updates`);

        return {
            newProducts,
            existingProducts
        };
    }

    /**
     * Check if all components of a product already exist in Trie
     */
    private itemExistsInTrie(productName: string, brandName: string, flavor?: string): boolean {
        const productExists = fileAutocompleteService.searchProducts(productName, 1).length > 0;
        const brandExists = fileAutocompleteService.searchBrands(brandName, 1).length > 0;
        const flavorExists = flavor ? fileAutocompleteService.searchFlavors(flavor, 1).length > 0 : true;
        
        return productExists && brandExists && flavorExists;
    }

    /**
     * Perform intelligent component-by-component updates
     */
    private async performIntelligentUpdates(updateData: {
        newProducts: Array<{name: string, brand_name: string, flavor?: string, created_at: string, updated_at: string}>;
        existingProducts: Array<{name: string, brand_name: string, flavor?: string, updated_at: string}>;
    }): Promise<void> {
        const { newProducts, existingProducts } = updateData;
        
        console.log(`📊 Processing ${newProducts.length} new products and ${existingProducts.length} updated products`);
        
        // Process new products
        for (const product of newProducts) {
            await this.processNewProduct(product);
        }
        
        // Process updated existing products (check for formula changes)
        for (const product of existingProducts) {
            await this.processUpdatedProduct(product);
        }
        
        console.log('✅ Intelligent component updates completed');
    }

    /**
     * Process a new product with granular component checking
     */
    private async processNewProduct(product: {
        name: string;
        brand_name: string;
        flavor?: string;
        created_at: string;
        updated_at: string;
    }): Promise<void> {
        const { name, brand_name, flavor } = product;
        
        console.log(`🔍 Processing new product: ${name} (${brand_name}${flavor ? ` - ${flavor}` : ''})`);
        
        // Check 1: Does this brand already exist in Trie?
        const brandExists = fileAutocompleteService.searchBrands(brand_name, 1).length > 0;
        if (!brandExists) {
            console.log(`➕ Adding new brand to Trie: ${brand_name}`);
            fileAutocompleteService.addBrand(brand_name);
        }
        
        // Check 2: Does this product already exist in Trie?
        const productExists = fileAutocompleteService.searchProducts(name, 1).length > 0;
        if (!productExists) {
            console.log(`➕ Adding new product to Trie: ${name}`);
            fileAutocompleteService.addProduct(name);
        }
        
        // Check 3: Does this flavor exist in Trie? (if flavor is provided)
        if (flavor) {
            const flavorExists = fileAutocompleteService.searchFlavors(flavor, 1).length > 0;
            if (!flavorExists) {
                console.log(`➕ Adding new flavor to Trie: ${flavor}`);
                fileAutocompleteService.addFlavor(flavor);
            }
        }
        
        console.log(`✅ New product processed: ${name}`);
    }

    /**
     * Process an updated existing product (check for formula changes)
     */
    private async processUpdatedProduct(product: {
        name: string;
        brand_name: string;
        flavor?: string;
        updated_at: string;
    }): Promise<void> {
        const { name, brand_name, flavor } = product;
        
        console.log(`🔄 Processing updated product: ${name} (${brand_name}${flavor ? ` - ${flavor}` : ''})`);
        
        // Check if this is a formula change (updated within the last year)
        const updatedDate = new Date(product.updated_at);
        const oneYearAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
        
        if (updatedDate >= oneYearAgo) {
            console.log(`📅 Product updated within last year - checking for new components: ${name}`);
            
            // Check for new brand (rare but possible)
            const brandExists = fileAutocompleteService.searchBrands(brand_name, 1).length > 0;
            if (!brandExists) {
                console.log(`➕ Adding new brand to Trie: ${brand_name}`);
                fileAutocompleteService.addBrand(brand_name);
            }
            
            // Check for new flavor (common with formula updates)
            if (flavor) {
                const flavorExists = fileAutocompleteService.searchFlavors(flavor, 1).length > 0;
                if (!flavorExists) {
                    console.log(`➕ Adding new flavor to Trie: ${flavor}`);
                    fileAutocompleteService.addFlavor(flavor);
                }
            }
        } else {
            console.log(`⏭️ Product updated over a year ago - skipping: ${name}`);
        }
        
        console.log(`✅ Updated product processed: ${name}`);
    }

    /**
     * Fetch new brands from database (since last update)
     */
    private async fetchNewBrands(): Promise<string[]> {
        // Get brands created/updated since last update
        const sinceDate = this.lastUpdateTime || new Date(Date.now() - 24 * 60 * 60 * 1000); // Default to 24 hours ago
        
        const { data, error } = await supabase
            .from('brands')
            .select('name')
            .gte('created_at', sinceDate.toISOString())
            .limit(5000);

        if (error) {
            console.warn(`⚠️ Failed to fetch new brands, falling back to all brands: ${error.message}`);
            // Fallback: fetch all brands if incremental fails
            return await this.fetchAllBrands();
        }

        return data?.map(brand => brand.name).filter(Boolean) || [];
    }

    /**
     * Fallback: Fetch all products from database (for first run or fallback)
     */
    private async fetchAllProducts(): Promise<string[]> {
        const { data, error } = await supabase
            .from('products')
            .select('name')
            .limit(50000);

        if (error) {
            throw new Error(`Failed to fetch products: ${error.message}`);
        }

        return data?.map(product => product.name).filter(Boolean) || [];
    }

    /**
     * Fallback: Fetch all brands from database (for first run or fallback)
     */
    private async fetchAllBrands(): Promise<string[]> {
        const { data, error } = await supabase
            .from('brands')
            .select('name')
            .limit(10000);

        if (error) {
            throw new Error(`Failed to fetch brands: ${error.message}`);
        }

        return data?.map(brand => brand.name).filter(Boolean) || [];
    }

    /**
     * Add new static supplement data (only if not already present)
     */
    private addNewStaticData(): void {
        // Only add if this is the first update (no lastUpdateTime)
        if (this.lastUpdateTime) {
            console.log('📝 Skipping static data - already initialized');
            return;
        }

        console.log('💊 Adding initial static supplement data...');
        const staticData = {
            products: [
                'jacked3d', 'c4', 'omega-3', '5-htp', 'l-arginine', 'alpha-gpc',
                'iso-100', 'superpump250', 'gold-standard', 'optimum-nutrition',
                'pre-jym', 'n.o.-xplode', 'cell-tech', 'nitro-tech', 'mass-tech',
                'muscle-tech', 'bpi sports', 'ghost', 'quest nutrition',
                'gorilla mind nitric', 'total war pre workout', 'ryse loaded protein',
                'transparent labs pre-series', 'athlean-x total-body workout supplement',
                'legion athletics pulse stim-free pre workout', 'redcon1 big noise pre workout'
            ],
            brands: [
                'optimum nutrition', 'dymatize', 'muscle tech', 'bpi sports',
                'cellucor', 'ghost', 'quest nutrition', 'gold standard',
                'isopure', 'gnc', 'vitamin shoppe', 'nature made'
            ]
        };

        fileAutocompleteService.addProductsBatch(staticData.products);
        fileAutocompleteService.addBrandsBatch(staticData.brands);
        console.log(`➕ Added ${staticData.products.length} static products and ${staticData.brands.length} static brands`);
    }

    /**
     * Get update status and statistics
     */
    getUpdateStatus(): {
        isUpdating: boolean;
        lastUpdateTime: Date | null;
        stats: any;
    } {
        return {
            isUpdating: this.isUpdating,
            lastUpdateTime: this.lastUpdateTime,
            stats: fileAutocompleteService.getStats()
        };
    }

    /**
     * Get the last update time (for time-based restrictions)
     */
    getLastUpdateTime(): Date | null {
        return this.lastUpdateTime;
    }

    /**
     * Force update if needed (for testing or manual triggers)
     */
    async forceUpdate(): Promise<void> {
        console.log('🔄 Force updating autocomplete data...');
        await this.performDailyUpdate();
    }
}

// Singleton instance
export const dailyUpdateService = new DailyUpdateService();

// Auto-start daily updates (optional - you can also trigger manually)
// This runs every 24 hours
export function startDailyUpdateScheduler(): void {
    const updateInterval = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    
    // Run immediately on startup (optional)
    // dailyUpdateService.performDailyUpdate().catch(console.error);
    
    // Then run every 24 hours
    setInterval(() => {
        dailyUpdateService.performDailyUpdate().catch(console.error);
    }, updateInterval);
    
    console.log('⏰ Daily update scheduler started (every 24 hours)');
}
