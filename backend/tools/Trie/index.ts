/**
 * Simple Trie implementation for autocomplete
 * TypeScript version of the C++ Trie
 */

export class TrieNode {
  children: Map<string, TrieNode> = new Map();
  isEndOfWord: boolean = false;
}

export class Trie {
  private root: TrieNode = new TrieNode();

  insertWord(word: string): void {
    let node = this.root;
    for (const char of word.toLowerCase()) {
      if (!node.children.has(char)) {
        node.children.set(char, new TrieNode());
      }
      node = node.children.get(char)!;
    }
    node.isEndOfWord = true;
  }

  insertWords(words: string[]): void {
    words.forEach(word => this.insertWord(word));
  }

  searchWord(word: string): boolean {
    let node = this.root;
    for (const char of word.toLowerCase()) {
      if (!node.children.has(char)) {
        return false;
      }
      node = node.children.get(char)!;
    }
    return node.isEndOfWord;
  }

  searchPrefix(prefix: string): string[] {
    let node = this.root;
    for (const char of prefix.toLowerCase()) {
      if (!node.children.has(char)) {
        return [];
      }
      node = node.children.get(char)!;
    }
    return this.getAllWordsFromNode(node, prefix);
  }

  getAllWords(): string[] {
    return this.getAllWordsFromNode(this.root, '');
  }

  private getAllWordsFromNode(node: TrieNode, prefix: string): string[] {
    const words: string[] = [];
    
    if (node.isEndOfWord) {
      words.push(prefix);
    }

    for (const [char, childNode] of node.children) {
      words.push(...this.getAllWordsFromNode(childNode, prefix + char));
    }

    return words;
  }
}
