'use client';

import { useAuth } from '@/lib/contexts/AuthContext';
import { createTestUser } from '@/lib/create-test-user';
import { useState } from 'react';

export default function AuthDebug() {
  const { user, login, register, logout, isLoading } = useAuth();
  const [email, setEmail] = useState('test@supplementiq.com');
  const [password, setPassword] = useState('TestPassword123!');
  const [username, setUsername] = useState('testuser');
  const [message, setMessage] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
      setMessage('✅ Login successful!');
    } catch (error) {
      setMessage(`❌ Login failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await register(username, email, password);
      setMessage('✅ Registration successful!');
    } catch (error) {
      setMessage(`❌ Registration failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleCreateTestUser = async () => {
    const result = await createTestUser();
    if (result.success) {
      setMessage('✅ Test user created successfully!');
    } else {
      setMessage(`❌ Failed to create test user: ${result.error}`);
    }
  };

  if (isLoading) {
    return <div className="p-4 border rounded">Loading authentication...</div>;
  }

  return (
    <div className="p-4 border rounded max-w-md mx-auto mt-8">
      <h3 className="text-lg font-bold mb-4">Auth Debug Panel</h3>
      
      {user ? (
        <div className="mb-4">
          <p className="text-green-600">✅ Logged in as: {user.username} ({user.email})</p>
          <p>Role: {user.role}</p>
          <button 
            onClick={logout}
            className="mt-2 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Logout
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <button 
              onClick={handleCreateTestUser}
              className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Create Test User
            </button>
          </div>

          <form onSubmit={handleRegister} className="space-y-2">
            <h4 className="font-semibold">Register New User</h4>
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full p-2 border rounded"
            />
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-2 border rounded"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2 border rounded"
            />
            <button 
              type="submit"
              className="w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              Register
            </button>
          </form>

          <form onSubmit={handleLogin} className="space-y-2">
            <h4 className="font-semibold">Login</h4>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-2 border rounded"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2 border rounded"
            />
            <button 
              type="submit"
              className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Login
            </button>
          </form>
        </div>
      )}

      {message && (
        <div className="mt-4 p-2 bg-gray-100 rounded text-sm">
          {message}
        </div>
      )}
    </div>
  );
}
