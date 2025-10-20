'use client';

import { useNextAuth } from '@/lib/contexts/NextAuthContext';
import { useState } from 'react';

export default function UpdateRolePage() {
  const { user } = useNextAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const updateRole = async (role: string) => {
    setLoading(true);
    setMessage('');
    
    try {
      const response = await fetch('/api/admin/update-role', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(`✅ Successfully updated role to ${role}`);
        // Refresh user data
        await refreshUser();
      } else {
        setMessage(`❌ Error: ${data.error}`);
      }
    } catch (error) {
      setMessage(`❌ Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Update User Role</h1>
        
        {user && (
          <div className="mb-6 p-4 bg-gray-100 rounded-lg">
            <h2 className="font-semibold text-gray-900">Current User Info:</h2>
            <p className="text-gray-700">Username: {user.username}</p>
            <p className="text-gray-700">Email: {user.email}</p>
            <p className="text-gray-700">Current Role: <span className="font-semibold text-blue-600">{user.role}</span></p>
          </div>
        )}

        <div className="space-y-3">
          <h3 className="font-semibold text-gray-900">Available Roles:</h3>
          {['newcomer', 'contributor', 'trusted_editor', 'moderator', 'admin', 'owner'].map((role) => (
            <button
              key={role}
              onClick={() => updateRole(role)}
              disabled={loading || (user?.role === role)}
              className={`w-full px-4 py-2 rounded-lg font-medium transition-colors ${
                user?.role === role
                  ? 'bg-green-100 text-green-700 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {role === user?.role ? `${role} (current)` : `Set to ${role}`}
            </button>
          ))}
        </div>

        {message && (
          <div className={`mt-6 p-4 rounded-lg ${
            message.includes('✅') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}>
            {message}
          </div>
        )}

        <div className="mt-8 pt-6 border-t border-gray-200">
          <a
            href="/owner"
            className="block w-full text-center bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
          >
            Go to Owner Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}
