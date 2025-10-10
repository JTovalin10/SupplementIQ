#pragma once

#include <string>
#include <vector>
#include <thread>
#include <mutex>
#include <atomic>
#include <queue>
#include <memory>
#include <condition_variable>
#include <chrono>

/**
 * Product data structure for queue processing
 */
struct ProductData {
    std::string name;
    std::string brand_name;
    std::string flavor;
    std::string year; // For formula changes
    std::string created_at;
    std::string updated_at;
    bool is_approved;
    std::string approved_by;
    
    ProductData() : is_approved(false) {}
    
    ProductData(const std::string& n, const std::string& b, const std::string& f = "", 
                const std::string& y = "", bool approved = false, const std::string& approver = "")
        : name(n), brand_name(b), flavor(f), year(y), is_approved(approved), approved_by(approver) {
        auto now = std::chrono::system_clock::now();
        auto time_t = std::chrono::system_clock::to_time_t(now);
        char buffer[100];
        std::strftime(buffer, sizeof(buffer), "%Y-%m-%dT%H:%M:%SZ", std::gmtime(&time_t));
        created_at = buffer;
        updated_at = buffer;
    }
};

/**
 * Product verification result
 */
struct VerificationResult {
    bool exists;
    std::string match_type; // "exact", "similar", "none"
    std::vector<ProductData> similar_products;
    
    VerificationResult() : exists(false), match_type("none") {}
};

/**
 * Multi-threaded Daily Update Service
 * 
 * Features:
 * - Background processing with dedicated threads
 * - Product verification before database insertion
 * - Queue management for approved products
 * - Scheduled daily updates at 12 PM PST
 * - Thread-safe operations
 */
class DailyUpdateService {
private:
    // Thread management
    std::unique_ptr<std::thread> updateThread_;
    std::unique_ptr<std::thread> queueProcessorThread_;
    std::atomic<bool> isRunning_;
    std::atomic<bool> shouldStop_;
    
    // Queue management
    std::queue<ProductData> approvedProductsQueue_;
    std::mutex queueMutex_;
    std::condition_variable queueCondition_;
    
    // Update scheduling
    std::chrono::system_clock::time_point lastUpdateTime_;
    std::mutex updateMutex_;
    
    // Database connection (would be configured externally)
    std::string databaseUrl_;
    std::string supabaseKey_;
    
    // Statistics
    std::atomic<int> totalProcessed_;
    std::atomic<int> totalApproved_;
    std::atomic<int> totalRejected_;
    
public:
    DailyUpdateService();
    ~DailyUpdateService();
    
    /**
     * Initialize the service with database configuration
     */
    bool initialize(const std::string& dbUrl, const std::string& apiKey);
    
    /**
     * Initialize the service using environment variables
     * Loads NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
     */
    bool initializeFromEnv();
    
    /**
     * Start background processing threads
     */
    void start();
    
    /**
     * Stop background processing threads
     */
    void stop();
    
    /**
     * Add a product to the approval queue
     */
    void addProductForApproval(const ProductData& product);
    
    /**
     * Approve a product (admin action)
     */
    bool approveProduct(const std::string& productName, const std::string& brandName, 
                       const std::string& flavor, const std::string& approver);
    
    /**
     * Reject a product (admin action)
     */
    bool rejectProduct(const std::string& productName, const std::string& brandName, 
                      const std::string& flavor);
    
    /**
     * Verify if a product already exists (before submission)
     */
    VerificationResult verifyProductExists(const ProductData& product);
    
    /**
     * Get queue status and statistics
     */
    struct QueueStats {
        int queueSize;
        int totalProcessed;
        int totalApproved;
        int totalRejected;
        std::string lastUpdateTime;
        bool isRunning;
    };
    
    QueueStats getQueueStats();
    
    /**
     * Force trigger daily update (for testing)
     */
    void forceDailyUpdate();
    
    /**
     * Get pending products for admin review
     */
    std::vector<ProductData> getPendingProducts();
    
private:
    /**
     * Main update thread function
     */
    void updateThreadFunction();
    
    /**
     * Queue processor thread function
     */
    void queueProcessorThreadFunction();
    
    /**
     * Check if it's time for daily update (12 PM PST)
     */
    bool isTimeForDailyUpdate();
    
    /**
     * Perform the actual daily update
     */
    void performDailyUpdate();
    
    /**
     * Process approved products queue
     */
    void processApprovedQueue();
    
    /**
     * Insert product into database
     */
    bool insertProductIntoDatabase(const ProductData& product);
    
    /**
     * Update Trie with new product
     */
    bool updateTrieWithProduct(const ProductData& product);
    
    /**
     * Calculate PST time from UTC
     */
    std::chrono::system_clock::time_point getPSTTime();
    
    /**
     * Check for similar products (fuzzy matching)
     */
    std::vector<ProductData> findSimilarProducts(const ProductData& product);
    
    /**
     * Clean up expired pending products
     */
    void cleanupExpiredProducts();
};
