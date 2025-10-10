#include <iostream>
#include <string>
#include <vector>
#include <chrono>
#include <thread>
#include <curl/curl.h>
#include <nlohmann/json.hpp>

// Test that works with the correct Supabase schema
using json = nlohmann::json;

class CorrectSchemaTest {
private:
    std::string supabaseUrl_;
    std::string supabaseKey_;

public:
    CorrectSchemaTest() {
        supabaseUrl_ = "https://elpjjfzkitdyctaputiy.supabase.co";
        supabaseKey_ = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVscGpqZnpraXRkeWN0YXB1dGl5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTQ0NTA0MSwiZXhwIjoyMDc1MDIxMDQxfQ.i75oRRFrlI12o-qVyjQJOHLSD4U4zFlai1MQmGzegI8";
    }

    static size_t WriteCallback(void* contents, size_t size, size_t nmemb, std::string* s) {
        size_t newLength = size * nmemb;
        try {
            s->append((char*)contents, newLength);
            return newLength;
        } catch (std::bad_alloc& e) {
            return 0;
        }
    }

    // First, create a brand in the brands table
    int createBrand(const std::string& brandName) {
        std::cout << "🏢 Creating brand: " << brandName << std::endl;

        CURL* curl = curl_easy_init();
        if (!curl) {
            std::cerr << "❌ Failed to initialize cURL" << std::endl;
            return -1;
        }

        json brandJson;
        brandJson["name"] = brandName;
        brandJson["slug"] = brandName + "_test";

        std::string jsonString = brandJson.dump();
        std::cout << "📄 Brand JSON: " << jsonString << std::endl;

        struct curl_slist* headers = nullptr;
        headers = curl_slist_append(headers, ("apikey: " + supabaseKey_).c_str());
        headers = curl_slist_append(headers, ("Authorization: Bearer " + supabaseKey_).c_str());
        headers = curl_slist_append(headers, "Content-Type: application/json");
        headers = curl_slist_append(headers, "Prefer: return=representation");

        std::string responseData;

        curl_easy_setopt(curl, CURLOPT_URL, (supabaseUrl_ + "/rest/v1/brands").c_str());
        curl_easy_setopt(curl, CURLOPT_POSTFIELDS, jsonString.c_str());
        curl_easy_setopt(curl, CURLOPT_HTTPHEADER, headers);
        curl_easy_setopt(curl, CURLOPT_WRITEFUNCTION, WriteCallback);
        curl_easy_setopt(curl, CURLOPT_WRITEDATA, &responseData);
        curl_easy_setopt(curl, CURLOPT_TIMEOUT, 30L);

        CURLcode res = curl_easy_perform(curl);

        long responseCode;
        curl_easy_getinfo(curl, CURLINFO_RESPONSE_CODE, &responseCode);

        curl_slist_free_all(headers);
        curl_easy_cleanup(curl);

        std::cout << "📊 Brand creation response code: " << responseCode << std::endl;
        std::cout << "📄 Brand creation response: " << responseData << std::endl;

        if (responseCode >= 200 && responseCode < 300) {
            // Parse the response to get the brand ID
            try {
                json responseJson = json::parse(responseData);
                if (responseJson.is_array() && !responseJson.empty()) {
                    int brandId = responseJson[0]["id"];
                    std::cout << "✅ Brand created with ID: " << brandId << std::endl;
                    return brandId;
                }
            } catch (const std::exception& e) {
                std::cerr << "❌ Failed to parse brand response: " << e.what() << std::endl;
            }
        }

        std::cerr << "❌ Failed to create brand!" << std::endl;
        return -1;
    }

    // Now create a product using the brand_id
    bool createProduct(int brandId, const std::string& productName, const std::string& category) {
        std::cout << "📦 Creating product: " << productName << " (Brand ID: " << brandId << ")" << std::endl;

        CURL* curl = curl_easy_init();
        if (!curl) {
            std::cerr << "❌ Failed to initialize cURL" << std::endl;
            return false;
        }

        json productJson;
        productJson["brand_id"] = brandId;
        productJson["category"] = category;
        productJson["name"] = productName;
        productJson["slug"] = productName + "_test_" + std::to_string(std::chrono::duration_cast<std::chrono::seconds>(std::chrono::system_clock::now().time_since_epoch()).count());
        productJson["description"] = "Test product created by DailyUpdateService";
        productJson["image_url"] = "https://example.com/images/" + productName + ".jpg";
        productJson["servings_per_container"] = 30;
        productJson["serving_size_g"] = 30.0;
        productJson["transparency_score"] = 85;
        productJson["confidence_level"] = "verified";

        std::string jsonString = productJson.dump();
        std::cout << "📄 Product JSON: " << jsonString << std::endl;

        struct curl_slist* headers = nullptr;
        headers = curl_slist_append(headers, ("apikey: " + supabaseKey_).c_str());
        headers = curl_slist_append(headers, ("Authorization: Bearer " + supabaseKey_).c_str());
        headers = curl_slist_append(headers, "Content-Type: application/json");
        headers = curl_slist_append(headers, "Prefer: return=minimal");

        std::string responseData;

        curl_easy_setopt(curl, CURLOPT_URL, (supabaseUrl_ + "/rest/v1/products").c_str());
        curl_easy_setopt(curl, CURLOPT_POSTFIELDS, jsonString.c_str());
        curl_easy_setopt(curl, CURLOPT_HTTPHEADER, headers);
        curl_easy_setopt(curl, CURLOPT_WRITEFUNCTION, WriteCallback);
        curl_easy_setopt(curl, CURLOPT_WRITEDATA, &responseData);
        curl_easy_setopt(curl, CURLOPT_TIMEOUT, 30L);

        CURLcode res = curl_easy_perform(curl);

        long responseCode;
        curl_easy_getinfo(curl, CURLINFO_RESPONSE_CODE, &responseCode);

        curl_slist_free_all(headers);
        curl_easy_cleanup(curl);

        if (res != CURLE_OK) {
            std::cerr << "❌ cURL error: " << curl_easy_strerror(res) << std::endl;
            return false;
        }

        std::cout << "📊 Product creation response code: " << responseCode << std::endl;
        std::cout << "📄 Product creation response: " << responseData << std::endl;

        if (responseCode >= 200 && responseCode < 300) {
            std::cout << "✅ Successfully created product!" << std::endl;
            return true;
        } else {
            std::cerr << "❌ Failed to create product!" << std::endl;
            return false;
        }
    }
};

int main() {
    std::cout << "🧪 Correct Schema Supabase Test" << std::endl;
    std::cout << "===============================" << std::endl;

    curl_global_init(CURL_GLOBAL_DEFAULT);

    CorrectSchemaTest test;

    // Create test brands first
    std::cout << "\n📋 Step 1: Creating test brands..." << std::endl;
    int brand1Id = test.createBrand("Test Brand 1");
    int brand2Id = test.createBrand("Test Brand 2");

    if (brand1Id == -1 || brand2Id == -1) {
        std::cerr << "❌ Failed to create brands. Cannot proceed with product creation." << std::endl;
        curl_global_cleanup();
        return 1;
    }

    // Create test products
    std::cout << "\n📋 Step 2: Creating test products..." << std::endl;
    bool product1Success = test.createProduct(brand1Id, "Test Whey Protein", "protein");
    bool product2Success = test.createProduct(brand2Id, "Test Creatine", "creatine");

    std::cout << "\n🎉 Test completed!" << std::endl;
    std::cout << "📊 Results:" << std::endl;
    std::cout << "  - Brand 1 creation: " << (brand1Id != -1 ? "✅" : "❌") << std::endl;
    std::cout << "  - Brand 2 creation: " << (brand2Id != -1 ? "✅" : "❌") << std::endl;
    std::cout << "  - Product 1 creation: " << (product1Success ? "✅" : "❌") << std::endl;
    std::cout << "  - Product 2 creation: " << (product2Success ? "✅" : "❌") << std::endl;

    if (product1Success && product2Success) {
        std::cout << "\n🎉 All products were successfully created in Supabase!" << std::endl;
        std::cout << "🔍 Check your Supabase dashboard to see:" << std::endl;
        std::cout << "  - New brands in the 'brands' table" << std::endl;
        std::cout << "  - New products in the 'products' table" << std::endl;
        std::cout << "  - Products linked to brands via brand_id foreign key" << std::endl;
    } else {
        std::cout << "\n⚠️ Some operations failed. Check the error messages above." << std::endl;
    }

    curl_global_cleanup();
    return 0;
}
