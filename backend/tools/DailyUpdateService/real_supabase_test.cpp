#include <iostream>
#include <string>
#include <vector>
#include <chrono>
#include <thread>
#include <curl/curl.h>
#include <nlohmann/json.hpp>

// Real test that actually sends data to Supabase
using json = nlohmann::json;

struct ProductData {
    std::string name;
    std::string brand_name;
    std::string flavor;
    int year;
    std::string created_at;
    std::string updated_at;
};

class RealSupabaseTest {
private:
    std::string supabaseUrl_;
    std::string supabaseKey_;

public:
    RealSupabaseTest() {
        supabaseUrl_ = "https://elpjjfzkitdyctaputiy.supabase.co";
        supabaseKey_ = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVscGpqZnpraXRkeWN0YXB1dGl5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTQ0NTA0MSwiZXhwIjoyMDc1MDIxMDQxfQ.i75oRRFrlI12o-qVyjQJOHLSD4U4zFlai1MQmGzegI8";
    }

    // Callback function for cURL
    static size_t WriteCallback(void* contents, size_t size, size_t nmemb, std::string* s) {
        size_t newLength = size * nmemb;
        try {
            s->append((char*)contents, newLength);
            return newLength;
        } catch (std::bad_alloc& e) {
            return 0;
        }
    }

    bool insertProductIntoDatabase(const ProductData& product) {
        std::cout << "💾 Inserting into Supabase database: " << product.name
                  << " (" << product.brand_name << ")" << std::endl;

        CURL* curl = curl_easy_init();
        if (!curl) {
            std::cerr << "❌ Failed to initialize cURL" << std::endl;
            return false;
        }

        // Create JSON payload
        json productJson;
        productJson["name"] = product.name;
        productJson["brand_name"] = product.brand_name;
        productJson["flavor"] = product.flavor;
        productJson["year"] = product.year;
        productJson["created_at"] = product.created_at;
        productJson["updated_at"] = product.updated_at;

        std::string jsonString = productJson.dump();
        std::cout << "📄 JSON payload: " << jsonString << std::endl;

        // Set up headers
        struct curl_slist* headers = nullptr;
        headers = curl_slist_append(headers, ("apikey: " + supabaseKey_).c_str());
        headers = curl_slist_append(headers, ("Authorization: Bearer " + supabaseKey_).c_str());
        headers = curl_slist_append(headers, "Content-Type: application/json");
        headers = curl_slist_append(headers, "Prefer: return=minimal");

        std::string responseData;

        // Configure cURL
        curl_easy_setopt(curl, CURLOPT_URL, (supabaseUrl_ + "/rest/v1/products").c_str());
        curl_easy_setopt(curl, CURLOPT_POSTFIELDS, jsonString.c_str());
        curl_easy_setopt(curl, CURLOPT_HTTPHEADER, headers);
        curl_easy_setopt(curl, CURLOPT_WRITEFUNCTION, WriteCallback);
        curl_easy_setopt(curl, CURLOPT_WRITEDATA, &responseData);
        curl_easy_setopt(curl, CURLOPT_TIMEOUT, 30L);

        // Perform the request
        std::cout << "📡 Making HTTP POST request to: " << supabaseUrl_ << "/rest/v1/products" << std::endl;
        CURLcode res = curl_easy_perform(curl);

        long responseCode;
        curl_easy_getinfo(curl, CURLINFO_RESPONSE_CODE, &responseCode);

        // Cleanup
        curl_slist_free_all(headers);
        curl_easy_cleanup(curl);

        if (res != CURLE_OK) {
            std::cerr << "❌ cURL error: " << curl_easy_strerror(res) << std::endl;
            return false;
        }

        std::cout << "📊 Response code: " << responseCode << std::endl;
        std::cout << "📄 Response data: " << responseData << std::endl;

        if (responseCode >= 200 && responseCode < 300) {
            std::cout << "✅ Successfully inserted product into Supabase!" << std::endl;
            return true;
        } else {
            std::cerr << "❌ Supabase insertion failed!" << std::endl;
            return false;
        }
    }
};

int main() {
    std::cout << "🧪 Real Supabase Integration Test" << std::endl;
    std::cout << "=================================" << std::endl;

    // Initialize cURL
    curl_global_init(CURL_GLOBAL_DEFAULT);

    RealSupabaseTest test;

    // Create test products
    std::vector<ProductData> testProducts = {
        {
            "Test Whey Protein - " + std::to_string(std::chrono::duration_cast<std::chrono::seconds>(std::chrono::system_clock::now().time_since_epoch()).count()),
            "Test Brand",
            "Chocolate",
            2024,
            "2024-10-09T23:30:00Z",
            "2024-10-09T23:30:00Z"
        },
        {
            "Test Creatine - " + std::to_string(std::chrono::duration_cast<std::chrono::seconds>(std::chrono::system_clock::now().time_since_epoch()).count()),
            "Test Brand 2",
            "Unflavored",
            2024,
            "2024-10-09T23:30:00Z",
            "2024-10-09T23:30:00Z"
        }
    };

    std::cout << "\n📋 Inserting " << testProducts.size() << " test products into Supabase..." << std::endl;
    
    int successCount = 0;
    for (const auto& product : testProducts) {
        std::cout << "\n--- Inserting Product ---" << std::endl;
        if (test.insertProductIntoDatabase(product)) {
            successCount++;
        }
        std::cout << "--- Product Insertion Complete ---\n" << std::endl;
        
        // Small delay between insertions
        std::this_thread::sleep_for(std::chrono::milliseconds(500));
    }

    std::cout << "🎉 Test completed!" << std::endl;
    std::cout << "📊 Results: " << successCount << "/" << testProducts.size() << " products inserted successfully" << std::endl;
    
    if (successCount == testProducts.size()) {
        std::cout << "✅ All products were successfully inserted into Supabase!" << std::endl;
        std::cout << "🔍 Check your Supabase dashboard to see the new products in the 'products' table." << std::endl;
    } else {
        std::cout << "⚠️ Some products failed to insert. Check the error messages above." << std::endl;
    }

    // Cleanup cURL
    curl_global_cleanup();

    return 0;
}
