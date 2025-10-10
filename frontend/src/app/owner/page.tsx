'use client';

import Dashboard from '@/components/features/Dashboard';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function OwnerPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push('/login');
        return;
      }
      
      // Temporarily allow admin users to access owner dashboard
      if (user && !['admin', 'owner'].includes(user.role)) {
        router.push('/');
        return;
      }
    }
  }, [user, isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-black">Loading...</div>
      </div>
    );
  }

  // Temporarily allow admin users to access owner dashboard
  if (!isAuthenticated || !user || !['admin', 'owner'].includes(user.role)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600 mb-4">
              You need admin or owner privileges to access this page.
            </p>
            {user && (
              <div className="bg-gray-100 p-4 rounded-lg mb-4">
                <p className="text-sm text-gray-700">
                  Current role: <span className="font-semibold">{user.role}</span>
                </p>
                <p className="text-sm text-gray-700">
                  Username: {user.username}
                </p>
              </div>
            )}
          </div>
          <div className="space-y-3">
            <a
              href="/admin/update-role"
              className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors inline-block"
            >
              Update Your Role
            </a>
            <a
              href="/"
              className="w-full bg-gray-100 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors inline-block"
            >
              Go Home
            </a>
          </div>
        </div>
      </div>
    );
  }

  return <Dashboard userRole="owner" />;
}
