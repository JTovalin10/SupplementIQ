#include <gtest/gtest.h>
#include <filesystem>
#include <fstream>
#include <iostream>
#include <vector>
#include "TrieManager.h"

class TrieManagerIntegrationTest : public ::testing::Test {
protected:
    void SetUp() override {
        // Create temporary directory for tests
        testDir = std::filesystem::temp_directory_path() / "trie_test";
        std::filesystem::create_directories(testDir);
        
        // Initialize trie manager
        trieManager = std::make_unique<TrieManager>(testDir.string());
        ASSERT_TRUE(trieManager->initialize());
    }
    
    void TearDown() override {
        // Clean up test directory
        if (std::filesystem::exists(testDir)) {
            std::filesystem::remove_all(testDir);
        }
    }
    
    std::string testDir;
    std::unique_ptr<TrieManager> trieManager;
    
    // Test data
    std::vector<ProductData> createTestProducts() {
        return {
            ProductData("Gold Standard Whey", "Optimum Nutrition", "Chocolate", "2024"),
            ProductData("Gold Standard Whey", "Optimum Nutrition", "Vanilla", "2024"),
            ProductData("Nitro-Tech", "MuscleTech", "Chocolate", "2024"),
            ProductData("C4 Pre-Workout", "Cellucor", "Fruit Punch", "2024"),
            ProductData("Whey Protein", "Dymatize", "Cookies & Cream", "2024"),
        };
    }
};

TEST_F(TrieManagerIntegrationTest, TestTrieInitialization) {
    EXPECT_TRUE(trieManager->isInitialized());
    
    auto stats = trieManager->getTrieStats();
    EXPECT_GE(stats.initializationTime, 0);
    EXPECT_TRUE(stats.isInitialized);
}

TEST_F(TrieManagerIntegrationTest, TestTrieDataSaveAndLoad) {
    auto testProducts = createTestProducts();
    
    // Save trie data
    EXPECT_TRUE(trieManager->saveTrieData(testProducts));
    
    // Load trie data
    std::vector<ProductData> loadedProducts;
    EXPECT_TRUE(trieManager->loadTrieData(loadedProducts));
    
    // Verify data integrity
    EXPECT_EQ(testProducts.size(), loadedProducts.size());
    
    for (size_t i = 0; i < testProducts.size(); ++i) {
        EXPECT_EQ(testProducts[i].name, loadedProducts[i].name);
        EXPECT_EQ(testProducts[i].brand_name, loadedProducts[i].brand_name);
        EXPECT_EQ(testProducts[i].flavor, loadedProducts[i].flavor);
    }
    
    auto stats = trieManager->getTrieStats();
    EXPECT_GT(stats.saveOperations, 0);
    EXPECT_GT(stats.loadOperations, 0);
}

TEST_F(TrieManagerIntegrationTest, TestTrieUpdate) {
    auto testProducts = createTestProducts();
    
    // Update trie with test products
    EXPECT_TRUE(trieManager->updateTrie(testProducts));
    
    auto stats = trieManager->getTrieStats();
    EXPECT_GT(stats.updateOperations, 0);
    EXPECT_GT(stats.totalProductsProcessed, 0);
}

TEST_F(TrieManagerIntegrationTest, TestBatchTrieUpdate) {
    auto testProducts = createTestProducts();
    
    // Batch update trie
    EXPECT_TRUE(trieManager->batchUpdateTrie(testProducts));
    
    auto stats = trieManager->getTrieStats();
    EXPECT_GT(stats.batchUpdateOperations, 0);
    EXPECT_EQ(stats.totalProductsProcessed, testProducts.size());
}

TEST_F(TrieManagerIntegrationTest, TestTrieStatistics) {
    auto testProducts = createTestProducts();
    
    // Perform various operations
    trieManager->saveTrieData(testProducts);
    trieManager->updateTrie(testProducts);
    trieManager->batchUpdateTrie(testProducts);
    
    auto stats = trieManager->getTrieStats();
    
    // Verify all expected fields are present
    EXPECT_GE(stats.initializationTime, 0);
    EXPECT_TRUE(stats.isInitialized);
    EXPECT_GT(stats.saveOperations, 0);
    EXPECT_GT(stats.loadOperations, 0);
    EXPECT_GT(stats.updateOperations, 0);
    EXPECT_GT(stats.batchUpdateOperations, 0);
    EXPECT_GT(stats.totalProductsProcessed, 0);
    EXPECT_GT(stats.totalOperations, 0);
}

TEST_F(TrieManagerIntegrationTest, TestLargeDataSet) {
    // Create a larger dataset
    std::vector<ProductData> largeDataset;
    for (int i = 0; i < 1000; ++i) {
        largeDataset.emplace_back(
            "Product " + std::to_string(i),
            "Brand " + std::to_string(i % 10),
            "Flavor " + std::to_string(i % 5),
            "2024"
        );
    }
    
    // Test batch update with large dataset
    EXPECT_TRUE(trieManager->batchUpdateTrie(largeDataset));
    
    auto stats = trieManager->getTrieStats();
    EXPECT_EQ(stats.totalProductsProcessed, largeDataset.size());
    EXPECT_GT(stats.batchUpdateOperations, 0);
}

TEST_F(TrieManagerIntegrationTest, TestConcurrentTrieOperations) {
    const int numThreads = 4;
    const int operationsPerThread = 5;
    std::vector<std::thread> threads;
    std::atomic<int> successCount{0};
    
    auto testProducts = createTestProducts();
    
    // Launch multiple threads performing trie operations
    for (int i = 0; i < numThreads; ++i) {
        threads.emplace_back([this, testProducts, operationsPerThread, &successCount]() {
            for (int j = 0; j < operationsPerThread; ++j) {
                if (trieManager->updateTrie(testProducts)) {
                    successCount++;
                }
                std::this_thread::sleep_for(std::chrono::milliseconds(1));
            }
        });
    }
    
    // Wait for all threads to complete
    for (auto& thread : threads) {
        thread.join();
    }
    
    // Verify all operations succeeded
    EXPECT_EQ(successCount.load(), numThreads * operationsPerThread);
    
    auto stats = trieManager->getTrieStats();
    EXPECT_EQ(stats.updateOperations, numThreads * operationsPerThread);
}

TEST_F(TrieManagerIntegrationTest, TestTrieShutdown) {
    // Test graceful shutdown
    EXPECT_TRUE(trieManager->shutdown());
    
    auto stats = trieManager->getTrieStats();
    EXPECT_FALSE(stats.isInitialized);
}

TEST_F(TrieManagerIntegrationTest, TestTrieDataPersistence) {
    auto testProducts = createTestProducts();
    
    // Save data
    EXPECT_TRUE(trieManager->saveTrieData(testProducts));
    
    // Create new trie manager instance
    auto newTrieManager = std::make_unique<TrieManager>(testDir.string());
    EXPECT_TRUE(newTrieManager->initialize());
    
    // Load data with new instance
    std::vector<ProductData> loadedProducts;
    EXPECT_TRUE(newTrieManager->loadTrieData(loadedProducts));
    
    // Verify data was persisted correctly
    EXPECT_EQ(testProducts.size(), loadedProducts.size());
    
    for (size_t i = 0; i < testProducts.size(); ++i) {
        EXPECT_EQ(testProducts[i].name, loadedProducts[i].name);
        EXPECT_EQ(testProducts[i].brand_name, loadedProducts[i].brand_name);
    }
}

TEST_F(TrieManagerIntegrationTest, TestEmptyDataSet) {
    std::vector<ProductData> emptyDataset;
    
    // Test operations with empty dataset
    EXPECT_TRUE(trieManager->saveTrieData(emptyDataset));
    EXPECT_TRUE(trieManager->updateTrie(emptyDataset));
    EXPECT_TRUE(trieManager->batchUpdateTrie(emptyDataset));
    
    auto stats = trieManager->getTrieStats();
    EXPECT_EQ(stats.totalProductsProcessed, 0);
    EXPECT_GT(stats.totalOperations, 0);
}
