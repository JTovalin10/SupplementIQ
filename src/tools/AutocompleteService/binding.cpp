#include <napi.h>
#include "AutocompleteService.h"
#include <memory>
#include <vector>
#include <string>

class AutocompleteServiceWrapper : public Napi::ObjectWrap<AutocompleteServiceWrapper> {
public:
    static Napi::Object Init(Napi::Env env, Napi::Object exports);
    AutocompleteServiceWrapper(const Napi::CallbackInfo& info);
    ~AutocompleteServiceWrapper();

private:
    static Napi::FunctionReference constructor;
    std::unique_ptr<AutocompleteService> service_;

    // JavaScript method bindings
    Napi::Value Initialize(const Napi::CallbackInfo& info);
    Napi::Value SearchProducts(const Napi::CallbackInfo& info);
    Napi::Value SearchBrands(const Napi::CallbackInfo& info);
    Napi::Value SearchFlavors(const Napi::CallbackInfo& info);
    Napi::Value AddProductsBatch(const Napi::CallbackInfo& info);
    Napi::Value AddBrandsBatch(const Napi::CallbackInfo& info);
    Napi::Value AddFlavorsBatch(const Napi::CallbackInfo& info);
    Napi::Value AddProduct(const Napi::CallbackInfo& info);
    Napi::Value AddBrand(const Napi::CallbackInfo& info);
    Napi::Value AddFlavor(const Napi::CallbackInfo& info);
    Napi::Value SaveToFiles(const Napi::CallbackInfo& info);
    Napi::Value LoadFromFiles(const Napi::CallbackInfo& info);
    Napi::Value GetStats(const Napi::CallbackInfo& info);
    Napi::Value ClearAll(const Napi::CallbackInfo& info);
    Napi::Value HasProduct(const Napi::CallbackInfo& info);
    Napi::Value HasBrand(const Napi::CallbackInfo& info);
    Napi::Value HasFlavor(const Napi::CallbackInfo& info);
    Napi::Value StartBackgroundUpdate(const Napi::CallbackInfo& info);
    Napi::Value IsUpdateInProgress(const Napi::CallbackInfo& info);
    Napi::Value Shutdown(const Napi::CallbackInfo& info);
};

Napi::FunctionReference AutocompleteServiceWrapper::constructor;

Napi::Object AutocompleteServiceWrapper::Init(Napi::Env env, Napi::Object exports) {
    Napi::HandleScope scope(env);

    Napi::Function func = DefineClass(env, "AutocompleteService", {
        InstanceMethod("initialize", &AutocompleteServiceWrapper::Initialize),
        InstanceMethod("searchProducts", &AutocompleteServiceWrapper::SearchProducts),
        InstanceMethod("searchBrands", &AutocompleteServiceWrapper::SearchBrands),
        InstanceMethod("searchFlavors", &AutocompleteServiceWrapper::SearchFlavors),
        InstanceMethod("addProductsBatch", &AutocompleteServiceWrapper::AddProductsBatch),
        InstanceMethod("addBrandsBatch", &AutocompleteServiceWrapper::AddBrandsBatch),
        InstanceMethod("addFlavorsBatch", &AutocompleteServiceWrapper::AddFlavorsBatch),
        InstanceMethod("addProduct", &AutocompleteServiceWrapper::AddProduct),
        InstanceMethod("addBrand", &AutocompleteServiceWrapper::AddBrand),
        InstanceMethod("addFlavor", &AutocompleteServiceWrapper::AddFlavor),
        InstanceMethod("saveToFiles", &AutocompleteServiceWrapper::SaveToFiles),
        InstanceMethod("loadFromFiles", &AutocompleteServiceWrapper::LoadFromFiles),
        InstanceMethod("getStats", &AutocompleteServiceWrapper::GetStats),
        InstanceMethod("clearAll", &AutocompleteServiceWrapper::ClearAll),
        InstanceMethod("hasProduct", &AutocompleteServiceWrapper::HasProduct),
        InstanceMethod("hasBrand", &AutocompleteServiceWrapper::HasBrand),
        InstanceMethod("hasFlavor", &AutocompleteServiceWrapper::HasFlavor),
        InstanceMethod("startBackgroundUpdate", &AutocompleteServiceWrapper::StartBackgroundUpdate),
        InstanceMethod("isUpdateInProgress", &AutocompleteServiceWrapper::IsUpdateInProgress),
        InstanceMethod("shutdown", &AutocompleteServiceWrapper::Shutdown),
    });

    constructor = Napi::Persistent(func);
    constructor.SuppressDestruct();

    exports.Set("AutocompleteService", func);
    return exports;
}

AutocompleteServiceWrapper::AutocompleteServiceWrapper(const Napi::CallbackInfo& info) 
    : Napi::ObjectWrap<AutocompleteServiceWrapper>(info) {
    service_ = std::make_unique<AutocompleteService>();
}

AutocompleteServiceWrapper::~AutocompleteServiceWrapper() {
    if (service_) {
        service_->shutdown();
    }
}

Napi::Value AutocompleteServiceWrapper::Initialize(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    try {
        std::string dataDir = "./data/autocomplete";
        if (info.Length() > 0 && info[0].IsString()) {
            dataDir = info[0].As<Napi::String>().Utf8Value();
        }
        
        bool success = service_->initialize(dataDir);
        return Napi::Boolean::New(env, success);
    } catch (const std::exception& e) {
        Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
        return Napi::Boolean::New(env, false);
    }
}

Napi::Value AutocompleteServiceWrapper::SearchProducts(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (info.Length() < 1 || !info[0].IsString()) {
        Napi::TypeError::New(env, "Expected string prefix").ThrowAsJavaScriptException();
        return env.Null();
    }
    
    try {
        std::string prefix = info[0].As<Napi::String>().Utf8Value();
        size_t limit = 25;
        
        if (info.Length() > 1 && info[1].IsNumber()) {
            limit = info[1].As<Napi::Number>().Uint32Value();
        }
        
        std::vector<std::string> results = service_->searchProducts(prefix, limit);
        
        Napi::Array jsResults = Napi::Array::New(env, results.size());
        for (size_t i = 0; i < results.size(); ++i) {
            jsResults[i] = Napi::String::New(env, results[i]);
        }
        
        return jsResults;
    } catch (const std::exception& e) {
        Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
        return env.Null();
    }
}

Napi::Value AutocompleteServiceWrapper::SearchBrands(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (info.Length() < 1 || !info[0].IsString()) {
        Napi::TypeError::New(env, "Expected string prefix").ThrowAsJavaScriptException();
        return env.Null();
    }
    
    try {
        std::string prefix = info[0].As<Napi::String>().Utf8Value();
        size_t limit = 15;
        
        if (info.Length() > 1 && info[1].IsNumber()) {
            limit = info[1].As<Napi::Number>().Uint32Value();
        }
        
        std::vector<std::string> results = service_->searchBrands(prefix, limit);
        
        Napi::Array jsResults = Napi::Array::New(env, results.size());
        for (size_t i = 0; i < results.size(); ++i) {
            jsResults[i] = Napi::String::New(env, results[i]);
        }
        
        return jsResults;
    } catch (const std::exception& e) {
        Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
        return env.Null();
    }
}

Napi::Value AutocompleteServiceWrapper::SearchFlavors(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (info.Length() < 1 || !info[0].IsString()) {
        Napi::TypeError::New(env, "Expected string prefix").ThrowAsJavaScriptException();
        return env.Null();
    }
    
    try {
        std::string prefix = info[0].As<Napi::String>().Utf8Value();
        size_t limit = 15;
        
        if (info.Length() > 1 && info[1].IsNumber()) {
            limit = info[1].As<Napi::Number>().Uint32Value();
        }
        
        std::vector<std::string> results = service_->searchFlavors(prefix, limit);
        
        Napi::Array jsResults = Napi::Array::New(env, results.size());
        for (size_t i = 0; i < results.size(); ++i) {
            jsResults[i] = Napi::String::New(env, results[i]);
        }
        
        return jsResults;
    } catch (const std::exception& e) {
        Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
        return env.Null();
    }
}

Napi::Value AutocompleteServiceWrapper::AddProductsBatch(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (info.Length() < 1 || !info[0].IsArray()) {
        Napi::TypeError::New(env, "Expected array of products").ThrowAsJavaScriptException();
        return env.Null();
    }
    
    try {
        Napi::Array jsArray = info[0].As<Napi::Array>();
        std::vector<std::string> products;
        
        for (uint32_t i = 0; i < jsArray.Length(); ++i) {
            if (jsArray[i].IsString()) {
                products.push_back(jsArray[i].As<Napi::String>().Utf8Value());
            }
        }
        
        service_->addProductsBatch(products);
        return Napi::Boolean::New(env, true);
    } catch (const std::exception& e) {
        Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
        return env.Null();
    }
}

Napi::Value AutocompleteServiceWrapper::AddBrandsBatch(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (info.Length() < 1 || !info[0].IsArray()) {
        Napi::TypeError::New(env, "Expected array of brands").ThrowAsJavaScriptException();
        return env.Null();
    }
    
    try {
        Napi::Array jsArray = info[0].As<Napi::Array>();
        std::vector<std::string> brands;
        
        for (uint32_t i = 0; i < jsArray.Length(); ++i) {
            if (jsArray[i].IsString()) {
                brands.push_back(jsArray[i].As<Napi::String>().Utf8Value());
            }
        }
        
        service_->addBrandsBatch(brands);
        return Napi::Boolean::New(env, true);
    } catch (const std::exception& e) {
        Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
        return env.Null();
    }
}

Napi::Value AutocompleteServiceWrapper::AddFlavorsBatch(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (info.Length() < 1 || !info[0].IsArray()) {
        Napi::TypeError::New(env, "Expected array of flavors").ThrowAsJavaScriptException();
        return env.Null();
    }
    
    try {
        Napi::Array jsArray = info[0].As<Napi::Array>();
        std::vector<std::string> flavors;
        
        for (uint32_t i = 0; i < jsArray.Length(); ++i) {
            if (jsArray[i].IsString()) {
                flavors.push_back(jsArray[i].As<Napi::String>().Utf8Value());
            }
        }
        
        service_->addFlavorsBatch(flavors);
        return Napi::Boolean::New(env, true);
    } catch (const std::exception& e) {
        Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
        return env.Null();
    }
}

Napi::Value AutocompleteServiceWrapper::AddProduct(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (info.Length() < 1 || !info[0].IsString()) {
        Napi::TypeError::New(env, "Expected string product").ThrowAsJavaScriptException();
        return env.Null();
    }
    
    try {
        std::string product = info[0].As<Napi::String>().Utf8Value();
        service_->addProduct(product);
        return Napi::Boolean::New(env, true);
    } catch (const std::exception& e) {
        Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
        return env.Null();
    }
}

Napi::Value AutocompleteServiceWrapper::AddBrand(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (info.Length() < 1 || !info[0].IsString()) {
        Napi::TypeError::New(env, "Expected string brand").ThrowAsJavaScriptException();
        return env.Null();
    }
    
    try {
        std::string brand = info[0].As<Napi::String>().Utf8Value();
        service_->addBrand(brand);
        return Napi::Boolean::New(env, true);
    } catch (const std::exception& e) {
        Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
        return env.Null();
    }
}

Napi::Value AutocompleteServiceWrapper::AddFlavor(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (info.Length() < 1 || !info[0].IsString()) {
        Napi::TypeError::New(env, "Expected string flavor").ThrowAsJavaScriptException();
        return env.Null();
    }
    
    try {
        std::string flavor = info[0].As<Napi::String>().Utf8Value();
        service_->addFlavor(flavor);
        return Napi::Boolean::New(env, true);
    } catch (const std::exception& e) {
        Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
        return env.Null();
    }
}

Napi::Value AutocompleteServiceWrapper::SaveToFiles(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    try {
        bool success = service_->saveToFiles();
        return Napi::Boolean::New(env, success);
    } catch (const std::exception& e) {
        Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
        return env.Null();
    }
}

Napi::Value AutocompleteServiceWrapper::LoadFromFiles(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    try {
        bool success = service_->loadFromFiles();
        return Napi::Boolean::New(env, success);
    } catch (const std::exception& e) {
        Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
        return env.Null();
    }
}

Napi::Value AutocompleteServiceWrapper::GetStats(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    try {
        AutocompleteService::Stats stats = service_->getStats();
        
        Napi::Object jsStats = Napi::Object::New(env);
        jsStats.Set("productCount", Napi::Number::New(env, stats.productCount));
        jsStats.Set("brandCount", Napi::Number::New(env, stats.brandCount));
        jsStats.Set("flavorCount", Napi::Number::New(env, stats.flavorCount));
        jsStats.Set("dataDir", Napi::String::New(env, stats.dataDir));
        
        return jsStats;
    } catch (const std::exception& e) {
        Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
        return env.Null();
    }
}

Napi::Value AutocompleteServiceWrapper::ClearAll(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    try {
        service_->clearAll();
        return Napi::Boolean::New(env, true);
    } catch (const std::exception& e) {
        Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
        return env.Null();
    }
}

Napi::Value AutocompleteServiceWrapper::HasProduct(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (info.Length() < 1 || !info[0].IsString()) {
        Napi::TypeError::New(env, "Expected string product").ThrowAsJavaScriptException();
        return env.Null();
    }
    
    try {
        std::string product = info[0].As<Napi::String>().Utf8Value();
        bool exists = service_->hasProduct(product);
        return Napi::Boolean::New(env, exists);
    } catch (const std::exception& e) {
        Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
        return env.Null();
    }
}

Napi::Value AutocompleteServiceWrapper::HasBrand(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (info.Length() < 1 || !info[0].IsString()) {
        Napi::TypeError::New(env, "Expected string brand").ThrowAsJavaScriptException();
        return env.Null();
    }
    
    try {
        std::string brand = info[0].As<Napi::String>().Utf8Value();
        bool exists = service_->hasBrand(brand);
        return Napi::Boolean::New(env, exists);
    } catch (const std::exception& e) {
        Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
        return env.Null();
    }
}

Napi::Value AutocompleteServiceWrapper::HasFlavor(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (info.Length() < 1 || !info[0].IsString()) {
        Napi::TypeError::New(env, "Expected string flavor").ThrowAsJavaScriptException();
        return env.Null();
    }
    
    try {
        std::string flavor = info[0].As<Napi::String>().Utf8Value();
        bool exists = service_->hasFlavor(flavor);
        return Napi::Boolean::New(env, exists);
    } catch (const std::exception& e) {
        Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
        return env.Null();
    }
}

Napi::Value AutocompleteServiceWrapper::Shutdown(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    try {
        service_->shutdown();
        return Napi::Boolean::New(env, true);
    } catch (const std::exception& e) {
        Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
        return env.Null();
    }
}

// Module initialization
Napi::Object Init(Napi::Env env, Napi::Object exports) {
    return AutocompleteServiceWrapper::Init(env, exports);
}

NODE_API_MODULE(autocomplete_service, Init)
