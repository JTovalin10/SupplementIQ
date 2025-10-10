#include <node-addon-api/napi.h>
#include "DailyUpdateService.h"
#include <memory>

// Global service instance
std::unique_ptr<DailyUpdateService> g_dailyUpdateService;

// Convert JavaScript string to C++ string
std::string jsStringToString(const Napi::String& jsStr) {
    return jsStr.Utf8Value();
}

// Convert C++ string to JavaScript string
Napi::String stringToJsString(Napi::Env env, const std::string& str) {
    return Napi::String::New(env, str);
}

// Convert ProductData to JavaScript object
Napi::Object productDataToJsObject(Napi::Env env, const ProductData& product) {
    Napi::Object obj = Napi::Object::New(env);
    
    obj.Set("name", stringToJsString(env, product.name));
    obj.Set("brand_name", stringToJsString(env, product.brand_name));
    obj.Set("flavor", stringToJsString(env, product.flavor));
    obj.Set("year", stringToJsString(env, product.year));
    obj.Set("created_at", stringToJsString(env, product.created_at));
    obj.Set("updated_at", stringToJsString(env, product.updated_at));
    obj.Set("is_approved", Napi::Boolean::New(env, product.is_approved));
    obj.Set("approved_by", stringToJsString(env, product.approved_by));
    
    return obj;
}

// Convert JavaScript object to ProductData
ProductData jsObjectToProductData(const Napi::Object& obj) {
    ProductData product;
    
    if (obj.Has("name")) {
        product.name = jsStringToString(obj.Get("name").As<Napi::String>());
    }
    if (obj.Has("brand_name")) {
        product.brand_name = jsStringToString(obj.Get("brand_name").As<Napi::String>());
    }
    if (obj.Has("flavor")) {
        product.flavor = jsStringToString(obj.Get("flavor").As<Napi::String>());
    }
    if (obj.Has("year")) {
        product.year = jsStringToString(obj.Get("year").As<Napi::String>());
    }
    if (obj.Has("is_approved")) {
        product.is_approved = obj.Get("is_approved").As<Napi::Boolean>().Value();
    }
    if (obj.Has("approved_by")) {
        product.approved_by = jsStringToString(obj.Get("approved_by").As<Napi::String>());
    }
    
    return product;
}

// Initialize the service
Napi::Value Initialize(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (info.Length() < 2) {
        Napi::TypeError::New(env, "Expected database URL and API key").ThrowAsJavaScriptException();
        return env.Null();
    }
    
    std::string dbUrl = jsStringToString(info[0].As<Napi::String>());
    std::string apiKey = jsStringToString(info[1].As<Napi::String>());
    
    if (!g_dailyUpdateService) {
        g_dailyUpdateService = std::make_unique<DailyUpdateService>();
    }
    
    bool success = g_dailyUpdateService->initialize(dbUrl, apiKey);
    return Napi::Boolean::New(env, success);
}

// Start the service
Napi::Value Start(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (!g_dailyUpdateService) {
        Napi::Error::New(env, "Service not initialized").ThrowAsJavaScriptException();
        return env.Null();
    }
    
    g_dailyUpdateService->start();
    return env.Undefined();
}

// Stop the service
Napi::Value Stop(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (!g_dailyUpdateService) {
        Napi::Error::New(env, "Service not initialized").ThrowAsJavaScriptException();
        return env.Null();
    }
    
    g_dailyUpdateService->stop();
    return env.Undefined();
}

// Add product for approval
Napi::Value AddProductForApproval(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (info.Length() < 1) {
        Napi::TypeError::New(env, "Expected product data object").ThrowAsJavaScriptException();
        return env.Null();
    }
    
    if (!g_dailyUpdateService) {
        Napi::Error::New(env, "Service not initialized").ThrowAsJavaScriptException();
        return env.Null();
    }
    
    ProductData product = jsObjectToProductData(info[0].As<Napi::Object>());
    g_dailyUpdateService->addProductForApproval(product);
    
    return env.Undefined();
}

// Approve product
Napi::Value ApproveProduct(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (info.Length() < 4) {
        Napi::TypeError::New(env, "Expected product name, brand, flavor, and approver").ThrowAsJavaScriptException();
        return env.Null();
    }
    
    if (!g_dailyUpdateService) {
        Napi::Error::New(env, "Service not initialized").ThrowAsJavaScriptException();
        return env.Null();
    }
    
    std::string productName = jsStringToString(info[0].As<Napi::String>());
    std::string brandName = jsStringToString(info[1].As<Napi::String>());
    std::string flavor = jsStringToString(info[2].As<Napi::String>());
    std::string approver = jsStringToString(info[3].As<Napi::String>());
    
    bool success = g_dailyUpdateService->approveProduct(productName, brandName, flavor, approver);
    return Napi::Boolean::New(env, success);
}

// Reject product
Napi::Value RejectProduct(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (info.Length() < 3) {
        Napi::TypeError::New(env, "Expected product name, brand, and flavor").ThrowAsJavaScriptException();
        return env.Null();
    }
    
    if (!g_dailyUpdateService) {
        Napi::Error::New(env, "Service not initialized").ThrowAsJavaScriptException();
        return env.Null();
    }
    
    std::string productName = jsStringToString(info[0].As<Napi::String>());
    std::string brandName = jsStringToString(info[1].As<Napi::String>());
    std::string flavor = jsStringToString(info[2].As<Napi::String>());
    
    bool success = g_dailyUpdateService->rejectProduct(productName, brandName, flavor);
    return Napi::Boolean::New(env, success);
}

// Verify product exists
Napi::Value VerifyProductExists(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (info.Length() < 1) {
        Napi::TypeError::New(env, "Expected product data object").ThrowAsJavaScriptException();
        return env.Null();
    }
    
    if (!g_dailyUpdateService) {
        Napi::Error::New(env, "Service not initialized").ThrowAsJavaScriptException();
        return env.Null();
    }
    
    ProductData product = jsObjectToProductData(info[0].As<Napi::Object>());
    VerificationResult result = g_dailyUpdateService->verifyProductExists(product);
    
    Napi::Object jsResult = Napi::Object::New(env);
    jsResult.Set("exists", Napi::Boolean::New(env, result.exists));
    jsResult.Set("match_type", stringToJsString(env, result.match_type));
    
    Napi::Array similarProducts = Napi::Array::New(env, result.similar_products.size());
    for (size_t i = 0; i < result.similar_products.size(); i++) {
        similarProducts.Set(i, productDataToJsObject(env, result.similar_products[i]));
    }
    jsResult.Set("similar_products", similarProducts);
    
    return jsResult;
}

// Get queue stats
Napi::Value GetQueueStats(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (!g_dailyUpdateService) {
        Napi::Error::New(env, "Service not initialized").ThrowAsJavaScriptException();
        return env.Null();
    }
    
    DailyUpdateService::QueueStats stats = g_dailyUpdateService->getQueueStats();
    
    Napi::Object jsStats = Napi::Object::New(env);
    jsStats.Set("queueSize", Napi::Number::New(env, stats.queueSize));
    jsStats.Set("totalProcessed", Napi::Number::New(env, stats.totalProcessed));
    jsStats.Set("totalApproved", Napi::Number::New(env, stats.totalApproved));
    jsStats.Set("totalRejected", Napi::Number::New(env, stats.totalRejected));
    jsStats.Set("lastUpdateTime", stringToJsString(env, stats.lastUpdateTime));
    jsStats.Set("isRunning", Napi::Boolean::New(env, stats.isRunning));
    
    return jsStats;
}

// Force daily update
Napi::Value ForceDailyUpdate(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (!g_dailyUpdateService) {
        Napi::Error::New(env, "Service not initialized").ThrowAsJavaScriptException();
        return env.Null();
    }
    
    g_dailyUpdateService->forceDailyUpdate();
    return env.Undefined();
}

// Get pending products
Napi::Value GetPendingProducts(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (!g_dailyUpdateService) {
        Napi::Error::New(env, "Service not initialized").ThrowAsJavaScriptException();
        return env.Null();
    }
    
    std::vector<ProductData> pending = g_dailyUpdateService->getPendingProducts();
    
    Napi::Array jsPending = Napi::Array::New(env, pending.size());
    for (size_t i = 0; i < pending.size(); i++) {
        jsPending.Set(i, productDataToJsObject(env, pending[i]));
    }
    
    return jsPending;
}

// Module initialization
Napi::Object Init(Napi::Env env, Napi::Object exports) {
    exports.Set(Napi::String::New(env, "initialize"), Napi::Function::New(env, Initialize));
    exports.Set(Napi::String::New(env, "start"), Napi::Function::New(env, Start));
    exports.Set(Napi::String::New(env, "stop"), Napi::Function::New(env, Stop));
    exports.Set(Napi::String::New(env, "addProductForApproval"), Napi::Function::New(env, AddProductForApproval));
    exports.Set(Napi::String::New(env, "approveProduct"), Napi::Function::New(env, ApproveProduct));
    exports.Set(Napi::String::New(env, "rejectProduct"), Napi::Function::New(env, RejectProduct));
    exports.Set(Napi::String::New(env, "verifyProductExists"), Napi::Function::New(env, VerifyProductExists));
    exports.Set(Napi::String::New(env, "getQueueStats"), Napi::Function::New(env, GetQueueStats));
    exports.Set(Napi::String::New(env, "forceDailyUpdate"), Napi::Function::New(env, ForceDailyUpdate));
    exports.Set(Napi::String::New(env, "getPendingProducts"), Napi::Function::New(env, GetPendingProducts));
    
    return exports;
}

NODE_API_MODULE(daily_update_service, Init)
