#include <napi.h>
#include "SecurityTree.h"
#include <iostream>
#include <string>

class SecurityTreeWrapper : public Napi::ObjectWrap<SecurityTreeWrapper> {
public:
    static Napi::Object Init(Napi::Env env, Napi::Object exports);
    SecurityTreeWrapper(const Napi::CallbackInfo& info);
    ~SecurityTreeWrapper();

private:
    SecurityTree* securityTree_;

    // Core functionality
    Napi::Value CanMakeRequest(const Napi::CallbackInfo& info);
    Napi::Value RecordRequest(const Napi::CallbackInfo& info);
    Napi::Value IsRequestExpired(const Napi::CallbackInfo& info);
    Napi::Value CleanupExpiredRequests(const Napi::CallbackInfo& info);
    
    // Admin tracking
    Napi::Value HasAdminMadeRequestToday(const Napi::CallbackInfo& info);
    Napi::Value GetAdminRequestCountToday(const Napi::CallbackInfo& info);
    
    // Daily management
    Napi::Value ResetDaily(const Napi::CallbackInfo& info);
    Napi::Value NeedsDailyReset(const Napi::CallbackInfo& info);
    
    // Statistics
    Napi::Value GetAllAdminStats(const Napi::CallbackInfo& info);
    Napi::Value GetTotalRequestsToday(const Napi::CallbackInfo& info);
    
    // Utility
    Napi::Value GetCurrentTimestamp(const Napi::CallbackInfo& info);
    Napi::Value ValidateAdminId(const Napi::CallbackInfo& info);
};

Napi::FunctionReference SecurityTreeWrapper::constructor;

Napi::Object SecurityTreeWrapper::Init(Napi::Env env, Napi::Object exports) {
    Napi::HandleScope scope(env);

    Napi::Function func = DefineClass(env, "SecurityTree", {
        // Core functionality
        InstanceMethod("canMakeRequest", &SecurityTreeWrapper::CanMakeRequest),
        InstanceMethod("recordRequest", &SecurityTreeWrapper::RecordRequest),
        InstanceMethod("isRequestExpired", &SecurityTreeWrapper::IsRequestExpired),
        InstanceMethod("cleanupExpiredRequests", &SecurityTreeWrapper::CleanupExpiredRequests),
        
        // Admin tracking
        InstanceMethod("hasAdminMadeRequestToday", &SecurityTreeWrapper::HasAdminMadeRequestToday),
        InstanceMethod("getAdminRequestCountToday", &SecurityTreeWrapper::GetAdminRequestCountToday),
        
        // Daily management
        InstanceMethod("resetDaily", &SecurityTreeWrapper::ResetDaily),
        InstanceMethod("needsDailyReset", &SecurityTreeWrapper::NeedsDailyReset),
        
        // Statistics
        InstanceMethod("getAllAdminStats", &SecurityTreeWrapper::GetAllAdminStats),
        InstanceMethod("getTotalRequestsToday", &SecurityTreeWrapper::GetTotalRequestsToday),
        
        // Utility
        InstanceMethod("getCurrentTimestamp", &SecurityTreeWrapper::GetCurrentTimestamp),
        InstanceMethod("validateAdminId", &SecurityTreeWrapper::ValidateAdminId),
    });

    constructor = Napi::Persistent(func);
    constructor.SuppressDestruct();

    exports.Set("createSecurityTree", Napi::Function::New(env, [](const Napi::CallbackInfo& info) {
        return SecurityTreeWrapper::NewInstance(info.Env());
    }));

    return exports;
}

SecurityTreeWrapper::SecurityTreeWrapper(const Napi::CallbackInfo& info) : Napi::ObjectWrap<SecurityTreeWrapper>(info) {
    Napi::Env env = info.Env();
    Napi::HandleScope scope(env);
    
    securityTree_ = new SecurityTree();
}

SecurityTreeWrapper::~SecurityTreeWrapper() {
    delete securityTree_;
}

Napi::Value SecurityTreeWrapper::CanMakeRequest(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (info.Length() < 2 || !info[0].IsString() || !info[1].IsNumber()) {
        Napi::TypeError::New(env, "Expected adminId (string) and timestamp (number)").ThrowAsJavaScriptException();
        return env.Null();
    }
    
    std::string adminId = info[0].As<Napi::String>().Utf8Value();
    int64_t timestamp = info[1].As<Napi::Number>().Int64Value();
    
    bool canMake = securityTree_->canMakeRequest(adminId, timestamp);
    return Napi::Boolean::New(env, canMake);
}

Napi::Value SecurityTreeWrapper::RecordRequest(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (info.Length() < 2 || !info[0].IsString() || !info[1].IsNumber()) {
        Napi::TypeError::New(env, "Expected adminId (string) and timestamp (number)").ThrowAsJavaScriptException();
        return env.Null();
    }
    
    std::string adminId = info[0].As<Napi::String>().Utf8Value();
    int64_t timestamp = info[1].As<Napi::Number>().Int64Value();
    
    securityTree_->recordRequest(adminId, timestamp);
    return env.Undefined();
}

Napi::Value SecurityTreeWrapper::IsRequestExpired(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (info.Length() < 2 || !info[0].IsNumber() || !info[1].IsNumber()) {
        Napi::TypeError::New(env, "Expected requestTimestamp and currentTimestamp (numbers)").ThrowAsJavaScriptException();
        return env.Null();
    }
    
    int64_t requestTimestamp = info[0].As<Napi::Number>().Int64Value();
    int64_t currentTimestamp = info[1].As<Napi::Number>().Int64Value();
    int expirationMinutes = info.Length() > 2 ? info[2].As<Napi::Number>().Int32Value() : 10;
    
    bool expired = securityTree_->isRequestExpired(requestTimestamp, currentTimestamp, expirationMinutes);
    return Napi::Boolean::New(env, expired);
}

Napi::Value SecurityTreeWrapper::CleanupExpiredRequests(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (info.Length() < 1 || !info[0].IsNumber()) {
        Napi::TypeError::New(env, "Expected currentTimestamp (number)").ThrowAsJavaScriptException();
        return env.Null();
    }
    
    int64_t currentTimestamp = info[0].As<Napi::Number>().Int64Value();
    securityTree_->cleanupExpiredRequests(currentTimestamp);
    return env.Undefined();
}

Napi::Value SecurityTreeWrapper::HasAdminMadeRequestToday(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (info.Length() < 2 || !info[0].IsString() || !info[1].IsNumber()) {
        Napi::TypeError::New(env, "Expected adminId (string) and timestamp (number)").ThrowAsJavaScriptException();
        return env.Null();
    }
    
    std::string adminId = info[0].As<Napi::String>().Utf8Value();
    int64_t timestamp = info[1].As<Napi::Number>().Int64Value();
    
    bool hasMade = securityTree_->hasAdminMadeRequestToday(adminId, timestamp);
    return Napi::Boolean::New(env, hasMade);
}

Napi::Value SecurityTreeWrapper::GetAdminRequestCountToday(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (info.Length() < 2 || !info[0].IsString() || !info[1].IsNumber()) {
        Napi::TypeError::New(env, "Expected adminId (string) and timestamp (number)").ThrowAsJavaScriptException();
        return env.Null();
    }
    
    std::string adminId = info[0].As<Napi::String>().Utf8Value();
    int64_t timestamp = info[1].As<Napi::Number>().Int64Value();
    
    int count = securityTree_->getAdminRequestCountToday(adminId, timestamp);
    return Napi::Number::New(env, count);
}

Napi::Value SecurityTreeWrapper::ResetDaily(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    securityTree_->resetDaily();
    return env.Undefined();
}

Napi::Value SecurityTreeWrapper::NeedsDailyReset(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (info.Length() < 1 || !info[0].IsNumber()) {
        Napi::TypeError::New(env, "Expected currentTimestamp (number)").ThrowAsJavaScriptException();
        return env.Null();
    }
    
    int64_t timestamp = info[0].As<Napi::Number>().Int64Value();
    bool needsReset = securityTree_->needsDailyReset(timestamp);
    return Napi::Boolean::New(env, needsReset);
}

Napi::Value SecurityTreeWrapper::GetAllAdminStats(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (info.Length() < 1 || !info[0].IsNumber()) {
        Napi::TypeError::New(env, "Expected currentTimestamp (number)").ThrowAsJavaScriptException();
        return env.Null();
    }
    
    int64_t timestamp = info[0].As<Napi::Number>().Int64Value();
    auto stats = securityTree_->getAllAdminStats(timestamp);
    
    Napi::Array result = Napi::Array::New(env);
    for (size_t i = 0; i < stats.size(); ++i) {
        Napi::Object statObj = Napi::Object::New(env);
        statObj.Set("adminId", Napi::String::New(env, stats[i].adminId));
        statObj.Set("requestsToday", Napi::Number::New(env, stats[i].requestsToday));
        statObj.Set("lastRequestTime", Napi::Number::New(env, stats[i].lastRequestTime));
        statObj.Set("hasActiveRequest", Napi::Boolean::New(env, stats[i].hasActiveRequest));
        result.Set(i, statObj);
    }
    
    return result;
}

Napi::Value SecurityTreeWrapper::GetTotalRequestsToday(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (info.Length() < 1 || !info[0].IsNumber()) {
        Napi::TypeError::New(env, "Expected currentTimestamp (number)").ThrowAsJavaScriptException();
        return env.Null();
    }
    
    int64_t timestamp = info[0].As<Napi::Number>().Int64Value();
    int total = securityTree_->getTotalRequestsToday(timestamp);
    return Napi::Number::New(env, total);
}

Napi::Value SecurityTreeWrapper::GetCurrentTimestamp(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    int64_t timestamp = std::time(nullptr);
    return Napi::Number::New(env, timestamp);
}

Napi::Value SecurityTreeWrapper::ValidateAdminId(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (info.Length() < 1 || !info[0].IsString()) {
        Napi::TypeError::New(env, "Expected adminId (string)").ThrowAsJavaScriptException();
        return env.Null();
    }
    
    std::string adminId = info[0].As<Napi::String>().Utf8Value();
    // Basic validation - non-empty, reasonable length
    bool valid = !adminId.empty() && adminId.length() <= 100;
    return Napi::Boolean::New(env, valid);
}

NODE_API_MODULE(security_tree_addon, SecurityTreeWrapper::Init)
