import { createClient } from "@/lib/database/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "10");

    // Create server-side Supabase client
    const supabase = await createClient();

    // Get the authorization header
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json(
        { error: "Authorization header required" },
        { status: 401 },
      );
    }

    const token = authHeader.replace("Bearer ", "");

    // Optimize: Parallel auth check and data fetch
    const [authResult, productsResult] = await Promise.all([
      // Verify token and get user role in parallel
      supabase.auth
        .getUser(token)
        .then(async ({ data: { user }, error: authError }) => {
          if (authError || !user) {
            return { error: "Invalid token" };
          }
          const { data: userProfile } = await supabase
            .from("users")
            .select("role")
            .eq("id", user.id)
            .single();
          return { userProfile, error: null };
        }),

      // Fetch recent products without joins (we'll fetch brand names separately)
      supabase
        .from("products")
        .select(
          `
          id,
          name,
          brand_id,
          category,
          created_at,
          updated_at
        `,
        )
        .order("updated_at", { ascending: false })
        .limit(limit),
    ]);

    // Check auth result
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    if (!authResult.userProfile) {
      return NextResponse.json(
        { error: "User profile not found" },
        { status: 404 },
      );
    }

    const allowedRoles = ["moderator", "admin", "owner"];
    if (!allowedRoles.includes(authResult.userProfile.role)) {
      return NextResponse.json(
        {
          error: `Insufficient permissions. Only ${allowedRoles.join(", ")} can access this data.`,
        },
        { status: 403 },
      );
    }

    if (productsResult.error) {
      console.error("Error fetching recent products:", productsResult.error);
      return NextResponse.json(
        { error: "Failed to fetch recent products" },
        { status: 500 },
      );
    }

    const products = productsResult.data || [];

    // Fetch brand names in parallel (only if we have products)
    let brandNames: Record<number, string> = {};
    if (products.length > 0) {
      const brandIds = [
        ...new Set(products.map((p: any) => p.brand_id).filter(Boolean)),
      ];
      if (brandIds.length > 0) {
        const { data: brands } = await supabase
          .from("brands")
          .select("id, name")
          .in("id", brandIds);

        if (brands) {
          brands.forEach((brand: any) => {
            brandNames[brand.id] = brand.name;
          });
        }
      }
    }

    // Format the data
    const formattedProducts = products.map((product: any) => ({
      id: product.id,
      name: product.name,
      brand: brandNames[product.brand_id] || "Unknown",
      category: product.category,
      submittedBy: "System",
      approvedBy: "System",
      createdAt: product.created_at,
      updatedAt: product.updated_at,
    }));

    return NextResponse.json(
      {
        products: formattedProducts,
        total: formattedProducts.length,
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
        },
      },
    );
  } catch (error) {
    console.error("Error in recent products API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
