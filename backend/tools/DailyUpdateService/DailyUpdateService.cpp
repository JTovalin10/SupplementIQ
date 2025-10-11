#include "DailyUpdateService.h"
#include <iostream>
#include <sstream>
#include <iomanip>
#include <algorithm>
#include <ctime>
#include <regex>
#include <fstream>
#include <filesystem>
#include <cstdlib>
#include <cstring>

/**
 * Constructor - Initialize the DailyUpdateService with default values
 * Sets up counters and timers for tracking service statistics
 */
DailyUpdateService::DailyUpdateService() 
    : isRunning_(false), shouldStop_(false), totalProcessed_(0), totalApproved_(0), totalRejected_(0) {
    lastUpdateTime_ = std::chrono::system_clock::now();
}

DailyUpdateService::~DailyUpdateService() {
    stop();
}

/**
 * Initialize the service with file paths and Go binary location
 * @param queueFilePath - Path to the queue persistence file
 * @param cacheDir - Directory for cache files and Trie data
 * @param goBinary - Path to the Go Supabase binary
 * @return true if initialization successful
 */
bool DailyUpdateService::initialize(const std::string& queueFilePath, const std::string& cacheDir, const std::string& goBinary) {
    queueFilePath_ = queueFilePath;
    cacheDirectory_ = cacheDir;
    goSupabaseBinary_ = goBinary;
    
    // Create cache directory if it doesn't exist
    std::filesystem::create_directories(cacheDir);
    
    std::cout << "✅ DailyUpdateService initialized (File/Cache Component)" << std::endl;
    std::cout << "📁 Queue file: " << queueFilePath_ << std::endl;
    std::cout << "📂 Cache directory: " << cacheDirectory_ << std::endl;
    std::cout << "🔧 Go binary: " << goSupabaseBinary_ << std::endl;
    
    // Load existing queue from file
    loadQueueFromFile();
    
    return true;
}

/**
 * Initialize the service using default paths
 * Sets up default file paths for queue, cache, and Go binary
 * @return true if initialization successful
 */
bool DailyUpdateService::initializeFromDefaults() {
    // Set default paths
    queueFilePath_ = "./data/queue/products_queue.json";
    cacheDirectory_ = "./data/cache/";
    goSupabaseBinary_ = "./go-supabase/main";
    
    // Create directories if they don't exist
    std::filesystem::create_directories(cacheDirectory_);
    std::filesystem::create_directories(std::filesystem::path(queueFilePath_).parent_path());
    
    std::cout << "✅ DailyUpdateService initialized with defaults (File/Cache Component)" << std::endl;
    std::cout << "📁 Queue file: " << queueFilePath_ << std::endl;
    std::cout << "📂 Cache directory: " << cacheDirectory_ << std::endl;
    std::cout << "🔧 Go binary: " << goSupabaseBinary_ << std::endl;
    
    // Load existing queue from file
    loadQueueFromFile();
    
    return true;
}

/**
 * Start the DailyUpdateService background threads
 * Launches two threads: one for daily scheduling, one for queue processing
 */
void DailyUpdateService::start() {
    if (isRunning_) {
        std::cout << "⚠️ DailyUpdateService already running" << std::endl;
        return;
    }
    
    shouldStop_ = false;
    isRunning_ = true;
    
    // Start background threads
    updateThread_ = std::make_unique<std::thread>(&DailyUpdateService::updateThreadFunction, this);
    queueProcessorThread_ = std::make_unique<std::thread>(&DailyUpdateService::queueProcessorThreadFunction, this);
    
    std::cout << "🚀 DailyUpdateService started with background processing" << std::endl;
}

/**
 * Stop the DailyUpdateService and clean up threads
 * Gracefully shuts down background threads and waits for completion
 */
void DailyUpdateService::stop() {
    if (!isRunning_) {
        return;
    }
    
    std::cout << "🛑 Stopping DailyUpdateService..." << std::endl;
    
    shouldStop_ = true;
    queueCondition_.notify_all();
    
    if (updateThread_ && updateThread_->joinable()) {
        updateThread_->join();
    }
    
    if (queueProcessorThread_ && queueProcessorThread_->joinable()) {
        queueProcessorThread_->join();
    }
    
    // Save queue to file before stopping
    saveQueueToFile();
    
    isRunning_ = false;
    std::cout << "✅ DailyUpdateService stopped" << std::endl;
}

/**
 * Add a product to the approval queue for processing
 * @param product - Product data to be added to the queue
 * Thread-safe operation that notifies the queue processor
 */
void DailyUpdateService::addProductForApproval(const ProductData& product) {
    std::lock_guard<std::mutex> lock(queueMutex_);
    approvedProductsQueue_.push(product);
    queueCondition_.notify_one();
    
    std::cout << "📝 Product added for approval: " << product.name 
              << " (" << product.brand_name << ")" << std::endl;
}

bool DailyUpdateService::approveProduct(const std::string& productName, const std::string& brandName, 
                                       const std::string& flavor, const std::string& approver) {
    // This would typically update a database record or in-memory structure
    std::cout << "✅ Product approved by " << approver << ": " << productName 
              << " (" << brandName << ")" << std::endl;
    
    totalApproved_++;
    return true;
}

bool DailyUpdateService::rejectProduct(const std::string& productName, const std::string& brandName, 
                                      const std::string& flavor) {
    std::cout << "❌ Product rejected: " << productName << " (" << brandName << ")" << std::endl;
    
    totalRejected_++;
    return true;
}

VerificationResult DailyUpdateService::verifyProductExists(const ProductData& product) {
    VerificationResult result;
    
    // Simulate database check for existing products
    // In real implementation, this would query the database
    
    std::cout << "🔍 Verifying product: " << product.name 
              << " (" << product.brand_name << ")" << std::endl;
    
    // Check for exact match
    // This would be a database query in real implementation
    bool exactMatch = false; // Would check database here
    
    if (exactMatch) {
        result.exists = true;
        result.match_type = "exact";
        std::cout << "⚠️ Exact match found for product: " << product.name << std::endl;
    } else {
        // Check for similar products
        result.similar_products = findSimilarProducts(product);
        
        if (!result.similar_products.empty()) {
            result.match_type = "similar";
            std::cout << "⚠️ Similar products found: " << result.similar_products.size() << std::endl;
        } else {
            result.match_type = "none";
            std::cout << "✅ No existing products found - safe to add" << std::endl;
        }
    }
    
    return result;
}

DailyUpdateService::QueueStats DailyUpdateService::getQueueStats() {
    QueueStats stats;
    
    std::lock_guard<std::mutex> lock(queueMutex_);
    stats.queueSize = approvedProductsQueue_.size();
    stats.totalProcessed = totalProcessed_.load();
    stats.totalApproved = totalApproved_.load();
    stats.totalRejected = totalRejected_.load();
    stats.isRunning = isRunning_.load();
    
    // Format last update time
    auto time_t = std::chrono::system_clock::to_time_t(lastUpdateTime_);
    char buffer[100];
    std::strftime(buffer, sizeof(buffer), "%Y-%m-%d %H:%M:%S PST", std::localtime(&time_t));
    stats.lastUpdateTime = buffer;
    
    return stats;
}

void DailyUpdateService::forceDailyUpdate() {
    std::cout << "🔄 Force triggering daily update..." << std::endl;
    performDailyUpdate();
}

std::vector<ProductData> DailyUpdateService::getPendingProducts() {
    std::lock_guard<std::mutex> lock(queueMutex_);
    
    std::vector<ProductData> pending;
    std::queue<ProductData> tempQueue = approvedProductsQueue_;
    
    while (!tempQueue.empty()) {
        pending.push_back(tempQueue.front());
        tempQueue.pop();
    }
    
    return pending;
}

void DailyUpdateService::updateThreadFunction() {
    std::cout << "⏰ Daily update thread started" << std::endl;
    
    while (!shouldStop_) {
        try {
            // Check if it's time for daily update
            if (isTimeForDailyUpdate()) {
                std::cout << "🕛 12:00 AM PST reached - starting daily update" << std::endl;
                performDailyUpdate();
            }
            
            // Sleep for 1 minute before checking again
            std::this_thread::sleep_for(std::chrono::minutes(1));
            
        } catch (const std::exception& e) {
            std::cerr << "❌ Error in update thread: " << e.what() << std::endl;
            std::this_thread::sleep_for(std::chrono::seconds(30));
        }
    }
    
    std::cout << "⏰ Daily update thread stopped" << std::endl;
}

/**
 * Background thread that continuously processes the approved products queue
 * **THIS IS WHERE QUEUED PRODUCTS GET PROCESSED AND SENT TO SUPABASE**
 * 
 * This thread:
 * 1. Waits for products to be added to the queue
 * 2. Processes each product by calling insertProductIntoDatabase() (sends to Supabase)
 * 3. Updates the Trie data structure for autocomplete
 * 4. Runs continuously until service is stopped
 */
void DailyUpdateService::queueProcessorThreadFunction() {
    std::cout << "🔄 Queue processor thread started" << std::endl;
    
    while (!shouldStop_) {
        try {
            std::unique_lock<std::mutex> lock(queueMutex_);
            
            // Wait for products to process or stop signal
            queueCondition_.wait(lock, [this] { 
                return !approvedProductsQueue_.empty() || shouldStop_; 
            });
            
            if (shouldStop_) {
                break;
            }
            
            // Process all approved products
            while (!approvedProductsQueue_.empty()) {
                ProductData product = approvedProductsQueue_.front();
                approvedProductsQueue_.pop();
                
                lock.unlock(); // Release lock during processing
                
                // Process the product - THIS CALLS Go Supabase component
                if (callGoSupabaseInsert(product)) {
                    updateTrieWithProduct(product);
                    totalProcessed_++;
                    std::cout << "✅ Processed product: " << product.name << std::endl;
                } else {
                    std::cerr << "❌ Failed to process product: " << product.name << std::endl;
                }
                
                lock.lock(); // Reacquire lock for next iteration
            }
            
        } catch (const std::exception& e) {
            std::cerr << "❌ Error in queue processor thread: " << e.what() << std::endl;
            std::this_thread::sleep_for(std::chrono::seconds(5));
        }
    }
    
    std::cout << "🔄 Queue processor thread stopped" << std::endl;
}

/**
 * Check if it's time to run the daily update (12:00 AM PST - midnight)
 * @return true if it's 12 AM PST and we haven't updated today
 */
bool DailyUpdateService::isTimeForDailyUpdate() {
    auto now = getPSTTime();
    auto time_t = std::chrono::system_clock::to_time_t(now);
    auto* tm = std::localtime(&time_t);
    
    // Check if it's 12:00 AM PST (midnight) and we haven't updated today
    bool is12AM = (tm->tm_hour == 0 && tm->tm_min == 0);
    
    // Check if we've already updated today
    auto today = std::chrono::system_clock::to_time_t(now);
    auto lastUpdate = std::chrono::system_clock::to_time_t(lastUpdateTime_);
    
    auto* today_tm = std::localtime(&today);
    auto* lastUpdate_tm = std::localtime(&lastUpdate);
    
    bool alreadyUpdatedToday = (
        today_tm->tm_year == lastUpdate_tm->tm_year &&
        today_tm->tm_yday == lastUpdate_tm->tm_yday
    );
    
    return is12AM && !alreadyUpdatedToday;
}

void DailyUpdateService::performDailyUpdate() {
    std::lock_guard<std::mutex> lock(updateMutex_);
    
    std::cout << "🚀 Starting daily update process..." << std::endl;
    
    // Process all approved products
    processApprovedQueue();
    
    // Reset server caches
    resetServerCaches();
    
    // Save queue to file for persistence
    saveQueueToFile();
    
    // Update Trie with all new products
    // This would integrate with the C++ AutocompleteService
    
    lastUpdateTime_ = std::chrono::system_clock::now();
    
    std::cout << "✅ Daily update completed" << std::endl;
}

void DailyUpdateService::processApprovedQueue() {
    std::lock_guard<std::mutex> lock(queueMutex_);
    
    std::cout << "📦 Processing " << approvedProductsQueue_.size() << " approved products..." << std::endl;
    
    // Process all approved products
    while (!approvedProductsQueue_.empty()) {
        ProductData product = approvedProductsQueue_.front();
        approvedProductsQueue_.pop();
        
        if (callGoSupabaseInsert(product)) {
            updateTrieWithProduct(product);
            totalProcessed_++;
            std::cout << "✅ Added to database and Trie: " << product.name << std::endl;
        } else {
            std::cerr << "❌ Failed to add: " << product.name << std::endl;
        }
    }
}

/**
 * Call Go Supabase component to insert product
 * @param product - Product data to insert via Go component
 * @return true if insertion successful, false otherwise
 */
bool DailyUpdateService::callGoSupabaseInsert(const ProductData& product) {
    std::cout << "🔄 Calling Go Supabase component for: " << product.name 
              << " (" << product.brand_name << ")" << std::endl;
    
    // Check if Go binary exists
    if (!std::filesystem::exists(goSupabaseBinary_)) {
        std::cerr << "❌ Go Supabase binary not found: " << goSupabaseBinary_ << std::endl;
        return false;
    }
    
    // Prepare JSON payload for Go component
    std::ostringstream jsonStream;
    jsonStream << "{"
               << "\"name\":\"" << product.name << "\","
               << "\"brand_name\":\"" << product.brand_name << "\","
               << "\"flavor\":\"" << product.flavor << "\","
               << "\"year\":\"" << product.year << "\","
               << "\"created_at\":\"" << product.created_at << "\","
               << "\"updated_at\":\"" << product.updated_at << "\""
               << "}";
    
    std::string jsonPayload = jsonStream.str();
    
    // Execute Go binary with JSON payload
    std::string command = goSupabaseBinary_ + " insert-product '" + jsonPayload + "'";
    
    int result = std::system(command.c_str());
    
    if (result == 0) {
        std::cout << "✅ Go Supabase component successfully processed product" << std::endl;
        return true;
    } else {
        std::cerr << "❌ Go Supabase component failed with exit code: " << result << std::endl;
        return false;
    }
}

bool DailyUpdateService::updateTrieWithProduct(const ProductData& product) {
    // In real implementation, this would update the C++ AutocompleteService
    std::cout << "🌳 Updating Trie with: " << product.name 
              << " (" << product.brand_name << ")" << std::endl;
    
    // Simulate Trie update
    std::this_thread::sleep_for(std::chrono::milliseconds(50));
    
    return true; // Would return actual result from Trie update
}

std::chrono::system_clock::time_point DailyUpdateService::getPSTTime() {
    // In real implementation, this would properly convert UTC to PST/PDT
    auto now = std::chrono::system_clock::now();
    // Simplified - would need proper timezone handling
    return now;
}

std::vector<ProductData> DailyUpdateService::findSimilarProducts(const ProductData& product) {
    std::vector<ProductData> similar;
    
    // In real implementation, this would query the database for similar products
    // using fuzzy matching, Levenshtein distance, or other similarity algorithms
    
    std::cout << "🔍 Searching for similar products to: " << product.name << std::endl;
    
    // Simulate finding similar products
    // This would be a database query with similarity matching
    
    return similar;
}

bool DailyUpdateService::saveQueueToFile() {
    try {
        std::lock_guard<std::mutex> lock(queueMutex_);
        
        // Create JSON array of products
        std::ostringstream jsonStream;
        jsonStream << "[\n";
        
        std::queue<ProductData> tempQueue = approvedProductsQueue_;
        bool first = true;
        
        while (!tempQueue.empty()) {
            if (!first) {
                jsonStream << ",\n";
            }
            first = false;
            
            const ProductData& product = tempQueue.front();
            jsonStream << "  {\n"
                       << "    \"name\":\"" << product.name << "\",\n"
                       << "    \"brand_name\":\"" << product.brand_name << "\",\n"
                       << "    \"flavor\":\"" << product.flavor << "\",\n"
                       << "    \"year\":\"" << product.year << "\",\n"
                       << "    \"created_at\":\"" << product.created_at << "\",\n"
                       << "    \"updated_at\":\"" << product.updated_at << "\",\n"
                       << "    \"is_approved\":" << (product.is_approved ? "true" : "false") << ",\n"
                       << "    \"approved_by\":\"" << product.approved_by << "\"\n"
                       << "  }";
            
            tempQueue.pop();
        }
        
        jsonStream << "\n]";
        
        // Write to file
        std::ofstream file(queueFilePath_);
        if (!file.is_open()) {
            std::cerr << "❌ Failed to open queue file for writing: " << queueFilePath_ << std::endl;
            return false;
        }
        
        file << jsonStream.str();
        file.close();
        
        std::cout << "✅ Queue saved to file: " << queueFilePath_ << std::endl;
        return true;
        
    } catch (const std::exception& e) {
        std::cerr << "❌ Error saving queue to file: " << e.what() << std::endl;
        return false;
    }
}

bool DailyUpdateService::loadQueueFromFile() {
    try {
        std::lock_guard<std::mutex> lock(queueMutex_);
        
        // Check if file exists
        if (!std::filesystem::exists(queueFilePath_)) {
            std::cout << "📁 Queue file doesn't exist, starting with empty queue" << std::endl;
            return true;
        }
        
        std::ifstream file(queueFilePath_);
        if (!file.is_open()) {
            std::cerr << "❌ Failed to open queue file for reading: " << queueFilePath_ << std::endl;
            return false;
        }
        
        // Read entire file content
        std::string content((std::istreambuf_iterator<char>(file)), std::istreambuf_iterator<char>());
        file.close();
        
        // Simple JSON parsing (in real implementation, use a proper JSON library)
        if (content.empty() || content == "[]") {
            std::cout << "📁 Queue file is empty, starting with empty queue" << std::endl;
            return true;
        }
        
        // For now, just log that we found a queue file
        // In a real implementation, we would parse the JSON and reconstruct the queue
        std::cout << "📁 Found queue file with data: " << queueFilePath_ << std::endl;
        std::cout << "⚠️ JSON parsing not implemented - queue will start empty" << std::endl;
        
        return true;
        
    } catch (const std::exception& e) {
        std::cerr << "❌ Error loading queue from file: " << e.what() << std::endl;
        return false;
    }
}

bool DailyUpdateService::resetServerCaches() {
    try {
        std::cout << "🔄 Resetting server caches..." << std::endl;
        
        // Clear cache directory
        if (std::filesystem::exists(cacheDirectory_)) {
            for (const auto& entry : std::filesystem::directory_iterator(cacheDirectory_)) {
                if (std::filesystem::is_regular_file(entry.path())) {
                    std::filesystem::remove(entry.path());
                    std::cout << "🗑️ Removed cache file: " << entry.path().filename() << std::endl;
                }
            }
        }
        
        std::cout << "✅ Server caches reset successfully" << std::endl;
        return true;
        
    } catch (const std::exception& e) {
        std::cerr << "❌ Error resetting server caches: " << e.what() << std::endl;
        return false;
    }
}

void DailyUpdateService::cleanupExpiredProducts() {
    // Clean up products that have been pending for too long
    std::cout << "🧹 Cleaning up expired pending products..." << std::endl;
    
    // Implementation would remove products that have been pending for more than X days
}
