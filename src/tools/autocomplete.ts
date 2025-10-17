class TrieNode {
    children: Map<string, TrieNode>;
    isEndOfWord: boolean;

    constructor() {
        this.children = new Map();
        this.isEndOfWord = false;
    }
}

class Trie {
    root: TrieNode;

    constructor() {
        this.root = new TrieNode();
    }

    insertWord(word: string): void {
        let curr: TrieNode = this.root;
        for (const char of word.toLowerCase()) {
            if (!curr.children.has(char)) {
                curr.children.set(char, new TrieNode());
            }
            curr = curr.children.get(char)!;
        }
        curr.isEndOfWord = true;
    }

    searchWord(word: string): boolean {
        let curr: TrieNode = this.root;
        for (const char of word.toLowerCase()) {
            if (!curr.children.has(char)) {
                return false;
            }
            curr = curr.children.get(char)!;
        }
        return curr.isEndOfWord;
    }

    searchPrefix(prefix: string): string[] {
        let curr: TrieNode = this.root;
        
        // Navigate to the prefix
        for (const char of prefix.toLowerCase()) {
            if (!curr.children.has(char)) {
                return []; // Prefix doesn't exist
            }
            curr = curr.children.get(char)!;
        }
        
        // Find all words with this prefix
        const results: string[] = [];
        this.dfs(curr, prefix.toLowerCase(), results);
        return results;
    }

    private dfs(node: TrieNode, current: string, results: string[]): void {
        if (node.isEndOfWord) {
            results.push(current);
        }
        
        for (const [char, childNode] of node.children) {
            this.dfs(childNode, current + char, results);
        }
    }

    // Insert multiple words at once
    insertWords(words: string[]): void {
        for (const word of words) {
            this.insertWord(word);
        }
    }

    // Get all words in the trie
    getAllWords(): string[] {
        const results: string[] = [];
        this.dfs(this.root, '', results);
        return results;
    }
}

// Export for use in other modules
export { Trie, TrieNode };

// Example usage
const trie = new Trie();

// Insert supplement-related words including alphanumeric product names
const supplementWords = [
    'protein', 'whey', 'casein', 'creatine', 'bcaa', 'eaa',
    'preworkout', 'fatburner', 'multivitamin', 'omega3',
    'magnesium', 'zinc', 'vitamin d', 'fish oil',
    // Alphanumeric product names
    'jacked3d', 'c4', 'pre-jym', 'alpha-gpc', 'l-arginine',
    '5-htp', 'd3', 'b12', 'k2', 'omega-3', 'omega-6',
    'n.o.-xplode', 'superpump250', 'jack3d', 'no-xplode',
    'cell-tech', 'nitro-tech', 'mass-tech', 'iso-100',
    'gold-standard', 'optimum-nutrition', 'muscle-tech'
];

trie.insertWords(supplementWords);

// Test the trie with alphanumeric searches
console.log('Search "jacked3d":', trie.searchWord('jacked3d'));
console.log('Search "c4":', trie.searchWord('c4'));
console.log('Search "omega3":', trie.searchWord('omega3'));
console.log('Words starting with "jack":', trie.searchPrefix('jack'));
console.log('Words starting with "c":', trie.searchPrefix('c'));
console.log('Words starting with "omega":', trie.searchPrefix('omega'));

// Test special character edge cases
console.log('\n=== SPECIAL CHARACTER TESTS ===');

// Test with spaces (should be ignored)
console.log('Testing with spaces: "jack ed3d"');
trie.insertWord('jack ed3d');
console.log('Search "jacked3d":', trie.searchWord('jacked3d'));

// Test with special characters that should be ignored
console.log('\nTesting with ignored characters:');
trie.insertWord('jack@ed3d!');
trie.insertWord('jack#ed3d$');
trie.insertWord('jack%ed3d^');
console.log('Search "jacked3d":', trie.searchWord('jacked3d'));

// Test with mixed valid/invalid characters
console.log('\nTesting mixed characters: "jack@3d!"');
trie.insertWord('jack@3d!');
console.log('Search "jack3d":', trie.searchWord('jack3d'));

// Test empty string
console.log('\nTesting empty string:');
console.log('Search "":', trie.searchWord(''));

// Test only special characters
console.log('\nTesting only special characters: "@#$%"');
trie.insertWord('@#$%');
console.log('Search "@#$%":', trie.searchWord('@#$%'));

// Test unicode characters
console.log('\nTesting unicode characters: "α-test"');
trie.insertWord('α-test');
console.log('Search "α-test":', trie.searchWord('α-test'));

// Test very long string with mixed characters
console.log('\nTesting long mixed string:');
const longString = 'very-long-supplement-name-with-numbers-123-and-symbols-!@#$%';
trie.insertWord(longString);
console.log('Search long string:', trie.searchWord('very-long-supplement-name-with-numbers-123-and-symbols'));

// Test prefix search with special characters
console.log('\nPrefix search with special chars: "jack@"');
const specialResults = trie.searchPrefix('jack@');
console.log('Results:', specialResults);

// Test case sensitivity with numbers
console.log('\nCase sensitivity test:');
trie.insertWord('Jacked3D');
console.log('Search "jacked3d":', trie.searchWord('jacked3d'));
console.log('Search "JACKED3D":', trie.searchWord('JACKED3D'));

// Test SQL injection attempts
console.log('\n=== SECURITY TESTS ===');
console.log('Testing SQL injection attempts:');
trie.insertWord("'; DROP TABLE products; --");
trie.insertWord("1' OR '1'='1");
trie.insertWord('<script>alert("xss")</script>');
console.log('Search "DROP TABLE":', trie.searchWord("'; DROP TABLE products; --"));
console.log('Search "1 OR 1=1":', trie.searchWord("1' OR '1'='1"));
console.log('Search "script":', trie.searchWord('<script>alert("xss")</script>'));

// Test XSS attempts
console.log('\nTesting XSS attempts:');
trie.insertWord('<img src=x onerror=alert(1)>');
trie.insertWord('javascript:alert(1)');
console.log('Search "img src":', trie.searchWord('<img src=x onerror=alert(1)>'));
console.log('Search "javascript":', trie.searchWord('javascript:alert(1)'));

// Test path traversal attempts
console.log('\nTesting path traversal:');
trie.insertWord('../../../etc/passwd');
trie.insertWord('..\\..\\..\\windows\\system32');
console.log('Search "etc passwd":', trie.searchWord('../../../etc/passwd'));
console.log('Search "windows system32":', trie.searchWord('..\\..\\..\\windows\\system32'));

console.log('\nAll words:', trie.getAllWords());