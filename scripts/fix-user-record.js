/**
 * Fix existing user - Create user record for existing Supabase auth user
 * Run this to create the missing user record for your owner account
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createUserRecord() {
  try {
    // Get your user ID from Supabase auth
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('Error fetching auth users:', authError);
      return;
    }

    console.log('Found auth users:', authUsers.users.length);

    for (const authUser of authUsers.users) {
      // Check if user record already exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('id', authUser.id)
        .single();

      if (!existingUser) {
        console.log(`Creating user record for: ${authUser.email}`);
        
        // Create user record
        const { error: userError } = await supabase
          .from('users')
          .insert({
            id: authUser.id,
            email: authUser.email,
            username: authUser.user_metadata?.username || authUser.email?.split('@')[0],
            role: 'owner', // Set your role here
            created_at: new Date().toISOString(),
          });

        if (userError) {
          console.error('Error creating user record:', userError);
        } else {
          console.log(`✅ Created user record for: ${authUser.email}`);
        }
      } else {
        console.log(`User record already exists for: ${authUser.email}`);
      }
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

createUserRecord();
