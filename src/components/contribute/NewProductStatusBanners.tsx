'use client';

import { useAuth } from '@/lib/contexts';

interface SubmittedProduct {
  name: string;
  brand: string;
  submittedDirectly: boolean;
}

interface NewProductStatusBannersProps {
  submitStatus: 'idle' | 'success' | 'error';
  isSubmitting: boolean;
  submitError: string;
  submittedProduct: SubmittedProduct | null;
  onDismissStatus: () => void;
  showDebugBanner?: boolean;
}

export default function NewProductStatusBanners({
  submitStatus,
  isSubmitting,
  submitError,
  submittedProduct,
  onDismissStatus,
  showDebugBanner = false
}: NewProductStatusBannersProps) {
  const { user } = useAuth();

  return (
    <>
      {/* Debug Status Banner */}
      {showDebugBanner && (
        <div className="mb-4 p-3 bg-yellow-100 border border-yellow-300 rounded-lg">
          <div className="text-sm text-yellow-800">
            <strong>Debug Status:</strong> submitStatus = "{submitStatus}", isSubmitting = {isSubmitting.toString()}
            {submittedProduct && (
              <div className="mt-1">
                <strong>Submitted Product:</strong> {submittedProduct.name} by {submittedProduct.brand} 
                (Direct: {submittedProduct.submittedDirectly ? 'Yes' : 'No'})
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Success Banner */}
      {submitStatus === 'success' && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-lg font-bold text-green-800">
                🎉 PRODUCT SUBMITTED SUCCESSFULLY! 🎉
              </h3>
              <div className="mt-2 text-sm text-green-700">
                <p className="text-base font-semibold">
                  Your product "{submittedProduct?.name || 'Unknown'}" by {submittedProduct?.brand || 'Unknown'} has been submitted successfully.
                </p>
                {submittedProduct?.submittedDirectly ? (
                  <div className="mt-3 p-3 bg-green-100 rounded-lg">
                    <p className="font-bold text-green-800 text-lg">✅ PRODUCT ADDED DIRECTLY TO DATABASE!</p>
                    <p className="mt-2">
                      <strong>What happened:</strong> Your product has been added directly to our main database because you have sufficient reputation points (1000+) or moderator privileges.
                    </p>
                    <p className="mt-2">
                      <strong>Next steps:</strong> Your product is now LIVE and visible to all users. You can find it in our product listings.
                    </p>
                  </div>
                ) : (
                  <div className="mt-3 p-3 bg-blue-100 rounded-lg">
                    <p className="font-bold text-blue-800 text-lg">📋 PRODUCT ADDED TO PENDING TABLE</p>
                    <p className="mt-2">
                      <strong>What happened:</strong> Your product has been successfully added to our temporary products table and is now in the review queue.
                    </p>
                    <p className="mt-2">
                      <strong>Next steps:</strong> Our community moderators will review the product information and approve it for the main database. You'll receive an email notification once it's approved and goes live.
                    </p>
                    <p className="mt-2 text-xs text-blue-600">
                      <strong>Status:</strong> Product is now in the pending review queue awaiting moderator approval.
                    </p>
                  </div>
                )}
                <p className="mt-3 text-sm text-green-600 font-medium">
                  Thank you for contributing to SupplementIQ!
                </p>
              </div>
            </div>
            <div className="ml-auto pl-3">
              <button
                type="button"
                onClick={onDismissStatus}
                className="inline-flex rounded-md p-1.5 text-green-500 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-green-600"
              >
                <span className="sr-only">Dismiss</span>
                <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading Banner */}
      {isSubmitting && (
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="animate-spin h-5 w-5 text-blue-400" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                {user?.reputation_points >= 1000 || ['admin', 'owner', 'moderator'].includes(user?.role || '') 
                  ? 'Adding Product Directly...' 
                  : 'Adding to Pending Table...'}
              </h3>
              <p className="text-sm text-blue-700 mt-1">
                {user?.reputation_points >= 1000 || ['admin', 'owner', 'moderator'].includes(user?.role || '') 
                  ? 'Your product will be added directly to our database and go live immediately.' 
                  : 'Please wait while we add your product to the pending review queue.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Error Banner */}
      {submitStatus === 'error' && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-red-800">
                Submission Failed
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <p>
                  There was an error submitting your product. Please try again.
                </p>
                {submitError && (
                  <p className="mt-1">
                    <strong>Error:</strong> {submitError}
                  </p>
                )}
                <p className="mt-1 text-xs text-red-600">
                  If the problem persists, please contact our support team.
                </p>
              </div>
            </div>
            <div className="ml-auto pl-3">
              <button
                type="button"
                onClick={onDismissStatus}
                className="inline-flex rounded-md p-1.5 text-red-500 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-600"
              >
                <span className="sr-only">Dismiss</span>
                <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
