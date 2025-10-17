import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Client for general operations
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Admin client with service role key for elevated operations
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Server-side client for API routes
export function createServerClient() {
  return createClient(supabaseUrl, supabaseServiceKey);
}
