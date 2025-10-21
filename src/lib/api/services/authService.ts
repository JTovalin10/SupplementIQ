import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

let token: string | null = null;

export async function fetchAuthToken(userId: string): Promise<string | null> {
  if (token) return token;

  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    
    token = data?.session?.access_token || null;
    return token;
  } catch (error) {
    console.error('Error fetching auth token:', error);
    return null;
  }
}
