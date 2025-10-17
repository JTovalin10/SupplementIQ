import { UserPlus, Crown, Ban, Trash2 } from 'lucide-react';

interface UserManagementProps {
  isOwner: boolean;
  onPromoteToModerator: (userId: string) => void;
  onPromoteToAdmin: (userId: string) => void;
  onBanUser: (userId: string) => void;
  onDeleteUser: (userId: string) => void;
}

export default function UserManagement({ 
  isOwner, 
  onPromoteToModerator, 
  onPromoteToAdmin, 
  onBanUser, 
  onDeleteUser 
}: UserManagementProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="px-6 py-4 border-b">
        <h3 className="text-lg font-semibold text-black">User Management</h3>
      </div>
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h4 className="text-md font-medium text-black">Promote Users</h4>
            <div className="space-y-2">
              <button
                onClick={() => onPromoteToModerator('user123')}
                className="w-full px-4 py-2 text-sm font-medium bg-blue-100 text-blue-800 rounded hover:bg-blue-200 flex items-center space-x-2"
              >
                <UserPlus className="w-4 h-4" />
                <span>Promote to Moderator</span>
              </button>
              {isOwner && (
                <button
                  onClick={() => onPromoteToAdmin('user123')}
                  className="w-full px-4 py-2 text-sm font-medium bg-purple-100 text-purple-800 rounded hover:bg-purple-200 flex items-center space-x-2"
                >
                  <Crown className="w-4 h-4" />
                  <span>Promote to Admin</span>
                </button>
              )}
            </div>
          </div>
          <div className="space-y-4">
            <h4 className="text-md font-medium text-black">User Actions</h4>
            <div className="space-y-2">
              <button
                onClick={() => onBanUser('user123')}
                className="w-full px-4 py-2 text-sm font-medium bg-red-100 text-red-800 rounded hover:bg-red-200 flex items-center space-x-2"
              >
                <Ban className="w-4 h-4" />
                <span>Ban User</span>
              </button>
              {isOwner && (
                <button
                  onClick={() => onDeleteUser('user123')}
                  className="w-full px-4 py-2 text-sm font-medium bg-red-100 text-red-800 rounded hover:bg-red-200 flex items-center space-x-2"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete User</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
