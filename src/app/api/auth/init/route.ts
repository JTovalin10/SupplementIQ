import { createClient } from '@/lib/database/supabase/server';
import { addUser, getUserRole } from '@/lib/utils/cache/securityCache/securityHelper';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = await createClient();
    // Authenticate the user by contacting Supabase Auth server
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
      return NextResponse.json({ session: null, role: null });
    }

    // Also obtain the session to hydrate client state
    const { data: sessionData } = await supabase.auth.getSession();
    const session = sessionData.session ?? null;

    const userId = userData.user.id;
    // Try cache first (process memory or native cache)
    const cachedRole = getUserRole(userId);
    if (cachedRole) {
      return NextResponse.json({ session, role: cachedRole });
    }

    const { data: roleData } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single();

    const rawRole = (roleData?.role as string | undefined) ?? null;
    const normalize = (r: string | null) => {
      if (!r) return null;
      const lc = r.toLowerCase();
      if (lc === 'authenticated user' || lc === 'auth' || lc === 'member') return 'user' as const;
      if (lc === 'moderator' || lc === 'admin' || lc === 'owner' || lc === 'user') return lc as 'moderator' | 'admin' | 'owner' | 'user';
      return null;
    };
    const role = normalize(rawRole);
    if (role) {
      addUser(userId, role);
    }
    return NextResponse.json({ session, role });
  } catch (error) {
    console.error('Initialization error:', error);
    // Never fail hard; return empty auth state
    return NextResponse.json({ session: null, role: null });
  }
}
