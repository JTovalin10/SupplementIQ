'use client';

import { useOwnerDashboard } from '@/lib/contexts/OwnerDashboardContext';
import { useRouter } from 'next/navigation';
import { useMemo } from 'react';

export default function ModerationDashboard() {
  const { pendingSubmissions, isLoading, error } = useOwnerDashboard();
  const router = useRouter();

  console.log('🔍 OwnerModeration state:', { isLoading, error, submissionsCount: pendingSubmissions.length });

  const handleReviewProduct = (submissionSlug: string) => {
    router.push(`/admin/products/${submissionSlug}`);
  };

  // Memoize the format date function
  const formatDate = useMemo(() => (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }, []);

  // Memoize the status badge component
  const getStatusBadge = useMemo(() => (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">Pending</span>;
      case 'approved':
        return <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Approved</span>;
      case 'rejected':
        return <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">Rejected</span>;
      default:
        return null;
    }
  }, []);

  // Show loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="px-6 py-4 border-b">
            <h3 className="text-lg font-semibold text-black">Pending Product Submissions</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="border rounded-lg p-4 animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
                  <div className="flex justify-between">
                    <div className="h-6 w-16 bg-gray-200 rounded"></div>
                    <div className="h-8 w-20 bg-gray-200 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="px-6 py-4 border-b">
            <h3 className="text-lg font-semibold text-black">Pending Product Submissions</h3>
          </div>
          <div className="p-6">
            <div className="text-center">
              <p className="text-red-600 mb-4">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 text-sm"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Memoize the submission list to prevent unnecessary re-renders
  const submissionList = useMemo(() => {
    if (pendingSubmissions.length === 0) {
      return (
        <div className="px-6 py-8 text-center">
          <p className="text-gray-500">No pending submissions</p>
        </div>
      );
    }
    
    return pendingSubmissions.map((submission) => (
      <div key={submission.id} className="px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-4">
              <div>
                <h4 className="text-sm font-medium text-black">{submission.productName}</h4>
                <p className="text-sm text-black">Brand: {submission.brandName}</p>
                <p className="text-sm text-black">Submitted by: {submission.submittedBy}</p>
              </div>
              <div className="text-sm text-black">
                <p>Category: {submission.category}</p>
                <p>{formatDate(submission.submittedAt)}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            {getStatusBadge(submission.status)}
            <div className="flex space-x-2">
              <button
                onClick={() => handleReviewProduct(submission.slug)}
                className="px-4 py-2 text-sm font-medium bg-blue-100 text-blue-800 rounded hover:bg-blue-200 transition-colors"
              >
                Review Product
              </button>
            </div>
          </div>
        </div>
      </div>
    ));
  }, [pendingSubmissions, formatDate, getStatusBadge]);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-semibold text-black">Pending Product Submissions</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {submissionList}
        </div>
      </div>
    </div>
  );
}
