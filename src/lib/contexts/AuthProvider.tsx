'use client';

import { SessionProvider } from 'next-auth/react';
import { NextAuthProvider } from './NextAuthContext';

interface AuthProviderProps {
  children: React.ReactNode;
}

/**
 * AuthProvider - Client-side wrapper for NextAuth providers
 * Combines SessionProvider and NextAuthProvider for proper client-side rendering
 */
export function AuthProvider({ children }: AuthProviderProps) {
  return (
    <SessionProvider>
      <NextAuthProvider>
        {children}
      </NextAuthProvider>
    </SessionProvider>
  );
}
