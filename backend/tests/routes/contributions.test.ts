import express from 'express';
import request from 'supertest';
import contributionRoutes from '../../routes/contributions';
import { mockSupabaseClient } from '../mocks/supabase';

// Mock the supabase module
jest.mock('../../lib/supabase', () => ({
  supabase: mockSupabaseClient,
  getAuthenticatedUser: jest.fn(),
}));

const app = express();
app.use(express.json());
app.use('/api/contributions', contributionRoutes);

describe('Contribution Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/contributions', () => {
    it('should get all contributions with pagination', async () => {
      const mockContributions = [
        global.testUtils.createMockContribution(),
        { ...global.testUtils.createMockContribution(), id: 'contribution-2' },
      ];

      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
      };

      mockQueryBuilder.select.mockResolvedValue({
        data: mockContributions,
        error: null,
        count: mockContributions.length,
      });

      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);

      const response = await request(app).get('/api/contributions');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('contributions');
      expect(response.body).toHaveProperty('pagination');
      expect(response.body.contributions).toHaveLength(2);
    });

    it('should filter contributions by status', async () => {
      const mockContributions = [global.testUtils.createMockContribution()];
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
      };

      mockQueryBuilder.select.mockResolvedValue({
        data: mockContributions,
        error: null,
        count: 1,
      });

      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);

      const response = await request(app).get('/api/contributions?status=pending');

      expect(response.status).toBe(200);
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('status', 'pending');
    });

    it('should filter contributions by type', async () => {
      const mockContributions = [global.testUtils.createMockContribution()];
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
      };

      mockQueryBuilder.select.mockResolvedValue({
        data: mockContributions,
        error: null,
        count: 1,
      });

      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);

      const response = await request(app).get('/api/contributions?type=review');

      expect(response.status).toBe(200);
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('contribution_type', 'review');
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

      const response = await request(app).get('/api/contributions');

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error', 'Database connection failed');
    });
  });

  describe('GET /api/contributions/:id', () => {
    it('should get a single contribution by ID', async () => {
      const mockContribution = global.testUtils.createMockContribution();
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn(),
      };

      mockQueryBuilder.single.mockResolvedValue({
        data: mockContribution,
        error: null,
      });

      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);

      const response = await request(app).get('/api/contributions/test-contribution-id');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockContribution);
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('id', 'test-contribution-id');
    });

    it('should return 404 for non-existent contribution', async () => {
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn(),
      };

      mockQueryBuilder.single.mockResolvedValue({
        data: null,
        error: { message: 'Contribution not found' },
      });

      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);

      const response = await request(app).get('/api/contributions/non-existent-id');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Contribution not found');
    });

    it('should return 400 for invalid UUID', async () => {
      const response = await request(app).get('/api/contributions/invalid-uuid');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Invalid contribution ID');
    });
  });

  describe('POST /api/contributions', () => {
    it('should create a new contribution when authenticated', async () => {
      const mockUser = global.testUtils.createMockUser();
      const { getAuthenticatedUser } = require('../../lib/supabase');
      getAuthenticatedUser.mockResolvedValue(mockUser);

      const mockContribution = global.testUtils.createMockContribution();
      const mockQueryBuilder = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn(),
      };

      mockQueryBuilder.single.mockResolvedValue({
        data: mockContribution,
        error: null,
      });

      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);

      const newContribution = {
        product_id: 'test-product-id',
        contribution_type: 'review',
        content: 'This is a great product!',
      };

      const response = await request(app)
        .post('/api/contributions')
        .set('Authorization', 'Bearer user-token')
        .send(newContribution);

      expect(response.status).toBe(201);
      expect(response.body).toEqual(mockContribution);
      expect(mockQueryBuilder.insert).toHaveBeenCalledWith([{
        ...newContribution,
        user_id: mockUser.id,
        status: 'pending',
      }]);
    });

    it('should return 401 when not authenticated', async () => {
      const { getAuthenticatedUser } = require('../../lib/supabase');
      getAuthenticatedUser.mockResolvedValue(null);

      const newContribution = {
        product_id: 'test-product-id',
        contribution_type: 'review',
        content: 'This is a great product!',
      };

      const response = await request(app)
        .post('/api/contributions')
        .send(newContribution);

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error', 'Unauthorized');
    });

    it('should validate required fields', async () => {
      const mockUser = global.testUtils.createMockUser();
      const { getAuthenticatedUser } = require('../../lib/supabase');
      getAuthenticatedUser.mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/api/contributions')
        .set('Authorization', 'Bearer user-token')
        .send({
          // missing required fields
          contribution_type: 'review',
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should handle database insertion errors', async () => {
      const mockUser = global.testUtils.createMockUser();
      const { getAuthenticatedUser } = require('../../lib/supabase');
      getAuthenticatedUser.mockResolvedValue(mockUser);

      const mockQueryBuilder = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn(),
      };

      mockQueryBuilder.single.mockResolvedValue({
        data: null,
        error: { message: 'Insertion failed' },
      });

      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);

      const newContribution = {
        product_id: 'test-product-id',
        contribution_type: 'review',
        content: 'This is a great product!',
      };

      const response = await request(app)
        .post('/api/contributions')
        .set('Authorization', 'Bearer user-token')
        .send(newContribution);

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error', 'Insertion failed');
    });
  });

  describe('PUT /api/contributions/:id', () => {
    it('should update contribution when user owns it', async () => {
      const mockUser = global.testUtils.createMockUser();
      const { getAuthenticatedUser } = require('../../lib/supabase');
      getAuthenticatedUser.mockResolvedValue(mockUser);

      const updatedContribution = {
        ...global.testUtils.createMockContribution(),
        content: 'Updated content',
      };

      const mockQueryBuilder = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn(),
      };

      mockQueryBuilder.single.mockResolvedValue({
        data: updatedContribution,
        error: null,
      });

      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);

      const updateData = { content: 'Updated content' };

      const response = await request(app)
        .put('/api/contributions/test-contribution-id')
        .set('Authorization', 'Bearer user-token')
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(updatedContribution);
      expect(mockQueryBuilder.update).toHaveBeenCalledWith(updateData);
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('id', 'test-contribution-id');
    });

    it('should allow admin to update any contribution', async () => {
      const mockAdmin = { ...global.testUtils.createMockUser(), user_metadata: { role: 'admin' } };
      const { getAuthenticatedUser } = require('../../lib/supabase');
      getAuthenticatedUser.mockResolvedValue(mockAdmin);

      const updatedContribution = {
        ...global.testUtils.createMockContribution(),
        status: 'approved',
      };

      const mockQueryBuilder = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn(),
      };

      mockQueryBuilder.single.mockResolvedValue({
        data: updatedContribution,
        error: null,
      });

      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);

      const updateData = { status: 'approved' };

      const response = await request(app)
        .put('/api/contributions/test-contribution-id')
        .set('Authorization', 'Bearer admin-token')
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(updatedContribution);
    });

    it('should return 403 when user tries to update another user\'s contribution', async () => {
      const mockUser = global.testUtils.createMockUser();
      const { getAuthenticatedUser } = require('../../lib/supabase');
      getAuthenticatedUser.mockResolvedValue(mockUser);

      const updateData = { content: 'Updated content' };

      const response = await request(app)
        .put('/api/contributions/different-user-contribution-id')
        .set('Authorization', 'Bearer user-token')
        .send(updateData);

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error', 'Access denied');
    });

    it('should return 404 for non-existent contribution', async () => {
      const mockUser = global.testUtils.createMockUser();
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
        error: { message: 'Contribution not found' },
      });

      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);

      const updateData = { content: 'Updated content' };

      const response = await request(app)
        .put('/api/contributions/non-existent-id')
        .set('Authorization', 'Bearer user-token')
        .send(updateData);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Contribution not found');
    });
  });

  describe('DELETE /api/contributions/:id', () => {
    it('should delete contribution when user owns it', async () => {
      const mockUser = global.testUtils.createMockUser();
      const { getAuthenticatedUser } = require('../../lib/supabase');
      getAuthenticatedUser.mockResolvedValue(mockUser);

      const mockQueryBuilder = {
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn(),
      };

      mockQueryBuilder.single.mockResolvedValue({
        data: global.testUtils.createMockContribution(),
        error: null,
      });

      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);

      const response = await request(app)
        .delete('/api/contributions/test-contribution-id')
        .set('Authorization', 'Bearer user-token');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Contribution deleted successfully');
      expect(mockQueryBuilder.delete).toHaveBeenCalled();
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('id', 'test-contribution-id');
    });

    it('should allow admin to delete any contribution', async () => {
      const mockAdmin = { ...global.testUtils.createMockUser(), user_metadata: { role: 'admin' } };
      const { getAuthenticatedUser } = require('../../lib/supabase');
      getAuthenticatedUser.mockResolvedValue(mockAdmin);

      const mockQueryBuilder = {
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn(),
      };

      mockQueryBuilder.single.mockResolvedValue({
        data: global.testUtils.createMockContribution(),
        error: null,
      });

      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);

      const response = await request(app)
        .delete('/api/contributions/test-contribution-id')
        .set('Authorization', 'Bearer admin-token');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Contribution deleted successfully');
    });

    it('should return 403 when user tries to delete another user\'s contribution', async () => {
      const mockUser = global.testUtils.createMockUser();
      const { getAuthenticatedUser } = require('../../lib/supabase');
      getAuthenticatedUser.mockResolvedValue(mockUser);

      const response = await request(app)
        .delete('/api/contributions/different-user-contribution-id')
        .set('Authorization', 'Bearer user-token');

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error', 'Access denied');
    });

    it('should return 404 for non-existent contribution', async () => {
      const mockUser = global.testUtils.createMockUser();
      const { getAuthenticatedUser } = require('../../lib/supabase');
      getAuthenticatedUser.mockResolvedValue(mockUser);

      const mockQueryBuilder = {
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn(),
      };

      mockQueryBuilder.single.mockResolvedValue({
        data: null,
        error: { message: 'Contribution not found' },
      });

      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);

      const response = await request(app)
        .delete('/api/contributions/non-existent-id')
        .set('Authorization', 'Bearer user-token');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Contribution not found');
    });
  });

  describe('POST /api/contributions/:id/vote', () => {
    it('should vote on a contribution when authenticated', async () => {
      const mockUser = global.testUtils.createMockUser();
      const { getAuthenticatedUser } = require('../../lib/supabase');
      getAuthenticatedUser.mockResolvedValue(mockUser);

      const mockVote = {
        id: 'vote-id',
        contribution_id: 'test-contribution-id',
        user_id: mockUser.id,
        vote_type: 'upvote',
        created_at: new Date().toISOString(),
      };

      const mockQueryBuilder = {
        upsert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn(),
      };

      mockQueryBuilder.single.mockResolvedValue({
        data: mockVote,
        error: null,
      });

      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);

      const voteData = { vote_type: 'upvote' };

      const response = await request(app)
        .post('/api/contributions/test-contribution-id/vote')
        .set('Authorization', 'Bearer user-token')
        .send(voteData);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockVote);
      expect(mockQueryBuilder.upsert).toHaveBeenCalledWith([{
        contribution_id: 'test-contribution-id',
        user_id: mockUser.id,
        vote_type: 'upvote',
      }]);
    });

    it('should return 401 when not authenticated', async () => {
      const { getAuthenticatedUser } = require('../../lib/supabase');
      getAuthenticatedUser.mockResolvedValue(null);

      const voteData = { vote_type: 'upvote' };

      const response = await request(app)
        .post('/api/contributions/test-contribution-id/vote')
        .send(voteData);

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error', 'Unauthorized');
    });

    it('should validate vote type', async () => {
      const mockUser = global.testUtils.createMockUser();
      const { getAuthenticatedUser } = require('../../lib/supabase');
      getAuthenticatedUser.mockResolvedValue(mockUser);

      const voteData = { vote_type: 'invalid-vote' };

      const response = await request(app)
        .post('/api/contributions/test-contribution-id/vote')
        .set('Authorization', 'Bearer user-token')
        .send(voteData);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should handle voting errors', async () => {
      const mockUser = global.testUtils.createMockUser();
      const { getAuthenticatedUser } = require('../../lib/supabase');
      getAuthenticatedUser.mockResolvedValue(mockUser);

      const mockQueryBuilder = {
        upsert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn(),
      };

      mockQueryBuilder.single.mockResolvedValue({
        data: null,
        error: { message: 'Voting failed' },
      });

      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);

      const voteData = { vote_type: 'upvote' };

      const response = await request(app)
        .post('/api/contributions/test-contribution-id/vote')
        .set('Authorization', 'Bearer user-token')
        .send(voteData);

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error', 'Voting failed');
    });
  });
});
