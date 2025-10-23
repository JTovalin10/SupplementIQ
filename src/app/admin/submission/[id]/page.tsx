'use client';

import SubmissionAction from '@/components/admin/SubmissionAction';
import ProductDisplay from '@/components/product/ProductDisplay';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface SubmissionDetails {
  id: number;
  productName: string;
  slug: string;
  category: string;
  description: string;
  imageUrl: string | null;
  price: number;
  servingsPerContainer: number | null;
  servingSizeG: number | null;
  dosageRating: number;
  dangerRating: number;
  approvalStatus: number;
  communityRating: number;
  totalReviews: number;
  submittedBy: {
    id: string;
    username: string;
    email: string;
    role: string;
  };
  brand: {
    id: number;
    name: string;
    slug: string;
    website: string | null;
    productCount: number;
  };
  categoryDetails: any;
  createdAt: string;
  updatedAt: string;
  reviewedBy: string | null;
  reviewedAt: string | null;
}

export default function SubmissionReviewPage() {
  const params = useParams();
  const router = useRouter();
  const [submission, setSubmission] = useState<SubmissionDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingImageUrl, setEditingImageUrl] = useState(false);
  const [imageUrl, setImageUrl] = useState('');

  useEffect(() => {
    const fetchSubmission = async () => {
      try {
        const response = await fetch(`/api/admin/submission/${params.id}`);
        const result = await response.json();

        if (result.success) {
          setSubmission(result.data);
          setImageUrl(result.data.imageUrl || '');
        } else {
          setError(result.error);
        }
      } catch (err) {
        setError('Failed to fetch submission details');
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchSubmission();
    }
  }, [params.id]);

  const handleSuccess = () => {
    router.push('/admin/owner');
  };

  const handleIngredientRating = (ingredient: string, value: string | number) => {
    // TODO: Implement ingredient update API call
    console.log(`Updating ${ingredient}: ${value}`);
  };

  const handleImageUrlUpdate = async (newImageUrl: string) => {
    try {
      const response = await fetch(`/api/admin/submission/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ imageUrl: newImageUrl }),
      });

      if (response.ok) {
        // Update local state
        setSubmission(prev => prev ? { ...prev, imageUrl: newImageUrl } : null);
        setImageUrl(newImageUrl);
      } else {
        console.error('Failed to update image URL');
      }
    } catch (error) {
      console.error('Error updating image URL:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading submission details...</p>
        </div>
      </div>
    );
  }

  if (error || !submission) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{error || 'Submission not found'}</p>
          <button
            onClick={() => router.push('/admin/owner')}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const renderCategoryDetails = () => {
    if (!submission.categoryDetails) return null;

    const details = submission.categoryDetails;
    const entries = Object.entries(details).filter(([key, value]) => 
      value !== null && value !== undefined && value !== '' && 
      !key.startsWith('lab_verified_') && 
      !['id', 'product_id', 'temp_product_id'].includes(key)
    );

    if (entries.length === 0) return null;

    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Product Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {entries.map(([key, value]) => (
            <div key={key} className="flex justify-between">
              <span className="text-sm font-medium text-gray-600 capitalize">
                {key.replace(/_/g, ' ')}
              </span>
              <span className="text-sm text-gray-900">
                {Array.isArray(value) ? value.join(', ') : String(value)}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/admin/owner')}
                className="p-2 text-gray-400 hover:text-gray-600"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Review Submission</h1>
                <p className="text-gray-600 mt-1">Review product submission details</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                submission.approvalStatus === 0 
                  ? 'bg-yellow-100 text-yellow-800' 
                  : submission.approvalStatus === 1 
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                {submission.approvalStatus === 0 ? 'Pending' : 
                 submission.approvalStatus === 1 ? 'Approved' : 'Rejected'}
              </span>
              
              {submission.approvalStatus === 0 && (
                <SubmissionAction
                  submissionId={submission.id.toString()}
                  productName={submission.productName}
                  adminId="current-admin-id" // This should come from auth context
                  onSuccess={handleSuccess}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Product Preview */}
      <div className="bg-gray-50">
        <ProductDisplay 
          product={{
            id: submission.id.toString(),
            name: submission.productName,
            brand: {
              name: submission.brand.name,
              website: submission.brand.website
            },
            category: submission.category,
            description: submission.description,
            imageUrl: submission.imageUrl,
            price: submission.price,
            servingsPerContainer: submission.servingsPerContainer,
            servingSizeG: submission.servingSizeG,
            dosageRating: submission.dosageRating,
            dangerRating: submission.dangerRating,
            communityRating: submission.communityRating,
            totalReviews: submission.totalReviews,
            categoryDetails: submission.categoryDetails
          }}
          isAdminReview={true}
          onIngredientRating={handleIngredientRating}
          onImageUrlUpdate={handleImageUrlUpdate}
        />
      </div>

      {/* Admin Review Sidebar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content - Image URL Editor */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image URL Editor */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Product Image</h3>
              <div className="space-y-4">
                {submission.imageUrl && (
                  <div className="flex items-center space-x-4">
                    <img
                      src={submission.imageUrl}
                      alt={submission.productName}
                      className="w-24 h-24 object-cover rounded-lg border"
                    />
                    <div>
                      <p className="text-sm text-gray-600">Current Image URL:</p>
                      <p className="text-sm font-mono text-gray-800 break-all">{submission.imageUrl}</p>
                    </div>
                  </div>
                )}
                <div className="space-y-2">
                  <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-700">
                    Update Image URL
                  </label>
                  <input
                    type="url"
                    id="imageUrl"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="https://example.com/product-image.jpg"
                  />
                  <button
                    onClick={() => {
                      // TODO: Implement image URL update API call
                      console.log('Update image URL:', imageUrl);
                    }}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Update Image
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Submission Info */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Submission Info</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-600">Submitted by</span>
                  <span className="text-sm text-gray-900">{submission.submittedBy.username}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-600">User role</span>
                  <span className="text-sm text-gray-900 capitalize">{submission.submittedBy.role}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-600">Submitted</span>
                  <span className="text-sm text-gray-900">
                    {new Date(submission.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-600">Last updated</span>
                  <span className="text-sm text-gray-900">
                    {new Date(submission.updatedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Ratings */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Ratings</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-600">Dosage Rating</span>
                  <span className="text-sm text-gray-900">{submission.dosageRating}/100</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-600">Danger Rating</span>
                  <span className="text-sm text-gray-900">{submission.dangerRating}/100</span>
                </div>
              </div>
            </div>

            {/* Brand Info */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Brand Information</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-600">Brand</span>
                  <span className="text-sm text-gray-900">{submission.brand.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-600">Products</span>
                  <span className="text-sm text-gray-900">{submission.brand.productCount}</span>
                </div>
                {submission.brand.website && (
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-600">Website</span>
                    <a
                      href={submission.brand.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      Visit
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
