#include <iostream>
#include <string>
#include <curl/curl.h>

// Simple test to check the table structure in Supabase
class TableStructureChecker {
private:
    std::string supabaseUrl_;
    std::string supabaseKey_;

public:
    TableStructureChecker() {
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

    bool checkTableStructure() {
        std::cout << "🔍 Checking Supabase table structure..." << std::endl;

        CURL* curl = curl_easy_init();
        if (!curl) {
            std::cerr << "❌ Failed to initialize cURL" << std::endl;
            return false;
        }

        // Set up headers
        struct curl_slist* headers = nullptr;
        headers = curl_slist_append(headers, ("apikey: " + supabaseKey_).c_str());
        headers = curl_slist_append(headers, ("Authorization: Bearer " + supabaseKey_).c_str());
        headers = curl_slist_append(headers, "Content-Type: application/json");
        headers = curl_slist_append(headers, "Prefer: return=minimal");

        std::string responseData;

        // Query to get table structure
        std::string queryUrl = supabaseUrl_ + "/rest/v1/products?select=*&limit=1";
        std::cout << "📡 Making GET request to: " << queryUrl << std::endl;

        curl_easy_setopt(curl, CURLOPT_URL, queryUrl.c_str());
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

        std::cout << "📊 Response code: " << responseCode << std::endl;
        std::cout << "📄 Response data: " << responseData << std::endl;

        if (responseCode >= 200 && responseCode < 300) {
            std::cout << "✅ Successfully queried table structure!" << std::endl;
            return true;
        } else {
            std::cerr << "❌ Failed to query table structure!" << std::endl;
            return false;
        }
    }

    bool insertTestProduct() {
        std::cout << "\n🧪 Testing product insertion with minimal data..." << std::endl;

        CURL* curl = curl_easy_init();
        if (!curl) {
            std::cerr << "❌ Failed to initialize cURL" << std::endl;
            return false;
        }

        // Try with just name field first
        std::string jsonPayload = "{\"name\":\"Test Product - Minimal\"}";
        std::cout << "📄 JSON payload: " << jsonPayload << std::endl;

        // Set up headers
        struct curl_slist* headers = nullptr;
        headers = curl_slist_append(headers, ("apikey: " + supabaseKey_).c_str());
        headers = curl_slist_append(headers, ("Authorization: Bearer " + supabaseKey_).c_str());
        headers = curl_slist_append(headers, "Content-Type: application/json");
        headers = curl_slist_append(headers, "Prefer: return=minimal");

        std::string responseData;

        curl_easy_setopt(curl, CURLOPT_URL, (supabaseUrl_ + "/rest/v1/products").c_str());
        curl_easy_setopt(curl, CURLOPT_POSTFIELDS, jsonPayload.c_str());
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

        std::cout << "📊 Response code: " << responseCode << std::endl;
        std::cout << "📄 Response data: " << responseData << std::endl;

        if (responseCode >= 200 && responseCode < 300) {
            std::cout << "✅ Successfully inserted test product!" << std::endl;
            return true;
        } else {
            std::cerr << "❌ Failed to insert test product!" << std::endl;
            return false;
        }
    }
};

int main() {
    std::cout << "🔍 Supabase Table Structure Checker" << std::endl;
    std::cout << "====================================" << std::endl;

    curl_global_init(CURL_GLOBAL_DEFAULT);

    TableStructureChecker checker;

    // Check table structure
    if (checker.checkTableStructure()) {
        std::cout << "\n✅ Table structure check completed!" << std::endl;
    }

    // Try minimal insertion
    if (checker.insertTestProduct()) {
        std::cout << "\n🎉 Test product insertion successful!" << std::endl;
        std::cout << "🔍 Check your Supabase dashboard to see the new product!" << std::endl;
    }

    curl_global_cleanup();
    return 0;
}
