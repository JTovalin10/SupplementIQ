#pragma once

#include <string>
#include <vector>
#include <thread>
#include <mutex>
#include <atomic>
#include <memory>
#include <condition_variable>
#include <chrono>

// Forward declarations
class CacheManager;
class TrieManager;
class GoIntegration;

/**
 * Product data structure for temporary products processing
 */
struct ProductData {
    std::string name;
    std::string brand_name;
    std::string flavor;
    std::string year;
    std::string status; // pending, accepted, denied
    std::string submitted_by;
    std::string reviewed_by;
    std::string rejection_reason;
    std::string created_at;
    std::string updated_at;
    
    ProductData() : status("pending") {}
    
    ProductData(const std::string& n, const std::string& b, const std::string& f = "", 
                const std::string& y = "", const std::string& s = "pending", 
                const std::string& submitter = "")
        : name(n), brand_name(b), flavor(f), year(y), status(s), submitted_by(submitter) {
        auto now = std::chrono::system_clock::now();
        auto time_t = std::chrono::system_clock::to_time_t(now);
        char buffer[100];
        std::strftime(buffer, sizeof(buffer), "%Y-%m-%dT%H:%M:%SZ", std::gmtime(&time_t));
        created_at = buffer;
        updated_at = buffer;
    }
};

/**
 * DailyUpdateService V2 - Modular architecture with temporary products system
 * 
 * Features:
 * - Modular component architecture (Cache, Trie, Go Integration)
 * - Background processing with dedicated threads
 * - Temporary products table integration (replaces queue system)
 * - Scheduled daily updates every hour
 * - Thread-safe operations
 * - Comprehensive error handling and recovery
 * - Statistics and monitoring
 * - Automatic processing of accepted products
 */
class DailyUpdateServiceV2 {
private:
    // Component managers
    std::unique_ptr<CacheManager> cacheManager_;
    std::unique_ptr<TrieManager> trieManager_;
    std::unique_ptr<GoIntegration> goIntegration_;
    
    // Thread management
    std::unique_ptr<std::thread> updateThread_;
    std::atomic<bool> isRunning_;
    std::atomic<bool> shouldStop_;
    
    // Update scheduling (every hour instead of daily)
    std::chrono::system_clock::time_point lastUpdateTime_;
    std::mutex updateMutex_;
    
    // Statistics
    std::atomic<int> totalProcessed_;
    std::atomic<int> totalAccepted_;
    std::atomic<int> totalDenied_;
    
public:
    DailyUpdateServiceV2();
    ~DailyUpdateServiceV2();
    
    /**
     * Initialize the service with all components
     */
    bool initialize(const std::string& baseDirectory = "./data/daily-update");
    
    /**
     * Start background processing threads
     */
    void start();
    
    /**
     * Stop background processing threads
     */
    void stop();
    
    /**
     * Force trigger hourly update (for testing)
     */
    void forceHourlyUpdate();
    
    /**
     * Get accepted products from temporary table for processing
     */
    std::vector<ProductData> getAcceptedProducts();
    
    /**
     * Get comprehensive service statistics
     */
    struct ServiceStats {
        // Thread status
        bool isRunning;
        std::string lastUpdateTime;
        
        // Processing statistics
        int totalProcessed;
        int totalAccepted;
        int totalDenied;
        
        // Component statistics
        CacheManager::CacheStats cacheStats;
        TrieManager::TrieStats trieStats;
        GoIntegration::GoStats goStats;
    };
    
    ServiceStats getServiceStats();
    
private:
    /**
     * Main update thread function (runs every hour)
     */
    void updateThreadFunction();
    
    /**
     * Check if it's time for hourly update
     */
    bool isTimeForHourlyUpdate();
    
    /**
     * Perform the actual hourly update
     */
    void performHourlyUpdate();
    
    /**
     * Process accepted products from temporary table
     */
    void processAcceptedProducts();
    
    /**
     * Initialize all component managers
     */
    bool initializeComponents(const std::string& baseDirectory);
    
    /**
     * Shutdown all component managers
     */
    void shutdownComponents();
};