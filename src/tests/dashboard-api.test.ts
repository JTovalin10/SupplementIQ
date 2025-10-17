/**
 * Dashboard API Tests
 * Tests the dashboard endpoints to identify issues
 */

import express from 'express';
import request from 'supertest';
import { apiRoutes } from '../routes';

const app = express();
app.use(express.json());
app.use('/api/v1', apiRoutes);

describe('Dashboard API Tests', () => {
  
  test('Health endpoint should respond', async () => {
    const response = await request(app)
      .get('/api/v1/admin/health')
      .expect('Content-Type', /json/);
    
    console.log('Health response:', response.status, response.body);
  });

  test('Dashboard stats endpoint without auth should fail gracefully', async () => {
    const response = await request(app)
      .get('/api/v1/admin/dashboard/stats')
      .expect('Content-Type', /json/);
    
    console.log('Stats response:', response.status, response.body);
  });

  test('Pending submissions endpoint without auth should fail gracefully', async () => {
    const response = await request(app)
      .get('/api/v1/admin/dashboard/pending-submissions')
      .expect('Content-Type', /json/);
    
    console.log('Pending submissions response:', response.status, response.body);
  });

  test('Recent activity endpoint without auth should fail gracefully', async () => {
    const response = await request(app)
      .get('/api/v1/admin/dashboard/recent-activity')
      .expect('Content-Type', /json/);
    
    console.log('Recent activity response:', response.status, response.body);
  });

  test('Autocomplete endpoint should work', async () => {
    const response = await request(app)
      .get('/api/v1/autocomplete/products?q=whey')
      .expect('Content-Type', /json/);
    
    console.log('Autocomplete response:', response.status, response.body);
  });

});

// Test individual components
describe('Component Tests', () => {
  
  test('Supabase connection test', async () => {
    try {
      const { supabase } = await import('../lib/supabase');
      const { data, error } = await supabase.from('users').select('count').limit(1);
      console.log('Supabase connection test:', { data, error });
    } catch (err) {
      console.error('Supabase connection error:', err);
    }
  });

  test('Admin cache test', async () => {
    try {
      const { adminCache } = await import('../lib/core/admin-cache');
      const testId = 'test-admin-id';
      const isAdmin = await adminCache.isUserAdmin(testId);
      console.log('Admin cache test:', { isAdmin });
    } catch (err) {
      console.error('Admin cache error:', err);
    }
  });

  test('SecurityTree service test', async () => {
    try {
      const { securityService } = await import('../lib/cpp-wrappers/security-tree');
      if (securityService) {
        const timestamp = securityService.getCurrentTimestamp();
        console.log('SecurityTree service test:', { timestamp, serviceAvailable: true });
      } else {
        console.log('SecurityTree service test: service not available');
      }
    } catch (err) {
      console.error('SecurityTree service error:', err);
    }
  });

});

// Test middleware
describe('Middleware Tests', () => {
  
  test('Admin auth middleware test', async () => {
    try {
      const { adminAuth } = await import('../middleware/auth');
      console.log('Admin auth middleware loaded:', !!adminAuth);
    } catch (err) {
      console.error('Admin auth middleware error:', err);
    }
  });

});

// Run tests
async function runTests() {
  console.log('🧪 Starting Dashboard API Tests...\n');
  
  try {
    // Test 1: Health endpoint
    console.log('1. Testing health endpoint...');
    const healthResponse = await request(app).get('/api/v1/admin/health');
    console.log('Health:', healthResponse.status, healthResponse.text);
    
    // Test 2: Dashboard stats
    console.log('\n2. Testing dashboard stats...');
    const statsResponse = await request(app).get('/api/v1/admin/dashboard/stats');
    console.log('Stats:', statsResponse.status, statsResponse.text);
    
    // Test 3: Supabase connection
    console.log('\n3. Testing Supabase connection...');
    try {
      const { supabase } = await import('../lib/supabase');
      const { data, error } = await supabase.from('users').select('count').limit(1);
      console.log('Supabase:', { data, error });
    } catch (err) {
      console.error('Supabase error:', err.message);
    }
    
    // Test 4: Admin cache
    console.log('\n4. Testing admin cache...');
    try {
      const { adminCache } = await import('../lib/core/admin-cache');
      console.log('Admin cache loaded:', !!adminCache);
    } catch (err) {
      console.error('Admin cache error:', err.message);
    }
    
    // Test 5: SecurityTree
    console.log('\n5. Testing SecurityTree...');
    try {
      const { securityService } = await import('../lib/cpp-wrappers/security-tree');
      console.log('SecurityTree available:', !!securityService);
    } catch (err) {
      console.error('SecurityTree error:', err.message);
    }
    
    console.log('\n✅ Tests completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run if called directly
if (require.main === module) {
  runTests();
}

export { runTests };
