import fs from 'fs/promises';
import path from 'path';
import { Trie } from '../../tools/autocomplete';

/**
 * File-based persistent autocomplete service
 * Saves Trie data to JSON files for persistence across server restarts
 */
export class FileAutocompleteService {
    private productTrie: Trie;
    private brandTrie: Trie;
    private flavorTrie: Trie;
    private dataDir: string;

    constructor(dataDir: string = './data/autocomplete') {
        this.productTrie = new Trie();
        this.brandTrie = new Trie();
        this.flavorTrie = new Trie();
        this.dataDir = dataDir;
    }

    /**
     * Initialize and load data from files (only on server restart)
     */
    async initialize(): Promise<void> {
        try {
            // Ensure data directory exists
            await fs.mkdir(this.dataDir, { recursive: true });
            
            // Only load from files if they exist (server restart scenario)
            const filesExist = await this.checkFilesExist();
            
            if (filesExist) {
                console.log('🔄 Server restart detected - loading from cache files...');
                await this.loadFromFiles();
                console.log('✅ File autocomplete service initialized from cache');
            } else {
                console.log('🆕 First startup - initializing with static data...');
                this.initializeStaticData();
                await this.saveToFiles();
                console.log('✅ File autocomplete service initialized with static data');
            }
            
        } catch (error) {
            console.error('Failed to initialize file autocomplete:', error);
            this.initializeStaticData();
        }
    }

    /**
     * Check if cache files exist
     */
    private async checkFilesExist(): Promise<boolean> {
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
    private async loadFromFiles(): Promise<void> {
        const files = {
            products: path.join(this.dataDir, 'products.json'),
            brands: path.join(this.dataDir, 'brands.json'),
            flavors: path.join(this.dataDir, 'flavors.json')
        };

        try {
            // Load products
            const productsData = await fs.readFile(files.products, 'utf-8');
            const products: string[] = JSON.parse(productsData);
            products.forEach(product => this.productTrie.insertWord(product));

            // Load brands
            const brandsData = await fs.readFile(files.brands, 'utf-8');
            const brands: string[] = JSON.parse(brandsData);
            brands.forEach(brand => this.brandTrie.insertWord(brand));

            // Load flavors
            const flavorsData = await fs.readFile(files.flavors, 'utf-8');
            const flavors: string[] = JSON.parse(flavorsData);
            flavors.forEach(flavor => this.flavorTrie.insertWord(flavor));

        } catch (error) {
            console.error('Failed to load from files:', error);
            throw error;
        }
    }

    /**
     * Save Trie data to JSON files
     */
    private async saveToFiles(): Promise<void> {
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
    addProduct(productName: string): void {
        this.productTrie.insertWord(productName.toLowerCase());
        // No immediate save - will be saved when update cycle completes
    }


    /**
     * Add brand to Trie (no immediate save for performance)
     */
    addBrand(brandName: string): void {
        this.brandTrie.insertWord(brandName.toLowerCase());
        // No immediate save - will be saved when update cycle completes
    }

    /**
     * Add flavor to Trie (no immediate save for performance)
     */
    addFlavor(flavorName: string): void {
        this.flavorTrie.insertWord(flavorName.toLowerCase());
        // No immediate save - will be saved when update cycle completes
    }

    /**
     * Batch add multiple products for daily update cycle
     */
    addProductsBatch(products: string[]): void {
        products.forEach(product => {
            this.productTrie.insertWord(product.toLowerCase());
        });
    }


    /**
     * Batch add multiple brands for daily update cycle
     */
    addBrandsBatch(brands: string[]): void {
        brands.forEach(brand => {
            this.brandTrie.insertWord(brand.toLowerCase());
        });
    }

    /**
     * Batch add multiple flavors for daily update cycle
     */
    addFlavorsBatch(flavors: string[]): void {
        flavors.forEach(flavor => {
            this.flavorTrie.insertWord(flavor.toLowerCase());
        });
    }

    /**
     * Search methods for products, brands, and flavors
     */
    searchProducts(prefix: string, limit: number = 25): string[] {
        return this.productTrie.searchPrefix(prefix).slice(0, limit);
    }

    searchBrands(prefix: string, limit: number = 15): string[] {
        return this.brandTrie.searchPrefix(prefix).slice(0, limit);
    }

    searchFlavors(prefix: string, limit: number = 15): string[] {
        return this.flavorTrie.searchPrefix(prefix).slice(0, limit);
    }

    /**
     * Manual save trigger - only called when server updates are complete
     * No periodic saving to maintain performance
     */
    async saveAfterUpdate(): Promise<void> {
        await this.saveToFiles();
        console.log('💾 Autocomplete data saved after server update');
    }

    /**
     * Graceful shutdown - save current state
     */
    async shutdown(): Promise<void> {
        await this.saveToFiles();
        console.log('💾 Final autocomplete data saved on shutdown');
    }

    /**
     * Initialize with static supplement data
     */
    private initializeStaticData(): void {
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
    getStats(): { products: number; brands: number; flavors: number; dataDir: string } {
        return {
            products: this.productTrie.getAllWords().length,
            brands: this.brandTrie.getAllWords().length,
            flavors: this.flavorTrie.getAllWords().length,
            dataDir: this.dataDir
        };
    }
}

// Singleton instance
export const fileAutocompleteService = new FileAutocompleteService();
