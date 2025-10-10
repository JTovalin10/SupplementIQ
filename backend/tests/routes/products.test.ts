import express from 'express';
import request from 'supertest';
import productRoutes from '../../routes/products';
import { mockSupabaseClient } from '../mocks/supabase';

// Mock the supabase module
jest.mock('../../lib/supabase', () => ({
  supabase: mockSupabaseClient,
  getAuthenticatedUser: jest.fn(),
}));

const app = express();
app.use(express.json());
app.use('/api/products', productRoutes);

describe('Product Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/products', () => {
    it('should get all products with default pagination', async () => {
      const mockProducts = [
        global.testUtils.createMockProduct(),
        { ...global.testUtils.createMockProduct(), id: 'product-2', name: 'Product 2' },
      ];

      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
      };

      mockQueryBuilder.select.mockResolvedValue({
        data: mockProducts,
        error: null,
        count: mockProducts.length,
      });

      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);

      const response = await request(app).get('/api/products');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('products');
      expect(response.body).toHaveProperty('pagination');
      expect(response.body.products).toHaveLength(2);
    });

    it('should filter products by category', async () => {
      const mockProducts = [global.testUtils.createMockProduct()];
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
      };

      mockQueryBuilder.select.mockResolvedValue({
        data: mockProducts,
        error: null,
        count: 1,
      });

      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);

      const response = await request(app).get('/api/products?category=protein');

      expect(response.status).toBe(200);
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('category', 'protein');
    });

    it('should search products by name', async () => {
      const mockProducts = [global.testUtils.createMockProduct()];
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        ilike: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
      };

      mockQueryBuilder.select.mockResolvedValue({
        data: mockProducts,
        error: null,
        count: 1,
      });

      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);

      const response = await request(app).get('/api/products?search=test');

      expect(response.status).toBe(200);
      expect(mockQueryBuilder.ilike).toHaveBeenCalledWith('name', '%test%');
    });

    it('should handle database errors', async () => {
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
      };

      mockQueryBuilder.select.mockResolvedValue({
        data: null,
        error: { message: 'Database connection failed' },
        count: null,
      });

      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);

      const response = await request(app).get('/api/products');

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error', 'Database connection failed');
    });
  });

  describe('GET /api/products/:id', () => {
    it('should get a single product by ID', async () => {
      const mockProduct = global.testUtils.createMockProduct();
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn(),
      };

      mockQueryBuilder.single.mockResolvedValue({
        data: mockProduct,
        error: null,
      });

      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);

      const response = await request(app).get('/api/products/test-product-id');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockProduct);
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('id', 'test-product-id');
    });

    it('should return 404 for non-existent product', async () => {
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn(),
      };

      mockQueryBuilder.single.mockResolvedValue({
        data: null,
        error: { message: 'Product not found' },
      });

      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);

      const response = await request(app).get('/api/products/non-existent-id');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Product not found');
    });

    it('should return 400 for invalid UUID', async () => {
      const response = await request(app).get('/api/products/invalid-uuid');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Invalid product ID');
    });
  });

  describe('POST /api/products', () => {
    it('should create a new product when authenticated as admin', async () => {
      const mockUser = { ...global.testUtils.createMockUser(), user_metadata: { role: 'admin' } };
      const { getAuthenticatedUser } = require('../../lib/supabase');
      getAuthenticatedUser.mockResolvedValue(mockUser);

      const mockProduct = global.testUtils.createMockProduct();
      const mockQueryBuilder = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn(),
      };

      mockQueryBuilder.single.mockResolvedValue({
        data: mockProduct,
        error: null,
      });

      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);

      const newProduct = {
        name: 'New Product',
        brand: 'New Brand',
        category: 'protein',
        price: 29.99,
        description: 'New product description',
      };

      const response = await request(app)
        .post('/api/products')
        .set('Authorization', 'Bearer admin-token')
        .send(newProduct);

      expect(response.status).toBe(201);
      expect(response.body).toEqual(mockProduct);
      expect(mockQueryBuilder.insert).toHaveBeenCalledWith([newProduct]);
    });

    it('should return 401 when not authenticated', async () => {
      const { getAuthenticatedUser } = require('../../lib/supabase');
      getAuthenticatedUser.mockResolvedValue(null);

      const newProduct = {
        name: 'New Product',
        brand: 'New Brand',
        category: 'protein',
        price: 29.99,
      };

      const response = await request(app)
        .post('/api/products')
        .send(newProduct);

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error', 'Unauthorized');
    });

    it('should return 403 when not admin', async () => {
      const mockUser = { ...global.testUtils.createMockUser(), user_metadata: { role: 'user' } };
      const { getAuthenticatedUser } = require('../../lib/supabase');
      getAuthenticatedUser.mockResolvedValue(mockUser);

      const newProduct = {
        name: 'New Product',
        brand: 'New Brand',
        category: 'protein',
        price: 29.99,
      };

      const response = await request(app)
        .post('/api/products')
        .set('Authorization', 'Bearer user-token')
        .send(newProduct);

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error', 'Admin access required');
    });

    it('should validate required fields', async () => {
      const mockUser = { ...global.testUtils.createMockUser(), user_metadata: { role: 'admin' } };
      const { getAuthenticatedUser } = require('../../lib/supabase');
      getAuthenticatedUser.mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/api/products')
        .set('Authorization', 'Bearer admin-token')
        .send({
          // missing required fields
          name: 'New Product',
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('PUT /api/products/:id', () => {
    it('should update a product when authenticated as admin', async () => {
      const mockUser = { ...global.testUtils.createMockUser(), user_metadata: { role: 'admin' } };
      const { getAuthenticatedUser } = require('../../lib/supabase');
      getAuthenticatedUser.mockResolvedValue(mockUser);

      const updatedProduct = { ...global.testUtils.createMockProduct(), name: 'Updated Product' };
      const mockQueryBuilder = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn(),
      };

      mockQueryBuilder.single.mockResolvedValue({
        data: updatedProduct,
        error: null,
      });

      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);

      const updateData = { name: 'Updated Product' };

      const response = await request(app)
        .put('/api/products/test-product-id')
        .set('Authorization', 'Bearer admin-token')
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(updatedProduct);
      expect(mockQueryBuilder.update).toHaveBeenCalledWith(updateData);
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('id', 'test-product-id');
    });

    it('should return 404 for non-existent product', async () => {
      const mockUser = { ...global.testUtils.createMockUser(), user_metadata: { role: 'admin' } };
      const { getAuthenticatedUser } = require('../../lib/supabase');
      getAuthenticatedUser.mockResolvedValue(mockUser);

      const mockQueryBuilder = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn(),
      };

      mockQueryBuilder.single.mockResolvedValue({
        data: null,
        error: { message: 'Product not found' },
      });

      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);

      const updateData = { name: 'Updated Product' };

      const response = await request(app)
        .put('/api/products/non-existent-id')
        .set('Authorization', 'Bearer admin-token')
        .send(updateData);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Product not found');
    });
  });

  describe('DELETE /api/products/:id', () => {
    it('should delete a product when authenticated as admin', async () => {
      const mockUser = { ...global.testUtils.createMockUser(), user_metadata: { role: 'admin' } };
      const { getAuthenticatedUser } = require('../../lib/supabase');
      getAuthenticatedUser.mockResolvedValue(mockUser);

      const mockQueryBuilder = {
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn(),
      };

      mockQueryBuilder.single.mockResolvedValue({
        data: global.testUtils.createMockProduct(),
        error: null,
      });

      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);

      const response = await request(app)
        .delete('/api/products/test-product-id')
        .set('Authorization', 'Bearer admin-token');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Product deleted successfully');
      expect(mockQueryBuilder.delete).toHaveBeenCalled();
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('id', 'test-product-id');
    });

    it('should return 404 for non-existent product', async () => {
      const mockUser = { ...global.testUtils.createMockUser(), user_metadata: { role: 'admin' } };
      const { getAuthenticatedUser } = require('../../lib/supabase');
      getAuthenticatedUser.mockResolvedValue(mockUser);

      const mockQueryBuilder = {
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn(),
      };

      mockQueryBuilder.single.mockResolvedValue({
        data: null,
        error: { message: 'Product not found' },
      });

      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);

      const response = await request(app)
        .delete('/api/products/non-existent-id')
        .set('Authorization', 'Bearer admin-token');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Product not found');
    });
  });

  describe('GET /api/products/search', () => {
    it('should search products with query parameter', async () => {
      const mockProducts = [global.testUtils.createMockProduct()];
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        or: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
      };

      mockQueryBuilder.select.mockResolvedValue({
        data: mockProducts,
        error: null,
        count: 1,
      });

      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);

      const response = await request(app).get('/api/products/search?q=test');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('products');
      expect(response.body.products).toHaveLength(1);
    });

    it('should return 400 for missing search query', async () => {
      const response = await request(app).get('/api/products/search');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Search query is required');
    });
  });
});
