import { Request, Response } from 'express';
import { mockSupabaseClient } from '../mocks/supabase';

/**
 * Test utility functions for backend testing
 */

export interface MockUser {
  id: string;
  email: string;
  user_metadata: {
    full_name: string;
    role?: 'admin' | 'moderator' | 'user';
  };
  app_metadata: {
    provider: string;
  };
}

export interface MockProduct {
  id: string;
  name: string;
  brand: string;
  category: string;
  price: number;
  image_url?: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface MockContribution {
  id: string;
  product_id: string;
  user_id: string;
  contribution_type: 'review' | 'rating' | 'photo' | 'correction';
  content: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
}

export interface MockRanking {
  id: string;
  product_id: string;
  category: string;
  rank: number;
  score: number;
  criteria: 'overall_quality' | 'transparency_score' | 'value_for_money' | 'effectiveness';
  created_at: string;
  updated_at: string;
}

export interface MockIngredient {
  id: string;
  name: string;
  category: string;
  description: string;
  benefits: string[];
  side_effects: string[];
  dosage_range: string;
  created_at: string;
  updated_at: string;
}

/**
 * Create a mock user for testing
 */
export const createMockUser = (overrides: Partial<MockUser> = {}): MockUser => ({
  id: 'test-user-id',
  email: 'test@example.com',
  user_metadata: {
    full_name: 'Test User',
    role: 'user',
  },
  app_metadata: {
    provider: 'email',
  },
  ...overrides,
});

/**
 * Create a mock admin user for testing
 */
export const createMockAdmin = (overrides: Partial<MockUser> = {}): MockUser => 
  createMockUser({ 
    user_metadata: { full_name: 'Test Admin', role: 'admin' },
    ...overrides 
  });

/**
 * Create a mock product for testing
 */
export const createMockProduct = (overrides: Partial<MockProduct> = {}): MockProduct => ({
  id: 'test-product-id',
  name: 'Test Product',
  brand: 'Test Brand',
  category: 'protein',
  price: 29.99,
  image_url: 'https://example.com/image.jpg',
  description: 'Test product description',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
});

/**
 * Create a mock contribution for testing
 */
export const createMockContribution = (overrides: Partial<MockContribution> = {}): MockContribution => ({
  id: 'test-contribution-id',
  product_id: 'test-product-id',
  user_id: 'test-user-id',
  contribution_type: 'review',
  content: 'Test contribution content',
  status: 'pending',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
});

/**
 * Create a mock ranking for testing
 */
export const createMockRanking = (overrides: Partial<MockRanking> = {}): MockRanking => ({
  id: 'test-ranking-id',
  product_id: 'test-product-id',
  category: 'protein',
  rank: 1,
  score: 95.5,
  criteria: 'overall_quality',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
});

/**
 * Create a mock ingredient for testing
 */
export const createMockIngredient = (overrides: Partial<MockIngredient> = {}): MockIngredient => ({
  id: 'test-ingredient-id',
  name: 'Test Ingredient',
  category: 'performance',
  description: 'Test ingredient description',
  benefits: ['Test benefit 1', 'Test benefit 2'],
  side_effects: ['Test side effect'],
  dosage_range: '5-10g per day',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
});

/**
 * Create a mock Supabase query builder
 */
export const createMockQueryBuilder = () => ({
  select: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  delete: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  neq: jest.fn().mockReturnThis(),
  gt: jest.fn().mockReturnThis(),
  gte: jest.fn().mockReturnThis(),
  lt: jest.fn().mockReturnThis(),
  lte: jest.fn().mockReturnThis(),
  like: jest.fn().mockReturnThis(),
  ilike: jest.fn().mockReturnThis(),
  is: jest.fn().mockReturnThis(),
  in: jest.fn().mockReturnThis(),
  contains: jest.fn().mockReturnThis(),
  containedBy: jest.fn().mockReturnThis(),
  rangeGt: jest.fn().mockReturnThis(),
  rangeGte: jest.fn().mockReturnThis(),
  rangeLt: jest.fn().mockReturnThis(),
  rangeLte: jest.fn().mockReturnThis(),
  rangeAdjacent: jest.fn().mockReturnThis(),
  overlaps: jest.fn().mockReturnThis(),
  textSearch: jest.fn().mockReturnThis(),
  match: jest.fn().mockReturnThis(),
  not: jest.fn().mockReturnThis(),
  or: jest.fn().mockReturnThis(),
  filter: jest.fn().mockReturnThis(),
  order: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  range: jest.fn().mockReturnThis(),
  abortSignal: jest.fn().mockReturnThis(),
  single: jest.fn(),
  maybeSingle: jest.fn(),
  csv: jest.fn(),
  geojson: jest.fn(),
  explain: jest.fn(),
  rollback: jest.fn(),
  returns: jest.fn().mockReturnThis(),
});

/**
 * Setup mock Supabase responses
 */
export const setupMockSupabase = () => {
  const mockQueryBuilder = createMockQueryBuilder();
  mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
  return mockQueryBuilder;
};

/**
 * Create a mock Express request
 */
export const createMockRequest = (overrides: Partial<Request> = {}): Partial<Request> => ({
  body: {},
  params: {},
  query: {},
  headers: {},
  get: jest.fn(),
  ...overrides,
});

/**
 * Create a mock Express response
 */
export const createMockResponse = (): Partial<Response> => {
  const res: Partial<Response> = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  res.end = jest.fn().mockReturnValue(res);
  res.set = jest.fn().mockReturnValue(res);
  res.header = jest.fn().mockReturnValue(res);
  res.cookie = jest.fn().mockReturnValue(res);
  res.clearCookie = jest.fn().mockReturnValue(res);
  return res;
};

/**
 * Create a mock NextFunction
 */
export const createMockNext = () => jest.fn();

/**
 * Generate a random UUID for testing
 */
export const generateTestUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

/**
 * Generate test pagination data
 */
export const createPaginationData = <T>(items: T[], page: number = 1, limit: number = 10) => ({
  data: items,
  pagination: {
    page,
    limit,
    total: items.length,
    totalPages: Math.ceil(items.length / limit),
    hasNext: page < Math.ceil(items.length / limit),
    hasPrev: page > 1,
  },
});

/**
 * Common test assertions for API responses
 */
export const expectApiResponse = (response: any, expectedStatus: number, expectedKeys?: string[]) => {
  expect(response.status).toBe(expectedStatus);
  expect(response.body).toBeDefined();
  
  if (expectedKeys) {
    expectedKeys.forEach(key => {
      expect(response.body).toHaveProperty(key);
    });
  }
};

/**
 * Common test assertions for error responses
 */
export const expectErrorResponse = (response: any, expectedStatus: number, expectedError?: string) => {
  expect(response.status).toBe(expectedStatus);
  expect(response.body).toHaveProperty('error');
  
  if (expectedError) {
    expect(response.body.error).toBe(expectedError);
  }
};

/**
 * Test data cleanup helper
 */
export const cleanupTestData = async () => {
  // Reset all mocks
  jest.clearAllMocks();
  
  // Clear any test data if needed
  // This would be used in integration tests with real database
};
