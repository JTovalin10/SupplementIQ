/**
 * Check user role in database
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkUserRole() {
  try {
    // Get auth users
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('Error fetching auth users:', authError);
      return;
    }

    for (const authUser of authUsers.users) {
      console.log(`\nChecking user: ${authUser.email}`);
      
      // Check user record in database
      const { data: userRecord, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (userError) {
        console.error('Error fetching user record:', userError);
      } else {
        console.log('User record:', userRecord);
        console.log('Role:', userRecord?.role);
      }
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

checkUserRole();
