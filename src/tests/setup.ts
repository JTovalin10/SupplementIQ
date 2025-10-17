import { config } from 'dotenv';

// Load test environment variables
config({ path: '.env.test' });

// Set default environment variables for testing
process.env.NODE_ENV = 'test';
process.env.NEXT_PUBLIC_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'test-anon-key';
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'test-service-key';

// Mock console methods to reduce noise in tests
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

beforeAll(() => {
  console.error = jest.fn();
  console.warn = jest.fn();
});

afterAll(() => {
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
});

// Global test utilities
global.testUtils = {
  createMockUser: () => ({
    id: 'test-user-id',
    email: 'test@example.com',
    user_metadata: {
      full_name: 'Test User',
    },
    app_metadata: {
      provider: 'email',
    },
  }),
  
  createMockProduct: () => ({
    id: 'test-product-id',
    name: 'Test Product',
    brand: 'Test Brand',
    category: 'protein',
    price: 29.99,
    image_url: 'https://example.com/image.jpg',
    description: 'Test product description',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }),

  createMockContribution: () => ({
    id: 'test-contribution-id',
    product_id: 'test-product-id',
    user_id: 'test-user-id',
    contribution_type: 'review',
    content: 'Test contribution content',
    status: 'pending',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }),
};
