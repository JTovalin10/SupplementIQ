#include <gtest/gtest.h>
#include <filesystem>
#include <fstream>
#include "TrieManager.h"

class TrieManagerTest : public ::testing::Test {
protected:
    void SetUp() override {
        // Create temporary test directory
        testDir_ = "/tmp/trie_test_" + std::to_string(std::time(nullptr));
        std::filesystem::create_directories(testDir_);
        
        trieManager = std::make_unique<TrieManager>();
    }
    
    void TearDown() override {
        // Clean up test directory
        std::filesystem::remove_all(testDir_);
    }
    
    std::unique_ptr<TrieManager> trieManager;
    std::string testDir_;
};

TEST_F(TrieManagerTest, TestInitialization) {
    EXPECT_TRUE(trieManager->initialize(testDir_));
}

TEST_F(TrieManagerTest, TestAddProduct) {
    EXPECT_TRUE(trieManager->initialize(testDir_));
    
    // Test adding a single product
    EXPECT_TRUE(trieManager->addProduct("Gold Standard Whey"));
    EXPECT_TRUE(trieManager->addProduct("Nitro-Tech"));
    EXPECT_TRUE(trieManager->addProduct("ISO100"));
}

TEST_F(TrieManagerTest, TestUpdateTrieWithProduct) {
    EXPECT_TRUE(trieManager->initialize(testDir_));
    
    // Create test product data
    ProductData product;
    product.name = "Gold Standard Whey";
    product.brand_name = "Optimum Nutrition";
    product.flavor = "Chocolate";
    
    EXPECT_TRUE(trieManager->updateTrieWithProduct(product));
}

TEST_F(TrieManagerTest, TestUpdateTrieWithProducts) {
    EXPECT_TRUE(trieManager->initialize(testDir_));
    
    // Create test products
    std::vector<ProductData> products;
    
    ProductData product1;
    product1.name = "Gold Standard Whey";
    product1.brand_name = "Optimum Nutrition";
    product1.flavor = "Chocolate";
    products.push_back(product1);
    
    ProductData product2;
    product2.name = "Nitro-Tech";
    product2.brand_name = "MuscleTech";
    product2.flavor = "Strawberry";
    products.push_back(product2);
    
    EXPECT_TRUE(trieManager->updateTrieWithProducts(products));
}

TEST_F(TrieManagerTest, TestSaveTrieData) {
    EXPECT_TRUE(trieManager->initialize(testDir_));
    
    // Add some products
    ProductData product;
    product.name = "Gold Standard Whey";
    product.brand_name = "Optimum Nutrition";
    product.flavor = "Chocolate";
    trieManager->updateTrieWithProduct(product);
    
    // Save to files
    EXPECT_TRUE(trieManager->saveTrieData());
    
    // Verify files were created
    EXPECT_TRUE(std::filesystem::exists(testDir_ + "/products.json"));
    EXPECT_TRUE(std::filesystem::exists(testDir_ + "/brands.json"));
    EXPECT_TRUE(std::filesystem::exists(testDir_ + "/flavors.json"));
}

TEST_F(TrieManagerTest, TestLoadTrieData) {
    EXPECT_TRUE(trieManager->initialize(testDir_));
    
    // Add some products and save
    ProductData product;
    product.name = "Gold Standard Whey";
    product.brand_name = "Optimum Nutrition";
    product.flavor = "Chocolate";
    trieManager->updateTrieWithProduct(product);
    trieManager->saveTrieData();
    
    // Create new TrieManager and load data
    auto newTrieManager = std::make_unique<TrieManager>();
    EXPECT_TRUE(newTrieManager->initialize(testDir_));
    EXPECT_TRUE(newTrieManager->loadTrieData());
}

TEST_F(TrieManagerTest, TestEmptyInput) {
    EXPECT_TRUE(trieManager->initialize(testDir_));
    
    // Test with empty products vector
    std::vector<ProductData> emptyProducts;
    EXPECT_TRUE(trieManager->updateTrieWithProducts(emptyProducts));
    
    // Should still be able to save
    EXPECT_TRUE(trieManager->saveTrieData());
}

TEST_F(TrieManagerTest, TestInvalidDirectory) {
    // Test with invalid directory
    EXPECT_FALSE(trieManager->initialize("/invalid/nonexistent/path"));
}

TEST_F(TrieManagerTest, TestPerformance) {
    EXPECT_TRUE(trieManager->initialize(testDir_));
    
    // Test with many products
    std::vector<ProductData> products;
    for (int i = 0; i < 100; ++i) {
        ProductData product;
        product.name = "Product " + std::to_string(i);
        product.brand_name = "Brand " + std::to_string(i % 10);
        product.flavor = "Flavor " + std::to_string(i % 5);
        products.push_back(product);
    }
    
    EXPECT_TRUE(trieManager->updateTrieWithProducts(products));
    EXPECT_TRUE(trieManager->saveTrieData());
}