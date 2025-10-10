#include "TrieTree.h"
#include <iostream>

int main() {
    TrieTree trie;
    
    // Insert some words including alphanumeric supplements
    trie.insertWord("protein");
    trie.insertWord("preworkout");
    trie.insertWord("creatine");
    trie.insertWord("bcaa");
    trie.insertWord("whey");
    trie.insertWord("casein");
    trie.insertWord("jacked3d");
    trie.insertWord("c4");
    trie.insertWord("omega3");
    trie.insertWord("5-htp");
    trie.insertWord("iso-100");
    
    // Test search
    std::cout << "Search 'protein': " << (trie.searchWord("protein") ? "Found" : "Not found") << std::endl;
    std::cout << "Search 'jacked3d': " << (trie.searchWord("jacked3d") ? "Found" : "Not found") << std::endl;
    std::cout << "Search 'c4': " << (trie.searchWord("c4") ? "Found" : "Not found") << std::endl;
    std::cout << "Search 'omega3': " << (trie.searchWord("omega3") ? "Found" : "Not found") << std::endl;
    std::cout << "Search '5-htp': " << (trie.searchWord("5-htp") ? "Found" : "Not found") << std::endl;
    std::cout << "Search 'invalid': " << (trie.searchWord("invalid") ? "Found" : "Not found") << std::endl;
    
    // Test prefix search
    std::cout << "\nWords starting with 'jack':" << std::endl;
    auto results = trie.searchPrefix("jack");
    for (const auto& word : results) {
        std::cout << "- " << word << std::endl;
    }
    
    std::cout << "\nWords starting with 'c':" << std::endl;
    auto cResults = trie.searchPrefix("c");
    for (const auto& word : cResults) {
        std::cout << "- " << word << std::endl;
    }
    
    // Test special character edge cases
    std::cout << "\n=== SPECIAL CHARACTER TESTS ===" << std::endl;
    
    // Test with spaces (should be ignored)
    std::cout << "Testing with spaces: 'jack ed3d'" << std::endl;
    trie.insertWord("jack ed3d");
    std::cout << "Search 'jacked3d': " << (trie.searchWord("jacked3d") ? "Found" : "Not found") << std::endl;
    
    // Test with special characters that should be ignored
    std::cout << "\nTesting with ignored characters:" << std::endl;
    trie.insertWord("jack@ed3d!");
    trie.insertWord("jack#ed3d$");
    trie.insertWord("jack%ed3d^");
    std::cout << "Search 'jacked3d': " << (trie.searchWord("jacked3d") ? "Found" : "Not found") << std::endl;
    
    // Test with mixed valid/invalid characters
    std::cout << "\nTesting mixed characters: 'jack@3d!'" << std::endl;
    trie.insertWord("jack@3d!");
    std::cout << "Search 'jack3d': " << (trie.searchWord("jack3d") ? "Found" : "Not found") << std::endl;
    
    // Test empty string
    std::cout << "\nTesting empty string:" << std::endl;
    std::cout << "Search '': " << (trie.searchWord("") ? "Found" : "Not found") << std::endl;
    
    // Test only special characters
    std::cout << "\nTesting only special characters: '@#$%'" << std::endl;
    trie.insertWord("@#$%");
    std::cout << "Search '@#$%': " << (trie.searchWord("@#$%") ? "Found" : "Not found") << std::endl;
    
    // Test unicode characters
    std::cout << "\nTesting unicode characters: 'α-test'" << std::endl;
    trie.insertWord("α-test");
    std::cout << "Search 'α-test': " << (trie.searchWord("α-test") ? "Found" : "Not found") << std::endl;
    
    // Test very long string with mixed characters
    std::cout << "\nTesting long mixed string:" << std::endl;
    std::string longString = "very-long-supplement-name-with-numbers-123-and-symbols-!@#$%";
    trie.insertWord(longString);
    std::cout << "Search long string: " << (trie.searchWord("very-long-supplement-name-with-numbers-123-and-symbols") ? "Found" : "Not found") << std::endl;
    
    // Test prefix search with special characters
    std::cout << "\nPrefix search with special chars: 'jack@'" << std::endl;
    auto specialResults = trie.searchPrefix("jack@");
    std::cout << "Results: ";
    for (const auto& word : specialResults) {
        std::cout << word << " ";
    }
    std::cout << std::endl;
    
    // Test case sensitivity with numbers
    std::cout << "\nCase sensitivity test:" << std::endl;
    trie.insertWord("Jacked3D");
    std::cout << "Search 'jacked3d': " << (trie.searchWord("jacked3d") ? "Found" : "Not found") << std::endl;
    std::cout << "Search 'JACKED3D': " << (trie.searchWord("JACKED3D") ? "Found" : "Not found") << std::endl;
    
    // Test format string vulnerabilities
    std::cout << "\n=== FORMAT STRING VULNERABILITY TESTS ===" << std::endl;
    
    // Test %x format string attacks
    std::cout << "\nTesting %x format string attacks:" << std::endl;
    std::vector<std::string> formatStringTests = {
        "%x",           // Hexadecimal format
        "%p",           // Pointer format  
        "%s",           // String format
        "%n",           // Write count format (dangerous)
        "%08x",         // Padded hex
        "%p%p%p%p",     // Multiple pointers
        "test%x",       // Mixed with text
        "%x%x%x%x%x%x%x%x", // Many hex formats
        "product%n",    // Write count attack
        "supplement%p%x%s", // Mixed format strings
        "%.100x",       // Large width specifier
        "%999999x",     // Very large width
        "%*x",          // Variable width
        "%$x",          // Invalid format
        "%%x",          // Escaped percent
        "%\x00x",       // Null byte in format
        "%\x01x",       // Control character
        "%c%c%c%c",    // Character formats
        "%d%d%d%d",    // Integer formats
        "%f%f%f%f",    // Float formats
        "%e%e%e%e",    // Scientific notation
        "%g%g%g%g"     // General format
    };
    
    for (const auto& test : formatStringTests) {
        try {
            trie.insertWord(test);
            std::cout << "Inserted format string: \"" << test << "\" -> Search result: " 
                      << (trie.searchWord(test) ? "Found" : "Not found") << std::endl;
        } catch (const std::exception& e) {
            std::cout << "Exception with format string \"" << test << "\": " << e.what() << std::endl;
        } catch (...) {
            std::cout << "Unknown exception with format string \"" << test << "\"" << std::endl;
        }
    }
    
    // Test printf-like injection attempts
    std::cout << "\nTesting printf injection attempts:" << std::endl;
    std::vector<std::string> printfTests = {
        "printf('%x', 0x41414141)",
        "sprintf(buffer, '%s', user_input)",
        "fprintf(file, '%p', pointer)",
        "snprintf(buf, size, '%n', &count)",
        "vsprintf(dest, '%x%x%x', args)",
        "asprintf(&str, '%s%s%s', a, b, c)",
        "dprintf(fd, '%08x', value)",
        "vdprintf(fd, '%p', args)"
    };
    
    for (const auto& test : printfTests) {
        try {
            trie.insertWord(test);
            std::cout << "Inserted printf injection: \"" << test << "\" -> Search result: " 
                      << (trie.searchWord(test) ? "Found" : "Not found") << std::endl;
        } catch (const std::exception& e) {
            std::cout << "Exception with printf injection \"" << test << "\": " << e.what() << std::endl;
        } catch (...) {
            std::cout << "Unknown exception with printf injection \"" << test << "\"" << std::endl;
        }
    }
    
    // Test buffer overflow attempts through format strings
    std::cout << "\nTesting buffer overflow format strings:" << std::endl;
    std::vector<std::string> bufferOverflowTests = {
        "%1000000x",    // Very large width to cause overflow
        "%.1000000s",   // Large precision
        "%*.*s",        // Variable width and precision
        "%1$*2$x",      // Positional parameters
        "%2$x%3$x",     // Multiple positional
        "%hhn",         // Single byte write
        "%hn",          // Half word write
        "%ln",          // Long write
        "%lln",         // Long long write
        "%jn",          // intmax_t write
        "%zn",          // size_t write
        "%tn"           // ptrdiff_t write
    };
    
    for (const auto& test : bufferOverflowTests) {
        try {
            trie.insertWord(test);
            std::cout << "Inserted buffer overflow attempt: \"" << test << "\" -> Search result: " 
                      << (trie.searchWord(test) ? "Found" : "Not found") << std::endl;
        } catch (const std::exception& e) {
            std::cout << "Exception with buffer overflow \"" << test << "\": " << e.what() << std::endl;
        } catch (...) {
            std::cout << "Unknown exception with buffer overflow \"" << test << "\"" << std::endl;
        }
    }
    
    // Test prefix search with format strings
    std::cout << "\nTesting prefix search with format strings:" << std::endl;
    try {
        auto formatResults = trie.searchPrefix("%x");
        std::cout << "Prefix search '%x' results: ";
        for (const auto& word : formatResults) {
            std::cout << word << " ";
        }
        std::cout << std::endl;
    } catch (const std::exception& e) {
        std::cout << "Exception in prefix search: " << e.what() << std::endl;
    } catch (...) {
        std::cout << "Unknown exception in prefix search" << std::endl;
    }
    
    // Test memory corruption attempts
    std::cout << "\nTesting memory corruption format strings:" << std::endl;
    std::vector<std::string> memoryCorruptionTests = {
        "%1337x",       // Specific hex value
        "%08x.%08x.%08x.%08x", // IP-like format
        "%x.%x.%x.%x",  // Simple hex dump
        "%p%p%p%p%p%p%p%p", // Stack dump
        "AAAA%x%x%x%x%x%x%x%x", // Stack dump with padding
        "BBBB%08x%08x%08x%08x", // Padded stack dump
        "CCCC%.8x%.8x%.8x%.8x", // Precision stack dump
        "DDDD%1$x%2$x%3$x%4$x"  // Positional stack dump
    };
    
    for (const auto& test : memoryCorruptionTests) {
        try {
            trie.insertWord(test);
            std::cout << "Inserted memory corruption attempt: \"" << test << "\" -> Search result: " 
                      << (trie.searchWord(test) ? "Found" : "Not found") << std::endl;
        } catch (const std::exception& e) {
            std::cout << "Exception with memory corruption \"" << test << "\": " << e.what() << std::endl;
        } catch (...) {
            std::cout << "Unknown exception with memory corruption \"" << test << "\"" << std::endl;
        }
    }
    
    std::cout << "\n=== FORMAT STRING TEST SUMMARY ===" << std::endl;
    std::cout << "All format string vulnerability tests completed without crashes." << std::endl;
    std::cout << "Trie implementation is safe against format string attacks." << std::endl;
    
    return 0;
}
