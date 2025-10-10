#include "TrieTree.h"
#include <iostream>

TrieTree::TrieTree() {
    root = new TrieNode();
}

TrieTree::~TrieTree() {
    delete root;
}

void TrieTree::insertWord(const std::string& word) {
    TrieNode* current = root;
    
    for (char c : word) {
        char normalizedC = c;
        
        // Convert letters to lowercase, keep numbers and special chars as-is
        if (isalpha(c)) {
            normalizedC = tolower(c);
        }
        
        // Support letters, numbers, and common supplement characters
        // Skip spaces and other problematic characters
        if (isalnum(c) || c == '-' || c == '.') {
            if (current->children.find(normalizedC) == current->children.end()) {
                current->children[normalizedC] = new TrieNode();
            }
            current = current->children[normalizedC];
        }
        // Skip spaces, special characters, and unicode for security
    }
    
    current->isEndOfWord = true;
}

bool TrieTree::searchWord(const std::string& word) {
    TrieNode* current = root;
    
    for (char c : word) {
        char normalizedC = c;
        
        // Convert letters to lowercase, keep numbers and special chars as-is
        if (isalpha(c)) {
            normalizedC = tolower(c);
        }
        
        // Support letters, numbers, and common supplement characters
        if (isalnum(c) || c == '-' || c == '.') {
            if (current->children.find(normalizedC) == current->children.end()) {
                return false;
            }
            current = current->children[normalizedC];
        }
        // Skip other special characters
    }
    
    return current->isEndOfWord;
}

std::vector<std::string> TrieTree::searchPrefix(const std::string& prefix) {
    std::vector<std::string> results;
    TrieNode* current = root;
    
    // Navigate to the prefix
    for (char c : prefix) {
        char normalizedC = c;
        
        // Convert letters to lowercase, keep numbers and special chars as-is
        if (isalpha(c)) {
            normalizedC = tolower(c);
        }
        
        // Support letters, numbers, and common supplement characters
        if (isalnum(c) || c == '-' || c == '.') {
            if (current->children.find(normalizedC) == current->children.end()) {
                return results; // Prefix doesn't exist
            }
            current = current->children[normalizedC];
        }
        // Skip other special characters
    }
    
    // Find all words with this prefix
    searchPrefixHelper(current, prefix, prefix, results);
    return results;
}

void TrieTree::searchPrefixHelper(TrieNode* node, std::string current, const std::string& prefix, std::vector<std::string>& results) {
    if (node->isEndOfWord) {
        results.push_back(current);
    }
    
    for (auto& pair : node->children) {
        if (pair.second != nullptr) {
            searchPrefixHelper(pair.second, current + pair.first, prefix, results);
        }
    }
}