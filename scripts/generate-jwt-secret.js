#!/usr/bin/env node

/**
 * Generate a secure JWT secret
 * Usage: node scripts/generate-jwt-secret.js
 */

const crypto = require('crypto');

function generateJWTSecret() {
  const secret = crypto.randomBytes(64).toString('hex');
  console.log('Generated JWT Secret:');
  console.log(secret);
  console.log('\nAdd this to your .env.local file:');
  console.log(`JWT_SECRET=${secret}`);
}

generateJWTSecret();
