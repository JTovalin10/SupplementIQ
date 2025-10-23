'use client';

import { AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { useState } from 'react';

interface SubmissionActionProps {
  submissionId: string;
  productName: string;
  adminId: string;
  onSuccess: () => void;
}

export default function SubmissionAction({ submissionId, productName, adminId, onSuccess }: SubmissionActionProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  const handleApprove = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/submission-action', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          submissionId,
          action: 'approve',
          adminId,
          notes: 'Approved via admin dashboard'
        }),
      });

      const result = await response.json();

      if (result.success) {
        alert(`✅ Product "${result.data.productName}" approved successfully!`);
        onSuccess();
      } else {
        alert(`❌ Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Error approving submission:', error);
      alert('❌ Failed to approve submission');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/submission-action', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          submissionId,
          action: 'reject',
          adminId,
          reason: rejectionReason,
          notes: 'Rejected via admin dashboard'
        }),
      });

      const result = await response.json();

      if (result.success) {
        alert(`✅ Product "${result.data.productName}" rejected successfully!`);
        setShowRejectModal(false);
        setRejectionReason('');
        onSuccess();
      } else {
        alert(`❌ Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Error rejecting submission:', error);
      alert('❌ Failed to reject submission');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="flex space-x-2">
        <button
          onClick={handleApprove}
          disabled={isLoading}
          className="flex items-center space-x-1 px-3 py-1 text-xs font-medium bg-green-100 text-green-800 rounded hover:bg-green-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <CheckCircle className="w-3 h-3" />
          <span>Approve</span>
        </button>
        
        <button
          onClick={() => setShowRejectModal(true)}
          disabled={isLoading}
          className="flex items-center space-x-1 px-3 py-1 text-xs font-medium bg-red-100 text-red-800 rounded hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <XCircle className="w-3 h-3" />
          <span>Reject</span>
        </button>
      </div>

      {/* Rejection Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center space-x-2 mb-4">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <h3 className="text-lg font-semibold text-gray-900">Reject Product Submission</h3>
            </div>
            
            <p className="text-sm text-gray-600 mb-4">
              You are about to reject "{productName}". Please provide a reason for the rejection.
            </p>
            
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Enter rejection reason..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm resize-none"
              rows={3}
            />
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectionReason('');
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={isLoading || !rejectionReason.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Rejecting...' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
