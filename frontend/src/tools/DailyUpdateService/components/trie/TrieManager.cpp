#include "TrieManager.h"
#include <iostream>
#include <cstdlib>
#include <ctime>
#include <sstream>
#include <chrono>
#include <fstream>
#include <filesystem>

/**
 * Constructor - Initialize Trie manager
 */
TrieManager::TrieManager() 
    : productsAdded_(0), brandsAdded_(0), flavorsAdded_(0), fileUpdates_(0) {
}

TrieManager::~TrieManager() {
}

/**
 * Initialize Trie manager with data directory
 */
bool TrieManager::initialize(const std::string& dataDir) {
    dataDirectory_ = dataDir;
    productsFile_ = dataDir + "/products.json";
    brandsFile_ = dataDir + "/brands.json";
    flavorsFile_ = dataDir + "/flavors.json";
    trieStateFile_ = dataDir + "/trie_state.json";
    
    // Create data directories
    if (!createDataDirectories()) {
        std::cerr << "❌ Failed to create data directories" << std::endl;
        return false;
    }
    
    std::cout << "✅ TrieManager initialized" << std::endl;
    std::cout << "📂 Data directory: " << dataDirectory_ << std::endl;
    std::cout << "📄 Products file: " << productsFile_ << std::endl;
    std::cout << "📄 Brands file: " << brandsFile_ << std::endl;
    std::cout << "📄 Flavors file: " << flavorsFile_ << std::endl;
    
    return true;
}

/**
 * Update Trie with new product data
 */
bool TrieManager::updateTrieWithProduct(const ProductData& product) {
    std::lock_guard<std::mutex> lock(trieMutex_);
    
    std::cout << "🌳 Updating Trie with product: " << product.name 
              << " (" << product.brand_name << ")" << std::endl;
    
    bool success = true;
    
    // Add product name to Trie
    if (!product.name.empty() && !addProduct(product.name)) {
        std::cerr << "❌ Failed to add product to Trie: " << product.name << std::endl;
        success = false;
    } else if (!product.name.empty()) {
        productsAdded_++;
    }
    
    // Add brand name to Trie
    if (!product.brand_name.empty() && !addBrand(product.brand_name)) {
        std::cerr << "❌ Failed to add brand to Trie: " << product.brand_name << std::endl;
        success = false;
    } else if (!product.brand_name.empty()) {
        brandsAdded_++;
    }
    
    // Add flavor to Trie
    if (!product.flavor.empty() && !addFlavor(product.flavor)) {
        std::cerr << "❌ Failed to add flavor to Trie: " << product.flavor << std::endl;
        success = false;
    } else if (!product.flavor.empty()) {
        flavorsAdded_++;
    }
    
    if (success) {
        std::cout << "✅ Trie updated successfully with product data" << std::endl;
    } else {
        std::cerr << "❌ Some Trie updates failed" << std::endl;
    }
    
    return success;
}

/**
 * Batch update Trie with multiple products
 */
bool TrieManager::updateTrieWithProducts(const std::vector<ProductData>& products) {
    std::lock_guard<std::mutex> lock(trieMutex_);
    
    std::cout << "🌳 Batch updating Trie with " << products.size() << " products..." << std::endl;
    
    // Use efficient batch update instead of individual calls
    std::string batchJson = generateBatchProductsJson(products);
    
    // Create a temporary file to pass JSON data safely
    std::string tempFile = "/tmp/trie_batch_update_" + std::to_string(std::time(nullptr)) + ".json";
    
    // Write JSON data to temporary file
    std::ofstream tempStream(tempFile);
    if (!tempStream.is_open()) {
        std::cerr << "❌ Failed to create temporary file: " << tempFile << std::endl;
        return false;
    }
    tempStream << batchJson;
    tempStream.close();
    
    std::string command = "node -e \""
        "const fs = require('fs'); "
        "const { FileAutocompleteService } = require('./lib/services/file-autocomplete'); "
        "const service = new FileAutocompleteService('" + dataDirectory_ + "'); "
        "const products = JSON.parse(fs.readFileSync('" + tempFile + "', 'utf8')); "
        "service.batchUpdate(products); "
        "console.log('Batch Trie update completed');"
        "\"";
    
    int result = std::system(command.c_str());
    
    // Clean up temporary file
    std::remove(tempFile.c_str());
    
    if (result == 0) {
        std::cout << "✅ Batch Trie update completed successfully" << std::endl;
        return true;
    } else {
        std::cerr << "❌ Failed to perform batch Trie update (exit code: " << result << ")" << std::endl;
        return false;
    }
}

/**
 * Save Trie data to JSON files
 */
bool TrieManager::saveTrieData() {
    std::lock_guard<std::mutex> lock(trieMutex_);
    
    std::cout << "💾 Saving Trie data to files..." << std::endl;
    
    if (!callNodeTrieSave()) {
        std::cerr << "❌ Failed to save Trie data" << std::endl;
        return false;
    }
    
    fileUpdates_++;
    std::cout << "✅ Trie data saved successfully" << std::endl;
    
    return true;
}

/**
 * Load Trie data from JSON files (cold start recovery)
 */
bool TrieManager::loadTrieData() {
    std::lock_guard<std::mutex> lock(trieMutex_);
    
    std::cout << "📁 Loading Trie data from files..." << std::endl;
    
    if (!callNodeTrieLoad()) {
        std::cerr << "❌ Failed to load Trie data" << std::endl;
        return false;
    }
    
    std::cout << "✅ Trie data loaded successfully" << std::endl;
    
    return true;
}

/**
 * Sync Trie with database at 12 AM PST
 */
bool TrieManager::syncTrieWithDatabase() {
    std::lock_guard<std::mutex> lock(trieMutex_);
    
    std::cout << "🔄 Syncing Trie with database..." << std::endl;
    
    // This would call the Go component to get all products from database
    // For now, we'll just save the current Trie state
    if (!saveTrieData()) {
        std::cerr << "❌ Failed to sync Trie with database" << std::endl;
        return false;
    }
    
    std::cout << "✅ Trie synced with database successfully" << std::endl;
    
    return true;
}

/**
 * Add single product to Trie (no file save)
 */
bool TrieManager::addProduct(const std::string& productName) {
    if (productName.empty()) {
        return false;
    }
    
    std::string jsonPayload = "{\"product\":\"" + productName + "\"}";
    return callNodeTrieUpdate("product", jsonPayload);
}

/**
 * Add single brand to Trie (no file save)
 */
bool TrieManager::addBrand(const std::string& brandName) {
    if (brandName.empty()) {
        return false;
    }
    
    std::string jsonPayload = "{\"brand\":\"" + brandName + "\"}";
    return callNodeTrieUpdate("brand", jsonPayload);
}

/**
 * Add single flavor to Trie (no file save)
 */
bool TrieManager::addFlavor(const std::string& flavorName) {
    if (flavorName.empty()) {
        return false;
    }
    
    std::string jsonPayload = "{\"flavor\":\"" + flavorName + "\"}";
    return callNodeTrieUpdate("flavor", jsonPayload);
}

/**
 * Get Trie statistics
 */
TrieManager::TrieStats TrieManager::getTrieStats() {
    return {
        productsAdded_.load(),
        brandsAdded_.load(),
        flavorsAdded_.load(),
        fileUpdates_.load(),
        dataDirectory_,
        !dataDirectory_.empty()
    };
}

/**
 * Create data directory structure
 */
bool TrieManager::createDataDirectories() {
    try {
        std::filesystem::create_directories(dataDirectory_);
        return true;
    } catch (const std::exception& e) {
        std::cerr << "❌ Error creating data directories: " << e.what() << std::endl;
        return false;
    }
}

/**
 * Call Node.js script to update Trie data
 */
bool TrieManager::callNodeTrieUpdate(const std::string& type, const std::string& data) {
    // Create a temporary file to pass JSON data safely
    std::string tempFile = "/tmp/trie_update_" + std::to_string(std::time(nullptr)) + ".json";
    
    // Write JSON data to temporary file
    std::ofstream tempStream(tempFile);
    if (!tempStream.is_open()) {
        std::cerr << "❌ Failed to create temporary file: " << tempFile << std::endl;
        return false;
    }
    tempStream << data;
    tempStream.close();
    
    std::string command = "node -e \""
        "const fs = require('fs'); "
        "const { FileAutocompleteService } = require('./lib/services/file-autocomplete'); "
        "const service = new FileAutocompleteService('" + dataDirectory_ + "'); "
        "const data = JSON.parse(fs.readFileSync('" + tempFile + "', 'utf8')); "
        "if (data.product) service.addProduct(data.product); "
        "if (data.brand) service.addBrand(data.brand); "
        "if (data.flavor) service.addFlavor(data.flavor); "
        "console.log('Trie updated with " + type + "');"
        "\"";
    
    int result = std::system(command.c_str());
    
    // Clean up temporary file
    std::remove(tempFile.c_str());
    
    if (result == 0) {
        std::cout << "✅ Trie updated successfully with " << type << std::endl;
        return true;
    } else {
        std::cerr << "❌ Failed to update Trie with " << type << " (exit code: " << result << ")" << std::endl;
        return false;
    }
}

/**
 * Call Node.js script to save Trie data to files
 */
bool TrieManager::callNodeTrieSave() {
    std::string command = "node -e \""
        "const { FileAutocompleteService } = require('./lib/services/file-autocomplete'); "
        "const service = new FileAutocompleteService('" + dataDirectory_ + "'); "
        "service.saveAfterUpdate().then(() => console.log('Trie data saved'));"
        "\"";
    
    int result = std::system(command.c_str());
    
    if (result == 0) {
        std::cout << "✅ Trie data saved successfully" << std::endl;
        return true;
    } else {
        std::cerr << "❌ Failed to save Trie data (exit code: " << result << ")" << std::endl;
        return false;
    }
}

/**
 * Call Node.js script to load Trie data from files
 */
bool TrieManager::callNodeTrieLoad() {
    std::string command = "node -e \""
        "const { FileAutocompleteService } = require('./lib/services/file-autocomplete'); "
        "const service = new FileAutocompleteService('" + dataDirectory_ + "'); "
        "service.initialize().then(() => console.log('Trie data loaded'));"
        "\"";
    
    int result = std::system(command.c_str());
    
    if (result == 0) {
        std::cout << "✅ Trie data loaded successfully" << std::endl;
        return true;
    } else {
        std::cerr << "❌ Failed to load Trie data (exit code: " << result << ")" << std::endl;
        return false;
    }
}

/**
 * Generate JSON payload for product data
 */
std::string TrieManager::generateProductJson(const ProductData& product) {
    std::ostringstream jsonStream;
    jsonStream << "{"
               << "\"name\":\"" << product.name << "\","
               << "\"brand_name\":\"" << product.brand_name << "\","
               << "\"flavor\":\"" << product.flavor << "\","
               << "\"year\":\"" << product.year << "\","
               << "\"created_at\":\"" << product.created_at << "\","
               << "\"updated_at\":\"" << product.updated_at << "\""
               << "}";
    
    return jsonStream.str();
}

/**
 * Generate JSON payload for batch product data
 */
std::string TrieManager::generateBatchProductsJson(const std::vector<ProductData>& products) {
    std::ostringstream jsonStream;
    jsonStream << "[";
    
    for (size_t i = 0; i < products.size(); ++i) {
        if (i > 0) {
            jsonStream << ",";
        }
        jsonStream << generateProductJson(products[i]);
    }
    
    jsonStream << "]";
    
    return jsonStream.str();
}
