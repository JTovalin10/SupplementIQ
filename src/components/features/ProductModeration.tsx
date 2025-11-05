"use client";

import { Badge } from "@/components/ui/badge";
import Button from "@/components/ui/button";
import Card from "@/components/ui/card";
import Textarea from "@/components/ui/textarea";
import {
  CheckCircle,
  Clock,
  Eye,
  FileText,
  Shield,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";

interface UserRole {
  role:
    | "newcomer"
    | "contributor"
    | "trusted_editor"
    | "moderator"
    | "admin"
    | "owner";
  contributions: number;
  permissions: {
    canViewPending: boolean;
    canApproveSubmissions: boolean;
    canApproveEdits: boolean;
    canBanUsers: boolean;
    canRequestDeletion: boolean;
    canDeleteDirectly: boolean;
  };
}

interface ProductSubmission {
  id: string;
  productDetails: any;
  submittedBy: string;
  submittedAt: string;
  status: "pending" | "approved" | "rejected";
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNotes?: string;
}

interface ProductEdit {
  id: string;
  productId: string;
  editDetails: any;
  editedBy: string;
  editedAt: string;
  status: "pending" | "approved" | "rejected";
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNotes?: string;
  originalData?: any;
}

export default function ProductModeration() {
  const [activeTab, setActiveTab] = useState<"submissions" | "edits">(
    "submissions",
  );
  const [submissions, setSubmissions] = useState<ProductSubmission[]>([]);
  const [edits, setEdits] = useState<ProductEdit[]>([]);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [reviewNotes, setReviewNotes] = useState("");

  useEffect(() => {
    fetchPendingItems();
    fetchUserRole();
  }, []);

  const fetchPendingItems = async () => {
    try {
      const response = await fetch("/api/v1/admin/products/pending", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      const data = await response.json();

      if (data.success) {
        setSubmissions(data.data.submissions);
        setEdits(data.data.edits);
        setUserRole(data.data.userRole);
      }
    } catch (error) {
      console.error("Failed to fetch pending items:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserRole = async () => {
    // This would typically come from the user context or auth
    // For now, we'll simulate it
    setUserRole({
      role: "moderator",
      contributions: 1250,
      permissions: {
        canViewPending: true,
        canApproveSubmissions: true,
        canApproveEdits: true,
        canBanUsers: false,
        canRequestDeletion: false,
        canDeleteDirectly: false,
      },
    });
  };

  const handleApproval = async (
    type: "submission" | "edit",
    id: string,
    action: "approve" | "reject",
  ) => {
    try {
      const endpoint =
        type === "submission"
          ? `/api/v1/admin/products/submissions/${id}/${action}`
          : `/api/v1/admin/products/edits/${id}/${action}`;

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ reviewNotes }),
      });

      const data = await response.json();

      if (data.success) {
        setReviewNotes("");
        setSelectedItem(null);
        fetchPendingItems(); // Refresh the list
      }
    } catch (error) {
      console.error(`Failed to ${action} ${type}:`, error);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "newcomer":
        return "bg-gray-100 text-gray-800";
      case "contributor":
        return "bg-blue-100 text-blue-800";
      case "trusted_editor":
        return "bg-green-100 text-green-800";
      case "moderator":
        return "bg-purple-100 text-purple-800";
      case "admin":
        return "bg-orange-100 text-orange-800";
      case "owner":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "approved":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!userRole?.permissions.canViewPending) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Access Denied
          </h3>
          <p className="text-gray-600">
            You need Trusted Editor role or higher to view pending products.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Product Moderation
          </h2>
          <p className="text-gray-600">
            Review and approve product submissions and edits
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <Badge className={getRoleBadgeColor(userRole.role)}>
            {userRole.role.replace("_", " ").toUpperCase()}
          </Badge>
          <span className="text-sm text-gray-600">
            {userRole.contributions} contributions
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab("submissions")}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "submissions"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            New Submissions ({submissions.length})
          </button>
          <button
            onClick={() => setActiveTab("edits")}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "edits"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Product Edits ({edits.length})
          </button>
        </nav>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* List */}
        <div className="space-y-4">
          {(activeTab === "submissions" ? submissions : edits).map((item) => (
            <Card
              key={item.id}
              className={`p-4 cursor-pointer transition-colors ${
                selectedItem?.id === item.id
                  ? "ring-2 ring-blue-500"
                  : "hover:bg-gray-50"
              }`}
              onClick={() => setSelectedItem(item)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <Badge className={getStatusBadgeColor(item.status)}>
                      {item.status}
                    </Badge>
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-600">
                      {new Date(
                        activeTab === "submissions"
                          ? item.submittedAt
                          : item.editedAt,
                      ).toLocaleDateString()}
                    </span>
                  </div>
                  <h4 className="font-medium text-gray-900 mb-1">
                    {activeTab === "submissions"
                      ? item.productDetails?.name || "New Product"
                      : `Edit: ${item.productId}`}
                  </h4>
                  <p className="text-sm text-gray-600">
                    By:{" "}
                    {activeTab === "submissions"
                      ? item.submittedBy
                      : item.editedBy}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedItem(item);
                    }}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Details */}
        <div>
          {selectedItem ? (
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {activeTab === "submissions"
                    ? "Product Submission"
                    : "Product Edit"}
                </h3>
                <Badge className={getStatusBadgeColor(selectedItem.status)}>
                  {selectedItem.status}
                </Badge>
              </div>

              {/* Product Details */}
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Product Name
                  </label>
                  <p className="text-sm text-gray-900">
                    {activeTab === "submissions"
                      ? selectedItem.productDetails?.name || "N/A"
                      : selectedItem.editDetails?.name || "N/A"}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <p className="text-sm text-gray-900">
                    {activeTab === "submissions"
                      ? selectedItem.productDetails?.description ||
                        "No description"
                      : selectedItem.editDetails?.description ||
                        "No description"}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <p className="text-sm text-gray-900">
                    {activeTab === "submissions"
                      ? selectedItem.productDetails?.category || "N/A"
                      : selectedItem.editDetails?.category || "N/A"}
                  </p>
                </div>

                {activeTab === "edits" && selectedItem.originalData && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Original Data
                    </label>
                    <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
                      {JSON.stringify(selectedItem.originalData, null, 2)}
                    </pre>
                  </div>
                )}
              </div>

              {/* Review Notes */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Review Notes
                </label>
                <Textarea
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Add notes about your review decision..."
                  rows={3}
                />
              </div>

              {/* Actions */}
              <div className="flex space-x-3">
                <Button
                  onClick={() =>
                    handleApproval(
                      activeTab === "submissions" ? "submission" : "edit",
                      selectedItem.id,
                      "approve",
                    )
                  }
                  disabled={!userRole?.permissions.canApproveSubmissions}
                  className="flex items-center space-x-2"
                >
                  <CheckCircle className="h-4 w-4" />
                  <span>Approve</span>
                </Button>
                <Button
                  variant="danger"
                  onClick={() =>
                    handleApproval(
                      activeTab === "submissions" ? "submission" : "edit",
                      selectedItem.id,
                      "reject",
                    )
                  }
                  disabled={!userRole?.permissions.canApproveSubmissions}
                  className="flex items-center space-x-2"
                >
                  <XCircle className="h-4 w-4" />
                  <span>Reject</span>
                </Button>
              </div>
            </Card>
          ) : (
            <Card className="p-6">
              <div className="text-center text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Select an item to review</p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
