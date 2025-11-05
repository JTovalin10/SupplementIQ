import { calculateEnhancedDosageRating } from "@/lib/config/data/ingredients/enhanced-dosage-calculator";
import { createClient } from "@/lib/database/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { fetchProductDetails } from "./product_details/index";

// GET /api/products/[slug] - Get approved product information for public display
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const supabase = await createClient();
    const { slug: identifier } = await params;

    // Check if identifier is a slug (string) or ID (number)
    const productIdInt = parseInt(identifier, 10);
    const isSlug = isNaN(productIdInt);

    let query = supabase.from("products").select(`
        *,
        brands:brand_id (
          id,
          name,
          website
        )
      `);

    // Use slug or ID based on what was provided
    if (isSlug) {
      query = query.eq("slug", identifier);
    } else {
      query = query.eq("id", productIdInt);
    }

    const { data: product, error } = await query.single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Fetch dosage details based on category using modular handlers
    const dosageDetails = await fetchProductDetails(
      supabase,
      product.category,
      product.id,
    );

    // Calculate enhanced dosage analysis if dosage details exist
    let dosageAnalysis = null;
    if (
      dosageDetails &&
      product.servings_per_container &&
      product.serving_size_g
    ) {
      try {
        // Extract ingredient data from dosage details
        const ingredients: Record<string, number> = {};
        Object.entries(dosageDetails).forEach(([key, value]) => {
          // Skip non-ingredient fields
          if (
            key === "id" ||
            key === "product_id" ||
            key === "pending_product_id" ||
            key === "creatine_type_name" ||
            key === "flavors" ||
            key === "serving_size_g" ||
            key === "servings_per_container" ||
            key.startsWith("lab_verified_") ||
            key.startsWith("creatine_types")
          ) {
            return;
          }

          if (
            typeof value === "number" &&
            value > 0 &&
            (key.includes("_mg") ||
              key.includes("_g") ||
              key === "creatine_dosage_mg")
          ) {
            // Map database field names to ingredient names
            let ingredientName = key;
            if (
              key === "creatine_dosage_mg" ||
              key === "creatine_monohydrate_mg"
            ) {
              ingredientName = "creatine_monohydrate_mg";
            }
            ingredients[ingredientName] = value;
          }
        });

        console.log(
          "📊 Extracted ingredients for dosage analysis:",
          ingredients,
        );
        console.log("📊 Dosage details keys:", Object.keys(dosageDetails));

        if (Object.keys(ingredients).length > 0) {
          dosageAnalysis = await calculateEnhancedDosageRating({
            category: product.category,
            servingsPerContainer: product.servings_per_container,
            servingSizeG: product.serving_size_g,
            price: null, // Not needed for public view
            currency: "USD",
            creatineType: dosageDetails.creatine_type_name || undefined,
            ingredients: ingredients,
          });
          console.log(
            "✅ Dosage analysis calculated:",
            dosageAnalysis ? "Success" : "Failed",
          );
        } else {
          console.warn("⚠️ No ingredients extracted from dosage details");
        }
      } catch (calcError) {
        console.error("Error calculating dosage analysis:", calcError);
      }
    }

    // Format the response
    const formattedProduct = {
      id: product.id.toString(),
      slug: product.slug,
      productName: product.name,
      brand: {
        id: product.brands?.id,
        name: product.brands?.name || "Unknown",
        website: product.brands?.website,
      },
      category: product.category,
      description: product.description || "No description available",
      imageUrl: product.image_url,
      servingsPerContainer: product.servings_per_container,
      servingSizeG: product.serving_size_g,
      dosageRating: product.dosage_rating || 0,
      dangerRating: product.danger_rating || 0,
      communityRating: product.community_rating,
      totalReviews: product.total_reviews,
      dosageDetails: dosageDetails,
      dosageAnalysis: dosageAnalysis, // Add calculated dosage analysis
      updatedAt: product.updated_at,
      createdAt: product.created_at,
    };

    return NextResponse.json({ product: formattedProduct });
  } catch (error) {
    console.error("Error fetching product details:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
