#!/usr/bin/env ts-node

/**
 * Dashboard API Diagnostic Script
 * Quick test to identify what's causing the dashboard API failures
 */

import express from 'express';
import request from 'supertest';

async function testDashboardAPIs() {
  console.log('🧪 Dashboard API Diagnostic Test\n');
  
  try {
    // Import the routes
    const { apiRoutes } = await import('../routes');
    
    // Create test app
    const app = express();
    app.use(express.json());
    app.use('/api/v1', apiRoutes);
    
    console.log('1. Testing health endpoint...');
    try {
      const response = await request(app).get('/api/v1/admin/health');
      console.log(`   Status: ${response.status}`);
      console.log(`   Body: ${response.text.substring(0, 200)}...`);
    } catch (err: any) {
      console.error('   Error:', err.message);
    }
    
    console.log('\n2. Testing dashboard stats...');
    try {
      const response = await request(app).get('/api/v1/admin/dashboard/stats');
      console.log(`   Status: ${response.status}`);
      console.log(`   Body: ${response.text.substring(0, 200)}...`);
    } catch (err: any) {
      console.error('   Error:', err.message);
    }
    
    console.log('\n3. Testing autocomplete (should work)...');
    try {
      const response = await request(app).get('/api/v1/autocomplete/products?q=whey');
      console.log(`   Status: ${response.status}`);
      console.log(`   Body: ${response.text.substring(0, 200)}...`);
    } catch (err: any) {
      console.error('   Error:', err.message);
    }
    
    console.log('\n4. Testing Supabase connection...');
    try {
      const { supabase } = await import('../lib/supabase');
      const { data, error } = await supabase.from('users').select('count').limit(1);
      console.log(`   Supabase connection: ${error ? 'FAILED' : 'SUCCESS'}`);
      if (error) console.log(`   Error: ${error.message}`);
    } catch (err: any) {
      console.error('   Supabase import error:', err.message);
    }
    
    console.log('\n5. Testing admin cache...');
    try {
      const { adminCache } = await import('../lib/core/admin-cache');
      console.log(`   Admin cache loaded: SUCCESS`);
    } catch (err: any) {
      console.error('   Admin cache error:', err.message);
    }
    
    console.log('\n6. Testing SecurityTree...');
    try {
      const { securityService } = await import('../lib/cpp-wrappers/security-tree');
      console.log(`   SecurityTree loaded: ${securityService ? 'SUCCESS' : 'FALLBACK'}`);
    } catch (err: any) {
      console.error('   SecurityTree error:', err.message);
    }
    
    console.log('\n7. Testing middleware...');
    try {
      const { adminAuth } = await import('../middleware/auth');
      console.log(`   Admin auth middleware: ${adminAuth ? 'SUCCESS' : 'FAILED'}`);
    } catch (err: any) {
      console.error('   Middleware error:', err.message);
    }
    
    console.log('\n✅ Diagnostic complete!');
    
  } catch (error: any) {
    console.error('❌ Diagnostic failed:', error.message);
    console.error(error.stack);
  }
}

// Run the test
testDashboardAPIs();
