#!/usr/bin/env node

// Script to sync root .env to frontend/.env.local
const fs = require('fs');
const path = require('path');

const rootEnvPath = path.join(__dirname, '.env');
const frontendEnvPath = path.join(__dirname, 'frontend', '.env.local');

try {
  // Check if root .env exists
  if (!fs.existsSync(rootEnvPath)) {
    console.error('❌ Root .env file not found!');
    process.exit(1);
  }

  // Read root .env content
  const envContent = fs.readFileSync(rootEnvPath, 'utf8');
  
  // Write to frontend/.env.local
  fs.writeFileSync(frontendEnvPath, envContent);
  
  console.log('✅ Environment variables synced from root .env to frontend/.env.local');
} catch (error) {
  console.error('❌ Error syncing environment variables:', error.message);
  process.exit(1);
}
