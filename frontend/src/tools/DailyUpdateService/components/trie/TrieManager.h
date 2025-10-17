#pragma once

#include <string>
#include <vector>
#include <filesystem>
#include <fstream>
#include <iostream>
#include <mutex>
#include <atomic>

/**
 * Product data structure for Trie updates
 */
struct ProductData {
    std::string name;
    std::string brand_name;
    std::string flavor;
    std::string year;
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
 * Trie Manager - Handles Trie data persistence and updates
 * 
 * Responsibilities:
 * - Update Trie data with new products
 * - Save Trie data to JSON files for persistence
 * - Load Trie data from JSON files (cold start recovery)
 * - Handle daily Trie synchronization
 * - Manage autocomplete data files
 */
class TrieManager {
private:
    std::string dataDirectory_;
    std::string productsFile_;
    std::string brandsFile_;
    std::string flavorsFile_;
    std::string trieStateFile_;
    std::mutex trieMutex_;
    
    // Statistics
    std::atomic<int> productsAdded_;
    std::atomic<int> brandsAdded_;
    std::atomic<int> flavorsAdded_;
    std::atomic<int> fileUpdates_;
    
public:
    TrieManager();
    ~TrieManager();
    
    /**
     * Initialize Trie manager with data directory
     */
    bool initialize(const std::string& dataDir);
    
    /**
     * Update Trie with new product data
     * - Add product name to products Trie
     * - Add brand name to brands Trie
     * - Add flavor to flavors Trie
     */
    bool updateTrieWithProduct(const ProductData& product);
    
    /**
     * Batch update Trie with multiple products
     */
    bool updateTrieWithProducts(const std::vector<ProductData>& products);
    
    /**
     * Save Trie data to JSON files
     * - products.json
     * - brands.json
     * - flavors.json
     */
    bool saveTrieData();
    
    /**
     * Load Trie data from JSON files (cold start recovery)
     */
    bool loadTrieData();
    
    /**
     * Sync Trie with database at 12 AM PST
     * - Get all products from database
     * - Update Trie with all current products
     * - Save to files
     */
    bool syncTrieWithDatabase();
    
    /**
     * Add single product to Trie (no file save)
     */
    bool addProduct(const std::string& productName);
    
    /**
     * Add single brand to Trie (no file save)
     */
    bool addBrand(const std::string& brandName);
    
    /**
     * Add single flavor to Trie (no file save)
     */
    bool addFlavor(const std::string& flavorName);
    
    /**
     * Get Trie statistics
     */
    struct TrieStats {
        int productsAdded;
        int brandsAdded;
        int flavorsAdded;
        int fileUpdates;
        std::string dataDirectory;
        bool isInitialized;
    };
    
    TrieStats getTrieStats();
    
private:
    /**
     * Create data directory structure
     */
    bool createDataDirectories();
    
    /**
     * Call Node.js script to update Trie data
     */
    bool callNodeTrieUpdate(const std::string& type, const std::string& data);
    
    /**
     * Call Node.js script to save Trie data to files
     */
    bool callNodeTrieSave();
    
    /**
     * Call Node.js script to load Trie data from files
     */
    bool callNodeTrieLoad();
    
    /**
     * Generate JSON payload for product data
     */
    std::string generateProductJson(const ProductData& product);
    
    /**
     * Generate JSON payload for batch product data
     */
    std::string generateBatchProductsJson(const std::vector<ProductData>& products);
};
