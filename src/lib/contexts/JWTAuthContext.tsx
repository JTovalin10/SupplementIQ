'use client';

import type { Session, User } from '@supabase/supabase-js';
import React, { createContext, useContext, useEffect, useState } from 'react';
// Use the universal client
import { fetchAuthToken } from '@/lib/services/authService';
import type { UserRole } from '@/lib/utils/cache/securityCache/securityHelper';
import { addUser, getUserRole } from '@/lib/utils/cache/securityCache/securityHelper';
import { supabase } from '../supabase/client';

// De-duplicate init calls across renders/tabs
let inflightAuthInit: Promise<void> | null = null;
const AUTH_INIT_CACHE_KEY = 'auth:init:cache:v1';
const AUTH_INIT_TTL_MS = 60_000; // 60s TTL to reduce chattiness but keep fresh

// Extend Supabase User with our custom fields
interface AppUser extends User {
  username?: string;
  role?: string;
  token?: string; // Add token property here
}

interface JWTAuthContextType {
  user: AppUser | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (email: string, password: string, username: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
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
  const [user, setUser] = useState<AppUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user && !!session;

  // Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Try sessionStorage cache first (browser only)
        if (typeof window !== 'undefined') {
          try {
            const cachedRaw = sessionStorage.getItem(AUTH_INIT_CACHE_KEY);
            if (cachedRaw) {
              const cached = JSON.parse(cachedRaw) as { session: Session | null; role: string | null; ts: number };
              if (cached && Date.now() - cached.ts < AUTH_INIT_TTL_MS) {
                const { session: initSession, role } = cached;
                if (initSession?.user) {
                  setSession(initSession);
                  setUser({ ...initSession.user, role: role ?? 'user' });
                } else {
                  setSession(null);
                  setUser(null);
                }
                return; // cache hit: skip network
              }
            }
          } catch {}
        }

        const response = await fetch('/api/auth/init');
        let payload: { session: Session | null; role: string | null } = { session: null, role: null };
        try {
          payload = await response.json();
        } catch {}

        const { session: initSession, role } = payload;
        if (initSession?.user) {
          setSession(initSession);
          // Cache role client-side too to avoid extra fetches in this session
          if (initSession.user.id && role) {
            const r = role as string;
            if (r === 'admin' || r === 'moderator' || r === 'owner' || r === 'user') {
              try { addUser(initSession.user.id, r as UserRole); } catch {}
            }
          }
          // If role is missing/invalid, fetch it now
          if (!role || !['admin','moderator','owner','user'].includes(role)) {
            fetchUserRole(initSession.user.id).then((freshRole) => {
              setUser({ ...initSession.user, role: freshRole ?? 'user' });
              if (typeof window !== 'undefined') {
                try { sessionStorage.setItem(AUTH_INIT_CACHE_KEY, JSON.stringify({ session: initSession, role: freshRole, ts: Date.now() })); } catch {}
              }
            }).catch(() => {
              setUser({ ...initSession.user, role: 'user' });
            });
          } else {
            setUser({ ...initSession.user, role });
          }
          // Write to session cache
          if (typeof window !== 'undefined') {
            try { sessionStorage.setItem(AUTH_INIT_CACHE_KEY, JSON.stringify({ session: initSession, role, ts: Date.now() })); } catch {}
          }
        } else {
          // Fallback: rehydrate from Supabase client on the browser to avoid flicker/logout on refresh
          const { data: local } = await supabase.auth.getSession();
          const localSession = local?.session ?? null;
          setSession(localSession);
          if (localSession?.user) {
            const inferredRole = await fetchUserRole(localSession.user.id);
            setUser({ ...localSession.user, role: inferredRole ?? 'user' });
            if (typeof window !== 'undefined') {
              try { sessionStorage.setItem(AUTH_INIT_CACHE_KEY, JSON.stringify({ session: localSession, role: inferredRole, ts: Date.now() })); } catch {}
            }
          } else {
            setUser(null);
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        setSession(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    if (!inflightAuthInit) {
      inflightAuthInit = initializeAuth().finally(() => {
        // Clear inflight after completion so a later hard change can refetch
        setTimeout(() => { inflightAuthInit = null; }, AUTH_INIT_TTL_MS);
      });
    }
    // Await existing init if already running to avoid duplicate calls
    void inflightAuthInit;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        if (session?.user) {
          // Set user immediately to reduce perceived latency, but avoid leaking Supabase JWT 'role' ("authenticated")
          const cached = session.user.id ? getUserRole(session.user.id) : null;
          setUser({ ...session.user, role: cached ?? undefined });
          // Fetch token and update asynchronously
          fetchAuthToken(session.user.id).then((token) => {
            setUser((prev) => (prev ? { ...prev, token } : prev));
          }).catch(() => {});
          // Fetch normalized role asynchronously if not cached
          if (!cached) {
            fetchUserRole(session.user.id).then((role) => {
              setUser((prev) => (prev ? { ...prev, role } : prev));
            }).catch(() => {});
          }
        } else {
          setUser(null);
        }
        setIsLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);


  const fetchUserRole = async (userId: string): Promise<string> => {
    try {
      // Check the security cache first
      const cachedRole = getUserRole(userId);
      if (cachedRole) {
        return cachedRole;
      }
      
      // Fetch from database if not in cache
      const response = await fetch(`/api/users/${userId}/role`);
      
      if (response.ok) {
        const data = await response.json();
        const raw = data.role as string | null;
        const normalized = raw && ['admin','moderator','owner','user'].includes(raw) ? raw : 'user';
        addUser(userId, normalized as UserRole); // Cache the result
        return normalized;
      }

      // Fallback to default role if database fetch fails
      return 'user';
    } catch (error) {
      console.error('Failed to fetch user role:', error);
      return 'user'; // Default role on error
    }
  };

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.user) {
        // Set user immediately; then fetch role in the background
        setUser({ ...data.user });
        fetchUserRole(data.user.id).then((role) => {
          setUser((prev) => (prev ? { ...prev, role } : prev));
          try { addUser(data.user!.id, role as UserRole); } catch {}
        }).catch(() => {});
      }

      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Network error' };
    }
  };

  const signup = async (email: string, password: string, username: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
          }
        }
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Signup error:', error);
      return { success: false, error: 'Network error' };
    }
  };

  const logout = async (): Promise<void> => {
    await supabase.auth.signOut();
  };

  const value: JWTAuthContextType = {
    user,
    session,
    isAuthenticated,
    isLoading,
    login,
    signup,
    logout,
  };

  return (
    <JWTAuthContext.Provider value={value}>
      {children}
    </JWTAuthContext.Provider>
  );
}
