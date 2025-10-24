'use client';

import { supabase } from '@/lib/database/supabase/client';
import { Search, Users } from 'lucide-react';
import { useMemo, useState } from 'react';
import UserProfile from './UserProfile';

interface UserSearchProps {
  onPromote?: (userId: string, newRole: string) => void;
  canPromoteToAdmin?: boolean;
}

interface User {
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
}

interface SearchResults {
  users: User[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export default function UserSearch({ onPromote, canPromoteToAdmin = false }: UserSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [results, setResults] = useState<SearchResults | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const roleOptions = useMemo(() => [
    { value: '', label: 'All Roles' },
    { value: 'newcomer', label: 'Newcomer' },
    { value: 'contributor', label: 'Contributor' },
    { value: 'trusted_editor', label: 'Trusted Editor' },
    { value: 'moderator', label: 'Moderator' },
    { value: 'admin', label: 'Admin' },
    { value: 'owner', label: 'Owner' }
  ], []);

  const searchUsers = async (query: string, role: string, page: number) => {
    setIsLoading(true);
    setError(null);

    try {
      // Get the current session and access token
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        throw new Error('No active session found. Please log in again.');
      }

      const params = new URLSearchParams({
        q: query,
        role: role,
        page: page.toString(),
        limit: '10'
      });

      const response = await fetch(`/api/admin/users/search?${params}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`HTTP ${response.status}: ${errorData.error || response.statusText}`);
      }

      const data = await response.json();
      setResults(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setResults(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
    searchUsers(searchQuery, selectedRole, 1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    searchUsers(searchQuery, selectedRole, page);
  };

  const handlePromote = async (userId: string, newRole: string) => {
    if (!onPromote) return;
    
    try {
      await onPromote(userId, newRole);
      // Refresh the search results after promotion
      searchUsers(searchQuery, selectedRole, currentPage);
    } catch (error) {
      console.error('Error promoting user:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Search Controls */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Users className="w-5 h-5 mr-2" />
          User Search
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by username, email, or name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
          </div>
          
          <div className="flex space-x-2">
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              {roleOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            
            <button
              onClick={handleSearch}
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
            >
              <Search className="w-4 h-4" />
              <span>Search</span>
            </button>
          </div>
        </div>
      </div>

      {/* Search Results */}
      {isLoading && (
        <div className="text-center py-8">
          <div className="text-gray-600">Searching users...</div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {results && (
        <div className="space-y-4">
          {/* Results Header */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Found {results.pagination.total} users
            </p>
            {results.pagination.totalPages > 1 && (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-600">
                  Page {currentPage} of {results.pagination.totalPages}
                </span>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === results.pagination.totalPages}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </div>

          {/* User Profiles */}
          <div className="space-y-4">
            {results.users.map((user) => (
              <UserProfile
                key={user.id}
                user={user}
                onPromote={handlePromote}
                canPromoteToAdmin={canPromoteToAdmin}
              />
            ))}
          </div>

          {results.users.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No users found matching your search criteria.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
