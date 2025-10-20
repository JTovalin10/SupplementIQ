/**
 * Add missing role column to users table
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addRoleColumn() {
  try {
    console.log('Adding role column to users table...');
    
    // First, create the user_role enum if it doesn't exist
    const { error: enumError } = await supabase.rpc('exec_sql', {
      sql: `
        DO $$ 
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
            CREATE TYPE user_role AS ENUM ('newcomer', 'contributor', 'trusted_editor', 'moderator', 'admin', 'owner');
          END IF;
        END $$;
      `
    });

    if (enumError) {
      console.error('Error creating enum:', enumError);
    } else {
      console.log('✅ Created user_role enum');
    }

    // Add role column if it doesn't exist
    const { error: columnError } = await supabase.rpc('exec_sql', {
      sql: `
        DO $$ 
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'role') THEN
            ALTER TABLE public.users ADD COLUMN role user_role DEFAULT 'newcomer';
          END IF;
        END $$;
      `
    });

    if (columnError) {
      console.error('Error adding role column:', columnError);
    } else {
      console.log('✅ Added role column to users table');
    }

    // Update existing user to owner
    const { error: updateError } = await supabase
      .from('users')
      .update({ role: 'owner' })
      .eq('email', 'jtovalin10@gmail.com');

    if (updateError) {
      console.error('Error updating user role:', updateError);
    } else {
      console.log('✅ Updated user role to owner');
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

addRoleColumn();
