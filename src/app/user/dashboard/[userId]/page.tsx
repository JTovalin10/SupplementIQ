'use client';

import JWTDashboard from '@/components/features/JWTDashboard';
import { useAuth } from '@/lib/contexts';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

interface UserData {
  id: string;
  username: string;
  role: string;
  reputation_points: number;
  bio?: string;
  joined_date: string;
  recent_activity: string;
}

interface Badge {
  badge_type: string;
  earned_at: string;
}

interface Review {
  id: string;
  rating: number;
  review_text: string;
  created_at: string;
  products: { name: string };
}

interface Submission {
  id: string;
  name: string;
  category: string;
  created_at: string;
  approval_status: number;
}

export default function UserDashboardPage() {
  const { isAuthenticated } = useAuth();
  const { user: currentUser } = useAuth();
  const params = useParams();
  const userId = params.userId as string;
  const [userData, setUserData] = useState<UserData | null>(null);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (userId) {
      fetchUserData();
    }
  }, [userId]);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/users/${userId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch user data');
      }

      const data = await response.json();
      setUserData(data.user);
      setBadges(data.badges || []);
      setReviews(data.reviews || []);
      setSubmissions(data.submissions || []);
    } catch (err) {
      console.error('Error fetching user data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load user data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading user dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Dashboard</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchUserData}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">User Not Found</h2>
          <p className="text-gray-600">The requested user could not be found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* User Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="h-16 w-16 rounded-full bg-gray-300 mr-4 flex items-center justify-center">
                <span className="text-xl font-medium text-gray-600">
                  {userData.username.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{userData.username}</h1>
                <p className="text-gray-600 capitalize">{userData.role}</p>
                <p className="text-sm text-gray-500">
                  Member since {new Date(userData.joined_date).toLocaleDateString()}
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">Reputation Points</div>
              <div className="text-2xl font-bold text-blue-600">{userData.reputation_points}</div>
              <div className="text-sm text-gray-500">Last Active</div>
              <div className="text-lg font-semibold text-green-600">
                {new Date(userData.recent_activity).toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* User Badges */}
      {badges.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Badges</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {badges.map((badge, index) => (
              <div key={index} className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                <div className="text-yellow-600 font-semibold">{badge.badge_type}</div>
                <div className="text-sm text-gray-500">
                  {new Date(badge.earned_at).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Reviews */}
      {reviews.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Reviews</h3>
          <div className="space-y-4">
            {reviews.map((review) => (
              <div key={review.id} className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-medium text-gray-900">{review.products.name}</h4>
                  <div className="flex items-center">
                    <span className="text-yellow-500">{'★'.repeat(review.rating)}</span>
                    <span className="text-gray-500 ml-2">{review.rating}/5</span>
                  </div>
                </div>
                <p className="text-gray-700 mb-2">{review.review_text}</p>
                <div className="text-sm text-gray-500">
                  {new Date(review.created_at).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Submissions */}
      {submissions.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Submissions</h3>
          <div className="space-y-4">
            {submissions.map((submission) => (
              <div key={submission.id} className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-medium text-gray-900">{submission.name}</h4>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    submission.approval_status === 0 ? 'bg-yellow-100 text-yellow-800' :
                    submission.approval_status === 1 ? 'bg-green-100 text-green-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {submission.approval_status === 0 ? 'Pending' :
                     submission.approval_status === 1 ? 'Approved' : 'Rejected'}
                  </span>
                </div>
                <div className="text-sm text-gray-500 mb-2">
                  Category: {submission.category}
                </div>
                <div className="text-sm text-gray-500">
                  {new Date(submission.created_at).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Dashboard Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <JWTDashboard />
      </div>
    </div>
  );
}
