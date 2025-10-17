import { DailyUpdateService as NativeDailyUpdateService } from '../tools/DailyUpdateService/build/Release/daily_update_service';

/**
 * Product data structure for the daily update service
 */
export interface ProductData {
    name: string;
    brand_name: string;
    flavor?: string;
    year?: string;
    created_at?: string;
    updated_at?: string;
    is_approved?: boolean;
    approved_by?: string;
}

/**
 * Product verification result
 */
export interface VerificationResult {
    exists: boolean;
    match_type: 'exact' | 'similar' | 'none';
    similar_products: ProductData[];
}

/**
 * Queue statistics
 */
export interface QueueStats {
    queueSize: number;
    totalProcessed: number;
    totalApproved: number;
    totalRejected: number;
    lastUpdateTime: string;
    isRunning: boolean;
}

/**
 * High-performance C++ Daily Update Service wrapper
 * Provides multi-threaded background processing for product updates
 */
export class CppDailyUpdateService {
    private service: any;
    private isInitialized: boolean = false;

    constructor() {
        try {
            this.service = new NativeDailyUpdateService();
            console.log('✅ C++ Daily Update Service loaded');
        } catch (error) {
            console.error('❌ Failed to load C++ Daily Update Service:', error);
            throw error;
        }
    }

    /**
     * Initialize the service with database configuration
     */
    async initialize(dbUrl: string, apiKey: string): Promise<boolean> {
        try {
            const success = this.service.initialize(dbUrl, apiKey);
            this.isInitialized = success;
            
            if (success) {
                console.log('✅ C++ Daily Update Service initialized');
            } else {
                console.error('❌ Failed to initialize C++ Daily Update Service');
            }
            
            return success;
        } catch (error) {
            console.error('❌ Error initializing C++ Daily Update Service:', error);
            return false;
        }
    }

    /**
     * Start background processing threads
     */
    start(): void {
        if (!this.isInitialized) {
            throw new Error('C++ Daily Update Service not initialized');
        }
        
        try {
            this.service.start();
            console.log('🚀 C++ Daily Update Service started');
        } catch (error) {
            console.error('❌ Error starting C++ Daily Update Service:', error);
            throw error;
        }
    }

    /**
     * Stop background processing threads
     */
    stop(): void {
        try {
            this.service.stop();
            console.log('🛑 C++ Daily Update Service stopped');
        } catch (error) {
            console.error('❌ Error stopping C++ Daily Update Service:', error);
        }
    }

    /**
     * Add a product to the approval queue
     */
    addProductForApproval(product: ProductData): void {
        if (!this.isInitialized) {
            throw new Error('C++ Daily Update Service not initialized');
        }
        
        try {
            this.service.addProductForApproval(product);
            console.log(`📝 Product added for approval: ${product.name} (${product.brand_name})`);
        } catch (error) {
            console.error('❌ Error adding product for approval:', error);
            throw error;
        }
    }

    /**
     * Approve a product (admin action)
     */
    approveProduct(productName: string, brandName: string, flavor: string, approver: string): boolean {
        if (!this.isInitialized) {
            throw new Error('C++ Daily Update Service not initialized');
        }
        
        try {
            return this.service.approveProduct(productName, brandName, flavor, approver);
        } catch (error) {
            console.error('❌ Error approving product:', error);
            return false;
        }
    }

    /**
     * Reject a product (admin action)
     */
    rejectProduct(productName: string, brandName: string, flavor: string): boolean {
        if (!this.isInitialized) {
            throw new Error('C++ Daily Update Service not initialized');
        }
        
        try {
            return this.service.rejectProduct(productName, brandName, flavor);
        } catch (error) {
            console.error('❌ Error rejecting product:', error);
            return false;
        }
    }

    /**
     * Verify if a product already exists (before submission)
     */
    verifyProductExists(product: ProductData): VerificationResult {
        if (!this.isInitialized) {
            throw new Error('C++ Daily Update Service not initialized');
        }
        
        try {
            return this.service.verifyProductExists(product);
        } catch (error) {
            console.error('❌ Error verifying product:', error);
            return {
                exists: false,
                match_type: 'none',
                similar_products: []
            };
        }
    }

    /**
     * Get queue status and statistics
     */
    getQueueStats(): QueueStats {
        if (!this.isInitialized) {
            throw new Error('C++ Daily Update Service not initialized');
        }
        
        try {
            return this.service.getQueueStats();
        } catch (error) {
            console.error('❌ Error getting queue stats:', error);
            return {
                queueSize: 0,
                totalProcessed: 0,
                totalApproved: 0,
                totalRejected: 0,
                lastUpdateTime: '',
                isRunning: false
            };
        }
    }

    /**
     * Force trigger daily update (for testing)
     */
    forceDailyUpdate(): void {
        if (!this.isInitialized) {
            throw new Error('C++ Daily Update Service not initialized');
        }
        
        try {
            this.service.forceDailyUpdate();
            console.log('🔄 Forced daily update triggered');
        } catch (error) {
            console.error('❌ Error forcing daily update:', error);
            throw error;
        }
    }

    /**
     * Get pending products for admin review
     */
    getPendingProducts(): ProductData[] {
        if (!this.isInitialized) {
            throw new Error('C++ Daily Update Service not initialized');
        }
        
        try {
            return this.service.getPendingProducts();
        } catch (error) {
            console.error('❌ Error getting pending products:', error);
            return [];
        }
    }
}

// Singleton instance
let cppDailyUpdateService: CppDailyUpdateService | null = null;

/**
 * Get the singleton C++ Daily Update Service instance
 */
export function getCppDailyUpdateService(): CppDailyUpdateService {
    if (!cppDailyUpdateService) {
        cppDailyUpdateService = new CppDailyUpdateService();
    }
    return cppDailyUpdateService;
}

/**
 * Initialize the C++ Daily Update Service
 */
export async function initializeCppDailyUpdateService(dbUrl?: string, apiKey?: string): Promise<boolean> {
    const service = getCppDailyUpdateService();
    if (dbUrl && apiKey) {
        return await service.initialize(dbUrl, apiKey);
    }
    return true; // Already initialized
}
