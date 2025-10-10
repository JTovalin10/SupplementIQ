import express from 'express';
import request from 'supertest';
import userRoutes from '../../routes/users';
import { mockSupabaseClient } from '../mocks/supabase';

// Mock the supabase module
jest.mock('../../lib/supabase', () => ({
  supabase: mockSupabaseClient,
  getAuthenticatedUser: jest.fn(),
}));

const app = express();
app.use(express.json());
app.use('/api/users', userRoutes);

describe('User Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/users', () => {
    it('should get all users when authenticated as admin', async () => {
      const mockAdmin = { ...global.testUtils.createMockUser(), user_metadata: { role: 'admin' } };
      const { getAuthenticatedUser } = require('../../lib/supabase');
      getAuthenticatedUser.mockResolvedValue(mockAdmin);

      const mockUsers = [
        global.testUtils.createMockUser(),
        { ...global.testUtils.createMockUser(), id: 'user-2', email: 'user2@example.com' },
      ];

      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
      };

      mockQueryBuilder.select.mockResolvedValue({
        data: mockUsers,
        error: null,
        count: mockUsers.length,
      });

      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);

      const response = await request(app)
        .get('/api/users')
        .set('Authorization', 'Bearer admin-token');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('users');
      expect(response.body).toHaveProperty('pagination');
      expect(response.body.users).toHaveLength(2);
    });

    it('should return 403 when not admin', async () => {
      const mockUser = { ...global.testUtils.createMockUser(), user_metadata: { role: 'user' } };
      const { getAuthenticatedUser } = require('../../lib/supabase');
      getAuthenticatedUser.mockResolvedValue(mockUser);

      const response = await request(app)
        .get('/api/users')
        .set('Authorization', 'Bearer user-token');

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error', 'Admin access required');
    });

    it('should return 401 when not authenticated', async () => {
      const { getAuthenticatedUser } = require('../../lib/supabase');
      getAuthenticatedUser.mockResolvedValue(null);

      const response = await request(app).get('/api/users');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error', 'Unauthorized');
    });
  });

  describe('GET /api/users/:id', () => {
    it('should get user profile by ID', async () => {
      const mockUser = global.testUtils.createMockUser();
      const { getAuthenticatedUser } = require('../../lib/supabase');
      getAuthenticatedUser.mockResolvedValue(mockUser);

      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn(),
      };

      mockQueryBuilder.single.mockResolvedValue({
        data: mockUser,
        error: null,
      });

      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);

      const response = await request(app)
        .get('/api/users/test-user-id')
        .set('Authorization', 'Bearer user-token');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockUser);
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('id', 'test-user-id');
    });

    it('should return 404 for non-existent user', async () => {
      const mockUser = global.testUtils.createMockUser();
      const { getAuthenticatedUser } = require('../../lib/supabase');
      getAuthenticatedUser.mockResolvedValue(mockUser);

      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn(),
      };

      mockQueryBuilder.single.mockResolvedValue({
        data: null,
        error: { message: 'User not found' },
      });

      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);

      const response = await request(app)
        .get('/api/users/non-existent-id')
        .set('Authorization', 'Bearer user-token');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'User not found');
    });

    it('should return 400 for invalid UUID', async () => {
      const mockUser = global.testUtils.createMockUser();
      const { getAuthenticatedUser } = require('../../lib/supabase');
      getAuthenticatedUser.mockResolvedValue(mockUser);

      const response = await request(app)
        .get('/api/users/invalid-uuid')
        .set('Authorization', 'Bearer user-token');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Invalid user ID');
    });
  });

  describe('PUT /api/users/:id', () => {
    it('should update user profile when authenticated as same user', async () => {
      const mockUser = global.testUtils.createMockUser();
      const { getAuthenticatedUser } = require('../../lib/supabase');
      getAuthenticatedUser.mockResolvedValue(mockUser);

      const updatedUser = { ...mockUser, user_metadata: { full_name: 'Updated Name' } };
      const mockQueryBuilder = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn(),
      };

      mockQueryBuilder.single.mockResolvedValue({
        data: updatedUser,
        error: null,
      });

      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);

      const updateData = { full_name: 'Updated Name' };

      const response = await request(app)
        .put('/api/users/test-user-id')
        .set('Authorization', 'Bearer user-token')
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(updatedUser);
      expect(mockQueryBuilder.update).toHaveBeenCalledWith(updateData);
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('id', 'test-user-id');
    });

    it('should allow admin to update any user', async () => {
      const mockAdmin = { ...global.testUtils.createMockUser(), user_metadata: { role: 'admin' } };
      const { getAuthenticatedUser } = require('../../lib/supabase');
      getAuthenticatedUser.mockResolvedValue(mockAdmin);

      const targetUser = { ...global.testUtils.createMockUser(), id: 'target-user-id' };
      const updatedUser = { ...targetUser, user_metadata: { full_name: 'Admin Updated Name' } };
      
      const mockQueryBuilder = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn(),
      };

      mockQueryBuilder.single.mockResolvedValue({
        data: updatedUser,
        error: null,
      });

      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);

      const updateData = { full_name: 'Admin Updated Name' };

      const response = await request(app)
        .put('/api/users/target-user-id')
        .set('Authorization', 'Bearer admin-token')
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(updatedUser);
    });

    it('should return 403 when user tries to update another user', async () => {
      const mockUser = global.testUtils.createMockUser();
      const { getAuthenticatedUser } = require('../../lib/supabase');
      getAuthenticatedUser.mockResolvedValue(mockUser);

      const updateData = { full_name: 'Updated Name' };

      const response = await request(app)
        .put('/api/users/different-user-id')
        .set('Authorization', 'Bearer user-token')
        .send(updateData);

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error', 'Access denied');
    });

    it('should return 404 for non-existent user', async () => {
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
        error: { message: 'User not found' },
      });

      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);

      const updateData = { full_name: 'Updated Name' };

      const response = await request(app)
        .put('/api/users/non-existent-id')
        .set('Authorization', 'Bearer user-token')
        .send(updateData);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'User not found');
    });
  });

  describe('DELETE /api/users/:id', () => {
    it('should delete user when authenticated as admin', async () => {
      const mockAdmin = { ...global.testUtils.createMockUser(), user_metadata: { role: 'admin' } };
      const { getAuthenticatedUser } = require('../../lib/supabase');
      getAuthenticatedUser.mockResolvedValue(mockAdmin);

      const mockQueryBuilder = {
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn(),
      };

      mockQueryBuilder.single.mockResolvedValue({
        data: global.testUtils.createMockUser(),
        error: null,
      });

      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);

      const response = await request(app)
        .delete('/api/users/test-user-id')
        .set('Authorization', 'Bearer admin-token');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'User deleted successfully');
      expect(mockQueryBuilder.delete).toHaveBeenCalled();
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('id', 'test-user-id');
    });

    it('should allow user to delete their own account', async () => {
      const mockUser = global.testUtils.createMockUser();
      const { getAuthenticatedUser } = require('../../lib/supabase');
      getAuthenticatedUser.mockResolvedValue(mockUser);

      const mockQueryBuilder = {
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn(),
      };

      mockQueryBuilder.single.mockResolvedValue({
        data: mockUser,
        error: null,
      });

      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);

      const response = await request(app)
        .delete('/api/users/test-user-id')
        .set('Authorization', 'Bearer user-token');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'User deleted successfully');
    });

    it('should return 403 when user tries to delete another user', async () => {
      const mockUser = global.testUtils.createMockUser();
      const { getAuthenticatedUser } = require('../../lib/supabase');
      getAuthenticatedUser.mockResolvedValue(mockUser);

      const response = await request(app)
        .delete('/api/users/different-user-id')
        .set('Authorization', 'Bearer user-token');

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error', 'Access denied');
    });

    it('should return 404 for non-existent user', async () => {
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
        error: { message: 'User not found' },
      });

      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);

      const response = await request(app)
        .delete('/api/users/non-existent-id')
        .set('Authorization', 'Bearer admin-token');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'User not found');
    });
  });

  describe('GET /api/users/:id/contributions', () => {
    it('should get user contributions', async () => {
      const mockUser = global.testUtils.createMockUser();
      const { getAuthenticatedUser } = require('../../lib/supabase');
      getAuthenticatedUser.mockResolvedValue(mockUser);

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

      const response = await request(app)
        .get('/api/users/test-user-id/contributions')
        .set('Authorization', 'Bearer user-token');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('contributions');
      expect(response.body).toHaveProperty('pagination');
      expect(response.body.contributions).toHaveLength(2);
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('user_id', 'test-user-id');
    });

    it('should return 403 when user tries to access another user\'s contributions', async () => {
      const mockUser = global.testUtils.createMockUser();
      const { getAuthenticatedUser } = require('../../lib/supabase');
      getAuthenticatedUser.mockResolvedValue(mockUser);

      const response = await request(app)
        .get('/api/users/different-user-id/contributions')
        .set('Authorization', 'Bearer user-token');

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error', 'Access denied');
    });

    it('should allow admin to access any user\'s contributions', async () => {
      const mockAdmin = { ...global.testUtils.createMockUser(), user_metadata: { role: 'admin' } };
      const { getAuthenticatedUser } = require('../../lib/supabase');
      getAuthenticatedUser.mockResolvedValue(mockAdmin);

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

      const response = await request(app)
        .get('/api/users/target-user-id/contributions')
        .set('Authorization', 'Bearer admin-token');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('contributions');
    });
  });

  describe('GET /api/users/:id/reputation', () => {
    it('should get user reputation score', async () => {
      const mockUser = global.testUtils.createMockUser();
      const { getAuthenticatedUser } = require('../../lib/supabase');
      getAuthenticatedUser.mockResolvedValue(mockUser);

      const mockReputationData = {
        user_id: 'test-user-id',
        reputation_score: 150,
        total_contributions: 10,
        approved_contributions: 8,
        rejected_contributions: 2,
      };

      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn(),
      };

      mockQueryBuilder.single.mockResolvedValue({
        data: mockReputationData,
        error: null,
      });

      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);

      const response = await request(app)
        .get('/api/users/test-user-id/reputation')
        .set('Authorization', 'Bearer user-token');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockReputationData);
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('user_id', 'test-user-id');
    });

    it('should return 404 for non-existent user reputation', async () => {
      const mockUser = global.testUtils.createMockUser();
      const { getAuthenticatedUser } = require('../../lib/supabase');
      getAuthenticatedUser.mockResolvedValue(mockUser);

      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn(),
      };

      mockQueryBuilder.single.mockResolvedValue({
        data: null,
        error: { message: 'User reputation not found' },
      });

      mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);

      const response = await request(app)
        .get('/api/users/test-user-id/reputation')
        .set('Authorization', 'Bearer user-token');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'User reputation not found');
    });
  });
});
