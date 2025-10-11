#include "DailyUpdateServiceV2.h"
#include "components/cache/CacheManager.h"
#include "components/trie/TrieManager.h"
#include "components/go-integration/GoIntegration.h"
#include <iostream>
#include <cstdlib>
#include <ctime>
#include <chrono>
#include <thread>

/**
 * Constructor - Initialize the DailyUpdateServiceV2
 */
DailyUpdateServiceV2::DailyUpdateServiceV2() 
    : isRunning_(false), shouldStop_(false), totalProcessed_(0), totalAccepted_(0), totalDenied_(0) {
    lastUpdateTime_ = std::chrono::system_clock::now();
}

DailyUpdateServiceV2::~DailyUpdateServiceV2() {
    stop();
}

/**
 * Initialize the service with all components
 */
bool DailyUpdateServiceV2::initialize(const std::string& baseDirectory) {
    std::cout << "🚀 Initializing DailyUpdateServiceV2..." << std::endl;
    
    if (!initializeComponents(baseDirectory)) {
        std::cerr << "❌ Failed to initialize components" << std::endl;
        return false;
    }
    
    std::cout << "✅ DailyUpdateServiceV2 initialized successfully" << std::endl;
    return true;
}

/**
 * Start background processing threads
 */
void DailyUpdateServiceV2::start() {
    if (isRunning_) {
        std::cout << "⚠️ DailyUpdateServiceV2 already running" << std::endl;
        return;
    }
    
    shouldStop_ = false;
    isRunning_ = true;
    
    // Start the update thread (runs every hour)
    updateThread_ = std::make_unique<std::thread>(&DailyUpdateServiceV2::updateThreadFunction, this);
    
    std::cout << "✅ DailyUpdateServiceV2 started - hourly updates enabled" << std::endl;
}

/**
 * Stop background processing threads
 */
void DailyUpdateServiceV2::stop() {
    if (!isRunning_) {
        return;
    }
    
    std::cout << "🛑 Stopping DailyUpdateServiceV2..." << std::endl;
    
    shouldStop_ = true;
    
    if (updateThread_ && updateThread_->joinable()) {
        updateThread_->join();
    }
    
    isRunning_ = false;
    
    std::cout << "✅ DailyUpdateServiceV2 stopped" << std::endl;
}

/**
 * Force trigger hourly update (for testing)
 */
void DailyUpdateServiceV2::forceHourlyUpdate() {
    std::cout << "🔄 Force triggering hourly update..." << std::endl;
    performHourlyUpdate();
}

/**
 * Get accepted products from temporary table for processing
 */
std::vector<ProductData> DailyUpdateServiceV2::getAcceptedProducts() {
    // This would typically query the temporary_products table for accepted products
    // For now, return empty vector as this is handled by the Go service
    std::vector<ProductData> acceptedProducts;
    
    // TODO: Implement query to temporary_products table via Go integration
    // SELECT * FROM temporary_products WHERE status = 'accepted' ORDER BY reviewed_at ASC
    
    return acceptedProducts;
}

/**
 * Get comprehensive service statistics
 */
DailyUpdateServiceV2::ServiceStats DailyUpdateServiceV2::getServiceStats() {
    ServiceStats stats;
    
    stats.isRunning = isRunning_;
    
    // Format last update time
    auto time_t = std::chrono::system_clock::to_time_t(lastUpdateTime_);
    char buffer[100];
    std::strftime(buffer, sizeof(buffer), "%Y-%m-%d %H:%M:%S UTC", std::gmtime(&time_t));
    stats.lastUpdateTime = buffer;
    
    // Processing statistics
    stats.totalProcessed = totalProcessed_;
    stats.totalAccepted = totalAccepted_;
    stats.totalDenied = totalDenied_;
    
    // Component statistics
    if (cacheManager_) {
        stats.cacheStats = cacheManager_->getCacheStats();
    }
    if (trieManager_) {
        stats.trieStats = trieManager_->getTrieStats();
    }
    if (goIntegration_) {
        stats.goStats = goIntegration_->getGoStats();
    }
    
    return stats;
}

/**
 * Main update thread function (runs every hour)
 */
void DailyUpdateServiceV2::updateThreadFunction() {
    std::cout << "🔄 Update thread started - checking every hour for updates..." << std::endl;
    
    while (!shouldStop_) {
        try {
            if (isTimeForHourlyUpdate()) {
                std::cout << "⏰ Time for hourly update - processing..." << std::endl;
                performHourlyUpdate();
            }
            
            // Sleep for 5 minutes before checking again
            std::this_thread::sleep_for(std::chrono::minutes(5));
            
        } catch (const std::exception& e) {
            std::cerr << "❌ Error in update thread: " << e.what() << std::endl;
            std::this_thread::sleep_for(std::chrono::minutes(1));
        }
    }
    
    std::cout << "🔄 Update thread stopped" << std::endl;
}

/**
 * Check if it's time for hourly update
 */
bool DailyUpdateServiceV2::isTimeForHourlyUpdate() {
    auto now = std::chrono::system_clock::now();
    auto timeSinceLastUpdate = now - lastUpdateTime_;
    
    // Check if at least 1 hour has passed
    return timeSinceLastUpdate >= std::chrono::hours(1);
}

/**
 * Perform the actual hourly update
 */
void DailyUpdateServiceV2::performHourlyUpdate() {
    std::lock_guard<std::mutex> lock(updateMutex_);
    
    std::cout << "🔄 Starting hourly update process..." << std::endl;
    
    try {
        // 1. Process accepted products from temporary table
        processAcceptedProducts();
        
        // 2. Reset caches (excluding AdminCache - only on system outage)
        if (cacheManager_) {
            cacheManager_->performDailyCacheReset();
        }
        
        // 3. Update Trie with any new data
        if (trieManager_) {
            // Get new products and update trie
            std::vector<ProductData> newProducts = getAcceptedProducts();
            if (!newProducts.empty()) {
                trieManager_->batchUpdateTrie(newProducts);
            }
        }
        
        // Update last update time
        lastUpdateTime_ = std::chrono::system_clock::now();
        
        std::cout << "✅ Hourly update completed successfully" << std::endl;
        
    } catch (const std::exception& e) {
        std::cerr << "❌ Error during hourly update: " << e.what() << std::endl;
    }
}

/**
 * Process accepted products from temporary table
 */
void DailyUpdateServiceV2::processAcceptedProducts() {
    std::cout << "📋 Processing accepted products from temporary table..." << std::endl;
    
    try {
        // Get accepted products from temporary table via Go integration
        std::vector<ProductData> acceptedProducts = getAcceptedProducts();
        
        if (acceptedProducts.empty()) {
            std::cout << "ℹ️ No accepted products to process" << std::endl;
            return;
        }
        
        std::cout << "📦 Found " << acceptedProducts.size() << " accepted products to process" << std::endl;
        
        // Process each accepted product
        for (const auto& product : acceptedProducts) {
            try {
                // Use Go integration to migrate product to main table
                if (goIntegration_) {
                    bool success = goIntegration_->migrateProduct(product);
                    if (success) {
                        totalAccepted_++;
                        std::cout << "✅ Migrated product: " << product.name << " (" << product.brand_name << ")" << std::endl;
                    } else {
                        totalDenied_++;
                        std::cerr << "❌ Failed to migrate product: " << product.name << std::endl;
                    }
                }
                
                totalProcessed_++;
                
            } catch (const std::exception& e) {
                std::cerr << "❌ Error processing product " << product.name << ": " << e.what() << std::endl;
                totalDenied_++;
            }
        }
        
        std::cout << "✅ Processed " << acceptedProducts.size() << " accepted products" << std::endl;
        
    } catch (const std::exception& e) {
        std::cerr << "❌ Error processing accepted products: " << e.what() << std::endl;
    }
}

/**
 * Initialize all component managers
 */
bool DailyUpdateServiceV2::initializeComponents(const std::string& baseDirectory) {
    std::cout << "🔧 Initializing components..." << std::endl;
    
    try {
        // Initialize Cache Manager
        cacheManager_ = std::make_unique<CacheManager>(baseDirectory + "/cache");
        if (!cacheManager_->initialize()) {
            std::cerr << "❌ Failed to initialize CacheManager" << std::endl;
            return false;
        }
        std::cout << "✅ CacheManager initialized" << std::endl;
        
        // Initialize Trie Manager
        trieManager_ = std::make_unique<TrieManager>(baseDirectory + "/trie");
        if (!trieManager_->initialize()) {
            std::cerr << "❌ Failed to initialize TrieManager" << std::endl;
            return false;
        }
        std::cout << "✅ TrieManager initialized" << std::endl;
        
        // Initialize Go Integration
        goIntegration_ = std::make_unique<GoIntegration>(baseDirectory + "/go");
        if (!goIntegration_->initialize()) {
            std::cerr << "❌ Failed to initialize GoIntegration" << std::endl;
            return false;
        }
        std::cout << "✅ GoIntegration initialized" << std::endl;
        
        return true;
        
    } catch (const std::exception& e) {
        std::cerr << "❌ Error initializing components: " << e.what() << std::endl;
        return false;
    }
}

/**
 * Shutdown all component managers
 */
void DailyUpdateServiceV2::shutdownComponents() {
    std::cout << "🔧 Shutting down components..." << std::endl;
    
    if (goIntegration_) {
        goIntegration_->shutdown();
        goIntegration_.reset();
        std::cout << "✅ GoIntegration shut down" << std::endl;
    }
    
    if (trieManager_) {
        trieManager_->shutdown();
        trieManager_.reset();
        std::cout << "✅ TrieManager shut down" << std::endl;
    }
    
    if (cacheManager_) {
        cacheManager_->shutdown();
        cacheManager_.reset();
        std::cout << "✅ CacheManager shut down" << std::endl;
    }
}