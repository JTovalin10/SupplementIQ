'use client';

import { useAuth } from '@/lib/contexts';
import UserSearch from './UserSearch';

interface AdminUserManagementProps {
  targetUserId?: string; // Optional prop for specific user management
}

export default function AdminUserManagement({ targetUserId }: AdminUserManagementProps) {
  const { user } = useAuth();

  const handlePromote = async (userId: string, newRole: string) => {
    try {
      // Only allow promotion to moderator for admins
      if (newRole === 'moderator') {
        // TODO: Implement actual promotion API call
        console.log(`Admin ${user?.id} promoting user ${userId} to moderator`);
        alert(`User promoted to moderator successfully!`);
      } else {
        alert('You can only promote users to moderator role.');
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
            Search and manage users. You can promote users to moderator role.
          </p>
        </div>
        <div className="p-6">
          <UserSearch 
            onPromote={handlePromote}
            canPromoteToAdmin={false}
          />
        </div>
      </div>
    </div>
  );
}
