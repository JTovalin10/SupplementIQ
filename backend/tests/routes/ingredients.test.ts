import express from 'express';
import request from 'supertest';
import ingredientRoutes from '../../routes/ingredients';
import { mockSupabaseClient } from '../mocks/supabase';

// Mock the supabase module
jest.mock('../../lib/supabase', () => ({
  supabase: mockSupabaseClient,
  getAuthenticatedUser: jest.fn(),
}));

const app = express();
app.use(express.json());
app.use('/api/ingredients', ingredientRoutes);

describe('Ingredient Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/ingredients', () => {
    it('should get all ingredients with default pagination', async () => {
      const mockIngredients = [
        {
          id: 'ingredient-1',
          name: 'Whey Protein Isolate',
          category: 'protein',
          description: 'High-quality protein isolate',
          benefits: ['Muscle growth', 'Recovery'],
          side_effects: ['Digestive issues'],
          dosage_range: '20-40g per serving',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: 'ingredient-2',
          name: 'Creatine Monohydrate',
          category: 'performance',
          description: 'Creatine supplement for strength',
          benefits: ['Strength gains', 'Power output'],
          side_effects: ['Water retention'],
          dosage_range: '3-5g per day',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
      };

      mockQueryBuilder.select.mockResolvedValue({
        data: mockIngredients,
        error: null,
        count: mockIngredients.length,
      });

      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);

      const response = await request(app).get('/api/ingredients');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('ingredients');
      expect(response.body).toHaveProperty('pagination');
      expect(response.body.ingredients).toHaveLength(2);
    });

    it('should filter ingredients by category', async () => {
      const mockIngredients = [
        {
          id: 'ingredient-1',
          name: 'Whey Protein Isolate',
          category: 'protein',
          description: 'High-quality protein isolate',
          benefits: ['Muscle growth', 'Recovery'],
          side_effects: ['Digestive issues'],
          dosage_range: '20-40g per serving',
        },
      ];

      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
      };

      mockQueryBuilder.select.mockResolvedValue({
        data: mockIngredients,
        error: null,
        count: 1,
      });

      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);

      const response = await request(app).get('/api/ingredients?category=protein');

      expect(response.status).toBe(200);
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('category', 'protein');
    });

    it('should search ingredients by name', async () => {
      const mockIngredients = [
        {
          id: 'ingredient-1',
          name: 'Whey Protein Isolate',
          category: 'protein',
          description: 'High-quality protein isolate',
        },
      ];

      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        ilike: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
      };

      mockQueryBuilder.select.mockResolvedValue({
        data: mockIngredients,
        error: null,
        count: 1,
      });

      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);

      const response = await request(app).get('/api/ingredients?search=whey');

      expect(response.status).toBe(200);
      expect(mockQueryBuilder.ilike).toHaveBeenCalledWith('name', '%whey%');
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

      const response = await request(app).get('/api/ingredients');

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error', 'Database connection failed');
    });
  });

  describe('GET /api/ingredients/:id', () => {
    it('should get a single ingredient by ID', async () => {
      const mockIngredient = {
        id: 'ingredient-1',
        name: 'Whey Protein Isolate',
        category: 'protein',
        description: 'High-quality protein isolate',
        benefits: ['Muscle growth', 'Recovery'],
        side_effects: ['Digestive issues'],
        dosage_range: '20-40g per serving',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn(),
      };

      mockQueryBuilder.single.mockResolvedValue({
        data: mockIngredient,
        error: null,
      });

      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);

      const response = await request(app).get('/api/ingredients/ingredient-1');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockIngredient);
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('id', 'ingredient-1');
    });

    it('should return 404 for non-existent ingredient', async () => {
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn(),
      };

      mockQueryBuilder.single.mockResolvedValue({
        data: null,
        error: { message: 'Ingredient not found' },
      });

      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);

      const response = await request(app).get('/api/ingredients/non-existent-id');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Ingredient not found');
    });

    it('should return 400 for invalid UUID', async () => {
      const response = await request(app).get('/api/ingredients/invalid-uuid');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Invalid ingredient ID');
    });
  });

  describe('POST /api/ingredients', () => {
    it('should create a new ingredient when authenticated as admin', async () => {
      const mockAdmin = { ...global.testUtils.createMockUser(), user_metadata: { role: 'admin' } };
      const { getAuthenticatedUser } = require('../../lib/supabase');
      getAuthenticatedUser.mockResolvedValue(mockAdmin);

      const mockIngredient = {
        id: 'ingredient-1',
        name: 'New Ingredient',
        category: 'performance',
        description: 'New ingredient description',
        benefits: ['Benefit 1', 'Benefit 2'],
        side_effects: ['Side effect 1'],
        dosage_range: '5-10g per day',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const mockQueryBuilder = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn(),
      };

      mockQueryBuilder.single.mockResolvedValue({
        data: mockIngredient,
        error: null,
      });

      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);

      const newIngredient = {
        name: 'New Ingredient',
        category: 'performance',
        description: 'New ingredient description',
        benefits: ['Benefit 1', 'Benefit 2'],
        side_effects: ['Side effect 1'],
        dosage_range: '5-10g per day',
      };

      const response = await request(app)
        .post('/api/ingredients')
        .set('Authorization', 'Bearer admin-token')
        .send(newIngredient);

      expect(response.status).toBe(201);
      expect(response.body).toEqual(mockIngredient);
      expect(mockQueryBuilder.insert).toHaveBeenCalledWith([newIngredient]);
    });

    it('should return 401 when not authenticated', async () => {
      const { getAuthenticatedUser } = require('../../lib/supabase');
      getAuthenticatedUser.mockResolvedValue(null);

      const newIngredient = {
        name: 'New Ingredient',
        category: 'performance',
        description: 'New ingredient description',
      };

      const response = await request(app)
        .post('/api/ingredients')
        .send(newIngredient);

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error', 'Unauthorized');
    });

    it('should return 403 when not admin', async () => {
      const mockUser = { ...global.testUtils.createMockUser(), user_metadata: { role: 'user' } };
      const { getAuthenticatedUser } = require('../../lib/supabase');
      getAuthenticatedUser.mockResolvedValue(mockUser);

      const newIngredient = {
        name: 'New Ingredient',
        category: 'performance',
        description: 'New ingredient description',
      };

      const response = await request(app)
        .post('/api/ingredients')
        .set('Authorization', 'Bearer user-token')
        .send(newIngredient);

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error', 'Admin access required');
    });

    it('should validate required fields', async () => {
      const mockAdmin = { ...global.testUtils.createMockUser(), user_metadata: { role: 'admin' } };
      const { getAuthenticatedUser } = require('../../lib/supabase');
      getAuthenticatedUser.mockResolvedValue(mockAdmin);

      const response = await request(app)
        .post('/api/ingredients')
        .set('Authorization', 'Bearer admin-token')
        .send({
          // missing required fields
          name: 'New Ingredient',
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('PUT /api/ingredients/:id', () => {
    it('should update an ingredient when authenticated as admin', async () => {
      const mockAdmin = { ...global.testUtils.createMockUser(), user_metadata: { role: 'admin' } };
      const { getAuthenticatedUser } = require('../../lib/supabase');
      getAuthenticatedUser.mockResolvedValue(mockAdmin);

      const updatedIngredient = {
        id: 'ingredient-1',
        name: 'Updated Ingredient',
        category: 'performance',
        description: 'Updated ingredient description',
        benefits: ['Updated benefit'],
        side_effects: ['Updated side effect'],
        dosage_range: '10-15g per day',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const mockQueryBuilder = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn(),
      };

      mockQueryBuilder.single.mockResolvedValue({
        data: updatedIngredient,
        error: null,
      });

      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);

      const updateData = { 
        name: 'Updated Ingredient',
        description: 'Updated ingredient description',
      };

      const response = await request(app)
        .put('/api/ingredients/ingredient-1')
        .set('Authorization', 'Bearer admin-token')
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(updatedIngredient);
      expect(mockQueryBuilder.update).toHaveBeenCalledWith(updateData);
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('id', 'ingredient-1');
    });

    it('should return 404 for non-existent ingredient', async () => {
      const mockAdmin = { ...global.testUtils.createMockUser(), user_metadata: { role: 'admin' } };
      const { getAuthenticatedUser } = require('../../lib/supabase');
      getAuthenticatedUser.mockResolvedValue(mockAdmin);

      const mockQueryBuilder = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn(),
      };

      mockQueryBuilder.single.mockResolvedValue({
        data: null,
        error: { message: 'Ingredient not found' },
      });

      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);

      const updateData = { name: 'Updated Ingredient' };

      const response = await request(app)
        .put('/api/ingredients/non-existent-id')
        .set('Authorization', 'Bearer admin-token')
        .send(updateData);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Ingredient not found');
    });
  });

  describe('DELETE /api/ingredients/:id', () => {
    it('should delete an ingredient when authenticated as admin', async () => {
      const mockAdmin = { ...global.testUtils.createMockUser(), user_metadata: { role: 'admin' } };
      const { getAuthenticatedUser } = require('../../lib/supabase');
      getAuthenticatedUser.mockResolvedValue(mockAdmin);

      const mockIngredient = {
        id: 'ingredient-1',
        name: 'Ingredient to Delete',
        category: 'performance',
        description: 'This ingredient will be deleted',
      };

      const mockQueryBuilder = {
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn(),
      };

      mockQueryBuilder.single.mockResolvedValue({
        data: mockIngredient,
        error: null,
      });

      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);

      const response = await request(app)
        .delete('/api/ingredients/ingredient-1')
        .set('Authorization', 'Bearer admin-token');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Ingredient deleted successfully');
      expect(mockQueryBuilder.delete).toHaveBeenCalled();
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('id', 'ingredient-1');
    });

    it('should return 404 for non-existent ingredient', async () => {
      const mockAdmin = { ...global.testUtils.createMockUser(), user_metadata: { role: 'admin' } };
      const { getAuthenticatedUser } = require('../../lib/supabase');
      getAuthenticatedUser.mockResolvedValue(mockAdmin);

      const mockQueryBuilder = {
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn(),
      };

      mockQueryBuilder.single.mockResolvedValue({
        data: null,
        error: { message: 'Ingredient not found' },
      });

      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);

      const response = await request(app)
        .delete('/api/ingredients/non-existent-id')
        .set('Authorization', 'Bearer admin-token');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Ingredient not found');
    });
  });

  describe('GET /api/ingredients/category/:category', () => {
    it('should get ingredients by category', async () => {
      const mockIngredients = [
        {
          id: 'ingredient-1',
          name: 'Whey Protein Isolate',
          category: 'protein',
          description: 'High-quality protein isolate',
        },
        {
          id: 'ingredient-2',
          name: 'Casein Protein',
          category: 'protein',
          description: 'Slow-digesting protein',
        },
      ];

      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
      };

      mockQueryBuilder.select.mockResolvedValue({
        data: mockIngredients,
        error: null,
        count: mockIngredients.length,
      });

      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);

      const response = await request(app).get('/api/ingredients/category/protein');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('ingredients');
      expect(response.body).toHaveProperty('pagination');
      expect(response.body.ingredients).toHaveLength(2);
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('category', 'protein');
    });

    it('should return empty array for non-existent category', async () => {
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
      };

      mockQueryBuilder.select.mockResolvedValue({
        data: [],
        error: null,
        count: 0,
      });

      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);

      const response = await request(app).get('/api/ingredients/category/non-existent');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('ingredients');
      expect(response.body.ingredients).toHaveLength(0);
    });
  });

  describe('GET /api/ingredients/search', () => {
    it('should search ingredients with query parameter', async () => {
      const mockIngredients = [
        {
          id: 'ingredient-1',
          name: 'Whey Protein Isolate',
          category: 'protein',
          description: 'High-quality protein isolate',
        },
      ];

      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        or: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
      };

      mockQueryBuilder.select.mockResolvedValue({
        data: mockIngredients,
        error: null,
        count: 1,
      });

      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);

      const response = await request(app).get('/api/ingredients/search?q=whey');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('ingredients');
      expect(response.body.ingredients).toHaveLength(1);
    });

    it('should return 400 for missing search query', async () => {
      const response = await request(app).get('/api/ingredients/search');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Search query is required');
    });
  });
});
