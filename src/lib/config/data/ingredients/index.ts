// Main ingredients configuration - organized by category
export { aminoAcidSupplements } from "./amino-acids";
export { basicInfoIngredients } from "./basic-info";
export { creatineSupplements } from "./creatine";
export { creatineTypeDosages, getCreatineTypeDosage } from "./creatine-dosages";
export {
  calculateDosageRating,
  calculateProductDosageRating,
} from "./dosage-calculator";
export { stimulantSupplements } from "./stimulants";
export type {
  CategoryIngredients,
  CategorySupplements,
  DosageRating,
  IngredientField,
  SupplementInfo,
} from "./types";

// Legacy support - keeping the old structure for backward compatibility
import { basicInfoIngredients } from "./basic-info";
import { CategoryIngredients, IngredientField } from "./types";

export const categoryIngredients: CategoryIngredients = {
  protein: [
    ...basicInfoIngredients.filter((ing) =>
      [
        "serving_size_g",
        "servings_per_container",
        "price",
        "calories",
        "sugar_g",
        "total_carbohydrate_g",
        "fat_g",
        "saturated_fat_g",
        "fiber_g",
        "sodium_mg",
        "cholesterol_mg",
      ].includes(ing.name),
    ),
    // Add protein-specific ingredients here
  ],
  "pre-workout": [
    ...basicInfoIngredients.filter((ing) =>
      [
        "calories",
        "serving_g",
        "serving_scoops",
        "sugar_g",
        "total_carbohydrate_g",
        "servings_per_container",
        "price",
      ].includes(ing.name),
    ),
    // Add pre-workout specific ingredients here
  ],
  "non-stim-pre-workout": [
    ...basicInfoIngredients.filter((ing) =>
      [
        "calories",
        "serving_g",
        "serving_scoops",
        "sugar_g",
        "total_carbohydrate_g",
        "servings_per_container",
        "price",
      ].includes(ing.name),
    ),
    // Add non-stim pre-workout specific ingredients here
  ],
  "energy-drink": [
    ...basicInfoIngredients.filter((ing) =>
      ["serving_size_fl_oz", "servings_per_container", "price"].includes(
        ing.name,
      ),
    ),
    // Add energy drink specific ingredients here
  ],
  bcaa: [
    ...basicInfoIngredients.filter((ing) =>
      ["serving_size_g", "servings_per_container", "price"].includes(ing.name),
    ),
    // Add BCAA specific ingredients here
  ],
  eaa: [
    ...basicInfoIngredients.filter((ing) =>
      ["serving_size_g", "servings_per_container", "price"].includes(ing.name),
    ),
    // Add EAA specific ingredients here
  ],
  "fat-burner": [
    ...basicInfoIngredients.filter((ing) =>
      ["serving_size_g", "servings_per_container", "price"].includes(ing.name),
    ),
    // Add fat burner specific ingredients here
  ],
  "appetite-suppressant": [
    ...basicInfoIngredients.filter((ing) =>
      ["serving_size_g", "servings_per_container", "price"].includes(ing.name),
    ),
    // Add appetite suppressant specific ingredients here
  ],
  creatine: [
    // Creatine-specific ingredients will be handled by creatineSupplements
  ],
};

// Helper function to get ingredient by name
export function getIngredientByName(name: string): IngredientField | undefined {
  for (const category of Object.values(categoryIngredients)) {
    const ingredient = category.find((ing) => ing.name === name);
    if (ingredient) return ingredient;
  }
  return undefined;
}

// Creatine types for dropdown (legacy support)
export const creatineTypes = [
  { value: "Creatine Monohydrate", label: "Creatine Monohydrate" },
  { value: "Creatine Anhydrous", label: "Creatine Anhydrous" },
  { value: "Creatine Phosphate", label: "Creatine Phosphate" },
  { value: "Free Acid Creatine", label: "Free Acid Creatine" },
  { value: "Creatine Hydrochloride", label: "Creatine Hydrochloride" },
  { value: "Creatine Citrate", label: "Creatine Citrate" },
  { value: "Creatine Malate", label: "Creatine Malate" },
  { value: "Creatine Pyruvate", label: "Creatine Pyruvate" },
  { value: "Creatine Nitrate", label: "Creatine Nitrate" },
  { value: "Creatine Gluconate", label: "Creatine Gluconate" },
  { value: "Creatine Orotate", label: "Creatine Orotate" },
  {
    value: "Creatine Alpha-Ketoglutarate",
    label: "Creatine Alpha-Ketoglutarate",
  },
  { value: "Creatine Taurinate", label: "Creatine Taurinate" },
  { value: "Creatine Ethyl Ester", label: "Creatine Ethyl Ester" },
  {
    value: "Creatine Ethyl Ester Malate",
    label: "Creatine Ethyl Ester Malate",
  },
  { value: "Creatine Magnesium Chelate", label: "Creatine Magnesium Chelate" },
  {
    value: "Micronized Creatine Monohydrate",
    label: "Micronized Creatine Monohydrate",
  },
  { value: "Buffered Creatine", label: "Buffered Creatine" },
  { value: "Crea-Trona", label: "Crea-Trona" },
  { value: "Effervescent Creatine", label: "Effervescent Creatine" },
  { value: "Liquid Creatine", label: "Liquid Creatine" },
  { value: "Creatinol-O-Phosphate", label: "Creatinol-O-Phosphate" },
  { value: "Creapure", label: "Creapure" },
];

// Additional ingredients that can be added to any category
export const additionalIngredients: IngredientField[] = [
  {
    name: "bioperine_mg",
    label: "Bioperine",
    placeholder: "5",
    unit: "mg",
    description: "Black pepper extract for absorption enhancement",
  },
  {
    name: "lecithin_mg",
    label: "Lecithin",
    placeholder: "100",
    unit: "mg",
    description: "Lecithin for emulsification and absorption",
  },
  {
    name: "silica_mg",
    label: "Silica",
    placeholder: "10",
    unit: "mg",
    description: "Silica as anti-caking agent",
  },
];
