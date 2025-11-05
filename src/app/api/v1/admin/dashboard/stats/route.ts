import { createClient } from "@/lib/database/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get user from auth header for role checking (parallel with stats)
    const authHeader = request.headers.get("authorization");
    let userRole: string | null = null;

    const authPromise = authHeader
      ? (async () => {
          const token = authHeader.replace("Bearer ", "");
          const {
            data: { user: authUser },
            error: authError,
          } = await supabase.auth.getUser(token);
          if (!authError && authUser) {
            const { data: userProfile } = await supabase
              .from("users")
              .select("role")
              .eq("id", authUser.id)
              .single();
            return userProfile?.role || null;
          }
          return null;
        })()
      : Promise.resolve(null);

    // Fetch real stats from database in parallel
    const [
      usersResult,
      pendingSubmissionsResult,
      productsResult,
      recentActivityResult,
      resolvedUserRole,
    ] = await Promise.all([
      // Total users count
      supabase.from("users").select("id", { count: "exact", head: true }),

      // Pending submissions count
      supabase
        .from("temporary_products")
        .select("id", { count: "exact", head: true })
        .eq("approval_status", 0),

      // Total products count
      supabase.from("products").select("id", { count: "exact", head: true }),

      // Recent activity count (last 24 hours)
      supabase
        .from("temporary_products")
        .select("id", { count: "exact", head: true })
        .gte(
          "created_at",
          new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        ),

      authPromise,
    ]);

    const totalUsers = usersResult.count || 0;
    const pendingSubmissions = pendingSubmissionsResult.count || 0;
    const totalProducts = productsResult.count || 0;
    const recentActivity = recentActivityResult.count || 0;
    userRole = resolvedUserRole;

    const responseData =
      userRole === "owner"
        ? {
            success: true,
            data: {
              totalUsers,
              pendingSubmissions,
              pendingEdits: 0,
              totalProducts,
              recentActivity,
              systemHealth: 95.0,
              databaseSize: "Unknown",
              apiCalls: 0,
            },
          }
        : {
            success: true,
            data: {
              totalUsers,
              pendingSubmissions,
              pendingEdits: 0,
              totalProducts,
              recentActivity,
            },
          };

    // Cache for 30 seconds
    return NextResponse.json(responseData, {
      headers: {
        "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
      },
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard stats" },
      { status: 500 },
    );
  }
}
