// Product ingredients cache backed by native C++ (Node-API), seeded via API.
// Key: productId -> ingredients[] (lightweight shape for runtime lookups)

export interface ProductIngredientItem {
  id: number | string;
  name: string;
  amount?: number | null;
  unit?: string | null;
  type?: string | null;
}

interface NativeProductIngredientsAddon {
  setProductIngredients(productId: string, ingredientsJson: string): void;
  getProductIngredients(productId: string): string | null;
  removeProduct(productId: string): boolean;
  isEmpty(): boolean;
}

function loadNativeAddon(): NativeProductIngredientsAddon {
  // Fallback to in-memory implementation (works in browser and when C++ addon is unavailable)
  if (typeof window !== "undefined") {
    const map = new Map<string, string>();
    return {
      setProductIngredients(productId: string, ingredientsJson: string) {
        map.set(productId, ingredientsJson);
      },
      getProductIngredients(productId: string) {
        return map.get(productId) ?? null;
      },
      removeProduct(productId: string) {
        return map.delete(productId);
      },
      isEmpty() {
        return map.size === 0;
      },
    };
  }

  try {
    const dynamicRequire = eval("require") as NodeRequire;
    if (
      typeof dynamicRequire === "function" &&
      typeof process !== "undefined" &&
      process.versions?.node
    ) {
      try {
        return dynamicRequire(
          "./native/build/Release/product_cache_addon.node",
        ) as NativeProductIngredientsAddon;
      } catch {}
      try {
        const nodeGypBuild = dynamicRequire("node-gyp-build");
        return nodeGypBuild(
          __dirname + "/native",
        ) as NativeProductIngredientsAddon;
      } catch {}
    }
  } catch {}

  // Fallback: in-memory implementation (works in server when native is unavailable)
  const map = new Map<string, string>();
  return {
    setProductIngredients(productId: string, ingredientsJson: string) {
      map.set(productId, ingredientsJson);
    },
    getProductIngredients(productId: string) {
      return map.get(productId) ?? null;
    },
    removeProduct(productId: string) {
      return map.delete(productId);
    },
    isEmpty() {
      return map.size === 0;
    },
  };
}

const productCacheCPP: NativeProductIngredientsAddon = loadNativeAddon();

let hasAttemptedSeed = false;
let seedingPromise: Promise<void> | null = null;

async function ensureProductIngredientsSeeded(): Promise<void> {
  if (hasAttemptedSeed) return;
  if (!seedingPromise) {
    seedingPromise = (async () => {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "";
        const res = await fetch(`${baseUrl}/api/products/ingredients`, {
          cache: "no-store",
        });
        if (!res.ok) return;
        const json = await res.json();
        const items = (json?.items || []) as Array<{
          productId: string;
          ingredients: ProductIngredientItem[];
        }>;
        for (const { productId, ingredients } of items) {
          setProductIngredients(productId, ingredients);
        }
      } finally {
        hasAttemptedSeed = true;
      }
    })();
  }
  await seedingPromise;
}

export function setProductIngredients(
  productId: string,
  ingredients: ProductIngredientItem[],
): void {
  const payload = JSON.stringify(ingredients ?? []);
  productCacheCPP.setProductIngredients(productId, payload);
}

export function removeProduct(productId: string): boolean {
  return productCacheCPP.removeProduct(productId);
}

export async function getProductIngredients(
  productId: string,
): Promise<ProductIngredientItem[] | null> {
  if (productCacheCPP.isEmpty()) {
    await ensureProductIngredientsSeeded();
  }
  const json = productCacheCPP.getProductIngredients(productId);
  if (!json) return null;
  try {
    return JSON.parse(json) as ProductIngredientItem[];
  } catch {
    return null;
  }
}
