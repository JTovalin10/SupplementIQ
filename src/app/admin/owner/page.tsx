'use client';

import OwnerDashboard from '@/components/features/dashboard/OwnerDashboard';
import { OwnerDashboardProvider, useAuth } from '@/lib/contexts';
import { Crown } from 'lucide-react';

export default function OwnerDashboardPage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <div className="flex items-center space-x-2">
                <Crown className="w-6 h-6 text-yellow-500" />
                <h1 className="text-2xl font-bold text-black">Owner Dashboard</h1>
              </div>
              <p className="text-black mt-1">
                Complete platform control and management
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Crown className="w-5 h-5 text-yellow-500" />
              <span className="text-black font-medium">Owner</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <OwnerDashboardProvider>
          <OwnerDashboard />
        </OwnerDashboardProvider>
      </div>
    </div>
  );
}
