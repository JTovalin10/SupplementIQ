"use client";

import { ArrowLeft, Calendar, Package, Star, User } from "lucide-react";
import { useRouter } from "next/navigation";

export interface ProductData {
  id: string;
  productName: string;
  brand: {
    id: number;
    name: string;
    website?: string;
  };
  category: string;
  description: string;
  imageUrl?: string;
  price?: number;
  currency?: string;
  servingsPerContainer?: number;
  servingSizeG?: number;
  dosageRating: number;
  dangerRating: number;
  submittedBy?: {
    id: string;
    username: string;
    email?: string;
  };
  submittedAt?: string;
  updatedAt?: string;
  approvalStatus?: number;
  reviewedBy?: string;
  reviewedAt?: string;
}

interface ProductDisplayProps {
  product: ProductData;
  mode: "review" | "product";
  showBackButton?: boolean;
  showSubmissionInfo?: boolean;
  className?: string;
}

export default function ProductDisplay({
  product,
  mode,
  showBackButton = true,
  showSubmissionInfo = true,
  className = "",
}: ProductDisplayProps) {
  const router = useRouter();

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 80) return "text-gray-700";
    if (rating >= 60) return "text-gray-600";
    return "text-gray-500";
  };

  const getRatingLabel = (rating: number) => {
    if (rating >= 80) return "Excellent";
    if (rating >= 60) return "Good";
    if (rating >= 40) return "Fair";
    return "Poor";
  };

  const getStatusBadge = () => {
    if (mode === "review") {
      return (
        <span className="px-3 py-1 text-sm font-medium bg-gray-100 text-gray-700 rounded-full">
          Pending Review
        </span>
      );
    }

    // For product mode, you might want to show different statuses
    return null;
  };

  return (
    <div className={`min-h-screen bg-gray-50 ${className}`}>
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              {showBackButton && (
                <>
                  <button
                    onClick={() => router.back()}
                    className="flex items-center text-gray-600 hover:text-gray-900"
                  >
                    <ArrowLeft className="h-5 w-5 mr-2" />
                    Back
                  </button>
                  <div className="h-6 w-px bg-gray-300"></div>
                </>
              )}
              <h1 className="text-xl font-semibold text-gray-900">
                {mode === "review" ? "Product Review" : "Product Details"}
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              {getStatusBadge()}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-8">
            {/* Left Column - Product Image */}
            <div className="space-y-4">
              <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                {product.imageUrl ? (
                  <img
                    src={product.imageUrl}
                    alt={product.productName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <Package className="h-24 w-24" />
                  </div>
                )}
              </div>
            </div>

            {/* Right Column - Product Details */}
            <div className="space-y-6">
              {/* Product Name and Brand */}
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {product.productName}
                </h1>
                <p className="text-lg text-gray-600 mb-4">
                  {product.brand.name}
                </p>
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded">
                    {product.category}
                  </span>
                </div>
              </div>

              {/* Description */}
              {product.description && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Description
                  </h3>
                  <p className="text-gray-600">{product.description}</p>
                </div>
              )}

              {/* Product Specifications */}
              <div className="grid grid-cols-2 gap-4">
                {product.servingsPerContainer && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-900">Servings</h4>
                    <p className="text-gray-600">
                      {product.servingsPerContainer} per container
                    </p>
                  </div>
                )}
                {product.servingSizeG && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-900">
                      Serving Size
                    </h4>
                    <p className="text-gray-600">{product.servingSizeG}g</p>
                  </div>
                )}
                {product.price && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-900">Price</h4>
                    <p className="text-gray-600">
                      {product.currency} {product.price.toFixed(2)}
                    </p>
                  </div>
                )}
                {product.price && product.servingsPerContainer && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-900">
                      Price per Scoop
                    </h4>
                    <p className="text-gray-600">
                      {product.currency}{" "}
                      {(product.price / product.servingsPerContainer).toFixed(
                        2,
                      )}
                    </p>
                  </div>
                )}
              </div>

              {/* Ratings */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Quality Ratings
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-gray-900">
                        Dosage Rating
                      </h4>
                      <div className="flex items-center">
                        <Star className="h-4 w-4 text-gray-500 mr-1" />
                        <span
                          className={`font-semibold ${getRatingColor(product.dosageRating)}`}
                        >
                          {product.dosageRating}/100
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600">
                      {getRatingLabel(product.dosageRating)}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-gray-900">
                        Danger Rating
                      </h4>
                      <div className="flex items-center">
                        <Star className="h-4 w-4 text-gray-500 mr-1" />
                        <span
                          className={`font-semibold ${getRatingColor(product.dangerRating)}`}
                        >
                          {product.dangerRating}/100
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600">
                      {getRatingLabel(product.dangerRating)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Submission Info - Only show in review mode or when explicitly requested */}
              {showSubmissionInfo &&
                (product.submittedBy || product.submittedAt) && (
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      {mode === "review"
                        ? "Submission Details"
                        : "Product Information"}
                    </h3>
                    <div className="space-y-3">
                      {product.submittedBy && (
                        <div className="flex items-center text-sm text-gray-600">
                          <User className="h-4 w-4 mr-2" />
                          <span>
                            {mode === "review" ? "Submitted by:" : "Added by:"}
                            <strong className="ml-1">
                              {product.submittedBy.username}
                            </strong>
                          </span>
                        </div>
                      )}
                      {product.submittedAt && (
                        <div className="flex items-center text-sm text-gray-600">
                          <Calendar className="h-4 w-4 mr-2" />
                          <span>
                            {mode === "review" ? "Submitted on:" : "Added on:"}
                            <strong className="ml-1">
                              {formatDate(product.submittedAt)}
                            </strong>
                          </span>
                        </div>
                      )}
                      {product.brand.website && (
                        <div className="flex items-center text-sm text-gray-600">
                          <span>Brand Website: </span>
                          <a
                            href={product.brand.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gray-700 hover:text-gray-900 ml-1"
                          >
                            {product.brand.website}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
