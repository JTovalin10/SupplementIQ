import { verifyModeratorPermissions } from "@/lib/auth/permissions";
import { createClient } from "@/lib/database/supabase/server";
import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/admin/reject-submission
 * Reject a pending product submission
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { submissionId, adminId, rejectionReason, adminNotes } = body;

    // Validate input
    if (!submissionId || !adminId) {
      return NextResponse.json(
        { error: "Missing required fields: submissionId and adminId" },
        { status: 400 },
      );
    }

    if (!rejectionReason) {
      return NextResponse.json(
        { error: "Rejection reason is required" },
        { status: 400 },
      );
    }

    // Verify admin permissions first
    const permissionCheck = await verifyModeratorPermissions(adminId);
    if (!permissionCheck.success) {
      return NextResponse.json(
        { error: permissionCheck.error },
        { status: permissionCheck.error?.includes("not found") ? 404 : 403 },
      );
    }

    // Get the temporary product
    const { data: tempProduct, error: fetchError } = await supabase
      .from("temporary_products")
      .select("*")
      .eq("id", submissionId)
      .eq("approval_status", 0) // Only pending submissions
      .single();

    if (fetchError || !tempProduct) {
      return NextResponse.json(
        { error: "Submission not found or already processed" },
        { status: 404 },
      );
    }

    // Update the temporary product status to rejected
    const { error: updateError } = await supabase
      .from("temporary_products")
      .update({
        approval_status: -1, // Rejected
        reviewed_by: adminId,
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", submissionId);

    if (updateError) {
      console.error("Error updating temporary product:", updateError);
      return NextResponse.json(
        { error: "Failed to reject submission" },
        { status: 500 },
      );
    }

    // TODO: Send notification email to submitter about rejection
    // This would require implementing an email service

    return NextResponse.json({
      success: true,
      message: "Product rejected and removed from pending list",
      data: {
        tempProductId: submissionId,
        productName: tempProduct.name,
        rejectionReason,
      },
    });
  } catch (error) {
    console.error("Rejection error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
