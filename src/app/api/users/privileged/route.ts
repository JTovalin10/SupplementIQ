import { supabase } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

// Returns all privileged users (moderator, admin, owner) with minimal fields for seeding
export async function GET(_request: NextRequest) {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, role')
      .in('role', ['moderator', 'admin', 'owner']);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const users = (data || []).map((u: { id: string; role: string }) => ({
      userId: u.id,
      role: u.role,
    }));

    return NextResponse.json({ users });
  } catch (e) {
    return NextResponse.json({ error: 'Failed to fetch privileged users' }, { status: 500 });
  }
}


