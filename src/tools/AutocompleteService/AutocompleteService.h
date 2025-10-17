#pragma once

#include <unordered_map>
#include <vector>
#include <string>
#include <mutex>
#include <shared_mutex>
#include <thread>
#include <future>
#include <atomic>
#include <memory>
#include <fstream>
#include <sstream>
#include <algorithm>
#include <cctype>

/**
 * High-performance multithreaded autocomplete service
 * Uses C++ Trie implementation with thread-safe operations
 */
class AutocompleteService {
public:
    // Trie node for fast prefix matching
    struct TrieNode {
        std::unordered_map<char, std::unique_ptr<TrieNode>> children;
        bool isEndOfWord = false;
        std::mutex nodeMutex; // Fine-grained locking for high concurrency
    };

    AutocompleteService();
    ~AutocompleteService();

    // Initialization
    bool initialize(const std::string& dataDir = "./data/autocomplete");
    void shutdown();

    // Thread-safe search operations (read-only, highly concurrent)
    std::vector<std::string> searchProducts(const std::string& prefix, size_t limit = 25) const;
    std::vector<std::string> searchBrands(const std::string& prefix, size_t limit = 15) const;

    // Batch operations for updates (write operations, temporarily exclusive)
    void addProductsBatch(const std::vector<std::string>& products);
    void addBrandsBatch(const std::vector<std::string>& brands);
    
    // Zero-downtime background update operations
    void startBackgroundUpdate(
        const std::vector<std::string>& products,
        const std::vector<std::string>& brands
    );
    void performBackgroundUpdate(
        const std::vector<std::string>& products,
        const std::vector<std::string>& brands
    );
    bool isUpdateInProgress() const;

    // Individual additions (thread-safe)
    void addProduct(const std::string& product);
    void addBrand(const std::string& brand);

    // Persistence operations
    bool saveToFiles() const;
    bool loadFromFiles();

    // Statistics
    struct Stats {
        size_t productCount;
        size_t brandCount;
        std::string dataDir;
    };
    Stats getStats() const;

    // Utility methods
    void clearAll();
    bool hasProduct(const std::string& product) const;
    bool hasBrand(const std::string& brand) const;

private:
    // Trie roots for each category
    std::unique_ptr<TrieNode> productRoot_;
    std::unique_ptr<TrieNode> brandRoot_;

    // Thread synchronization for zero-downtime updates
    mutable std::shared_mutex productMutex_;  // Multiple readers, single writer
    mutable std::shared_mutex brandMutex_;
    
    // Background update thread management
    std::atomic<bool> updateInProgress_{false};
    std::unique_ptr<std::thread> updateThread_;
    std::mutex updateMutex_;

    // Data directory
    std::string dataDir_;

    // Performance tracking
    std::atomic<size_t> searchCount_{0};
    std::atomic<size_t> totalSearchTime_{0};

    // Helper methods
    std::string normalizeString(const std::string& str) const;
    std::vector<std::string> searchPrefixHelper(
        const TrieNode* root, 
        const std::string& prefix, 
        size_t limit,
        std::shared_mutex& mutex
    ) const;
    
    void insertWordHelper(
        TrieNode* root, 
        const std::string& word,
        std::shared_mutex& mutex
    );
    
    bool searchWordHelper(
        const TrieNode* root, 
        const std::string& word,
        std::shared_mutex& mutex
    ) const;
    
    void dfsHelper(
        const TrieNode* node, 
        std::string current, 
        std::vector<std::string>& results, 
        size_t limit
    ) const;
    
    void clearTrieHelper(TrieNode* root);
    
    // File operations
    bool saveTrieToFile(const TrieNode* root, const std::string& filename) const;
    bool loadTrieFromFile(TrieNode* root, const std::string& filename);
    
    // Static data initialization
    void initializeStaticData();
    
    // Performance monitoring
    class PerformanceTimer {
    public:
        PerformanceTimer(std::atomic<size_t>& totalTime) : totalTime_(totalTime) {
            startTime_ = std::chrono::high_resolution_clock::now();
        }
        
        ~PerformanceTimer() {
            auto endTime = std::chrono::high_resolution_clock::now();
            auto duration = std::chrono::duration_cast<std::chrono::microseconds>(endTime - startTime_);
            totalTime_ += duration.count();
        }
        
    private:
        std::chrono::high_resolution_clock::time_point startTime_;
        std::atomic<size_t>& totalTime_;
    };
};
