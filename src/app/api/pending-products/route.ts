import { supabase } from "@/lib/supabase";
import { sanitizeHttpUrl } from "@/lib/utils/url-sanitizer";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/api/auth";

// Validation schemas
const PendingProductRequestSchema = z
  .object({
    product_id: z.number().optional(),
    name: z.string().min(1),
    brand_name: z.string().min(1),
    category: z.enum([
      "protein",
      "pre-workout",
      "non-stim-pre-workout",
      "energy-drink",
      "bcaa",
      "eaa",
      "fat-burner",
      "appetite-suppressant",
      "creatine",
    ]),
    product_form: z
      .enum([
        "powder",
        "pill",
        "bar",
        "liquid",
        "capsule",
        "tablet",
        "drink",
        "energy_shot",
      ])
      .optional(),
    job_type: z.enum(["add", "update", "delete"]),
    flavor: z.string().optional(),
    year: z.string().optional(),
    image_url: z.string().url().optional(),
    description: z.string().optional(),
    servings_per_container: z
      .number()
      .positive()
      .max(1000000)
      .multipleOf(0.01)
      .optional(),
    price: z.number().positive(),
    serving_size_g: z.number().positive().max(100).multipleOf(0.01).optional(),
    max_serving_size: z
      .number()
      .positive()
      .max(100)
      .multipleOf(0.01)
      .optional(),
    transparency_score: z.number().min(0).max(100).default(0),
    confidence_level: z
      .enum(["verified", "likely", "estimated", "unknown"])
      .default("estimated"),
    // submitted_by removed - now obtained from verified JWT token
    notes: z.string().optional(),
  })
  .passthrough(); // Allow additional ingredient fields

const ProductApprovalRequestSchema = z.object({
  id: z.number(),
  status: z.enum(["approved", "rejected"]),
  reviewed_by: z.string().uuid(),
});

// Helper function to generate slug
function generateSlug(
  brandName: string,
  productName: string,
  year?: string,
): string {
  let combined = `${brandName} ${productName}`;
  if (year) {
    combined += ` ${year}`;
  }
  return combined
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// Helper function to parse year
function parseYear(yearStr?: string): number | null {
  if (!yearStr) return null;
  const year = parseInt(yearStr, 10);
  return isNaN(year) ? null : year;
}

// POST /api/pending-products - Submit product for approval
export async function POST(request: NextRequest) {
  try {
    // ✅ SECURE: Verify JWT token first
    const authResult = await requireAuth(request);

    if (authResult instanceof NextResponse) {
      return authResult; // Returns 401 if not authenticated
    }

    const { user } = authResult;

    const body = await request.json();
    const validatedData = PendingProductRequestSchema.parse(body);

    // Get user's reputation points and role from database
    // Use verified user.id from JWT token
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("reputation_points, role")
      .eq("id", user.id) // ← Use verified user ID from JWT
      .single();

    if (userError || !userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // ✅ SECURE: Use role from database (source of truth)
    const effectiveRole = userData.role;

    // Check if user can submit image URLs (1000+ points OR admin/owner/moderator)
    const canSubmitImageUrl =
      userData.reputation_points >= 1000 ||
      ["admin", "owner", "moderator"].includes(effectiveRole);

    // If image_url is provided but user doesn't have permission, reject
    if (validatedData.image_url && !canSubmitImageUrl) {
      return NextResponse.json(
        {
          error:
            "Image URL submission requires 1000+ reputation points or moderator/admin/owner role",
          required_points: 1000,
          current_points: userData.reputation_points,
          current_role: effectiveRole,
        },
        { status: 403 },
      );
    }

    // Sanitize optional image_url
    let safeImageUrl: string | null = null;
    if (validatedData.image_url) {
      safeImageUrl = sanitizeHttpUrl(validatedData.image_url);
      if (!safeImageUrl) {
        return NextResponse.json(
          {
            error:
              "Invalid image_url. Only http/https URLs to public hosts are allowed.",
          },
          { status: 400 },
        );
      }
    }

    // Get or create brand
    const { data: brandData, error: brandError } = await supabase
      .from("brands")
      .select("id")
      .eq("name", validatedData.brand_name)
      .single();

    let brandId: number;
    if (brandError || !brandData) {
      // Create new brand
      const { data: newBrand, error: createBrandError } = await supabase
        .from("brands")
        .insert({
          name: validatedData.brand_name,
          slug: validatedData.brand_name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, ""),
        })
        .select("id")
        .single();

      if (createBrandError || !newBrand) {
        return NextResponse.json(
          { error: "Failed to create brand" },
          { status: 500 },
        );
      }
      brandId = newBrand.id;
    } else {
      brandId = brandData.id;
    }

    // Insert pending product
    const { data: pendingProduct, error: insertError } = await supabase
      .from("pending_products")
      .insert({
        brand_id: brandId,
        category: validatedData.category,
        product_name: validatedData.name,
        slug: generateSlug(
          validatedData.brand_name,
          validatedData.name,
          validatedData.year,
        ),
        image_url: safeImageUrl,
        description: validatedData.description,
        price: validatedData.price,
        currency: "USD",
        servings_per_container: validatedData.servings_per_container,
        serving_size_g: validatedData.serving_size_g,
        dosage_rating: 0,
        danger_rating: 0,
        approval_status: 0, // 0 = pending
        submitted_by: user.id, // ✅ SECURE: Use verified user ID from JWT
      })
      .select(
        `
        *,
        brands:brand_id (
          id,
          name,
          slug,
          website
        )
      `,
      )
      .single();

    if (insertError) {
      return NextResponse.json(
        { error: "Failed to submit product for approval" },
        { status: 500 },
      );
    }

    // Insert category-specific details based on category
    await insertCategorySpecificDetails(
      pendingProduct.id,
      validatedData.category,
      validatedData,
    );

    return NextResponse.json(
      {
        message: "Product submitted for approval",
        product: pendingProduct,
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 },
      );
    }

    console.error("Error submitting pending product:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// GET /api/pending-products - Get pending products with filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);

    // Validate parameters
    if (page <= 0) {
      return NextResponse.json(
        { error: "Page must be greater than 0" },
        { status: 400 },
      );
    }

    if (limit <= 0 || limit > 100) {
      return NextResponse.json(
        { error: "Limit must be between 1 and 100" },
        { status: 400 },
      );
    }

    if (status && !["pending", "approved", "rejected"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status. Must be pending, approved, or rejected" },
        { status: 400 },
      );
    }

    const offset = (page - 1) * limit;

    // Build query
    let query = supabase.from("pending_products").select(
      `
        *,
        brands:brand_id (
          id,
          name,
          slug,
          website,
          product_count,
          created_at
        )
      `,
      { count: "exact" },
    );

    // Apply status filter
    if (status) {
      query = query.eq("status", status);
    }

    // Apply pagination
    query = query
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    const { data: products, error, count } = await query;

    if (error) {
      return NextResponse.json(
        { error: "Failed to fetch pending products" },
        { status: 500 },
      );
    }

    const totalPages = Math.ceil((count || 0) / limit);

    return NextResponse.json({
      products: products || [],
      total: count || 0,
      page,
      limit,
      total_pages: totalPages,
    });
  } catch (error) {
    console.error("Error fetching pending products:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// Helper function to insert category-specific details
async function insertCategorySpecificDetails(
  productId: number,
  category: string,
  formData: Record<string, any>,
) {
  const baseDetails: Record<string, any> = {
    pending_product_id: productId,
  };

  // Get category-specific ingredient fields from the config
  const { categoryIngredients } = require("@/lib/config/data/ingredients");
  const ingredientFields = categoryIngredients[category] || [];

  // Map form data to detail table fields
  ingredientFields.forEach((ingredient: any) => {
    const fieldName = ingredient.name;
    const formValue = formData[fieldName];

    // Skip if not provided
    if (formValue === undefined || formValue === null) return;

    // Convert to database value format
    if (
      formValue === 0 ||
      formValue === "0" ||
      formValue === "not_in_product"
    ) {
      baseDetails[fieldName] = 0; // Not in product
    } else if (
      formValue === -1 ||
      formValue === "-1" ||
      formValue === "not_specified"
    ) {
      baseDetails[fieldName] = -1; // Blend/unknown
    } else {
      // Parse numeric value
      const numValue =
        typeof formValue === "number" ? formValue : parseFloat(formValue);
      if (!isNaN(numValue)) {
        baseDetails[fieldName] = Math.round(numValue); // Round to integer for mg/mcg fields
      }
    }
  });

  // Handle category-specific fields that might not be in ingredientFields
  // Pre-workout specific
  if (category === "pre-workout") {
    if (formData.serving_scoops !== undefined) {
      baseDetails.serving_scoops = parseInt(formData.serving_scoops) || null;
    }
    if (formData.serving_g !== undefined) {
      baseDetails.serving_g = parseFloat(formData.serving_g) || null;
    }
  }

  // Non-stim pre-workout specific
  if (category === "non-stim-pre-workout") {
    if (formData.serving_scoops !== undefined) {
      baseDetails.serving_scoops = parseInt(formData.serving_scoops) || null;
    }
    if (formData.serving_g !== undefined) {
      baseDetails.serving_g = parseFloat(formData.serving_g) || null;
    }
  }

  // Energy drink specific
  if (category === "energy-drink") {
    if (formData.serving_size_fl_oz !== undefined) {
      baseDetails.serving_size_fl_oz =
        parseInt(formData.serving_size_fl_oz) || null;
    }
  }

  // Creatine specific
  if (category === "creatine") {
    baseDetails.creatine_type_name =
      formData.creatine_type_name || "Creatine Monohydrate";
    if (formData.serving_size_g !== undefined) {
      baseDetails.serving_size_g = parseFloat(formData.serving_size_g) || 0;
    }
    if (formData.servings_per_container !== undefined) {
      baseDetails.servings_per_container =
        parseInt(formData.servings_per_container) || 0;
    }
  }

  // Insert into appropriate table
  switch (category) {
    case "pre-workout":
      await supabase.from("preworkout_details").insert(baseDetails);
      break;
    case "non-stim-pre-workout":
      await supabase.from("non_stim_preworkout_details").insert(baseDetails);
      break;
    case "energy-drink":
      await supabase.from("energy_drink_details").insert(baseDetails);
      break;
    case "protein":
      await supabase.from("protein_details").insert(baseDetails);
      break;
    case "bcaa":
    case "eaa":
      await supabase.from("amino_acid_details").insert(baseDetails);
      break;
    case "fat-burner":
    case "appetite-suppressant":
      await supabase.from("fat_burner_details").insert(baseDetails);
      break;
    case "creatine":
      await supabase.from("creatine_details").insert(baseDetails);
      break;
    default:
      throw new Error(`Unsupported product category: ${category}`);
  }
}
