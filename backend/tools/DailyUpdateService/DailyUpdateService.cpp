#include "DailyUpdateService.h"
#include <iostream>
#include <sstream>
#include <iomanip>
#include <algorithm>
#include <ctime>
#include <regex>
#include <curl/curl.h>
#include <nlohmann/json.hpp>

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
 * Initialize the service with database connection details
 * @param dbUrl - Supabase database URL for API calls
 * @param apiKey - Supabase API key for authentication
 * @return true if initialization successful
 */
bool DailyUpdateService::initialize(const std::string& dbUrl, const std::string& apiKey) {
    databaseUrl_ = dbUrl;
    supabaseKey_ = apiKey;
    
    std::cout << "✅ DailyUpdateService initialized" << std::endl;
    std::cout << "📊 Database URL: " << (dbUrl.empty() ? "Not configured" : "Configured") << std::endl;
    std::cout << "🔑 API Key: " << (apiKey.empty() ? "Not configured" : "Configured") << std::endl;
    
    return true;
}

/**
 * Initialize the service using environment variables
 * Loads NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY from environment
 * @return true if initialization successful
 */
bool DailyUpdateService::initializeFromEnv() {
    // Get environment variables
    const char* url = std::getenv("NEXT_PUBLIC_SUPABASE_URL");
    const char* key = std::getenv("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!url || !key) {
        std::cerr << "❌ Missing required environment variables:" << std::endl;
        if (!url) std::cerr << "   - NEXT_PUBLIC_SUPABASE_URL" << std::endl;
        if (!key) std::cerr << "   - SUPABASE_SERVICE_ROLE_KEY" << std::endl;
        return false;
    }
    
    databaseUrl_ = std::string(url);
    supabaseKey_ = std::string(key);
    
    std::cout << "✅ DailyUpdateService initialized from environment variables" << std::endl;
    std::cout << "📊 Database URL: " << databaseUrl_ << std::endl;
    std::cout << "🔑 API Key: " << (supabaseKey_.empty() ? "Not configured" : "Configured") << std::endl;
    
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
                
                // Process the product - THIS CALLS insertProductIntoDatabase() WHICH SENDS TO SUPABASE
                if (insertProductIntoDatabase(product)) {
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
        
        if (insertProductIntoDatabase(product)) {
            updateTrieWithProduct(product);
            totalProcessed_++;
            std::cout << "✅ Added to database and Trie: " << product.name << std::endl;
        } else {
            std::cerr << "❌ Failed to add: " << product.name << std::endl;
        }
    }
}

/**
 * **THIS IS WHERE PRODUCTS GET SENT TO SUPABASE**
 * Insert a product into the Supabase database
 * @param product - Product data to insert
 * @return true if insertion successful, false otherwise
 */
bool DailyUpdateService::insertProductIntoDatabase(const ProductData& product) {
    if (databaseUrl_.empty() || supabaseKey_.empty()) {
        std::cerr << "❌ Database URL or API key not configured" << std::endl;
        return false;
    }
    
    std::cout << "💾 Inserting into Supabase database: " << product.name 
              << " (" << product.brand_name << ")" << std::endl;
    
    // Initialize cURL
    CURL* curl = curl_easy_init();
    if (!curl) {
        std::cerr << "❌ Failed to initialize cURL" << std::endl;
        return false;
    }
    
    // Prepare JSON payload
    nlohmann::json productJson;
    productJson["name"] = product.name;
    productJson["brand_name"] = product.brand_name;
    productJson["flavor"] = product.flavor;
    productJson["year"] = product.year;
    productJson["created_at"] = product.created_at;
    productJson["updated_at"] = product.updated_at;
    
    std::string jsonString = productJson.dump();
    
    // Prepare headers
    struct curl_slist* headers = nullptr;
    headers = curl_slist_append(headers, ("Authorization: Bearer " + supabaseKey_).c_str());
    headers = curl_slist_append(headers, "Content-Type: application/json");
    headers = curl_slist_append(headers, "Prefer: return=minimal");
    
    // Response data
    std::string responseData;
    
    // Set cURL options
    curl_easy_setopt(curl, CURLOPT_URL, (databaseUrl_ + "/products").c_str());
    curl_easy_setopt(curl, CURLOPT_POSTFIELDS, jsonString.c_str());
    curl_easy_setopt(curl, CURLOPT_HTTPHEADER, headers);
    curl_easy_setopt(curl, CURLOPT_WRITEFUNCTION, [](void* contents, size_t size, size_t nmemb, std::string* s) {
        size_t newLength = size * nmemb;
        try {
            s->append((char*)contents, newLength);
            return newLength;
        } catch (std::bad_alloc& e) {
            return 0;
        }
    });
    curl_easy_setopt(curl, CURLOPT_WRITEDATA, &responseData);
    curl_easy_setopt(curl, CURLOPT_TIMEOUT, 30L);
    
    // Perform the request
    CURLcode res = curl_easy_perform(curl);
    
    // Check response
    long responseCode;
    curl_easy_getinfo(curl, CURLINFO_RESPONSE_CODE, &responseCode);
    
    // Cleanup
    curl_slist_free_all(headers);
    curl_easy_cleanup(curl);
    
    if (res != CURLE_OK) {
        std::cerr << "❌ cURL error: " << curl_easy_strerror(res) << std::endl;
        return false;
    }
    
    if (responseCode >= 200 && responseCode < 300) {
        std::cout << "✅ Successfully inserted product into Supabase (HTTP " << responseCode << ")" << std::endl;
        return true;
    } else {
        std::cerr << "❌ Supabase insertion failed (HTTP " << responseCode << "): " << responseData << std::endl;
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

void DailyUpdateService::cleanupExpiredProducts() {
    // Clean up products that have been pending for too long
    std::cout << "🧹 Cleaning up expired pending products..." << std::endl;
    
    // Implementation would remove products that have been pending for more than X days
}
