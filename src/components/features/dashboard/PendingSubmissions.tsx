'use client';

import { Building2, Eye, Package, User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

interface Submission {
  id: string;
  productName: string;
  brandName: string;
  category: string;
  submittedBy: string;
  submittedAt: string;
  status: 'pending' | 'approved' | 'rejected';
  imageUrl?: string | null;
  brand?: {
    id: number;
    name: string;
    website?: string;
  };
}

export default function PendingSubmissions() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

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
      const json = await fetcher();
      const mapped: Submission[] = (json.submissions || []).map((s: any) => ({
        id: String(s.id),
        productName: s.productName ?? s.name ?? 'Unknown',
        brandName: s.brandName ?? 'Unknown',
        category: s.category ?? 'Unknown',
        submittedBy: s.submittedBy ?? 'Unknown',
        submittedAt: s.submittedAt ?? new Date().toISOString(),
        status: s.status ?? 'pending',
        imageUrl: s.imageUrl ?? null,
        brand: s.brand ?? null,
      }));
      setSubmissions(mapped);
    } catch (err) {
      console.error('Failed to fetch pending submissions:', err);
      setError(err instanceof Error ? err.message : 'Failed to load pending submissions');
    } finally {
      setLoading(false);
    }
  };


  const handleViewSubmission = (submissionId: string) => {
    router.push(`/admin/submission/${submissionId}`);
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
              <div key={submission.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-start space-x-4">
                      {submission.imageUrl && (
                        <img
                          src={submission.imageUrl}
                          alt={submission.productName}
                          className="w-16 h-16 object-cover rounded-lg border"
                        />
                      )}
                      <div className="flex-1">
                        <h4 className="font-bold text-gray-900 text-xl mb-2">{submission.productName}</h4>
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <div className="flex items-center space-x-1">
                            <Building2 className="w-4 h-4 text-blue-600" />
                            <span className="font-medium text-gray-700">{submission.brandName}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Package className="w-4 h-4 text-green-600" />
                            <span className="capitalize">{submission.category.replace('-', ' ')}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <User className="w-4 h-4 text-purple-600" />
                            <span>by {submission.submittedBy}</span>
                          </div>
                        </div>
                        <p className="text-xs text-gray-400 mt-2">{formatTimestamp(submission.submittedAt)}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className={`px-3 py-1 text-xs font-medium rounded-full ${getTypeColor('product')}`}>
                      Pending Review
                    </span>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleViewSubmission(submission.id)}
                        className="flex items-center space-x-1 bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700 transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                        <span>Review</span>
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