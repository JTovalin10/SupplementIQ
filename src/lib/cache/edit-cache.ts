"use client";

// Local storage key for caching user edits
const CACHE_KEY = "supplementiq_user_edits";

export interface CachedEdit {
  productId: string;
  fieldId: string;
  value: any;
  timestamp: number;
  confirmed: boolean;
}

export interface ProductEditCache {
  [productId: string]: {
    [fieldId: string]: CachedEdit;
  };
}

class EditCache {
  private cache: ProductEditCache = {};

  constructor() {
    this.loadFromStorage();
  }

  // Load cache from localStorage
  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(CACHE_KEY);
      if (stored) {
        this.cache = JSON.parse(stored);
      }
    } catch (error) {
      console.warn("Failed to load edit cache from localStorage:", error);
      this.cache = {};
    }
  }

  // Save cache to localStorage
  private saveToStorage(): void {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(this.cache));
    } catch (error) {
      console.warn("Failed to save edit cache to localStorage:", error);
    }
  }

  // Save an edit
  saveEdit(
    productId: string,
    fieldId: string,
    value: any,
    confirmed: boolean = false,
  ): void {
    if (!this.cache[productId]) {
      this.cache[productId] = {};
    }

    this.cache[productId][fieldId] = {
      productId,
      fieldId,
      value,
      timestamp: Date.now(),
      confirmed,
    };

    this.saveToStorage();
    console.log(
      `💾 Cached edit: ${productId}.${fieldId} = ${value} (confirmed: ${confirmed})`,
    );
  }

  // Get all edits for a product
  getProductEdits(productId: string): { [fieldId: string]: CachedEdit } {
    return this.cache[productId] || {};
  }

  // Get a specific edit
  getEdit(productId: string, fieldId: string): CachedEdit | null {
    return this.cache[productId]?.[fieldId] || null;
  }

  // Mark an edit as confirmed
  confirmEdit(productId: string, fieldId: string): void {
    if (this.cache[productId]?.[fieldId]) {
      this.cache[productId][fieldId].confirmed = true;
      this.cache[productId][fieldId].timestamp = Date.now();
      this.saveToStorage();
      console.log(`✅ Confirmed edit: ${productId}.${fieldId}`);
    }
  }

  // Clear all edits for a product (after successful approval)
  clearProductEdits(productId: string): void {
    if (this.cache[productId]) {
      delete this.cache[productId];
      this.saveToStorage();
      console.log(`🗑️ Cleared all edits for product: ${productId}`);
    }
  }

  // Clear all cached edits
  clearAllEdits(): void {
    this.cache = {};
    this.saveToStorage();
    console.log("🗑️ Cleared all cached edits");
  }

  // Get cache statistics
  getCacheStats(): { totalProducts: number; totalEdits: number } {
    const totalProducts = Object.keys(this.cache).length;
    const totalEdits = Object.values(this.cache).reduce(
      (sum, productEdits) => sum + Object.keys(productEdits).length,
      0,
    );
    return { totalProducts, totalEdits };
  }

  // Check if there are unsaved edits for a product
  hasUnsavedEdits(productId: string): boolean {
    return Object.keys(this.cache[productId] || {}).length > 0;
  }
}

// Export singleton instance
export const editCache = new EditCache();
