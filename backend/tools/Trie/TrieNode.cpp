#include "TrieNode.h"

TrieNode::TrieNode() {
    isEndOfWord = false;
}

TrieNode::~TrieNode() {
    for (auto& pair : children) {
        if (pair.second != nullptr) {
            delete pair.second;
        }
    }
}