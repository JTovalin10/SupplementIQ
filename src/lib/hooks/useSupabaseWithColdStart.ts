'use client';

import { supabase } from '@/lib/database/supabase/client';
import { useColdStartHandler } from '@/lib/hooks/useColdStartHandler';

/**
 * Hook for handling Supabase operations with cold start detection
 * This provides a centralized way to handle Supabase cold starts across the app
 */
export function useSupabaseWithColdStart() {
  const { executeWithColdStartHandling } = useColdStartHandler();

  const executeSupabaseOperation = async <T>(
    operation: () => Promise<T>,
    operationName: string = 'Supabase Operation'
  ): Promise<T> => {
    return executeWithColdStartHandling(operation, operationName);
  };

  // Common Supabase operations with cold start handling
  const auth = {
    getSession: () => executeSupabaseOperation(
      () => supabase.auth.getSession(),
      'Get Session'
    ),
    getUser: (token?: string) => executeSupabaseOperation(
      () => supabase.auth.getUser(token),
      'Get User'
    ),
    signInWithPassword: (credentials: { email: string; password: string }) => executeSupabaseOperation(
      () => supabase.auth.signInWithPassword(credentials),
      'Sign In'
    ),
    signUp: (credentials: { email: string; password: string; options?: any }) => executeSupabaseOperation(
      () => supabase.auth.signUp(credentials),
      'Sign Up'
    ),
    signOut: () => executeSupabaseOperation(
      () => supabase.auth.signOut(),
      'Sign Out'
    ),
  };

  const database = {
    from: (table: string) => ({
      select: (columns: string) => ({
        eq: (column: string, value: any) => executeSupabaseOperation(
          () => supabase.from(table).select(columns).eq(column, value),
          `Select from ${table}`
        ),
        single: () => executeSupabaseOperation(
          () => supabase.from(table).select(columns).single(),
          `Select single from ${table}`
        ),
      }),
      insert: (data: any) => executeSupabaseOperation(
        () => supabase.from(table).insert(data),
        `Insert into ${table}`
      ),
      update: (data: any) => ({
        eq: (column: string, value: any) => executeSupabaseOperation(
          () => supabase.from(table).update(data).eq(column, value),
          `Update ${table}`
        ),
      }),
      delete: () => ({
        eq: (column: string, value: any) => executeSupabaseOperation(
          () => supabase.from(table).delete().eq(column, value),
          `Delete from ${table}`
        ),
      }),
    }),
  };

  return {
    executeSupabaseOperation,
    auth,
    database,
    supabase: {
      ...supabase,
      auth: {
        ...supabase.auth,
        getSession: auth.getSession,
        getUser: auth.getUser,
        signInWithPassword: auth.signInWithPassword,
        signUp: auth.signUp,
        signOut: auth.signOut,
      },
    },
  };
}
