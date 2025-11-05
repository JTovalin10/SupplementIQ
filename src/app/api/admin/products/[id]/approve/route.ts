import { createClient } from "@/lib/database/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// POST /api/admin/products/[id]/approve - Approve a pending product and move it to production
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  console.log("🚀 Approval route called");
  try {
    const supabase = await createClient();
    const { id: productSlug } = await params;
    console.log("📦 Product slug:", productSlug);

    if (!productSlug || productSlug === "undefined") {
      return NextResponse.json(
        { error: "Invalid product slug" },
        { status: 400 },
      );
    }

    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json(
        { error: "Authorization header required" },
        { status: 401 },
      );
    }

    const token = authHeader.replace("Bearer ", "");

    // Verify the token and get user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // Get user profile to check role
    const { data: userProfile, error: profileError } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError || !userProfile) {
      return NextResponse.json(
        { error: "User profile not found" },
        { status: 404 },
      );
    }

    // Check if user has moderator+ permissions
    const allowedRoles = ["moderator", "admin", "owner"];
    if (!allowedRoles.includes(userProfile.role)) {
      return NextResponse.json(
        {
          error: `Insufficient permissions. Only ${allowedRoles.join(", ")} can approve products.`,
        },
        { status: 403 },
      );
    }

    // Get product data from request body (sent from frontend to avoid double DB calls)
    console.log("📥 Reading request body...");
    const body = await request.json();
    console.log("📦 Request body received:", {
      hasPendingProduct: !!body.pendingProduct,
      hasEditedFields: !!body.editedFields,
    });
    const { pendingProduct, editedFields } = body;

    if (!pendingProduct) {
      console.error("❌ No pendingProduct in request body");
      return NextResponse.json(
        { error: "Product data not provided" },
        { status: 400 },
      );
    }

    console.log("✅ Pending product received:", {
      id: pendingProduct.id,
      product_name: pendingProduct.product_name,
      brand_id: pendingProduct.brand_id,
      category: pendingProduct.category,
    });

    // Note: If product is already approved, it should already be deleted from pending_products
    // If it still exists here, it means it's still pending, so proceed with approval

    // Apply any edited fields to the pending product first
    if (editedFields && Object.keys(editedFields).length > 0) {
      console.log("📝 Applying edited fields:", editedFields);

      // Update pending product with edited fields
      const { error: updatePendingError } = await supabase
        .from("pending_products")
        .update(editedFields)
        .eq("id", pendingProduct.id);

      if (updatePendingError) {
        console.error(
          "Error updating pending product with edits:",
          updatePendingError,
        );
        return NextResponse.json(
          { error: "Failed to apply edits" },
          { status: 500 },
        );
      }

      // Update the pending product object with edited fields for consistency
      Object.assign(pendingProduct, editedFields);
    }

    // CRITICAL: Create a NEW product in the products table
    console.log("📝 Inserting product into products table...");
    const insertData = {
      brand_id: pendingProduct.brand_id,
      category: pendingProduct.category,
      name: pendingProduct.product_name,
      slug: pendingProduct.slug,
      image_url: pendingProduct.image_url,
      description: pendingProduct.description,
      servings_per_container: pendingProduct.servings_per_container,
      serving_size_g: pendingProduct.serving_size_g,
      dosage_rating: pendingProduct.dosage_rating || 0,
      danger_rating: pendingProduct.danger_rating || 0,
    };
    console.log("📤 Insert data:", insertData);

    const { data: newProduct, error: insertError } = await supabase
      .from("products")
      .insert(insertData)
      .select()
      .single();

    if (insertError) {
      console.error(
        "❌ Error creating product in products table:",
        insertError,
      );
      return NextResponse.json(
        {
          error: "Failed to create product in products table",
          details: insertError.message,
        },
        { status: 500 },
      );
    }

    console.log("✅ Created product in products table with ID:", newProduct.id);

    // Now update the details table to point to the NEW product ID
    // Only update if details table exists for this category (non-blocking)
    const detailsTableName = `${pendingProduct.category.replace("-", "_")}_details`;
    console.log("📝 Updating details table:", detailsTableName);

    const { error: updateDetailsError } = await supabase
      .from(detailsTableName)
      .update({
        product_id: newProduct.id, // Use the NEW product ID from products table
        pending_product_id: null,
      })
      .eq("pending_product_id", pendingProduct.id);

    if (updateDetailsError) {
      console.error("Error updating product details:", updateDetailsError);
      // Don't fail the request if details update fails - product is already created
      console.warn(
        "⚠️ Details update failed, but product was created successfully",
      );
    } else {
      console.log("✅ Updated product details successfully");
    }

    // Delete from pending_products after successful approval to save space
    // This is CRITICAL - must delete to prevent showing in pending list
    const pendingProductId =
      typeof pendingProduct.id === "string"
        ? parseInt(pendingProduct.id, 10)
        : pendingProduct.id;
    console.log(
      "🗑️ Deleting pending product with ID:",
      pendingProductId,
      "Type:",
      typeof pendingProductId,
      "Original:",
      pendingProduct.id,
    );
    const { error: deleteError, data: deleteData } = await supabase
      .from("pending_products")
      .delete()
      .eq("id", pendingProductId)
      .select();

    if (deleteError) {
      console.error("❌ Error deleting pending product:", deleteError);
      console.error(
        "❌ Delete error details:",
        JSON.stringify(deleteError, null, 2),
      );
      // Fail the request if deletion fails - this is critical
      return NextResponse.json(
        {
          error: "Failed to delete pending product",
          details: deleteError.message,
        },
        { status: 500 },
      );
    }

    console.log(
      "✅ Deleted pending product from pending_products table, deleted rows:",
      deleteData?.length || 0,
    );

    // Verify deletion worked
    const { data: verifyDeleted } = await supabase
      .from("pending_products")
      .select("id")
      .eq("id", pendingProductId)
      .single();

    if (verifyDeleted) {
      console.error(
        "❌ WARNING: Product still exists in pending_products after deletion!",
      );
      return NextResponse.json(
        {
          error: "Failed to verify deletion of pending product",
          details: "Product still exists in database",
        },
        { status: 500 },
      );
    }

    console.log(
      "✅ Verified: Product successfully deleted from pending_products",
    );

    // Update brand product count (non-blocking)
    if (pendingProduct.brand_id) {
      (async () => {
        try {
          await supabase.rpc("increment_brand_product_count", {
            brand_id: pendingProduct.brand_id,
          });
        } catch (err) {
          console.warn("Failed to increment brand count (non-critical):", err);
        }
      })();
    }

    console.log("✅ Approval process completed successfully");
    const response = NextResponse.json({
      success: true,
      message: "Product approved and moved to production",
      data: {
        productId: newProduct.id, // Use the NEW product ID
        productName: pendingProduct.product_name,
        slug: pendingProduct.slug,
      },
    });
    console.log("📤 Sending success response");
    return response;
  } catch (error: any) {
    console.error("❌ Error approving product:", error);
    console.error("❌ Error stack:", error?.stack);
    console.error("❌ Error message:", error?.message);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error?.message || "Unknown error",
      },
      { status: 500 },
    );
  }
}
