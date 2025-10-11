#pragma once

#include <string>
#include <vector>
#include <filesystem>
#include <iostream>
#include <mutex>
#include <atomic>

/**
 * Product data structure for Go integration (temporary products system)
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
 * Go Integration - Handles communication with Go Supabase component (temporary products system)
 * 
 * Responsibilities:
 * - Migrate accepted products from temporary table to main products table
 * - Call Go component for batch operations
 * - Handle Go binary execution and error handling
 * - Manage Go component communication protocols
 * - Handle Go component response parsing
 */
class GoIntegration {
private:
    std::string goSupabaseBinary_;
    std::string goWorkingDirectory_;
    std::mutex goMutex_;
    
    // Statistics
    std::atomic<int> successfulInserts_;
    std::atomic<int> failedInserts_;
    std::atomic<int> batchOperations_;
    std::atomic<int> goCalls_;
    
public:
    GoIntegration();
    ~GoIntegration();
    
    /**
     * Initialize Go integration with binary path
     */
    bool initialize(const std::string& goBinaryPath, const std::string& workingDir = "");
    
    /**
     * Migrate accepted product from temporary table to main table via Go component
     */
    bool migrateProduct(const ProductData& product);
    
    /**
     * Get accepted products from temporary table via Go component
     */
    std::vector<ProductData> getAcceptedProducts();
    
    /**
     * Check if product exists in main table via Go component
     */
    bool checkProductExists(const std::string& name, const std::string& brand, const std::string& flavor, const std::string& year = "");
    
    /**
     * Check if brand exists via Go component
     */
    bool checkBrandExists(const std::string& brandName);
    
    /**
     * Verify Go component is working
     */
    bool verifyGoComponent();
    
    /**
     * Get Go integration statistics
     */
    struct GoStats {
        int successfulInserts;
        int failedInserts;
        int batchOperations;
        int goCalls;
        std::string goBinaryPath;
        std::string workingDirectory;
        bool isInitialized;
    };
    
    GoStats getGoStats();
    
private:
    /**
     * Execute Go binary with command and arguments
     */
    int executeGoCommand(const std::string& command, const std::string& arguments = "");
    
    /**
     * Execute Go binary with JSON payload
     */
    int executeGoWithJson(const std::string& command, const std::string& jsonPayload);
    
    /**
     * Check if Go binary exists and is executable
     */
    bool checkGoBinary();
    
    /**
     * Escape JSON string for shell execution
     */
    std::string escapeJsonForShell(const std::string& json);
    
    /**
     * Generate JSON payload for single product
     */
    std::string generateProductJson(const ProductData& product);
    
    /**
     * Generate JSON payload for batch products
     */
    std::string generateBatchProductsJson(const std::vector<ProductData>& products);
    
    /**
     * Parse Go component response
     */
    bool parseGoResponse(const std::string& response);
};
