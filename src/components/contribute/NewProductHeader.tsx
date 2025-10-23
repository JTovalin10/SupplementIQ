'use client';

import { useUser } from '@/lib/contexts/UserContext';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface NewProductHeaderProps {
  title?: string;
  description?: string;
}

export default function NewProductHeader({ 
  title = "Add New Product",
  description = "Submit a new supplement product to our database. All submissions are reviewed by our community."
}: NewProductHeaderProps) {
  const { user } = useUser();

  return (
    <div className="bg-white border-b">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center space-x-4">
          <Link
            href="/contribute"
            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Contribute
          </Link>
        </div>
        <div className="mt-4">
          <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
          <p className="text-gray-600 mt-2">
            {description}
          </p>
          
          {/* User Status Indicator */}
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                {user?.reputation_points >= 1000 || ['admin', 'owner', 'moderator'].includes(user?.role || '') ? (
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                ) : (
                  <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>
              <div className="flex-1">
                {user?.reputation_points >= 1000 || ['admin', 'owner', 'moderator'].includes(user?.role || '') ? (
                  <div>
                    <h3 className="text-sm font-medium text-green-800">Direct Submission Enabled</h3>
                    <p className="text-sm text-green-700 mt-1">
                      Your products will be added directly to our database and go live immediately.
                      {user?.role && ['admin', 'owner', 'moderator'].includes(user.role) ? (
                        <span> (Privileged role: {user.role})</span>
                      ) : (
                        <span> (Reputation: {user?.reputation_points || 0} points)</span>
                      )}
                    </p>
                  </div>
                ) : (
                  <div>
                    <h3 className="text-sm font-medium text-yellow-800">Review Required</h3>
                    <p className="text-sm text-yellow-700 mt-1">
                      Your products will be submitted for community review before going live.
                      <br />
                      <span className="font-medium">Current reputation: {user?.reputation_points || 0} points</span> • 
                      <span className="font-medium"> Need: 1000+ points for direct submission</span>
                    </p>
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
