import { verifyAdminPermissions } from '@/lib/auth/permissions';
import { supabase } from '@/lib/database/supabase/client';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const role = searchParams.get('role') || '';

    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Authorization header required' }, { status: 401 });
    }

    // Extract user ID from the auth header (assuming it's in format "Bearer <token>")
    const token = authHeader.replace('Bearer ', '');
    
    // Verify admin permissions
    const permissionCheck = await verifyAdminPermissions(token);
    if (!permissionCheck.success) {
      return NextResponse.json({ error: permissionCheck.error }, { status: 403 });
    }

    const offset = (page - 1) * limit;

    // Build the query
    let supabaseQuery = supabase
      .from('users')
      .select(`
        id,
        email,
        username,
        role,
        created_at,
        last_login,
        contribution_count,
        profile:profiles(
          first_name,
          last_name,
          bio,
          avatar_url
        )
      `)
      .order('created_at', { ascending: false });

    // Add search filters
    if (query) {
      supabaseQuery = supabaseQuery.or(`username.ilike.%${query}%,email.ilike.%${query}%,profiles.first_name.ilike.%${query}%,profiles.last_name.ilike.%${query}%`);
    }

    if (role) {
      supabaseQuery = supabaseQuery.eq('role', role);
    }

    // Add pagination
    supabaseQuery = supabaseQuery.range(offset, offset + limit - 1);

    const { data: users, error, count } = await supabaseQuery;

    if (error) {
      console.error('Error searching users:', error);
      return NextResponse.json({ error: 'Failed to search users' }, { status: 500 });
    }

    // Get total count for pagination
    const { count: totalCount } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    return NextResponse.json({
      users: users || [],
      pagination: {
        page,
        limit,
        total: totalCount || 0,
        totalPages: Math.ceil((totalCount || 0) / limit)
      }
    });

  } catch (error) {
    console.error('Error in user search API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
