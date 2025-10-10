import { Router, Request, Response } from 'express';
import { body, param, validationResult } from 'express-validator';
import { supabase, getAuthenticatedUser } from '../lib/supabase';

const router = Router();

// Validation middleware
const validateRequest = (req: Request, res: Response, next: Function) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array(),
    });
  }
  next();
};

// Get user profile
router.get('/profile', async (req: Request, res: Response) => {
  try {
    // Get authenticated user
    const authHeader = req.headers.authorization;
    const user = await getAuthenticatedUser(authHeader || '');

    if (!user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required',
      });
    }

    // Get user profile from database
    const { data, error } = await supabase
      .from('users')
      .select(`
        *,
        contributions(
          id,
          type,
          content,
          rating,
          created_at,
          products(name, brand)
        )
      `)
      .eq('id', user.id)
      .single();

    if (error) {
      return res.status(400).json({
        error: 'Database error',
        message: error.message,
      });
    }

    res.json({ user: data });
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch user profile',
    });
  }
});

// Update user profile
router.put('/profile', [
  body('full_name').optional().trim().isLength({ min: 2 }).withMessage('Full name must be at least 2 characters'),
  body('bio').optional().isString(),
  body('avatar_url').optional().isURL().withMessage('Avatar URL must be valid'),
], validateRequest, async (req: Request, res: Response) => {
  try {
    const updateData = req.body;

    // Get authenticated user
    const authHeader = req.headers.authorization;
    const user = await getAuthenticatedUser(authHeader || '');

    if (!user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required',
      });
    }

    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', user.id)
      .select()
      .single();

    if (error) {
      return res.status(400).json({
        error: 'Database error',
        message: error.message,
      });
    }

    res.json({
      message: 'Profile updated successfully',
      user: data,
    });
  } catch (error) {
    console.error('Update user profile error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to update user profile',
    });
  }
});

// Get user's contributions
router.get('/contributions', async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    // Get authenticated user
    const authHeader = req.headers.authorization;
    const user = await getAuthenticatedUser(authHeader || '');

    if (!user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required',
      });
    }

    const from = (Number(page) - 1) * Number(limit);
    const to = from + Number(limit) - 1;

    const { data, error, count } = await supabase
      .from('contributions')
      .select(`
        *,
        products(name, brand, image_url),
        contribution_votes(vote_type)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      return res.status(400).json({
        error: 'Database error',
        message: error.message,
      });
    }

    res.json({
      contributions: data,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: count,
        pages: Math.ceil((count || 0) / Number(limit)),
      },
    });
  } catch (error) {
    console.error('Get user contributions error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch user contributions',
    });
  }
});

export { router as userRoutes };
