const bcrypt = require('bcryptjs');

// Test users data
const testUsers = [
  {
    email: 'owner@example.com',
    username: 'owner_user',
    role: 'owner',
    password: 'password123'
  },
  {
    email: 'admin@example.com',
    username: 'admin_user',
    role: 'admin',
    password: 'password123'
  },
  {
    email: 'moderator@example.com',
    username: 'moderator_user',
    role: 'moderator',
    password: 'password123'
  },
  {
    email: 'user@example.com',
    username: 'regular_user',
    role: 'user',
    password: 'password123'
  }
];

async function createTestUsers() {
  console.log('Creating test users...');
  
  for (const userData of testUsers) {
    try {
      // Hash the password
      const passwordHash = await bcrypt.hash(userData.password, 12);
      
      console.log(`Creating user: ${userData.email} (${userData.role})`);
      console.log(`Username: ${userData.username}`);
      console.log(`Password: ${userData.password}`);
      console.log(`Hashed password: ${passwordHash}`);
      console.log('---');
      
      // You can copy these SQL INSERT statements to your Supabase SQL editor
      console.log(`INSERT INTO users (email, username, role, password_hash, created_at, updated_at) VALUES (
        '${userData.email}',
        '${userData.username}',
        '${userData.role}',
        '${passwordHash}',
        NOW(),
        NOW()
      );`);
      console.log('');
      
    } catch (error) {
      console.error(`Error creating user ${userData.email}:`, error);
    }
  }
  
  console.log('Test users created! You can now use these credentials to login.');
  console.log('Copy the INSERT statements above and run them in your Supabase SQL editor.');
}

createTestUsers().catch(console.error);
