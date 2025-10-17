#include "AutocompleteService.h"
#include <iostream>
#include <filesystem>
#include <chrono>
#include <thread>

AutocompleteService::AutocompleteService() 
    : productRoot_(std::make_unique<TrieNode>())
    , brandRoot_(std::make_unique<TrieNode>()) {
}

AutocompleteService::~AutocompleteService() {
    shutdown();
    
    // Wait for background update thread to finish
    if (updateThread_ && updateThread_->joinable()) {
        updateThread_->join();
    }
}

bool AutocompleteService::initialize(const std::string& dataDir) {
    dataDir_ = dataDir;
    
    try {
        // Create data directory if it doesn't exist
        std::filesystem::create_directories(dataDir_);
        
        // Check if cache files exist
        std::vector<std::string> requiredFiles = {
            dataDir_ + "/products.json",
            dataDir_ + "/brands.json"
        };
        
        bool filesExist = std::all_of(requiredFiles.begin(), requiredFiles.end(),
            [](const std::string& file) {
                return std::filesystem::exists(file);
            });
        
        if (filesExist) {
            std::cout << "🔄 Loading autocomplete cache from files..." << std::endl;
            if (!loadFromFiles()) {
                std::cerr << "❌ Failed to load from cache files, using static data" << std::endl;
                initializeStaticData();
                saveToFiles();
            } else {
                std::cout << "✅ Autocomplete cache loaded successfully" << std::endl;
            }
        } else {
            std::cout << "🆕 First startup - initializing with static data..." << std::endl;
            initializeStaticData();
            saveToFiles();
            std::cout << "✅ Autocomplete initialized with static data" << std::endl;
        }
        
        return true;
    } catch (const std::exception& e) {
        std::cerr << "❌ Failed to initialize autocomplete service: " << e.what() << std::endl;
        initializeStaticData();
        return false;
    }
}

void AutocompleteService::shutdown() {
    // Stop any background updates
    updateInProgress_ = false;
    
    // Wait for background update thread to finish
    if (updateThread_ && updateThread_->joinable()) {
        updateThread_->join();
    }
    
    // Save current state to files
    saveToFiles();
    
    // Clear all data
    clearAll();
    
    std::cout << "💾 Autocomplete service shutdown complete" << std::endl;
}

std::vector<std::string> AutocompleteService::searchProducts(const std::string& prefix, size_t limit) const {
    PerformanceTimer timer(totalSearchTime_);
    searchCount_++;
    
    std::string normalizedPrefix = normalizeString(prefix);
    return searchPrefixHelper(productRoot_.get(), normalizedPrefix, limit, productMutex_);
}

std::vector<std::string> AutocompleteService::searchBrands(const std::string& prefix, size_t limit) const {
    PerformanceTimer timer(totalSearchTime_);
    searchCount_++;
    
    std::string normalizedPrefix = normalizeString(prefix);
    return searchPrefixHelper(brandRoot_.get(), normalizedPrefix, limit, brandMutex_);
}


void AutocompleteService::addProductsBatch(const std::vector<std::string>& products) {
    std::unique_lock<std::shared_mutex> lock(productMutex_);
    
    for (const auto& product : products) {
        std::string normalized = normalizeString(product);
        if (!normalized.empty()) {
            insertWordHelper(productRoot_.get(), normalized, productMutex_);
        }
    }
    
    std::cout << "✅ Added " << products.size() << " products to autocomplete" << std::endl;
}

void AutocompleteService::addBrandsBatch(const std::vector<std::string>& brands) {
    std::unique_lock<std::shared_mutex> lock(brandMutex_);
    
    for (const auto& brand : brands) {
        std::string normalized = normalizeString(brand);
        if (!normalized.empty()) {
            insertWordHelper(brandRoot_.get(), normalized, brandMutex_);
        }
    }
    
    std::cout << "✅ Added " << brands.size() << " brands to autocomplete" << std::endl;
}


void AutocompleteService::addProduct(const std::string& product) {
    std::unique_lock<std::shared_mutex> lock(productMutex_);
    std::string normalized = normalizeString(product);
    if (!normalized.empty()) {
        insertWordHelper(productRoot_.get(), normalized, productMutex_);
    }
}

void AutocompleteService::addBrand(const std::string& brand) {
    std::unique_lock<std::shared_mutex> lock(brandMutex_);
    std::string normalized = normalizeString(brand);
    if (!normalized.empty()) {
        insertWordHelper(brandRoot_.get(), normalized, brandMutex_);
    }
}


bool AutocompleteService::saveToFiles() const {
    try {
        std::cout << "💾 Saving autocomplete data to files..." << std::endl;
        
        // Use shared locks for reading
        std::shared_lock<std::shared_mutex> productLock(productMutex_);
        std::shared_lock<std::shared_mutex> brandLock(brandMutex_);
        
        // Save each Trie to its respective file
        bool success = true;
        success &= saveTrieToFile(productRoot_.get(), dataDir_ + "/products.json");
        success &= saveTrieToFile(brandRoot_.get(), dataDir_ + "/brands.json");
        
        if (success) {
            std::cout << "✅ Autocomplete data saved successfully" << std::endl;
        } else {
            std::cerr << "❌ Failed to save some autocomplete data" << std::endl;
        }
        
        return success;
    } catch (const std::exception& e) {
        std::cerr << "❌ Error saving autocomplete data: " << e.what() << std::endl;
        return false;
    }
}

bool AutocompleteService::loadFromFiles() {
    try {
        std::cout << "📂 Loading autocomplete data from files..." << std::endl;
        
        // Use unique locks for writing
        std::unique_lock<std::shared_mutex> productLock(productMutex_);
        std::unique_lock<std::shared_mutex> brandLock(brandMutex_);
        
        // Clear existing data
        clearTrieHelper(productRoot_.get());
        clearTrieHelper(brandRoot_.get());
        
        // Load each Trie from its respective file
        bool success = true;
        success &= loadTrieFromFile(productRoot_.get(), dataDir_ + "/products.json");
        success &= loadTrieFromFile(brandRoot_.get(), dataDir_ + "/brands.json");
        
        if (success) {
            std::cout << "✅ Autocomplete data loaded successfully" << std::endl;
        } else {
            std::cerr << "❌ Failed to load some autocomplete data" << std::endl;
        }
        
        return success;
    } catch (const std::exception& e) {
        std::cerr << "❌ Error loading autocomplete data: " << e.what() << std::endl;
        return false;
    }
}

AutocompleteService::Stats AutocompleteService::getStats() const {
    std::shared_lock<std::shared_mutex> productLock(productMutex_);
    std::shared_lock<std::shared_mutex> brandLock(brandMutex_);
    
    // Count nodes in each Trie (approximate)
    size_t productCount = 0;
    size_t brandCount = 0;
    
    // Simple DFS to count end-of-word nodes
    std::function<void(const TrieNode*, size_t&)> countWords = [&](const TrieNode* node, size_t& count) {
        if (node->isEndOfWord) count++;
        for (const auto& pair : node->children) {
            countWords(pair.second.get(), count);
        }
    };
    
    countWords(productRoot_.get(), productCount);
    countWords(brandRoot_.get(), brandCount);
    
    return {
        productCount,
        brandCount,
        dataDir_
    };
}

void AutocompleteService::clearAll() {
    std::unique_lock<std::shared_mutex> productLock(productMutex_);
    std::unique_lock<std::shared_mutex> brandLock(brandMutex_);
    
    clearTrieHelper(productRoot_.get());
    clearTrieHelper(brandRoot_.get());
    
    std::cout << "🧹 Cleared all autocomplete data" << std::endl;
}

bool AutocompleteService::hasProduct(const std::string& product) const {
    std::shared_lock<std::shared_mutex> lock(productMutex_);
    std::string normalized = normalizeString(product);
    return searchWordHelper(productRoot_.get(), normalized, productMutex_);
}

bool AutocompleteService::hasBrand(const std::string& brand) const {
    std::shared_lock<std::shared_mutex> lock(brandMutex_);
    std::string normalized = normalizeString(brand);
    return searchWordHelper(brandRoot_.get(), normalized, brandMutex_);
}


std::string AutocompleteService::normalizeString(const std::string& str) const {
    std::string result;
    result.reserve(str.length());
    
    for (char c : str) {
        if (std::isalnum(c) || c == '-' || c == '.' || c == ' ') {
            result += std::tolower(c);
        }
    }
    
    return result;
}

std::vector<std::string> AutocompleteService::searchPrefixHelper(
    const TrieNode* root, 
    const std::string& prefix, 
    size_t limit,
    std::shared_mutex& mutex
) const {
    std::shared_lock<std::shared_mutex> lock(mutex);
    
    std::vector<std::string> results;
    if (prefix.empty()) return results;
    
    const TrieNode* current = root;
    
    // Navigate to the prefix node
    for (char c : prefix) {
        auto it = current->children.find(c);
        if (it == current->children.end()) {
            return results; // Prefix not found
        }
        current = it->second.get();
    }
    
    // Perform DFS from the prefix node
    dfsHelper(current, prefix, results, limit);
    
    return results;
}

void AutocompleteService::insertWordHelper(
    TrieNode* root, 
    const std::string& word,
    std::shared_mutex& mutex
) {
    TrieNode* current = root;
    
    for (char c : word) {
        if (current->children.find(c) == current->children.end()) {
            current->children[c] = std::make_unique<TrieNode>();
        }
        current = current->children[c].get();
    }
    
    current->isEndOfWord = true;
}

bool AutocompleteService::searchWordHelper(
    const TrieNode* root, 
    const std::string& word,
    std::shared_mutex& mutex
) const {
    const TrieNode* current = root;
    
    for (char c : word) {
        auto it = current->children.find(c);
        if (it == current->children.end()) {
            return false;
        }
        current = it->second.get();
    }
    
    return current->isEndOfWord;
}

void AutocompleteService::dfsHelper(
    const TrieNode* node, 
    std::string current, 
    std::vector<std::string>& results, 
    size_t limit
) const {
    if (results.size() >= limit) return;
    
    if (node->isEndOfWord) {
        results.push_back(current);
    }
    
    for (const auto& pair : node->children) {
        dfsHelper(pair.second.get(), current + pair.first, results, limit);
    }
}

void AutocompleteService::clearTrieHelper(TrieNode* root) {
    root->children.clear();
    root->isEndOfWord = false;
}

bool AutocompleteService::saveTrieToFile(const TrieNode* root, const std::string& filename) const {
    try {
        std::ofstream file(filename);
        if (!file.is_open()) {
            return false;
        }
        
        std::vector<std::string> words;
        dfsHelper(root, "", words, SIZE_MAX);
        
        file << "[\n";
        for (size_t i = 0; i < words.size(); ++i) {
            file << "  \"" << words[i] << "\"";
            if (i < words.size() - 1) file << ",";
            file << "\n";
        }
        file << "]\n";
        
        file.close();
        return true;
    } catch (const std::exception& e) {
        std::cerr << "Error saving to " << filename << ": " << e.what() << std::endl;
        return false;
    }
}

bool AutocompleteService::loadTrieFromFile(TrieNode* root, const std::string& filename) {
    try {
        std::ifstream file(filename);
        if (!file.is_open()) {
            return false;
        }
        
        std::string content((std::istreambuf_iterator<char>(file)),
                           std::istreambuf_iterator<char>());
        file.close();
        
        // Simple JSON parsing for string arrays
        std::vector<std::string> words;
        size_t pos = 0;
        
        while ((pos = content.find('"', pos)) != std::string::npos) {
            size_t start = pos + 1;
            size_t end = content.find('"', start);
            if (end != std::string::npos) {
                std::string word = content.substr(start, end - start);
                if (!word.empty()) {
                    words.push_back(normalizeString(word));
                }
                pos = end + 1;
            } else {
                break;
            }
        }
        
        // Insert all words into Trie
        for (const auto& word : words) {
            insertWordHelper(root, word, productMutex_); // Use product mutex as placeholder
        }
        
        return true;
    } catch (const std::exception& e) {
        std::cerr << "Error loading from " << filename << ": " << e.what() << std::endl;
        return false;
    }
}

void AutocompleteService::initializeStaticData() {
    // Static product data
    std::vector<std::string> products = {
        "protein powder", "whey isolate", "casein protein", "creatine monohydrate",
        "bcaa powder", "eaa powder", "pre workout", "fat burner", "mass gainer",
        "multivitamin", "omega-3", "fish oil", "vitamin d", "magnesium", "zinc",
        "jacked3d", "c4", "pre-jym", "superpump250", "gold standard"
    };
    
    // Static brand data
    std::vector<std::string> brands = {
        "optimum nutrition", "dymatize", "muscle tech", "bpi sports",
        "cellucor", "ghost", "quest nutrition", "gold standard",
        "isopure", "gnc", "vitamin shoppe", "nature made"
    };
    
    // Static flavor data
    addProductsBatch(products);
    addBrandsBatch(brands);
    
    std::cout << "💊 Static supplement data initialized" << std::endl;
}

// Zero-downtime background update implementation
void AutocompleteService::startBackgroundUpdate(
    const std::vector<std::string>& products,
    const std::vector<std::string>& brands
) {
    std::lock_guard<std::mutex> lock(updateMutex_);
    
    // Don't start a new update if one is already in progress
    if (updateInProgress_.load()) {
        std::cout << "⚠️ Background update already in progress, skipping..." << std::endl;
        return;
    }
    
    // Start background thread for zero-downtime update
    updateInProgress_ = true;
    updateThread_ = std::make_unique<std::thread>(
        &AutocompleteService::performBackgroundUpdate, 
        this, 
        products, 
        brands
    );
    
    std::cout << "🚀 Started background update thread for zero-downtime update..." << std::endl;
}

void AutocompleteService::performBackgroundUpdate(
    const std::vector<std::string>& products,
    const std::vector<std::string>& brands
) {
    try {
        std::cout << "🔄 Background thread: Building new Trie structures..." << std::endl;
        
        // Create completely new Trie structures in background thread
        auto newProductRoot = std::make_unique<TrieNode>();
        auto newBrandRoot = std::make_unique<TrieNode>();
        
        // Build new Tries with fresh data (no locking needed - these are private to this thread)
        auto insertWords = [](TrieNode* root, const std::vector<std::string>& words) {
            for (const auto& word : words) {
                std::string normalized;
                normalized.reserve(word.length());
                
                for (char c : word) {
                    if (std::isalnum(c) || c == '-' || c == '.' || c == ' ') {
                        normalized += std::tolower(c);
                    }
                }
                
                if (!normalized.empty()) {
                    TrieNode* current = root;
                    for (char c : normalized) {
                        if (current->children.find(c) == current->children.end()) {
                            current->children[c] = std::make_unique<TrieNode>();
                        }
                        current = current->children[c].get();
                    }
                    current->isEndOfWord = true;
                }
            }
        };
        
        // Insert all new data into the new Tries
        insertWords(newProductRoot.get(), products);
        insertWords(newBrandRoot.get(), brands);
        
        std::cout << "✅ Background thread: New Trie structures built successfully" << std::endl;
        
        // Atomic swap - this is the critical zero-downtime moment
        std::cout << "⚡ Background thread: Performing atomic swap..." << std::endl;
        
        {
            // Acquire exclusive locks for atomic swap
            std::unique_lock<std::shared_mutex> productLock(productMutex_);
            std::unique_lock<std::shared_mutex> brandLock(brandMutex_);
            
            // Atomic swap of Trie pointers - zero downtime!
            productRoot_.swap(newProductRoot);
            brandRoot_.swap(newBrandRoot);
            
            // Old Tries are automatically destroyed when newProductRoot, etc. go out of scope
        }
        
        std::cout << "🎉 Background thread: Zero-downtime update completed successfully!" << std::endl;
        std::cout << "📊 Updated with " << products.size() << " products, " 
                  << brands.size() << " brands" << std::endl;
        
    } catch (const std::exception& e) {
        std::cerr << "❌ Background thread error: " << e.what() << std::endl;
    } catch (...) {
        std::cerr << "❌ Background thread: Unknown error occurred" << std::endl;
    }
    
    // Mark update as complete
    updateInProgress_ = false;
    std::cout << "🏁 Background update thread finished" << std::endl;
}

bool AutocompleteService::isUpdateInProgress() const {
    return updateInProgress_.load();
}
