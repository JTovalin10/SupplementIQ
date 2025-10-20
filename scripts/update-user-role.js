/**
 * Update user role to owner
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function updateUserRole() {
  try {
    // Get auth users
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('Error fetching auth users:', authError);
      return;
    }

    for (const authUser of authUsers.users) {
      console.log(`Updating role for: ${authUser.email}`);
      
      // Update user role to owner
      const { error: updateError } = await supabase
        .from('users')
        .update({ role: 'owner' })
        .eq('id', authUser.id);

      if (updateError) {
        console.error('Error updating user role:', updateError);
      } else {
        console.log(`✅ Updated role to 'owner' for: ${authUser.email}`);
      }
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

updateUserRole();
