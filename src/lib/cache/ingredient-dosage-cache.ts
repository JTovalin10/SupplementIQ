import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export interface CachedIngredientConfig {
  name: string;
  label: string;
  placeholder: string;
  unit: string;
  description: string;
  section: string;
  minDailyDosage: number;
  maxDailyDosage: number;
  dangerousDosage: number;
  dosageNotes: string;
  cautions: string;
  precaution_people: string[];
  dosage_citation: string;
  cautions_citation: string;
  loadingPhase?: {
    dosage: number;
    duration: number;
  };
}

export interface CachedCreatineType {
  type: string;
  minDailyDosage: number;
  maxDailyDosage: number;
  dangerousDosage: number;
  dosageNotes: string;
  cautions: string;
  precaution_people: string[];
  dosage_citation: string;
  cautions_citation: string;
  loadingPhase?: {
    dosage: number;
    duration: number;
  };
}

export interface IngredientCache {
  ingredients: Map<string, CachedIngredientConfig>;
  creatineTypes: Map<string, CachedCreatineType>;
  lastUpdated: Date;
  version: string;
}

class IngredientDosageCache {
  private cache: IngredientCache | null = null;
  private cacheVersion = "1.0.0";
  private readonly CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
  private isLoading = false; // Prevent multiple simultaneous loads

  /**
   * Get ingredient configuration from cache or database
   */
  async getIngredientConfig(
    ingredientName: string,
  ): Promise<CachedIngredientConfig | null> {
    await this.ensureCacheLoaded();

    if (!this.cache) {
      console.error("Failed to load ingredient cache");
      return null;
    }

    return this.cache.ingredients.get(ingredientName) || null;
  }

  /**
   * Get creatine type configuration from cache or database
   */
  async getCreatineTypeConfig(
    creatineType: string,
  ): Promise<CachedCreatineType | null> {
    await this.ensureCacheLoaded();

    if (!this.cache) {
      console.error("Failed to load ingredient cache");
      return null;
    }

    return this.cache.creatineTypes.get(creatineType) || null;
  }

  /**
   * Get cache status for debugging
   */
  getCacheStatus(): {
    isLoaded: boolean;
    lastUpdated?: Date;
    ingredientCount: number;
    creatineTypeCount: number;
  } {
    if (!this.cache) {
      return { isLoaded: false, ingredientCount: 0, creatineTypeCount: 0 };
    }

    return {
      isLoaded: true,
      lastUpdated: this.cache.lastUpdated,
      ingredientCount: this.cache.ingredients.size,
      creatineTypeCount: this.cache.creatineTypes.size,
    };
  }

  /**
   * Get all ingredient configurations for a category
   */
  async getIngredientConfigsForCategory(
    category: string,
    creatineType?: string,
  ): Promise<Map<string, CachedIngredientConfig>> {
    await this.ensureCacheLoaded();

    if (!this.cache) {
      console.error("Failed to load ingredient cache");
      return new Map();
    }

    console.log(
      "✅ Cache hit - using cached ingredient data for category:",
      category,
    );
    console.log(
      "Available ingredients:",
      Array.from(this.cache.ingredients.keys()),
    );

    const configs = new Map<string, CachedIngredientConfig>();

    // Add creatine supplements
    if (category === "creatine" || category === "pre-workout") {
      for (const [name, config] of this.cache.ingredients) {
        if (name.includes("creatine")) {
          console.log("✅ Found creatine ingredient in cache:", name);
          configs.set(name, config);
        }
      }
    }

    // Add amino acid supplements
    if (
      category === "bcaa" ||
      category === "eaa" ||
      category === "pre-workout"
    ) {
      for (const [name, config] of this.cache.ingredients) {
        if (
          name.includes("l_") ||
          name.includes("amino") ||
          name.includes("citrulline") ||
          name.includes("tyrosine")
        ) {
          configs.set(name, config);
        }
      }
    }

    // Add stimulant supplements
    if (
      category === "pre-workout" ||
      category === "energy-drink" ||
      category === "fat-burner"
    ) {
      for (const [name, config] of this.cache.ingredients) {
        if (
          name.includes("caffeine") ||
          name.includes("stimulant") ||
          name.includes("huperzine") ||
          name.includes("betaine")
        ) {
          configs.set(name, config);
        }
      }
    }

    return configs;
  }

  /**
   * Check if cache is valid and load if necessary
   */
  private async ensureCacheLoaded(): Promise<void> {
    const now = new Date();

    // Check if cache exists and is still valid
    if (
      this.cache &&
      now.getTime() - this.cache.lastUpdated.getTime() < this.CACHE_TTL
    ) {
      console.log("Cache hit - using existing data");
      return;
    }

    // Prevent multiple simultaneous loads
    if (this.isLoading) {
      console.log("Cache loading in progress, waiting...");
      // Wait for the current load to complete
      while (this.isLoading) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
      return;
    }

    console.log(
      "Cache miss - loading ingredient dosage cache from database...",
    );
    this.isLoading = true;
    try {
      await this.loadCacheFromDatabase();
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Load ingredient data from database into cache
   */
  private async loadCacheFromDatabase(): Promise<void> {
    try {
      console.log("🔄 Loading ingredient dosage configs from database...");
      // Load ingredient dosage configurations from database
      const { data: ingredientConfigs, error: ingredientError } = await supabase
        .from("ingredient_dosage_configs")
        .select("*");

      if (ingredientError) {
        console.error(
          "Error loading ingredient dosage configs:",
          ingredientError,
        );
        // Fallback to hardcoded data if database fails
        this.loadFallbackCache();
        return;
      }

      // Convert database data to cache format
      const ingredients = new Map<string, CachedIngredientConfig>();

      if (ingredientConfigs) {
        for (const config of ingredientConfigs) {
          // Map database ingredient names to expected field names
          let mappedName = config.ingredient_name
            .toLowerCase()
            .replace(/\s+/g, "_");
          if (mappedName === "creatine_monohydrate") {
            mappedName = "creatine_monohydrate_mg";
          }

          const cachedConfig: CachedIngredientConfig = {
            name: mappedName,
            label: config.ingredient_name,
            placeholder: config.min_daily_dosage?.toString() || "0",
            unit: config.dosage_unit,
            description: config.dosage_notes || "",
            section: config.category || "Other",
            minDailyDosage: config.min_daily_dosage || 0,
            maxDailyDosage: config.max_daily_dosage || 0,
            dangerousDosage: config.dangerous_dosage || 0,
            dosageNotes: config.dosage_notes || "",
            cautions: config.cautions || "",
            precaution_people: config.precaution_people || [],
            dosage_citation: config.dosage_citation || "",
            cautions_citation: config.cautions_citation || "",
          };

          ingredients.set(mappedName, cachedConfig);
        }
      }

      console.log("🔄 Loading creatine types from database...");
      // Load creatine types from database
      const { data: creatineTypes, error: creatineError } = await supabase
        .from("creatine_types")
        .select("*");

      const creatineTypeConfigs = new Map<string, CachedCreatineType>();

      if (creatineTypes && !creatineError) {
        for (const creatineType of creatineTypes) {
          // Find corresponding dosage config for this creatine type
          const dosageConfig = ingredientConfigs?.find((config) =>
            config.ingredient_name
              .toLowerCase()
              .includes(creatineType.name.toLowerCase()),
          );

          const cachedCreatineType: CachedCreatineType = {
            type: creatineType.name,
            minDailyDosage:
              dosageConfig?.min_daily_dosage ||
              creatineType.recommended_daily_dose_g * 1000 * 0.6, // 60% of recommended as min
            maxDailyDosage:
              dosageConfig?.max_daily_dosage ||
              creatineType.recommended_daily_dose_g * 1000, // Recommended as max
            dangerousDosage:
              dosageConfig?.dangerous_dosage ||
              creatineType.recommended_daily_dose_g * 1000 * 2, // 2x recommended as dangerous
            dosageNotes:
              dosageConfig?.dosage_notes ||
              `Standard dosing for ${creatineType.name}`,
            cautions: dosageConfig?.cautions || "Take with plenty of water",
            precaution_people: dosageConfig?.precaution_people || [
              "kidney disease",
              "diabetes",
            ],
            dosage_citation: dosageConfig?.dosage_citation || "",
            cautions_citation: dosageConfig?.cautions_citation || "",
          };

          creatineTypeConfigs.set(creatineType.name, cachedCreatineType);
        }
      }

      // Create cache object
      this.cache = {
        ingredients,
        creatineTypes: creatineTypeConfigs,
        lastUpdated: new Date(),
        version: this.cacheVersion,
      };

      console.log(
        `✅ Loaded ${ingredients.size} ingredients and ${creatineTypeConfigs.size} creatine types into cache`,
      );
    } catch (error) {
      console.error("Error loading cache from database:", error);
      this.loadFallbackCache();
    }
  }

  /**
   * Load fallback cache with hardcoded data if database fails
   */
  private loadFallbackCache(): void {
    console.log("Loading fallback ingredient cache...");

    const ingredients = new Map<string, CachedIngredientConfig>();
    const creatineTypes = new Map<string, CachedCreatineType>();

    // Add basic creatine monohydrate data
    const creatineMonohydrate: CachedIngredientConfig = {
      name: "creatine_monohydrate_mg",
      label: "Creatine Monohydrate",
      placeholder: "5000",
      unit: "mg",
      description:
        "Most researched form of creatine for muscle strength and power",
      section: "Creatine",
      minDailyDosage: 3000,
      maxDailyDosage: 5000,
      dangerousDosage: 10000,
      dosageNotes:
        "Most researched form. Loading phase: 20g/day for 5-7 days, then 3-5g maintenance.",
      cautions:
        "High doses (10g+) may cause GI distress, bloating, or cramping. Take with plenty of water.",
      precaution_people: [
        "kidney disease",
        "diabetes",
        "bipolar disorder",
        "taking medications that affect kidney function",
      ],
      dosage_citation: "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC2048496/",
      cautions_citation:
        "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC2048496/",
    };

    ingredients.set("creatine_monohydrate_mg", creatineMonohydrate);

    const creatineTypeConfig: CachedCreatineType = {
      type: "Creatine Monohydrate",
      minDailyDosage: 3000,
      maxDailyDosage: 5000,
      dangerousDosage: 10000,
      dosageNotes:
        "Most researched form. Loading phase: 20g/day for 5-7 days, then 3-5g maintenance.",
      cautions:
        "High doses (10g+) may cause GI distress, bloating, or cramping. Take with plenty of water.",
      precaution_people: [
        "kidney disease",
        "diabetes",
        "bipolar disorder",
        "taking medications that affect kidney function",
      ],
      dosage_citation: "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC2048496/",
      cautions_citation:
        "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC2048496/",
    };

    creatineTypes.set("Creatine Monohydrate", creatineTypeConfig);

    this.cache = {
      ingredients,
      creatineTypes,
      lastUpdated: new Date(),
      version: this.cacheVersion,
    };

    console.log("✅ Loaded fallback cache with basic creatine data");
  }

  /**
   * Force refresh the cache from database
   */
  async refreshCache(): Promise<void> {
    console.log("Force refreshing ingredient dosage cache...");
    this.cache = null;
    await this.loadCacheFromDatabase();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    isLoaded: boolean;
    ingredientCount: number;
    creatineTypeCount: number;
    lastUpdated: Date | null;
    version: string;
  } {
    return {
      isLoaded: !!this.cache,
      ingredientCount: this.cache?.ingredients.size || 0,
      creatineTypeCount: this.cache?.creatineTypes.size || 0,
      lastUpdated: this.cache?.lastUpdated || null,
      version: this.cacheVersion,
    };
  }

  /**
   * Check if a specific ingredient exists in cache
   */
  async hasIngredient(ingredientName: string): Promise<boolean> {
    await this.ensureCacheLoaded();
    return this.cache?.ingredients.has(ingredientName) || false;
  }

  /**
   * Check if a specific creatine type exists in cache
   */
  async hasCreatineType(creatineType: string): Promise<boolean> {
    await this.ensureCacheLoaded();
    return this.cache?.creatineTypes.has(creatineType) || false;
  }
}

// Export singleton instance
export const ingredientDosageCache = new IngredientDosageCache();

// Export the class for testing
export { IngredientDosageCache };
