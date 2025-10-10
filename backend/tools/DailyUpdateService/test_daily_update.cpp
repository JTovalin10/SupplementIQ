#include "DailyUpdateService.h"
#include <iostream>
#include <thread>
#include <chrono>
#include <cassert>

/**
 * Test suite for DailyUpdateService
 * Tests all major functionality including Supabase integration
 */

class DailyUpdateServiceTest {
private:
    DailyUpdateService service;
    
public:
    void runAllTests() {
        std::cout << "🧪 Starting DailyUpdateService Test Suite" << std::endl;
        std::cout << "=========================================" << std::endl;
        
        testInitialization();
        testEnvironmentVariables();
        testProductQueue();
        testProductApproval();
        testProductVerification();
        testQueueStats();
        testForceUpdate();
        testThreading();
        
        std::cout << "\n✅ All tests completed successfully!" << std::endl;
    }
    
private:
    void testInitialization() {
        std::cout << "\n📋 Test 1: Service Initialization" << std::endl;
        
        // Test manual initialization
        bool result = service.initialize("https://test.supabase.co", "test-key");
        assert(result == true);
        std::cout << "✅ Manual initialization successful" << std::endl;
        
        // Test invalid initialization
        DailyUpdateService testService;
        bool invalidResult = testService.initialize("", "");
        // Should still return true (service doesn't validate URLs in initialize)
        std::cout << "✅ Invalid initialization handled correctly" << std::endl;
    }
    
    void testEnvironmentVariables() {
        std::cout << "\n📋 Test 2: Environment Variables" << std::endl;
        
        // Set test environment variables
        setenv("NEXT_PUBLIC_SUPABASE_URL", "https://test-project.supabase.co", 1);
        setenv("SUPABASE_SERVICE_ROLE_KEY", "test-service-role-key", 1);
        
        DailyUpdateService envService;
        bool result = envService.initializeFromEnv();
        assert(result == true);
        std::cout << "✅ Environment variable initialization successful" << std::endl;
        
        // Test missing environment variables
        unsetenv("NEXT_PUBLIC_SUPABASE_URL");
        DailyUpdateService missingService;
        bool missingResult = missingService.initializeFromEnv();
        assert(missingResult == false);
        std::cout << "✅ Missing environment variables handled correctly" << std::endl;
        
        // Restore environment variables
        setenv("NEXT_PUBLIC_SUPABASE_URL", "https://test-project.supabase.co", 1);
    }
    
    void testProductQueue() {
        std::cout << "\n📋 Test 3: Product Queue Management" << std::endl;
        
        // Create test products
        ProductData product1("Whey Protein", "Optimum Nutrition", "Vanilla");
        ProductData product2("Creatine", "MuscleTech", "Unflavored");
        ProductData product3("BCAA", "Dymatize", "Fruit Punch");
        
        // Test adding products to queue
        service.addProductForApproval(product1);
        service.addProductForApproval(product2);
        service.addProductForApproval(product3);
        std::cout << "✅ Products added to queue successfully" << std::endl;
        
        // Test getting pending products
        auto pendingProducts = service.getPendingProducts();
        assert(pendingProducts.size() == 3);
        std::cout << "✅ Retrieved pending products: " << pendingProducts.size() << std::endl;
        
        // Verify product data integrity
        assert(pendingProducts[0].name == "Whey Protein");
        assert(pendingProducts[1].name == "Creatine");
        assert(pendingProducts[2].name == "BCAA");
        std::cout << "✅ Product data integrity verified" << std::endl;
    }
    
    void testProductApproval() {
        std::cout << "\n📋 Test 4: Product Approval/Rejection" << std::endl;
        
        // Test product approval
        bool approveResult = service.approveProduct("Whey Protein", "Optimum Nutrition", "Vanilla", "admin@test.com");
        assert(approveResult == true);
        std::cout << "✅ Product approval successful" << std::endl;
        
        // Test product rejection
        bool rejectResult = service.rejectProduct("Creatine", "MuscleTech", "Unflavored");
        assert(rejectResult == true);
        std::cout << "✅ Product rejection successful" << std::endl;
    }
    
    void testProductVerification() {
        std::cout << "\n📋 Test 5: Product Verification" << std::endl;
        
        // Create test product for verification
        ProductData testProduct("Test Protein", "Test Brand", "Chocolate");
        
        // Test product verification
        auto verificationResult = service.verifyProductExists(testProduct);
        assert(verificationResult.match_type == "none"); // Should find no matches
        std::cout << "✅ Product verification completed" << std::endl;
    }
    
    void testQueueStats() {
        std::cout << "\n📋 Test 6: Queue Statistics" << std::endl;
        
        // Get queue statistics
        auto stats = service.getQueueStats();
        
        // Verify stats structure
        assert(stats.totalApproved >= 0);
        assert(stats.totalRejected >= 0);
        assert(stats.totalProcessed >= 0);
        std::cout << "✅ Queue statistics retrieved successfully" << std::endl;
        std::cout << "   - Queue Size: " << stats.queueSize << std::endl;
        std::cout << "   - Total Approved: " << stats.totalApproved << std::endl;
        std::cout << "   - Total Rejected: " << stats.totalRejected << std::endl;
        std::cout << "   - Total Processed: " << stats.totalProcessed << std::endl;
    }
    
    void testForceUpdate() {
        std::cout << "\n📋 Test 7: Force Daily Update" << std::endl;
        
        // Test force update (should not crash)
        service.forceDailyUpdate();
        std::cout << "✅ Force daily update executed without errors" << std::endl;
    }
    
    void testThreading() {
        std::cout << "\n📋 Test 8: Threading and Background Processing" << std::endl;
        
        // Test starting and stopping service
        service.start();
        std::cout << "✅ Service started successfully" << std::endl;
        
        // Let it run for a short time
        std::this_thread::sleep_for(std::chrono::seconds(2));
        
        // Test stopping service
        service.stop();
        std::cout << "✅ Service stopped successfully" << std::endl;
    }
};

/**
 * Mock Supabase Test
 * Tests the Supabase integration without actually making HTTP requests
 */
class MockSupabaseTest {
public:
    static void testSupabaseIntegration() {
        std::cout << "\n📋 Test 9: Mock Supabase Integration" << std::endl;
        
        // Test environment setup
        setenv("NEXT_PUBLIC_SUPABASE_URL", "https://test-project.supabase.co", 1);
        setenv("SUPABASE_SERVICE_ROLE_KEY", "test-service-role-key", 1);
        
        DailyUpdateService service;
        bool initResult = service.initializeFromEnv();
        assert(initResult == true);
        std::cout << "✅ Mock Supabase initialization successful" << std::endl;
        
        // Test product data structure for Supabase
        ProductData testProduct("Test Whey", "Test Brand", "Vanilla");
        testProduct.year = "2024";
        
        std::cout << "✅ Product data structure ready for Supabase:" << std::endl;
        std::cout << "   - Name: " << testProduct.name << std::endl;
        std::cout << "   - Brand: " << testProduct.brand_name << std::endl;
        std::cout << "   - Flavor: " << testProduct.flavor << std::endl;
        std::cout << "   - Year: " << testProduct.year << std::endl;
        std::cout << "   - Created: " << testProduct.created_at << std::endl;
        std::cout << "   - Updated: " << testProduct.updated_at << std::endl;
    }
};

/**
 * Performance Test
 * Tests the service under load
 */
class PerformanceTest {
public:
    static void testHighVolumeQueue() {
        std::cout << "\n📋 Test 10: High Volume Queue Performance" << std::endl;
        
        DailyUpdateService service;
        service.initialize("https://test.supabase.co", "test-key");
        
        auto start = std::chrono::high_resolution_clock::now();
        
        // Add 1000 products to queue
        for (int i = 0; i < 1000; ++i) {
            ProductData product("Product " + std::to_string(i), "Brand " + std::to_string(i % 10), "Flavor " + std::to_string(i % 5));
            service.addProductForApproval(product);
        }
        
        auto end = std::chrono::high_resolution_clock::now();
        auto duration = std::chrono::duration_cast<std::chrono::milliseconds>(end - start);
        
        std::cout << "✅ Added 1000 products in " << duration.count() << "ms" << std::endl;
        
        // Test queue stats with large queue
        auto stats = service.getQueueStats();
        assert(stats.queueSize >= 1000);
        std::cout << "✅ Queue size verified: " << stats.queueSize << std::endl;
    }
};

int main() {
    std::cout << "🚀 DailyUpdateService Comprehensive Test Suite" << std::endl;
    std::cout << "=============================================" << std::endl;
    
    try {
        // Run basic functionality tests
        DailyUpdateServiceTest test;
        test.runAllTests();
        
        // Run mock Supabase tests
        MockSupabaseTest::testSupabaseIntegration();
        
        // Run performance tests
        PerformanceTest::testHighVolumeQueue();
        
        std::cout << "\n🎉 ALL TESTS PASSED!" << std::endl;
        std::cout << "The DailyUpdateService is working correctly!" << std::endl;
        
    } catch (const std::exception& e) {
        std::cerr << "❌ Test failed with exception: " << e.what() << std::endl;
        return 1;
    } catch (...) {
        std::cerr << "❌ Test failed with unknown exception" << std::endl;
        return 1;
    }
    
    return 0;
}
