import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  try {
    const { userId } = await params;

    // Create server-side Supabase client
    const supabase = await createClient();

    // Get the current user from the session
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the requesting user's role from the database
    const { data: requestingUserProfile, error: requestingUserError } =
      await supabase.from("users").select("role").eq("id", user.id).single();

    if (requestingUserError || !requestingUserProfile) {
      return NextResponse.json(
        { error: "Requesting user profile not found" },
        { status: 404 },
      );
    }

    // Check if the requesting user has admin/owner role
    if (!["admin", "owner"].includes(requestingUserProfile.role)) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 },
      );
    }

    // Check if the requesting user is accessing their own data or has admin/owner role
    if (user.id !== userId && requestingUserProfile.role !== "owner") {
      return NextResponse.json(
        { error: "Can only access your own dashboard data" },
        { status: 403 },
      );
    }

    // Get the target user's profile to verify they exist and have appropriate role
    const { data: targetUserProfile, error: targetUserError } = await supabase
      .from("users")
      .select("role")
      .eq("id", userId)
      .single();

    if (targetUserError || !targetUserProfile) {
      return NextResponse.json(
        { error: "Target user not found" },
        { status: 404 },
      );
    }

    // Check if target user has admin/owner role
    if (!["admin", "owner"].includes(targetUserProfile.role)) {
      return NextResponse.json(
        { error: "Target user does not have dashboard access" },
        { status: 403 },
      );
    }

    // Return mock recent activity data
    const recentActivity = [
      {
        id: "1",
        type: "submission",
        description:
          "New product submitted: Optimum Nutrition Gold Standard Whey",
        user: "fitness_enthusiast_99",
        timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      },
      {
        id: "2",
        type: "approval",
        description: "Approved product: Dymatize ISO100",
        user: "admin_user",
        timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
      },
    ];

    return NextResponse.json({
      success: true,
      data: recentActivity,
    });
  } catch (error) {
    console.error("Recent activity error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
