'use client';

import { useAuth } from '@/lib/contexts';
import { useOwnerDashboard } from '@/lib/contexts/OwnerDashboardContext';
import { supabase } from '@/lib/database/supabase/client';
import UserSearch from '../UserSearch';

interface OwnerUserManagementProps {
  targetUserId?: string; // Optional prop for specific user management
}

export default function OwnerUserManagement({ targetUserId }: OwnerUserManagementProps) {
  const { user } = useAuth();
  const {
    handlePromoteToModerator,
    handlePromoteToAdmin,
    handleOverridePromote
  } = useOwnerDashboard();

  const handlePromote = async (userId: string, newRole: string) => {
    try {
      // Get the current session and access token
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        alert('Authentication error. Please log in again.');
        return;
      }

      const response = await fetch('/api/admin/users/promote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          userId,
          newRole,
          promotedBy: user?.id
        }),
      });

      const result = await response.json();

      if (result.success) {
        alert(result.message);
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Error promoting user:', error);
      alert('Failed to promote user. Please try again.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-semibold text-black">User Management</h3>
          <p className="text-sm text-gray-600 mt-1">
            Search and manage users. You can promote users to moderator or admin roles.
          </p>
        </div>
        <div className="p-6">
          <UserSearch 
            onPromote={handlePromote}
            canPromoteToAdmin={true}
          />
        </div>
      </div>
    </div>
  );
}
