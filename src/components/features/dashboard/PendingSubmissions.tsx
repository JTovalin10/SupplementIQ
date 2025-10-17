'use client';

import { withCache } from '@/lib/utils/cache';
import { useEffect, useRef, useState } from 'react';

interface Submission {
  id: string;
  productName: string;
  brandName: string;
  category: string;
  submittedBy: string;
  submittedAt: string;
  status: 'pending' | 'approved' | 'rejected';
}

export default function PendingSubmissions() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const hasFetchedRef = useRef(false);
  useEffect(() => {
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;
    fetchPendingSubmissions();
  }, []);

  const fetchPendingSubmissions = async () => {
    try {
      setLoading(true);
      setError(null);
      const page = 1;
      const limit = 10;
      const url = `/api/admin/dashboard/pending-submissions?page=${page}&limit=${limit}`;
      const fetcher = async () => {
        const response = await fetch(url);
        if (!response.ok) {
          let details = '';
          try {
            const errJson = await response.json();
            details = errJson?.error || JSON.stringify(errJson);
          } catch {
            try { details = await response.text(); } catch { details = ''; }
          }
          const message = `Failed to load (HTTP ${response.status}${response.statusText ? ` ${response.statusText}` : ''})${details ? `: ${details}` : ''}`;
          throw new Error(message);
        }
        return response.json();
      };
      const json = page === 1
        ? await withCache(`admin:pending-submissions:page=${page}:limit=${limit}`, fetcher, 60)
        : await fetcher();
      const mapped: Submission[] = (json.submissions || []).map((s: any) => ({
        id: String(s.id),
        productName: s.productName ?? s.name ?? 'Unknown',
        brandName: s.brand?.name ?? 'Unknown',
        category: s.category ?? 'Unknown',
        submittedBy: s.submittedBy ?? 'Unknown',
        submittedAt: s.submittedAt ?? new Date().toISOString(),
        status: s.status ?? 'pending',
      }));
      setSubmissions(mapped);
    } catch (err) {
      console.error('Failed to fetch pending submissions:', err);
      setError(err instanceof Error ? err.message : 'Failed to load pending submissions');
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
                    <h4 className="font-medium text-gray-900">{submission.productName}</h4>
                    <p className="text-sm text-gray-500">Brand: {submission.brandName} • Category: {submission.category}</p>
                    <p className="text-sm text-gray-500">by {submission.submittedBy}</p>
                    <p className="text-xs text-gray-400">{formatTimestamp(submission.submittedAt)}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTypeColor('product')}`}>Pending</span>
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