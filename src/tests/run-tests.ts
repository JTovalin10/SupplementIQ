#!/usr/bin/env ts-node

/**
 * Test Runner for SupplementIQ Backend
 * 
 * This script runs all backend tests with proper setup and teardown.
 * It ensures environment variables are set and provides test utilities.
 */

import { execSync } from 'child_process';
import { config } from 'dotenv';
import path from 'path';

// Load environment variables for testing
config({ path: path.join(__dirname, '../.env.test') });

// Set test environment
process.env.NODE_ENV = 'test';

// Set default test environment variables
const testEnv = {
  NODE_ENV: 'test',
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'test-anon-key',
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || 'test-service-key',
  CACHE_TTL: '60',
  CACHE_MAX_SIZE: '100',
  MAX_FILE_SIZE: '1048576',
  ALLOWED_FILE_TYPES: 'image/jpeg,image/png',
  RATE_LIMIT_REQUESTS: '1000',
  RATE_LIMIT_WINDOW: '60000',
};

// Set environment variables
Object.entries(testEnv).forEach(([key, value]) => {
  process.env[key] = value;
});

console.log('🧪 Running SupplementIQ Backend Tests...\n');

try {
  // Run Jest with coverage
  const command = 'jest --coverage --verbose --detectOpenHandles --forceExit';
  execSync(command, { 
    stdio: 'inherit',
    cwd: path.join(__dirname, '..'),
    env: { ...process.env, ...testEnv }
  });
  
  console.log('\n✅ All tests completed successfully!');
} catch (error) {
  console.error('\n❌ Tests failed:', error.message);
  process.exit(1);
}
