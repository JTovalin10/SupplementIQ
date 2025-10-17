import { supabase } from '@/lib/supabase/client';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = params.id;
    
    if (!userId) {
      throw new Error("User ID is not defined");
    }

    const { data: user, error } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single();

    if (error || !user) {
      return NextResponse.json(
        { error: 'User not found or error fetching role' },
        { status: 404 }
      );
    }

    const rawRole = user.role as string | undefined;
    const normalize = (r?: string) => {
      if (!r) return null;
      const lc = r.toLowerCase();
      if (lc === 'authenticated user' || lc === 'auth' || lc === 'member' || lc === 'user') return 'newcomer' as const;
      if (['newcomer','contributor','trusted_editor','moderator','admin','owner'].includes(lc)) return lc as any;
      return null;
    };
    const role = normalize(rawRole);
    return NextResponse.json({ role });

  } catch (error) {
    console.error("Failed to get user role:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
