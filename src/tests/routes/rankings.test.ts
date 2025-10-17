import express from 'express';
import request from 'supertest';
import rankingRoutes from '../../routes/rankings';
import { mockSupabaseClient } from '../mocks/supabase';

// Mock the supabase module
jest.mock('../../lib/supabase', () => ({
  supabase: mockSupabaseClient,
  getAuthenticatedUser: jest.fn(),
}));

const app = express();
app.use(express.json());
app.use('/api/rankings', rankingRoutes);

describe('Ranking Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/rankings', () => {
    it('should get all rankings with default pagination', async () => {
      const mockRankings = [
        {
          id: 'ranking-1',
          product_id: 'product-1',
          category: 'protein',
          rank: 1,
          score: 95.5,
          criteria: 'overall_quality',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: 'ranking-2',
          product_id: 'product-2',
          category: 'protein',
          rank: 2,
          score: 88.2,
          criteria: 'overall_quality',
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
        data: mockRankings,
        error: null,
        count: mockRankings.length,
      });

      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);

      const response = await request(app).get('/api/rankings');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('rankings');
      expect(response.body).toHaveProperty('pagination');
      expect(response.body.rankings).toHaveLength(2);
    });

    it('should filter rankings by category', async () => {
      const mockRankings = [
        {
          id: 'ranking-1',
          product_id: 'product-1',
          category: 'protein',
          rank: 1,
          score: 95.5,
          criteria: 'overall_quality',
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
        data: mockRankings,
        error: null,
        count: 1,
      });

      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);

      const response = await request(app).get('/api/rankings?category=protein');

      expect(response.status).toBe(200);
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('category', 'protein');
    });

    it('should filter rankings by criteria', async () => {
      const mockRankings = [
        {
          id: 'ranking-1',
          product_id: 'product-1',
          category: 'protein',
          rank: 1,
          score: 95.5,
          criteria: 'transparency_score',
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
        data: mockRankings,
        error: null,
        count: 1,
      });

      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);

      const response = await request(app).get('/api/rankings?criteria=transparency_score');

      expect(response.status).toBe(200);
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('criteria', 'transparency_score');
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

      const response = await request(app).get('/api/rankings');

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error', 'Database connection failed');
    });
  });

  describe('GET /api/rankings/:id', () => {
    it('should get a single ranking by ID', async () => {
      const mockRanking = {
        id: 'ranking-1',
        product_id: 'product-1',
        category: 'protein',
        rank: 1,
        score: 95.5,
        criteria: 'overall_quality',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn(),
      };

      mockQueryBuilder.single.mockResolvedValue({
        data: mockRanking,
        error: null,
      });

      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);

      const response = await request(app).get('/api/rankings/ranking-1');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockRanking);
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('id', 'ranking-1');
    });

    it('should return 404 for non-existent ranking', async () => {
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn(),
      };

      mockQueryBuilder.single.mockResolvedValue({
        data: null,
        error: { message: 'Ranking not found' },
      });

      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);

      const response = await request(app).get('/api/rankings/non-existent-id');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Ranking not found');
    });

    it('should return 400 for invalid UUID', async () => {
      const response = await request(app).get('/api/rankings/invalid-uuid');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Invalid ranking ID');
    });
  });

  describe('POST /api/rankings', () => {
    it('should create a new ranking when authenticated as admin', async () => {
      const mockAdmin = { ...global.testUtils.createMockUser(), user_metadata: { role: 'admin' } };
      const { getAuthenticatedUser } = require('../../lib/supabase');
      getAuthenticatedUser.mockResolvedValue(mockAdmin);

      const mockRanking = {
        id: 'ranking-1',
        product_id: 'product-1',
        category: 'protein',
        rank: 1,
        score: 95.5,
        criteria: 'overall_quality',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const mockQueryBuilder = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn(),
      };

      mockQueryBuilder.single.mockResolvedValue({
        data: mockRanking,
        error: null,
      });

      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);

      const newRanking = {
        product_id: 'product-1',
        category: 'protein',
        rank: 1,
        score: 95.5,
        criteria: 'overall_quality',
      };

      const response = await request(app)
        .post('/api/rankings')
        .set('Authorization', 'Bearer admin-token')
        .send(newRanking);

      expect(response.status).toBe(201);
      expect(response.body).toEqual(mockRanking);
      expect(mockQueryBuilder.insert).toHaveBeenCalledWith([newRanking]);
    });

    it('should return 401 when not authenticated', async () => {
      const { getAuthenticatedUser } = require('../../lib/supabase');
      getAuthenticatedUser.mockResolvedValue(null);

      const newRanking = {
        product_id: 'product-1',
        category: 'protein',
        rank: 1,
        score: 95.5,
        criteria: 'overall_quality',
      };

      const response = await request(app)
        .post('/api/rankings')
        .send(newRanking);

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error', 'Unauthorized');
    });

    it('should return 403 when not admin', async () => {
      const mockUser = { ...global.testUtils.createMockUser(), user_metadata: { role: 'user' } };
      const { getAuthenticatedUser } = require('../../lib/supabase');
      getAuthenticatedUser.mockResolvedValue(mockUser);

      const newRanking = {
        product_id: 'product-1',
        category: 'protein',
        rank: 1,
        score: 95.5,
        criteria: 'overall_quality',
      };

      const response = await request(app)
        .post('/api/rankings')
        .set('Authorization', 'Bearer user-token')
        .send(newRanking);

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error', 'Admin access required');
    });

    it('should validate required fields', async () => {
      const mockAdmin = { ...global.testUtils.createMockUser(), user_metadata: { role: 'admin' } };
      const { getAuthenticatedUser } = require('../../lib/supabase');
      getAuthenticatedUser.mockResolvedValue(mockAdmin);

      const response = await request(app)
        .post('/api/rankings')
        .set('Authorization', 'Bearer admin-token')
        .send({
          // missing required fields
          product_id: 'product-1',
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should validate category enum', async () => {
      const mockAdmin = { ...global.testUtils.createMockUser(), user_metadata: { role: 'admin' } };
      const { getAuthenticatedUser } = require('../../lib/supabase');
      getAuthenticatedUser.mockResolvedValue(mockAdmin);

      const response = await request(app)
        .post('/api/rankings')
        .set('Authorization', 'Bearer admin-token')
        .send({
          product_id: 'product-1',
          category: 'invalid-category',
          rank: 1,
          score: 95.5,
          criteria: 'overall_quality',
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should validate criteria enum', async () => {
      const mockAdmin = { ...global.testUtils.createMockUser(), user_metadata: { role: 'admin' } };
      const { getAuthenticatedUser } = require('../../lib/supabase');
      getAuthenticatedUser.mockResolvedValue(mockAdmin);

      const response = await request(app)
        .post('/api/rankings')
        .set('Authorization', 'Bearer admin-token')
        .send({
          product_id: 'product-1',
          category: 'protein',
          rank: 1,
          score: 95.5,
          criteria: 'invalid-criteria',
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('PUT /api/rankings/:id', () => {
    it('should update a ranking when authenticated as admin', async () => {
      const mockAdmin = { ...global.testUtils.createMockUser(), user_metadata: { role: 'admin' } };
      const { getAuthenticatedUser } = require('../../lib/supabase');
      getAuthenticatedUser.mockResolvedValue(mockAdmin);

      const updatedRanking = {
        id: 'ranking-1',
        product_id: 'product-1',
        category: 'protein',
        rank: 2,
        score: 92.0,
        criteria: 'overall_quality',
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
        data: updatedRanking,
        error: null,
      });

      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);

      const updateData = { rank: 2, score: 92.0 };

      const response = await request(app)
        .put('/api/rankings/ranking-1')
        .set('Authorization', 'Bearer admin-token')
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(updatedRanking);
      expect(mockQueryBuilder.update).toHaveBeenCalledWith(updateData);
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('id', 'ranking-1');
    });

    it('should return 404 for non-existent ranking', async () => {
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
        error: { message: 'Ranking not found' },
      });

      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);

      const updateData = { rank: 2, score: 92.0 };

      const response = await request(app)
        .put('/api/rankings/non-existent-id')
        .set('Authorization', 'Bearer admin-token')
        .send(updateData);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Ranking not found');
    });
  });

  describe('DELETE /api/rankings/:id', () => {
    it('should delete a ranking when authenticated as admin', async () => {
      const mockAdmin = { ...global.testUtils.createMockUser(), user_metadata: { role: 'admin' } };
      const { getAuthenticatedUser } = require('../../lib/supabase');
      getAuthenticatedUser.mockResolvedValue(mockAdmin);

      const mockRanking = {
        id: 'ranking-1',
        product_id: 'product-1',
        category: 'protein',
        rank: 1,
        score: 95.5,
        criteria: 'overall_quality',
      };

      const mockQueryBuilder = {
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn(),
      };

      mockQueryBuilder.single.mockResolvedValue({
        data: mockRanking,
        error: null,
      });

      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);

      const response = await request(app)
        .delete('/api/rankings/ranking-1')
        .set('Authorization', 'Bearer admin-token');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Ranking deleted successfully');
      expect(mockQueryBuilder.delete).toHaveBeenCalled();
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('id', 'ranking-1');
    });

    it('should return 404 for non-existent ranking', async () => {
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
        error: { message: 'Ranking not found' },
      });

      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);

      const response = await request(app)
        .delete('/api/rankings/non-existent-id')
        .set('Authorization', 'Bearer admin-token');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Ranking not found');
    });
  });

  describe('GET /api/rankings/category/:category', () => {
    it('should get rankings by category', async () => {
      const mockRankings = [
        {
          id: 'ranking-1',
          product_id: 'product-1',
          category: 'protein',
          rank: 1,
          score: 95.5,
          criteria: 'overall_quality',
        },
        {
          id: 'ranking-2',
          product_id: 'product-2',
          category: 'protein',
          rank: 2,
          score: 88.2,
          criteria: 'overall_quality',
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
        data: mockRankings,
        error: null,
        count: mockRankings.length,
      });

      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);

      const response = await request(app).get('/api/rankings/category/protein');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('rankings');
      expect(response.body).toHaveProperty('pagination');
      expect(response.body.rankings).toHaveLength(2);
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('category', 'protein');
    });

    it('should return 400 for invalid category', async () => {
      const response = await request(app).get('/api/rankings/category/invalid-category');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Invalid category');
    });
  });

  describe('GET /api/rankings/criteria/:criteria', () => {
    it('should get rankings by criteria', async () => {
      const mockRankings = [
        {
          id: 'ranking-1',
          product_id: 'product-1',
          category: 'protein',
          rank: 1,
          score: 95.5,
          criteria: 'transparency_score',
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
        data: mockRankings,
        error: null,
        count: 1,
      });

      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);

      const response = await request(app).get('/api/rankings/criteria/transparency_score');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('rankings');
      expect(response.body).toHaveProperty('pagination');
      expect(response.body.rankings).toHaveLength(1);
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('criteria', 'transparency_score');
    });

    it('should return 400 for invalid criteria', async () => {
      const response = await request(app).get('/api/rankings/criteria/invalid-criteria');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Invalid criteria');
    });
  });
});
