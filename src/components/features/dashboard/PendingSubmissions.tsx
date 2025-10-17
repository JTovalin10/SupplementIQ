'use client';

import { useEffect, useState } from 'react';

interface Submission {
  id: string;
  title: string;
  user: string;
  submittedAt: string;
  type: 'product' | 'edit' | 'review';
  status: 'pending' | 'approved' | 'rejected';
}

export default function PendingSubmissions() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPendingSubmissions();
  }, []);

  const fetchPendingSubmissions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // TODO: Replace with actual API call
      // const response = await fetch('/api/admin/dashboard/pending-submissions');
      // const data = await response.json();
      
      // Mock data for now
      const mockSubmissions = [
        {
          id: '1',
          title: 'Optimum Nutrition Gold Standard Whey',
          user: 'John Doe',
          submittedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          type: 'product',
          status: 'pending'
        },
        {
          id: '2',
          title: 'Dymatize ISO100 Update',
          user: 'Jane Smith',
          submittedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
          type: 'edit',
          status: 'pending'
        },
        {
          id: '3',
          title: 'MuscleTech NitroTech Review',
          user: 'Mike Johnson',
          submittedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
          type: 'review',
          status: 'pending'
        }
      ];
      
      setSubmissions(mockSubmissions);
    } catch (err) {
      console.error('Failed to fetch pending submissions:', err);
      setError('Failed to load pending submissions');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (submissionId: string) => {
    try {
      // TODO: Replace with actual API call
      // await fetch(`/api/admin/submissions/${submissionId}/approve`, { method: 'POST' });
      
      setSubmissions(prev => prev.filter(sub => sub.id !== submissionId));
    } catch (err) {
      console.error('Failed to approve submission:', err);
    }
  };

  const handleReject = async (submissionId: string) => {
    try {
      // TODO: Replace with actual API call
      // await fetch(`/api/admin/submissions/${submissionId}/reject`, { method: 'POST' });
      
      setSubmissions(prev => prev.filter(sub => sub.id !== submissionId));
    } catch (err) {
      console.error('Failed to reject submission:', err);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return `${Math.floor(diffInHours / 24)}d ago`;
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'product': return 'bg-blue-100 text-blue-800';
      case 'edit': return 'bg-yellow-100 text-yellow-800';
      case 'review': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Pending Submissions</h3>
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
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Pending Submissions</h3>
        </div>
        <div className="p-6">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={fetchPendingSubmissions}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 text-sm"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b">
        <h3 className="text-lg font-semibold text-gray-900">Pending Submissions</h3>
      </div>
      <div className="p-6">
        {submissions.length > 0 ? (
          <div className="space-y-4">
            {submissions.map((submission) => (
              <div key={submission.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium text-gray-900">{submission.title}</h4>
                    <p className="text-sm text-gray-500">by {submission.user}</p>
                    <p className="text-xs text-gray-400">{formatTimestamp(submission.submittedAt)}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(submission.type)}`}>
                      {submission.type}
                    </span>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleApprove(submission.id)}
                        className="bg-green-600 text-white px-3 py-1 rounded text-xs hover:bg-green-700"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleReject(submission.id)}
                        className="bg-red-600 text-white px-3 py-1 rounded text-xs hover:bg-red-700"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No pending submissions</p>
        )}
      </div>
    </div>
  );
}