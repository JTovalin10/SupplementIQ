import { Activity, Clock, Crown, Shield } from 'lucide-react';

interface DashboardHeaderProps {
  isOwner: boolean;
  cacheStatus: { hours: number; minutes: number; seconds: number } | null;
  loading: boolean;
  onRefresh: () => void;
}

export default function DashboardHeader({ isOwner, cacheStatus, loading, onRefresh }: DashboardHeaderProps) {
  return (
    <div className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-6">
          <div>
            <div className="flex items-center space-x-2">
              {isOwner ? (
                <Crown className="w-6 h-6 text-yellow-500" />
              ) : (
                <Shield className="w-6 h-6 text-blue-600" />
              )}
              <h1 className="text-2xl font-bold text-gray-900">
                {isOwner ? 'Owner' : 'Admin'} Dashboard
              </h1>
            </div>
            <p className="text-gray-700 mt-1">
              {isOwner ? 'Complete platform control and management' : 'Manage products, users, and platform settings'}
            </p>
          </div>
          <div className="flex items-center space-x-4">
            {/* Cache Status */}
            {cacheStatus && !loading && (
              <div className="flex items-center space-x-2 text-sm">
                <Clock className="w-4 h-4 text-gray-500" />
                <span className="text-gray-600">
                  Next update in: {cacheStatus.hours}h {cacheStatus.minutes}m {cacheStatus.seconds}s
                </span>
              </div>
            )}
            
            {/* Refresh Button */}
            <button
              onClick={onRefresh}
              disabled={loading}
              className="flex items-center space-x-1 px-3 py-1 text-sm bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 disabled:opacity-50"
            >
              <Activity className="w-4 h-4" />
              <span>Refresh</span>
            </button>
            
            <div className="flex items-center space-x-2">
              {isOwner ? (
                <Crown className="w-5 h-5 text-yellow-500" />
              ) : (
                <Shield className="w-5 h-5 text-blue-600" />
              )}
              <span className="text-gray-900 font-medium">
                {isOwner ? 'Owner' : 'Administrator'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
