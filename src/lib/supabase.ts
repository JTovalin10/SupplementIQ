import { createClient } from '@supabase/supabase-js';

/**
 * Supabase configuration and client initialization
 * Sets up the Supabase client for server-side operations with service role key
 */

// Environment variable validation
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable');
}

if (!supabaseServiceKey) {
  throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable');
}

/**
 * Supabase client instance for server-side operations
 * Configured with service role key for administrative database access
 * 
 * @requires NEXT_PUBLIC_SUPABASE_URL - Supabase project URL
 * @requires SUPABASE_SERVICE_ROLE_KEY - Service role key for server-side operations
 * 
 * @returns SupabaseClient - Configured client instance
 * 
 * @throws Error - When required environment variables are missing
 * 
 * @example
 * // Use for database operations
 * const { data, error } = await supabase.from('products').select('*');
 */
export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

/**
 * Get authenticated user from Authorization header
 * Extracts and validates JWT token from Bearer authorization header
 * 
 * @requires authHeader - Authorization header string in format "Bearer <token>"
 * 
 * @returns User | null - User object if token is valid, null if invalid/missing
 * 
 * @throws None - Returns null for any errors instead of throwing
 * 
 * @example
 * // Usage in route middleware
 * const user = await getAuthenticatedUser(req.headers.authorization);
 * if (!user) return res.status(401).json({ error: 'Unauthorized' });
 */
export const getAuthenticatedUser = async (authHeader: string) => {
  if (!authHeader) {
    return null;
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return null;
  }

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error) {
      return null;
    }
    return user;
  } catch (error) {
    console.error('Error getting authenticated user:', error);
    return null;
  }
};
