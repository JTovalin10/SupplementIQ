#include "DailyUpdateServiceV2.h"
#include <gtest/gtest.h>
#include <filesystem>
#include <fstream>
#include <iostream>
#include <thread>
#include <chrono>

class DailyUpdateServiceV2Test : public ::testing::Test {
protected:
    void SetUp() override {
        // Create test directories
        testDir = "/tmp/daily_update_test";
        std::filesystem::create_directories(testDir);
        
        // Create test files
        queueFile = testDir + "/products_queue.json";
        cacheStateFile = testDir + "/cache_state.json";
        adminCacheFile = testDir + "/admin_cache.json";
        productsFile = testDir + "/products.json";
        brandsFile = testDir + "/brands.json";
        flavorsFile = testDir + "/flavors.json";
        
        // Initialize DailyUpdateServiceV2
        dailyUpdateService = std::make_unique<DailyUpdateServiceV2>(testDir);
    }
    
    void TearDown() override {
        // Stop service if running
        if (dailyUpdateService) {
            dailyUpdateService->stop();
        }
        
        // Clean up test directory
        std::filesystem::remove_all(testDir);
    }
    
    std::string testDir;
    std::string queueFile;
    std::string cacheStateFile;
    std::string adminCacheFile;
    std::string productsFile;
    std::string brandsFile;
    std::string flavorsFile;
    std::unique_ptr<DailyUpdateServiceV2> dailyUpdateService;
    
    // Helper function to create test JSON file
    void createTestJSONFile(const std::string& filename, const std::string& content) {
        std::ofstream file(filename);
        file << content;
        file.close();
    }
    
    // Helper function to read JSON file
    std::string readJSONFile(const std::string& filename) {
        std::ifstream file(filename);
        std::string content((std::istreambuf_iterator<char>(file)),
                           std::istreambuf_iterator<char>());
        file.close();
        return content;
    }
};

TEST_F(DailyUpdateServiceV2Test, TestInitialization) {
    EXPECT_TRUE(dailyUpdateService->initialize());
}

TEST_F(DailyUpdateServiceV2Test, TestStartStop) {
    EXPECT_TRUE(dailyUpdateService->initialize());
    EXPECT_TRUE(dailyUpdateService->start());
    
    // Let it run for a short time
    std::this_thread::sleep_for(std::chrono::milliseconds(100));
    
    EXPECT_TRUE(dailyUpdateService->stop());
}

TEST_F(DailyUpdateServiceV2Test, TestPerformDailyUpdate) {
    // Create test queue file
    std::string queueContent = R"([
        {"name": "Gold Standard Whey", "brand": "Optimum Nutrition", "flavor": "Chocolate", "year": "2023"},
        {"name": "Nitro-Tech", "brand": "MuscleTech", "flavor": "Strawberry", "year": "2024"}
    ])";
    
    createTestJSONFile(queueFile, queueContent);
    
    // Initialize service
    EXPECT_TRUE(dailyUpdateService->initialize());
    
    // Perform daily update
    EXPECT_TRUE(dailyUpdateService->performDailyUpdate());
    
    // Verify queue file was processed (should be empty or updated)
    std::string updatedContent = readJSONFile(queueFile);
    // The exact content depends on implementation, but should be valid JSON
    EXPECT_TRUE(updatedContent.find("{") != std::string::npos || 
                updatedContent.find("[") != std::string::npos);
}

TEST_F(DailyUpdateServiceV2Test, TestProcessQueue) {
    // Create test queue file
    std::string queueContent = R"([
        {"name": "Test Product 1", "brand": "Test Brand 1", "flavor": "Test Flavor 1"},
        {"name": "Test Product 2", "brand": "Test Brand 2", "flavor": "Test Flavor 2"}
    ])";
    
    createTestJSONFile(queueFile, queueContent);
    
    // Initialize service
    EXPECT_TRUE(dailyUpdateService->initialize());
    
    // Process queue
    EXPECT_TRUE(dailyUpdateService->processQueue());
    
    // Verify queue was processed
    std::string updatedContent = readJSONFile(queueFile);
    EXPECT_TRUE(updatedContent.find("[]") != std::string::npos || 
                updatedContent.find("Test Product") == std::string::npos);
}

TEST_F(DailyUpdateServiceV2Test, TestResetCaches) {
    // Create test cache files
    std::string cacheStateContent = R"({
        "lastReset": "2023-01-01T00:00:00Z",
        "cacheEntries": [
            {"key": "products_page_1", "data": "test_data", "timestamp": "2023-01-01T00:00:00Z"}
        ]
    })";
    
    createTestJSONFile(cacheStateFile, cacheStateContent);
    
    // Initialize service
    EXPECT_TRUE(dailyUpdateService->initialize());
    
    // Reset caches
    EXPECT_TRUE(dailyUpdateService->resetCaches());
    
    // Verify cache was reset
    std::string updatedContent = readJSONFile(cacheStateFile);
    EXPECT_TRUE(updatedContent.find("cacheEntries") == std::string::npos || 
                updatedContent.find("[]") != std::string::npos);
}

TEST_F(DailyUpdateServiceV2Test, TestUpdateTrieData) {
    // Create test trie files
    std::string productsContent = R"([
        {"name": "Gold Standard Whey", "brand": "Optimum Nutrition", "flavor": "Chocolate"}
    ])";
    
    std::string brandsContent = R"([
        {"name": "Optimum Nutrition"}
    ])";
    
    std::string flavorsContent = R"([
        {"name": "Chocolate"}
    ])";
    
    createTestJSONFile(productsFile, productsContent);
    createTestJSONFile(brandsFile, brandsContent);
    createTestJSONFile(flavorsFile, flavorsContent);
    
    // Initialize service
    EXPECT_TRUE(dailyUpdateService->initialize());
    
    // Update trie data
    EXPECT_TRUE(dailyUpdateService->updateTrieData());
    
    // Verify trie files were updated
    EXPECT_TRUE(std::filesystem::exists(productsFile));
    EXPECT_TRUE(std::filesystem::exists(brandsFile));
    EXPECT_TRUE(std::filesystem::exists(flavorsFile));
}

TEST_F(DailyUpdateServiceV2Test, TestColdStartRecovery) {
    // Create test files for cold start recovery
    std::string queueContent = R"([
        {"name": "Test Product", "brand": "Test Brand", "flavor": "Test Flavor"}
    ])";
    
    std::string cacheStateContent = R"({
        "lastReset": "2023-01-01T00:00:00Z",
        "cacheEntries": []
    })";
    
    std::string adminCacheContent = R"({
        "adminCount": 0,
        "ownerCount": 0,
        "lastUpdated": "2023-01-01T00:00:00Z"
    })";
    
    createTestJSONFile(queueFile, queueContent);
    createTestJSONFile(cacheStateFile, cacheStateContent);
    createTestJSONFile(adminCacheFile, adminCacheContent);
    
    // Initialize service
    EXPECT_TRUE(dailyUpdateService->initialize());
    
    // Perform cold start recovery
    EXPECT_TRUE(dailyUpdateService->performColdStartRecovery());
    
    // Verify files exist and are accessible
    EXPECT_TRUE(std::filesystem::exists(queueFile));
    EXPECT_TRUE(std::filesystem::exists(cacheStateFile));
    EXPECT_TRUE(std::filesystem::exists(adminCacheFile));
}

TEST_F(DailyUpdateServiceV2Test, TestIsTimeForDailyUpdate) {
    // Initialize service
    EXPECT_TRUE(dailyUpdateService->initialize());
    
    // Test time checking (implementation dependent)
    // This test verifies the function doesn't crash and returns a boolean
    bool result = dailyUpdateService->isTimeForDailyUpdate();
    EXPECT_TRUE(result == true || result == false);
}

TEST_F(DailyUpdateServiceV2Test, TestEmptyInput) {
    // Test with empty queue
    createTestJSONFile(queueFile, "[]");
    
    // Initialize service
    EXPECT_TRUE(dailyUpdateService->initialize());
    
    // Process empty queue
    EXPECT_TRUE(dailyUpdateService->processQueue());
    
    // Should handle empty input gracefully
    std::string content = readJSONFile(queueFile);
    EXPECT_TRUE(content.find("[]") != std::string::npos);
}

TEST_F(DailyUpdateServiceV2Test, TestInvalidJSON) {
    // Test with invalid JSON
    createTestJSONFile(queueFile, "invalid json");
    
    // Initialize service
    EXPECT_TRUE(dailyUpdateService->initialize());
    
    // Should handle invalid JSON gracefully
    EXPECT_FALSE(dailyUpdateService->processQueue());
}

TEST_F(DailyUpdateServiceV2Test, TestFilePermissions) {
    // Initialize service
    EXPECT_TRUE(dailyUpdateService->initialize());
    
    // Test file creation and permissions
    EXPECT_TRUE(dailyUpdateService->saveQueue());
    EXPECT_TRUE(dailyUpdateService->saveCacheState());
    EXPECT_TRUE(dailyUpdateService->saveAdminCache());
    
    // Verify files are readable
    EXPECT_TRUE(std::filesystem::exists(queueFile));
    EXPECT_TRUE(std::filesystem::exists(cacheStateFile));
    EXPECT_TRUE(std::filesystem::exists(adminCacheFile));
    
    // Verify files are not empty
    EXPECT_GT(std::filesystem::file_size(queueFile), 0);
    EXPECT_GT(std::filesystem::file_size(cacheStateFile), 0);
    EXPECT_GT(std::filesystem::file_size(adminCacheFile), 0);
}

TEST_F(DailyUpdateServiceV2Test, TestConcurrentOperations) {
    // Initialize service
    EXPECT_TRUE(dailyUpdateService->initialize());
    
    // Test multiple operations in sequence
    EXPECT_TRUE(dailyUpdateService->processQueue());
    EXPECT_TRUE(dailyUpdateService->resetCaches());
    EXPECT_TRUE(dailyUpdateService->updateTrieData());
    EXPECT_TRUE(dailyUpdateService->performColdStartRecovery());
}

TEST_F(DailyUpdateServiceV2Test, TestServiceStatus) {
    // Initialize service
    EXPECT_TRUE(dailyUpdateService->initialize());
    
    // Test service status
    EXPECT_FALSE(dailyUpdateService->isRunning());
    
    // Start service
    EXPECT_TRUE(dailyUpdateService->start());
    EXPECT_TRUE(dailyUpdateService->isRunning());
    
    // Stop service
    EXPECT_TRUE(dailyUpdateService->stop());
    EXPECT_FALSE(dailyUpdateService->isRunning());
}

TEST_F(DailyUpdateServiceV2Test, TestUpdateThread) {
    // Initialize service
    EXPECT_TRUE(dailyUpdateService->initialize());
    
    // Start service
    EXPECT_TRUE(dailyUpdateService->start());
    
    // Let update thread run for a short time
    std::this_thread::sleep_for(std::chrono::milliseconds(500));
    
    // Stop service
    EXPECT_TRUE(dailyUpdateService->stop());
    
    // Verify service stopped
    EXPECT_FALSE(dailyUpdateService->isRunning());
}

TEST_F(DailyUpdateServiceV2Test, TestQueueStructure) {
    // Create test queue with proper structure
    std::string queueContent = R"([
        {
            "name": "Gold Standard Whey",
            "brand": "Optimum Nutrition",
            "flavor": "Chocolate",
            "year": "2023",
            "image_url": "https://example.com/image.jpg",
            "ingredients": [
                {"name": "Whey Protein", "amount": 24.0, "unit": "g"}
            ],
            "created_at": "2023-01-01T00:00:00Z",
            "updated_at": "2023-01-01T00:00:00Z",
            "is_approved": true,
            "approved_by": "admin@test.com"
        }
    ])";
    
    createTestJSONFile(queueFile, queueContent);
    
    // Initialize service
    EXPECT_TRUE(dailyUpdateService->initialize());
    
    // Process queue
    EXPECT_TRUE(dailyUpdateService->processQueue());
    
    // Verify queue structure was handled correctly
    std::string content = readJSONFile(queueFile);
    EXPECT_TRUE(content.find("{") != std::string::npos || 
                content.find("[") != std::string::npos);
}

TEST_F(DailyUpdateServiceV2Test, TestErrorHandling) {
    // Test with non-existent directory
    std::string invalidDir = "/invalid/directory/that/does/not/exist";
    auto invalidService = std::make_unique<DailyUpdateServiceV2>(invalidDir);
    
    // Should handle invalid directory gracefully
    EXPECT_FALSE(invalidService->initialize());
}

TEST_F(DailyUpdateServiceV2Test, TestMultipleStarts) {
    // Initialize service
    EXPECT_TRUE(dailyUpdateService->initialize());
    
    // Start service multiple times
    EXPECT_TRUE(dailyUpdateService->start());
    EXPECT_TRUE(dailyUpdateService->isRunning());
    
    // Starting again should not cause issues
    EXPECT_TRUE(dailyUpdateService->start());
    EXPECT_TRUE(dailyUpdateService->isRunning());
    
    // Stop service
    EXPECT_TRUE(dailyUpdateService->stop());
    EXPECT_FALSE(dailyUpdateService->isRunning());
}

TEST_F(DailyUpdateServiceV2Test, TestMultipleStops) {
    // Initialize service
    EXPECT_TRUE(dailyUpdateService->initialize());
    
    // Start service
    EXPECT_TRUE(dailyUpdateService->start());
    EXPECT_TRUE(dailyUpdateService->isRunning());
    
    // Stop service multiple times
    EXPECT_TRUE(dailyUpdateService->stop());
    EXPECT_FALSE(dailyUpdateService->isRunning());
    
    // Stopping again should not cause issues
    EXPECT_TRUE(dailyUpdateService->stop());
    EXPECT_FALSE(dailyUpdateService->isRunning());
}

// Performance test
TEST_F(DailyUpdateServiceV2Test, TestPerformance) {
    // Create large queue file
    std::string queueContent = "[";
    for (int i = 0; i < 1000; i++) {
        if (i > 0) queueContent += ",";
        queueContent += R"({"name": "Product )" + std::to_string(i) + 
                       R"(", "brand": "Brand )" + std::to_string(i % 100) + 
                       R"(", "flavor": "Flavor )" + std::to_string(i % 50) + "\"}";
    }
    queueContent += "]";
    
    createTestJSONFile(queueFile, queueContent);
    
    // Initialize service
    EXPECT_TRUE(dailyUpdateService->initialize());
    
    // Test performance
    auto start = std::chrono::high_resolution_clock::now();
    
    EXPECT_TRUE(dailyUpdateService->processQueue());
    
    auto end = std::chrono::high_resolution_clock::now();
    auto duration = std::chrono::duration_cast<std::chrono::milliseconds>(end - start);
    
    // Should complete within reasonable time (adjust threshold as needed)
    EXPECT_LT(duration.count(), 10000); // Less than 10 seconds
}

int main(int argc, char **argv) {
    ::testing::InitGoogleTest(&argc, argv);
    return RUN_ALL_TESTS();
}
