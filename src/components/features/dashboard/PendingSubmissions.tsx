import type { PendingSubmission } from '@/lib/services/dashboardService';

interface PendingSubmissionsProps {
  submissions: PendingSubmission[];
  onApprove: (submissionId: string) => void;
  onReject: (submissionId: string) => void;
}

export default function PendingSubmissions({ submissions, onApprove, onReject }: PendingSubmissionsProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
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
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="px-6 py-4 border-b">
        <h3 className="text-lg font-semibold text-black">Pending Product Submissions</h3>
      </div>
      <div className="divide-y divide-gray-200">
        {submissions.map((submission) => (
          <div key={submission.id} className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-4">
                  <div>
                    <h4 className="text-sm font-medium text-black">{submission.productName}</h4>
                    <p className="text-sm text-black">Brand: {submission.brandName}</p>
                    <p className="text-sm text-black">Category: {submission.category}</p>
                  </div>
                  <div className="text-sm text-black">
                    <p>Submitted by: {submission.submittedBy}</p>
                    <p>{formatDate(submission.submittedAt)}</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                {getStatusBadge(submission.status)}
                <div className="flex space-x-2">
                  <button
                    onClick={() => onApprove(submission.id)}
                    className="px-3 py-1 text-xs font-medium bg-green-100 text-green-800 rounded hover:bg-green-200"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => onReject(submission.id)}
                    className="px-3 py-1 text-xs font-medium bg-red-100 text-red-800 rounded hover:bg-red-200"
                  >
                    Reject
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
