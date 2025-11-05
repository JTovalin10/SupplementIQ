"use client";

import ActionResultScreen from "@/components/common/ActionResultScreen";
import { editCache } from "@/lib/cache/edit-cache";
import { supabase } from "@/lib/database/supabase/client";
import { Check, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface ProductReviewActionsProps {
  productId: string;
  productName: string;
  confirmedFields?: Set<string>;
  totalFields?: number;
  className?: string;
  onReturn?: () => void;
  productData?: any; // The full product data from the initial API call
}

export default function ProductReviewActions({
  productId,
  productName,
  confirmedFields = new Set(),
  totalFields = 0,
  className = "",
  onReturn,
  productData,
}: ProductReviewActionsProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [action, setAction] = useState<"approve" | "deny" | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successAction, setSuccessAction] = useState<"approved" | "rejected">(
    "approved",
  );
  const [showRejectConfirm, setShowRejectConfirm] = useState(false);
  const [rejectConfirmText, setRejectConfirmText] = useState("");

  const handleApprove = async () => {
    console.log("🚀 Approve button clicked!");
    console.log(
      "📊 Confirmed fields:",
      confirmedFields.size,
      "Total fields:",
      totalFields,
    );
    console.log("✅ All fields confirmed:", allFieldsConfirmed);

    setIsLoading(true);
    setAction("approve");

    try {
      // Cache all confirmed edits before approval
      confirmedFields.forEach((fieldId) => {
        editCache.confirmEdit(productId, fieldId);
      });

      // Get the current session for API call
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();
      if (sessionError || !session) {
        throw new Error("No active session found. Please log in again.");
      }

      // Get edited fields from cache
      const editedFields = editCache.getProductEdits(productId);
      console.log("📝 Edited fields to send:", editedFields);
      console.log("📦 Product data being sent:", productData);

      // If productData doesn't exist, fetch it first
      let pendingProductData = productData;
      if (!pendingProductData) {
        console.log("⚠️ Product data not provided, fetching from API...");
        const {
          data: { session: fetchSession },
          error: fetchSessionError,
        } = await supabase.auth.getSession();
        if (!fetchSessionError && fetchSession) {
          const fetchResponse = await fetch(
            `/api/admin/products/${productId}`,
            {
              headers: {
                Authorization: `Bearer ${fetchSession.access_token}`,
              },
            },
          );
          if (fetchResponse.ok) {
            const fetchData = await fetchResponse.json();
            pendingProductData = fetchData.product;
            console.log("✅ Fetched product data:", pendingProductData);
          }
        }
      }

      // Transform the product data to match what the API expects
      // The API expects a pendingProduct object with fields like product_name, brand_id, etc.
      const pendingProduct = pendingProductData
        ? {
            id: pendingProductData.id,
            product_name: pendingProductData.productName,
            brand_id: pendingProductData.brand?.id,
            category: pendingProductData.category,
            slug: productId, // Use productId as slug
            image_url: pendingProductData.imageUrl,
            description: pendingProductData.description,
            servings_per_container: pendingProductData.servingsPerContainer,
            serving_size_g: pendingProductData.servingSizeG,
            dosage_rating: pendingProductData.dosageRating || 0,
            danger_rating: pendingProductData.dangerRating || 0,
            approval_status: pendingProductData.approvalStatus || 0,
            price: pendingProductData.price,
            currency: pendingProductData.currency,
            product_form: pendingProductData.productForm,
            min_serving_size: pendingProductData.minServingSize,
            max_serving_size: pendingProductData.maxServingSize,
          }
        : null;

      if (!pendingProduct) {
        throw new Error(
          "Product data not available. Please refresh the page and try again.",
        );
      }

      // Call the approval API with product data and edited fields
      console.log(
        "📡 Making POST request to:",
        `/api/admin/products/${productId}/approve`,
      );
      console.log(
        "📤 Sending pendingProduct:",
        JSON.stringify(pendingProduct, null, 2),
      );

      // Add timeout to prevent infinite loading
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.error("⏱️ Request timeout after 30 seconds");
        controller.abort();
      }, 30000); // 30 second timeout

      let response: Response;
      try {
        response = await fetch(`/api/admin/products/${productId}/approve`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            pendingProduct: pendingProduct,
            editedFields: editedFields,
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        console.log("📡 API response status:", response.status);
        console.log(
          "📡 API response headers:",
          Object.fromEntries(response.headers.entries()),
        );

        if (!response.ok) {
          let errorText = "";
          try {
            errorText = await response.text();
            console.error("❌ Error response body:", errorText);
            const errorData = JSON.parse(errorText);

            // If product already approved, handle it as success
            if (errorData.error?.includes("already approved")) {
              console.log("⚠️ Product already approved, redirecting...");
              setIsLoading(false);
              setAction(null);
              setTimeout(() => {
                router.push("/admin/owner");
              }, 1000);
              return;
            }

            throw new Error(
              `HTTP ${response.status}: ${errorData.error || errorData.details || response.statusText}`,
            );
          } catch (parseError) {
            throw new Error(
              `HTTP ${response.status}: ${errorText || response.statusText}`,
            );
          }
        }

        const result = await response.json();
        console.log("✅ Product approved successfully:", result);

        // If product was already approved, redirect immediately
        if (result.alreadyApproved) {
          console.log(
            "🔄 Product already approved, redirecting to admin page...",
          );
          setIsLoading(false);
          setAction(null);
          // Redirect to owner dashboard where submissions are shown
          setTimeout(() => {
            router.push("/admin/owner");
          }, 1000);
          return;
        }

        // Show success screen
        setSuccessAction("approved");
        setShowSuccess(true);
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        if (fetchError.name === "AbortError") {
          throw new Error(
            "Request timed out after 30 seconds. Please try again.",
          );
        }
        if (
          fetchError.message?.includes("Failed to fetch") ||
          fetchError.message?.includes("NetworkError")
        ) {
          throw new Error(
            "Network error. Please check your connection and try again.",
          );
        }
        throw fetchError;
      }
    } catch (error) {
      console.error("Error approving product:", error);
      alert(
        `Failed to approve product: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    } finally {
      setIsLoading(false);
      setAction(null);
    }
  };

  const handleDeny = () => {
    setShowRejectConfirm(true);
  };

  const handleConfirmReject = async () => {
    if (rejectConfirmText.toLowerCase() !== "confirm") {
      alert('Please type "confirm" to proceed with rejection');
      return;
    }

    setIsLoading(true);
    setAction("deny");
    setShowRejectConfirm(false);

    try {
      // TODO: Implement deny API call
      console.log("Product does not exist:", productId);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Show success screen
      setSuccessAction("rejected");
      setShowSuccess(true);
    } catch (error) {
      console.error("Error marking product as non-existent:", error);
      alert("Failed to mark product as non-existent. Please try again.");
    } finally {
      setIsLoading(false);
      setAction(null);
      setRejectConfirmText("");
    }
  };

  // Check if all fields are confirmed
  const allFieldsConfirmed =
    totalFields > 0 && confirmedFields.size >= totalFields;

  // Debug logging
  console.log("🔍 ProductReviewActions state:", {
    productId,
    productName,
    confirmedFields: Array.from(confirmedFields),
    totalFields,
    allFieldsConfirmed,
    isLoading,
    action,
  });

  // Show success screen
  if (showSuccess) {
    return (
      <ActionResultScreen
        productName={productName}
        action={successAction}
        onReturn={() => {
          // Clear cached edits after successful approval
          if (successAction === "approved") {
            editCache.clearProductEdits(productId);
          }
          if (onReturn) {
            onReturn();
          }
        }}
      />
    );
  }

  // Show loading screen
  if (isLoading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <h3 className="text-lg font-semibold text-gray-900">Review Actions</h3>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-blue-800 font-medium">
            {action === "approve"
              ? "Approving product..."
              : "Processing request..."}
          </p>
          <p className="text-blue-600 text-sm mt-2">
            Saving your changes and updating database
          </p>
        </div>
      </div>
    );
  }

  // Show rejection confirmation modal
  if (showRejectConfirm) {
    return (
      <div className={`space-y-4 ${className}`}>
        <h3 className="text-lg font-semibold text-gray-900">
          Confirm Rejection
        </h3>

        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <X className="h-5 w-5 text-red-600 mt-0.5" />
            <div>
              <h4 className="text-red-800 font-medium">
                Are you sure you want to reject this product?
              </h4>
              <p className="text-red-700 text-sm mt-1">
                This will mark "{productName}" as non-existent or having major
                issues. This action cannot be undone.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type <span className="font-bold text-red-600">"confirm"</span> to
              proceed:
            </label>
            <input
              type="text"
              value={rejectConfirmText}
              onChange={(e) => setRejectConfirmText(e.target.value)}
              placeholder="Type 'confirm' here"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
            />
          </div>

          <div className="flex space-x-3">
            <button
              onClick={handleConfirmReject}
              disabled={rejectConfirmText.toLowerCase() !== "confirm"}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium"
            >
              Confirm Rejection
            </button>
            <button
              onClick={() => {
                setShowRejectConfirm(false);
                setRejectConfirmText("");
              }}
              className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900">Review Actions</h3>

      <div className="space-y-3">
        {/* Approve Button */}
        <button
          onClick={() => {
            console.log(
              "🔘 Approve button clicked, disabled:",
              isLoading || !allFieldsConfirmed,
            );
            handleApprove();
          }}
          disabled={isLoading || !allFieldsConfirmed}
          className={`w-full px-4 py-3 text-white rounded-lg disabled:cursor-not-allowed flex items-center justify-center space-x-2 font-medium ${
            allFieldsConfirmed
              ? "bg-green-600 hover:bg-green-700"
              : "bg-gray-400 hover:bg-gray-500"
          }`}
        >
          <Check className="h-5 w-5" />
          <span>
            {isLoading && action === "approve"
              ? "Approving..."
              : "Approve Product"}
          </span>
        </button>

        {/* Product Doesn't Exist Button */}
        <button
          onClick={handleDeny}
          disabled={isLoading}
          className="w-full px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center space-x-2 font-medium"
        >
          <X className="h-5 w-5" />
          <span>
            {isLoading && action === "deny"
              ? "Processing..."
              : "Product Doesn't Exist"}
          </span>
        </button>
      </div>

      <div className="text-xs text-gray-500 space-y-1">
        <p>
          • <strong>Approve:</strong> Product will be published and visible to
          users (only available when all fields are confirmed)
        </p>
        <p>
          • <strong>Product Doesn't Exist:</strong> Mark this product as
          non-existent or having major issues
        </p>
        {!allFieldsConfirmed && (
          <p className="text-amber-600">
            • <strong>Note:</strong> Confirm all fields before approving (
            {confirmedFields.size}/{totalFields} confirmed)
          </p>
        )}
      </div>
    </div>
  );
}
