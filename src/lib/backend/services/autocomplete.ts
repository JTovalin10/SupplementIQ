import { supabase } from "../supabase";

/**
 * Autocomplete service for providing search suggestions
 */
class AutocompleteService {
  /**
   * Search for brand suggestions (synchronous wrapper for compatibility)
   */
  searchBrands(query: string, limit: number = 25): any[] {
    // For now, return empty array - can be enhanced with in-memory cache
    // or made async if needed
    return [];
  }

  /**
   * Async version for async routes
   */
  async searchBrandsAsync(query: string, limit: number = 25): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from("brands")
        .select("id, name")
        .ilike("name", `%${query}%`)
        .limit(limit)
        .order("name", { ascending: true });

      if (error) {
        console.error("Error searching brands:", error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error("Autocomplete brands error:", error);
      return [];
    }
  }

  /**
   * Search for flavor suggestions
   */
  async searchFlavors(query: string, limit: number = 25): Promise<any[]> {
    try {
      // Assuming flavors might be in a flavors table or stored as a JSON array
      // For now, return empty array if flavors table doesn't exist
      // This can be customized based on your schema
      const { data, error } = await supabase
        .from("products")
        .select("flavors")
        .ilike("flavors", `%${query}%`)
        .limit(limit);

      if (error) {
        // If flavors column doesn't exist, return empty array
        return [];
      }

      // Extract unique flavors from products
      const flavorSet = new Set<string>();
      (data || []).forEach((product: any) => {
        if (product.flavors) {
          if (Array.isArray(product.flavors)) {
            product.flavors.forEach((flavor: string) => {
              if (flavor.toLowerCase().includes(query.toLowerCase())) {
                flavorSet.add(flavor);
              }
            });
          } else if (typeof product.flavors === "string") {
            if (product.flavors.toLowerCase().includes(query.toLowerCase())) {
              flavorSet.add(product.flavors);
            }
          }
        }
      });

      return Array.from(flavorSet)
        .slice(0, limit)
        .map((flavor) => ({ name: flavor }));
    } catch (error) {
      console.error("Autocomplete flavors error:", error);
      return [];
    }
  }

  /**
   * Search for product suggestions
   */
  async searchProducts(query: string, limit: number = 25): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, slug")
        .ilike("name", `%${query}%`)
        .limit(limit)
        .order("name", { ascending: true });

      if (error) {
        console.error("Error searching products:", error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error("Autocomplete products error:", error);
      return [];
    }
  }

  /**
   * Add a product to autocomplete index (placeholder - can be enhanced with in-memory cache or database)
   */
  addProduct(name: string): void {
    // TODO: Implement product indexing
    // For now, this is a no-op as autocomplete queries the database directly
    console.log("Product added to autocomplete index:", name);
  }
}

// Export singleton instance
export const autocompleteService = new AutocompleteService();
