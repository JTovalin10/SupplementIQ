'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

interface User {
  id: string;
  email: string;
  username: string;
  role: string; // Made flexible for database-driven roles
}

interface JWTAuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (email: string, password: string, username: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  refreshToken: () => Promise<boolean>;
  getAccessToken: () => string | null;
}

const JWTAuthContext = createContext<JWTAuthContextType | undefined>(undefined);

export function useJWTAuth() {
  const context = useContext(JWTAuthContext);
  if (context === undefined) {
    throw new Error('useJWTAuth must be used within a JWTAuthProvider');
  }
  return context;
}

interface JWTAuthProviderProps {
  children: React.ReactNode;
}

export function JWTAuthProvider({ children }: JWTAuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshTokenValue, setRefreshTokenValue] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);

  const isAuthenticated = !!user && !!accessToken;

  // Set client-side flag
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Initialize auth state from localStorage
  useEffect(() => {
    if (!isClient) return;
    
    const initializeAuth = async () => {
      try {

        const storedAccessToken = localStorage.getItem('accessToken');
        const storedRefreshToken = localStorage.getItem('refreshToken');
        const storedUser = localStorage.getItem('user');

        if (storedAccessToken && storedRefreshToken && storedUser) {
          // Verify the access token is still valid
          const tokenPayload = JSON.parse(atob(storedAccessToken.split('.')[1]));
          const isExpired = Date.now() >= tokenPayload.exp * 1000;

          if (!isExpired) {
            // Token is valid, restore state
            setAccessToken(storedAccessToken);
            setRefreshTokenValue(storedRefreshToken);
            setUser(JSON.parse(storedUser));
          } else {
            // Token expired, try to refresh
            const refreshSuccess = await attemptRefresh(storedRefreshToken);
            if (!refreshSuccess) {
              // Refresh failed, clear storage
              clearAuthData();
            }
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        clearAuthData();
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, [isClient]);

  const clearAuthData = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
    }
    setUser(null);
    setAccessToken(null);
    setRefreshTokenValue(null);
  };

  const attemptRefresh = async (refreshTokenValue: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken: refreshTokenValue }),
      });

      if (response.ok) {
        const data = await response.json();
        setAccessToken(data.accessToken);
        if (typeof window !== 'undefined') {
          localStorage.setItem('accessToken', data.accessToken);
        }
        return true;
      } else {
        clearAuthData();
        return false;
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
      clearAuthData();
      return false;
    }
  };

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Store tokens and user data
        setAccessToken(data.tokens.accessToken);
        setRefreshTokenValue(data.tokens.refreshToken);
        setUser(data.user);

        if (typeof window !== 'undefined') {
          localStorage.setItem('accessToken', data.tokens.accessToken);
          localStorage.setItem('refreshToken', data.tokens.refreshToken);
          localStorage.setItem('user', JSON.stringify(data.user));
        }

        return { success: true };
      } else {
        return { success: false, error: data.error || 'Login failed' };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Network error' };
    }
  };

  const signup = async (email: string, password: string, username: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, username }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Store tokens and user data
        setAccessToken(data.tokens.accessToken);
        setRefreshTokenValue(data.tokens.refreshToken);
        setUser(data.user);

        if (typeof window !== 'undefined') {
          localStorage.setItem('accessToken', data.tokens.accessToken);
          localStorage.setItem('refreshToken', data.tokens.refreshToken);
          localStorage.setItem('user', JSON.stringify(data.user));
        }

        return { success: true };
      } else {
        return { success: false, error: data.error || 'Signup failed' };
      }
    } catch (error) {
      console.error('Signup error:', error);
      return { success: false, error: 'Network error' };
    }
  };

  const logout = () => {
    clearAuthData();
  };

  const refreshToken = async (): Promise<boolean> => {
    if (!refreshTokenValue) return false;
    return await attemptRefresh(refreshTokenValue);
  };

  const getAccessToken = (): string | null => {
    return accessToken;
  };

  const value: JWTAuthContextType = {
    user: isClient ? user : null,
    isAuthenticated: isClient ? isAuthenticated : false,
    isLoading: isLoading || !isClient,
    login: isClient ? login : async () => ({ success: false, error: 'Loading...' }),
    signup: isClient ? signup : async () => ({ success: false, error: 'Loading...' }),
    logout: isClient ? logout : () => {},
    refreshToken: isClient ? refreshToken : async () => false,
    getAccessToken: isClient ? getAccessToken : () => null,
  };

  return (
    <JWTAuthContext.Provider value={value}>
      {children}
    </JWTAuthContext.Provider>
  );
}
