// Test user creation script
// Run this to create a test user for development

import { createClient } from '@/lib/supabase/client';

const supabase = createClient();

export async function createTestUser() {
  const testUser = {
    email: 'test@supplementiq.com',
    password: 'TestPassword123!',
    username: 'testuser'
  };

  try {
    console.log('Creating test user...');
    
    const { data, error } = await supabase.auth.signUp({
      email: testUser.email,
      password: testUser.password,
      options: {
        data: {
          username: testUser.username,
        },
      },
    });

    if (error) {
      console.error('Error creating user:', error.message);
      return { success: false, error: error.message };
    }

    if (data.user) {
      console.log('✅ Test user created successfully!');
      console.log('Email:', testUser.email);
      console.log('Password:', testUser.password);
      console.log('Username:', testUser.username);
      
      // Note: In development, Supabase might require email confirmation
      console.log('Note: You may need to confirm the email in your Supabase dashboard');
      
      return { success: true, user: data.user };
    }

  } catch (error) {
    console.error('Unexpected error:', error);
    return { success: false, error: 'Unexpected error occurred' };
  }
}

// Usage:
// import { createTestUser } from '@/lib/create-test-user';
// createTestUser();
