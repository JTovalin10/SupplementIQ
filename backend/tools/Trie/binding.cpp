#include <node.h>
#include <v8.h>
#include "TrieTree.h"

using namespace v8;

class TrieWrapper {
private:
    TrieTree* trie;
    
public:
    TrieWrapper() {
        trie = new TrieTree();
    }
    
    ~TrieWrapper() {
        delete trie;
    }
    
    void insertWord(const std::string& word) {
        trie->insertWord(word);
    }
    
    bool searchWord(const std::string& word) {
        return trie->searchWord(word);
    }
    
    std::vector<std::string> searchPrefix(const std::string& prefix) {
        return trie->searchPrefix(prefix);
    }
};

// Global wrapper instance
TrieWrapper* g_trie = new TrieWrapper();

void InsertWord(const FunctionCallbackInfo<Value>& args) {
    Isolate* isolate = args.GetIsolate();
    
    if (args.Length() < 1 || !args[0]->IsString()) {
        isolate->ThrowException(Exception::TypeError(String::NewFromUtf8(isolate, "Expected a string argument")));
        return;
    }
    
    String::Utf8Value word(isolate, args[0]);
    g_trie->insertWord(std::string(*word));
    
    args.GetReturnValue().Set(Undefined(isolate));
}

void SearchWord(const FunctionCallbackInfo<Value>& args) {
    Isolate* isolate = args.GetIsolate();
    
    if (args.Length() < 1 || !args[0]->IsString()) {
        isolate->ThrowException(Exception::TypeError(String::NewFromUtf8(isolate, "Expected a string argument")));
        return;
    }
    
    String::Utf8Value word(isolate, args[0]);
    bool result = g_trie->searchWord(std::string(*word));
    
    args.GetReturnValue().Set(Boolean::New(isolate, result));
}

void SearchPrefix(const FunctionCallbackInfo<Value>& args) {
    Isolate* isolate = args.GetIsolate();
    
    if (args.Length() < 1 || !args[0]->IsString()) {
        isolate->ThrowException(Exception::TypeError(String::NewFromUtf8(isolate, "Expected a string argument")));
        return;
    }
    
    String::Utf8Value prefix(isolate, args[0]);
    std::vector<std::string> results = g_trie->searchPrefix(std::string(*prefix));
    
    Local<Array> result_array = Array::New(isolate, results.size());
    for (size_t i = 0; i < results.size(); i++) {
        result_array->Set(i, String::NewFromUtf8(isolate, results[i].c_str()));
    }
    
    args.GetReturnValue().Set(result_array);
}

void Initialize(Local<Object> exports) {
    NODE_SET_METHOD(exports, "insertWord", InsertWord);
    NODE_SET_METHOD(exports, "searchWord", SearchWord);
    NODE_SET_METHOD(exports, "searchPrefix", SearchPrefix);
}

NODE_MODULE(trie, Initialize)
