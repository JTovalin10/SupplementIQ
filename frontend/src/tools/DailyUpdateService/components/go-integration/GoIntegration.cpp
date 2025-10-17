#include "GoIntegration.h"
#include <iostream>
#include <cstdlib>
#include <sstream>
#include <regex>

/**
 * Constructor - Initialize Go integration
 */
GoIntegration::GoIntegration() 
    : successfulInserts_(0), failedInserts_(0), batchOperations_(0), goCalls_(0) {
}

GoIntegration::~GoIntegration() {
}

/**
 * Initialize Go integration with binary path
 */
bool GoIntegration::initialize(const std::string& goBinaryPath, const std::string& workingDir) {
    goSupabaseBinary_ = goBinaryPath;
    goWorkingDirectory_ = workingDir.empty() ? std::filesystem::current_path().string() : workingDir;
    
    // Check if Go binary exists
    if (!checkGoBinary()) {
        std::cerr << "❌ Go binary not found or not executable: " << goSupabaseBinary_ << std::endl;
        return false;
    }
    
    // Verify Go component is working
    if (!verifyGoComponent()) {
        std::cerr << "❌ Go component verification failed" << std::endl;
        return false;
    }
    
    std::cout << "✅ GoIntegration initialized" << std::endl;
    std::cout << "🔧 Go binary: " << goSupabaseBinary_ << std::endl;
    std::cout << "📂 Working directory: " << goWorkingDirectory_ << std::endl;
    
    return true;
}

/**
 * Migrate accepted product from temporary table to main table via Go component
 */
bool GoIntegration::migrateProduct(const ProductData& product) {
    std::lock_guard<std::mutex> lock(goMutex_);
    
    std::cout << "🔄 Migrating product via Go component: " << product.name 
              << " (" << product.brand_name << ")" << std::endl;
    
    try {
        std::string jsonPayload = generateProductJson(product);
        int result = executeGoWithJson("migrate", jsonPayload);
        
        goCalls_++;
        
        if (result == 0) {
            successfulInserts_++;
            std::cout << "✅ Successfully migrated product: " << product.name << std::endl;
            return true;
        } else {
            failedInserts_++;
            std::cerr << "❌ Failed to migrate product: " << product.name << " (exit code: " << result << ")" << std::endl;
            return false;
        }
        
    } catch (const std::exception& e) {
        failedInserts_++;
        std::cerr << "❌ Exception during product migration: " << e.what() << std::endl;
        return false;
    }
}

/**
 * Get accepted products from temporary table via Go component
 */
std::vector<ProductData> GoIntegration::getAcceptedProducts() {
    std::lock_guard<std::mutex> lock(goMutex_);
    
    std::cout << "🔄 Getting accepted products from temporary table..." << std::endl;
    
    std::vector<ProductData> acceptedProducts;
    
    try {
        int result = executeGoCommand("get-accepted");
        goCalls_++;
        
        if (result == 0) {
            std::cout << "✅ Successfully retrieved accepted products" << std::endl;
            // TODO: Parse the response and populate acceptedProducts vector
            // This would typically parse JSON response from Go component
        } else {
            std::cerr << "❌ Failed to get accepted products (exit code: " << result << ")" << std::endl;
        }
        
    } catch (const std::exception& e) {
        std::cerr << "❌ Exception while getting accepted products: " << e.what() << std::endl;
    }
    
    return acceptedProducts;
}

/**
 * Check if product exists in main table via Go component
 */
bool GoIntegration::checkProductExists(const std::string& name, const std::string& brand, const std::string& flavor, const std::string& year) {
    std::lock_guard<std::mutex> lock(goMutex_);
    
    std::cout << "🔄 Checking if product exists: " << name << " (" << brand << ")" << std::endl;
    
    try {
        std::stringstream args;
        args << "--name \"" << name << "\" --brand \"" << brand << "\"";
        if (!flavor.empty()) {
            args << " --flavor \"" << flavor << "\"";
        }
        if (!year.empty()) {
            args << " --year \"" << year << "\"";
        }
        
        int result = executeGoCommand("check-exists", args.str());
        goCalls_++;
        
        if (result == 0) {
            std::cout << "✅ Product exists: " << name << std::endl;
            return true;
        } else {
            std::cout << "ℹ️ Product does not exist: " << name << std::endl;
            return false;
        }
        
    } catch (const std::exception& e) {
        std::cerr << "❌ Exception during product existence check: " << e.what() << std::endl;
        return false;
    }
}

/**
 * Check if brand exists via Go component
 */
bool GoIntegration::checkBrandExists(const std::string& brandName) {
    std::lock_guard<std::mutex> lock(goMutex_);
    
    std::cout << "🔄 Checking if brand exists: " << brandName << std::endl;
    
    try {
        std::string args = "--brand \"" + brandName + "\"";
        int result = executeGoCommand("check-brand", args);
        goCalls_++;
        
        if (result == 0) {
            std::cout << "✅ Brand exists: " << brandName << std::endl;
            return true;
        } else {
            std::cout << "ℹ️ Brand does not exist: " << brandName << std::endl;
            return false;
        }
        
    } catch (const std::exception& e) {
        std::cerr << "❌ Exception during brand existence check: " << e.what() << std::endl;
        return false;
    }
}

/**
 * Verify Go component is working
 */
bool GoIntegration::verifyGoComponent() {
    std::cout << "🔍 Verifying Go component..." << std::endl;
    
    try {
        int result = executeGoCommand("verify");
        goCalls_++;
        
        if (result == 0) {
            std::cout << "✅ Go component verification successful" << std::endl;
            return true;
        } else {
            std::cerr << "❌ Go component verification failed (exit code: " << result << ")" << std::endl;
            return false;
        }
        
    } catch (const std::exception& e) {
        std::cerr << "❌ Exception during Go component verification: " << e.what() << std::endl;
        return false;
    }
}

/**
 * Get Go integration statistics
 */
GoIntegration::GoStats GoIntegration::getGoStats() {
    GoStats stats;
    stats.successfulInserts = successfulInserts_;
    stats.failedInserts = failedInserts_;
    stats.batchOperations = batchOperations_;
    stats.goCalls = goCalls_;
    stats.goBinaryPath = goSupabaseBinary_;
    stats.workingDirectory = goWorkingDirectory_;
    stats.isInitialized = !goSupabaseBinary_.empty();
    
    return stats;
}

/**
 * Execute Go binary with command and arguments
 */
int GoIntegration::executeGoCommand(const std::string& command, const std::string& arguments) {
    std::stringstream cmd;
    cmd << goSupabaseBinary_ << " " << command;
    
    if (!arguments.empty()) {
        cmd << " " << arguments;
    }
    
    std::cout << "🔧 Executing: " << cmd.str() << std::endl;
    
    // Change to working directory if specified
    std::string originalDir;
    if (!goWorkingDirectory_.empty()) {
        originalDir = std::filesystem::current_path().string();
        std::filesystem::current_path(goWorkingDirectory_);
    }
    
    int result = std::system(cmd.str().c_str());
    
    // Restore original directory
    if (!goWorkingDirectory_.empty() && !originalDir.empty()) {
        std::filesystem::current_path(originalDir);
    }
    
    return result;
}

/**
 * Execute Go binary with JSON payload
 */
int GoIntegration::executeGoWithJson(const std::string& command, const std::string& jsonPayload) {
    std::stringstream cmd;
    cmd << "echo '" << escapeJsonForShell(jsonPayload) << "' | " << goSupabaseBinary_ << " " << command << " --json";
    
    std::cout << "🔧 Executing with JSON: " << command << std::endl;
    
    // Change to working directory if specified
    std::string originalDir;
    if (!goWorkingDirectory_.empty()) {
        originalDir = std::filesystem::current_path().string();
        std::filesystem::current_path(goWorkingDirectory_);
    }
    
    int result = std::system(cmd.str().c_str());
    
    // Restore original directory
    if (!goWorkingDirectory_.empty() && !originalDir.empty()) {
        std::filesystem::current_path(originalDir);
    }
    
    return result;
}

/**
 * Check if Go binary exists and is executable
 */
bool GoIntegration::checkGoBinary() {
    if (goSupabaseBinary_.empty()) {
        return false;
    }
    
    return std::filesystem::exists(goSupabaseBinary_) && 
           (std::filesystem::status(goSupabaseBinary_).permissions() & std::filesystem::perms::owner_exec) != std::filesystem::perms::none;
}

/**
 * Escape JSON string for shell execution
 */
std::string GoIntegration::escapeJsonForShell(const std::string& json) {
    std::string escaped = json;
    
    // Escape single quotes for shell
    size_t pos = 0;
    while ((pos = escaped.find("'", pos)) != std::string::npos) {
        escaped.replace(pos, 1, "'\"'\"'");
        pos += 5;
    }
    
    return escaped;
}

/**
 * Generate JSON payload for single product
 */
std::string GoIntegration::generateProductJson(const ProductData& product) {
    std::stringstream json;
    json << "{";
    json << "\"name\":\"" << product.name << "\",";
    json << "\"brand_name\":\"" << product.brand_name << "\",";
    json << "\"flavor\":\"" << product.flavor << "\",";
    json << "\"year\":\"" << product.year << "\",";
    json << "\"status\":\"" << product.status << "\",";
    json << "\"submitted_by\":\"" << product.submitted_by << "\",";
    json << "\"reviewed_by\":\"" << product.reviewed_by << "\",";
    json << "\"rejection_reason\":\"" << product.rejection_reason << "\",";
    json << "\"created_at\":\"" << product.created_at << "\",";
    json << "\"updated_at\":\"" << product.updated_at << "\"";
    json << "}";
    
    return json.str();
}

/**
 * Parse Go component response
 */
bool GoIntegration::parseGoResponse(const std::string& response) {
    // Simple response parsing - look for success indicators
    return response.find("success") != std::string::npos || 
           response.find("SUCCESS") != std::string::npos ||
           response.find("true") != std::string::npos;
}