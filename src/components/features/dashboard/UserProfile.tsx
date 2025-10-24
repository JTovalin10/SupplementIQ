'use client';

import { Award, Calendar, Clock, Mail, User } from 'lucide-react';
import { useMemo } from 'react';

interface UserProfileProps {
  user: {
    id: string;
    email: string;
    username: string;
    role: string;
    created_at: string;
    last_login?: string;
    contribution_count: number;
    profile?: {
      first_name?: string;
      last_name?: string;
      bio?: string;
      avatar_url?: string;
    };
  };
  onPromote?: (userId: string, newRole: string) => void;
  canPromoteToAdmin?: boolean;
}

export default function UserProfile({ user, onPromote, canPromoteToAdmin = false }: UserProfileProps) {
  const formatDate = useMemo(() => (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }, []);

  const getRoleBadgeColor = useMemo(() => (role: string) => {
    switch (role) {
      case 'owner':
        return 'bg-purple-100 text-purple-800';
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'moderator':
        return 'bg-blue-100 text-blue-800';
      case 'trusted_editor':
        return 'bg-green-100 text-green-800';
      case 'contributor':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }, []);

  const promotionOptions = useMemo(() => {
    const options = [];
    
    if (user.role === 'contributor' || user.role === 'newcomer') {
      options.push({ role: 'moderator', label: 'Promote to Moderator', color: 'bg-blue-100 text-blue-800 hover:bg-blue-200' });
    }
    
    if (canPromoteToAdmin && (user.role === 'moderator' || user.role === 'contributor' || user.role === 'newcomer')) {
      options.push({ role: 'admin', label: 'Promote to Admin', color: 'bg-red-100 text-red-800 hover:bg-red-200' });
    }
    
    return options;
  }, [user.role, canPromoteToAdmin]);

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="px-6 py-4 border-b">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
            {user.profile?.avatar_url ? (
              <img 
                src={user.profile.avatar_url} 
                alt={user.username}
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : (
              <User className="w-6 h-6 text-gray-500" />
            )}
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900">
              {user.profile?.first_name && user.profile?.last_name 
                ? `${user.profile.first_name} ${user.profile.last_name}`
                : user.username
              }
            </h3>
            <p className="text-sm text-gray-600">@{user.username}</p>
          </div>
          <div className="flex items-center space-x-2">
            <span className={`px-3 py-1 text-xs font-medium rounded-full ${getRoleBadgeColor(user.role)}`}>
              {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
            </span>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* User Information */}
          <div className="space-y-4">
            <h4 className="text-md font-medium text-gray-900">User Information</h4>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Mail className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">{user.email}</span>
              </div>
              <div className="flex items-center space-x-3">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">
                  Joined {formatDate(user.created_at)}
                </span>
              </div>
              {user.last_login && (
                <div className="flex items-center space-x-3">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">
                    Last login {formatDate(user.last_login)}
                  </span>
                </div>
              )}
              <div className="flex items-center space-x-3">
                <Award className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">
                  {user.contribution_count} contributions
                </span>
              </div>
            </div>
          </div>

          {/* Profile Information */}
          <div className="space-y-4">
            <h4 className="text-md font-medium text-gray-900">Profile</h4>
            {user.profile?.bio ? (
              <p className="text-sm text-gray-600">{user.profile.bio}</p>
            ) : (
              <p className="text-sm text-gray-400 italic">No bio provided</p>
            )}
          </div>
        </div>

        {/* Promotion Actions */}
        {promotionOptions.length > 0 && onPromote && (
          <div className="mt-6 pt-6 border-t">
            <h4 className="text-md font-medium text-gray-900 mb-4">Promotion Actions</h4>
            <div className="flex flex-wrap gap-3">
              {promotionOptions.map((option) => (
                <button
                  key={option.role}
                  onClick={() => onPromote(user.id, option.role)}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${option.color}`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
