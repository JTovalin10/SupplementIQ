#pragma once
#include "TrieNode.h"
#include <vector>
#include <string>

class TrieTree {
private:
    TrieNode* root;
    
public:
    TrieTree();
    ~TrieTree();
    
    void insertWord(const std::string& word);
    bool searchWord(const std::string& word);
    std::vector<std::string> searchPrefix(const std::string& prefix);
    
private:
    void searchPrefixHelper(TrieNode* node, std::string current, const std::string& prefix, std::vector<std::string>& results);
};
