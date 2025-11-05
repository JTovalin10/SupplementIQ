import { createClient } from "@/lib/database/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// GET /api/admin/dashboard/pending-submissions?page=1&limit=10
export async function GET(request: NextRequest) {
  try {
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
    const { searchParams } = new URL(request.url);
    const page = Math.max(parseInt(searchParams.get("page") || "1", 10), 1);
    const limit = Math.min(
      Math.max(parseInt(searchParams.get("limit") || "10", 10), 1),
      50,
    );
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    // Optimize: Parallel auth check and data fetch (no joins for speed)
    const [authResult, dataResult] = await Promise.all([
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

      // Fetch pending products without joins (we'll fetch user/brand names separately if needed)
      supabase
        .from("pending_products")
        .select(
          `
          id,
          slug,
          product_name,
          image_url,
          category,
          created_at,
          submitted_by,
          brand_id
        `,
          { count: "exact" },
        )
        .order("created_at", { ascending: false })
        .range(from, to),
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

    if (dataResult.error) {
      return NextResponse.json(
        { error: dataResult.error.message },
        { status: 500 },
      );
    }

    const pendingProducts = dataResult.data || [];

    // Fetch user and brand names in parallel (only if we have products)
    let userNames: Record<string, string> = {};
    let brandNames: Record<number, string> = {};

    if (pendingProducts.length > 0) {
      const userIds = [
        ...new Set(
          pendingProducts.map((p: any) => p.submitted_by).filter(Boolean),
        ),
      ];
      const brandIds = [
        ...new Set(pendingProducts.map((p: any) => p.brand_id).filter(Boolean)),
      ];

      const [usersResult, brandsResult] = await Promise.all([
        userIds.length > 0
          ? supabase.from("users").select("id, username").in("id", userIds)
          : Promise.resolve({ data: [], error: null }),
        brandIds.length > 0
          ? supabase.from("brands").select("id, name").in("id", brandIds)
          : Promise.resolve({ data: [], error: null }),
      ]);

      if (usersResult.data) {
        usersResult.data.forEach((user: any) => {
          userNames[user.id] = user.username;
        });
      }

      if (brandsResult.data) {
        brandsResult.data.forEach((brand: any) => {
          brandNames[brand.id] = brand.name;
        });
      }
    }

    // Map to submissions format
    const submissions = pendingProducts.map((row: any) => ({
      id: String(row.id),
      slug: row.slug as string,
      productName: row.product_name as string,
      brandName: brandNames[row.brand_id] ?? "Unknown",
      imageUrl: row.image_url as string | null,
      category: row.category as string,
      submittedBy: userNames[row.submitted_by] ?? "Unknown",
      submittedAt: row.created_at as string,
      status: "pending" as "pending",
    }));

    return NextResponse.json(
      {
        submissions,
        total: dataResult.count || submissions.length,
        page,
        limit,
        totalPages: Math.ceil((dataResult.count || submissions.length) / limit),
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=10, stale-while-revalidate=30",
        },
      },
    );
  } catch (e) {
    return NextResponse.json(
      { error: "Failed to fetch pending submissions" },
      { status: 500 },
    );
  }
}
