'use client';

import { useOwnerDashboard } from '@/lib/contexts/OwnerDashboardContext';
import { Crown } from 'lucide-react';
import { useMemo } from 'react';

interface OwnerToolsProps {
  targetUserId?: string; // Optional prop for specific user override promotion
}

export default function OwnerTools({ targetUserId }: OwnerToolsProps) {
  const {
    handleOverridePromote
  } = useOwnerDashboard();

  // Use provided targetUserId or default placeholder
  const userId = targetUserId || 'user-id';

  // Memoize the override promotion button
  const overridePromoteButton = useMemo(() => ({
    label: 'Override Promote to Admin',
    onClick: () => handleOverridePromote(userId, 'admin'),
    className: 'w-full px-4 py-2 text-sm font-medium bg-yellow-100 text-yellow-800 rounded hover:bg-yellow-200'
  }), [handleOverridePromote, userId]);


  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-semibold text-black flex items-center space-x-2">
            <Crown className="w-5 h-5 text-yellow-500" />
            <span>Owner-Only Tools</span>
          </h3>
          {targetUserId && (
            <p className="text-sm text-gray-600 mt-1">Override promoting User ID: {targetUserId}</p>
          )}
        </div>
        <div className="p-6">
          <div className="space-y-4">
            <h4 className="text-md font-medium text-black">Override Promotions</h4>
            <p className="text-sm text-black">Bypass contribution requirements for role promotions</p>
            <div className="space-y-2">
              <p className="text-sm text-gray-600">
                Use the button below to override promote users.
              </p>
              <button
                onClick={overridePromoteButton.onClick}
                className={overridePromoteButton.className}
              >
                {overridePromoteButton.label}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}