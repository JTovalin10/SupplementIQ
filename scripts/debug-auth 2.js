#!/usr/bin/env node

/**
 * Debug script to test authentication flow
 * Run this to check if the authentication is working properly
 */

const { createClient } = require('@supabase/supabase-js');

// You'll need to replace these with your actual Supabase credentials
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase credentials. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testAuth() {
  console.log('🔍 Testing authentication flow...\n');
  
  try {
    // 1. Check current session
    console.log('1. Checking current session...');
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('❌ Session error:', sessionError.message);
      return;
    }
    
    if (!session) {
      console.log('❌ No active session found');
      console.log('💡 Please log in to your owner account first');
      return;
    }
    
    console.log('✅ Session found');
    console.log('   User ID:', session.user.id);
    console.log('   Email:', session.user.email);
    console.log('   Has access token:', !!session.access_token);
    
    // 2. Test token validation
    console.log('\n2. Testing token validation...');
    const { data: { user }, error: userError } = await supabase.auth.getUser(session.access_token);
    
    if (userError) {
      console.error('❌ Token validation error:', userError.message);
      return;
    }
    
    if (!user) {
      console.error('❌ No user found for token');
      return;
    }
    
    console.log('✅ Token validation successful');
    console.log('   User ID:', user.id);
    
    // 3. Check user profile in database
    console.log('\n3. Checking user profile in database...');
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();
    
    if (profileError) {
      console.error('❌ Profile fetch error:', profileError.message);
      console.log('   This might be the issue - user profile not found in database');
      return;
    }
    
    console.log('✅ User profile found');
    console.log('   Username:', profile.username);
    console.log('   Role:', profile.role);
    console.log('   Email:', profile.email);
    
    // 4. Check if role allows admin access
    console.log('\n4. Checking admin access permissions...');
    const allowedRoles = ['admin', 'owner', 'moderator'];
    const hasAdminAccess = allowedRoles.includes(profile.role);
    
    if (hasAdminAccess) {
      console.log('✅ User has admin access with role:', profile.role);
    } else {
      console.log('❌ User does NOT have admin access');
      console.log('   Current role:', profile.role);
      console.log('   Required roles:', allowedRoles.join(', '));
      console.log('\n💡 To fix this, you need to update your role in the database:');
      console.log(`   UPDATE users SET role = 'owner' WHERE id = '${user.id}';`);
      return;
    }
    
    // 5. Test API endpoint
    console.log('\n5. Testing dashboard API endpoint...');
    const response = await fetch('http://localhost:3000/api/v1/admin/dashboard/stats', {
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('   Response status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ API call successful');
      console.log('   Data keys:', Object.keys(data.data || {}));
    } else {
      const error = await response.text();
      console.log('❌ API call failed');
      console.log('   Error:', error);
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

// Run the test
testAuth();
