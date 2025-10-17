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

// Get contributions with pagination
router.get('/', async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 20, product_id, type } = req.query;

    let query = supabase
      .from('contributions')
      .select(`
        *,
        users(full_name, avatar_url),
        products(name, brand)
      `)
      .order('created_at', { ascending: false });

    // Apply filters
    if (product_id) {
      query = query.eq('product_id', product_id);
    }

    if (type) {
      query = query.eq('type', type);
    }

    // Apply pagination
    const from = (Number(page) - 1) * Number(limit);
    const to = from + Number(limit) - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

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
    console.error('Get contributions error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch contributions',
    });
  }
});

// Create contribution
router.post('/', [
  body('product_id').isUUID().withMessage('Product ID must be a valid UUID'),
  body('type').isIn(['review', 'rating', 'fact_check', 'transparency_score']).withMessage('Invalid contribution type'),
  body('content').optional().isString(),
  body('rating').optional().isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('transparency_score').optional().isInt({ min: 0, max: 100 }).withMessage('Transparency score must be between 0 and 100'),
], validateRequest, async (req: Request, res: Response) => {
  try {
    const contributionData = req.body;

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
      .from('contributions')
      .insert([{
        ...contributionData,
        user_id: user.id,
      }])
      .select(`
        *,
        users(full_name, avatar_url),
        products(name, brand)
      `)
      .single();

    if (error) {
      return res.status(400).json({
        error: 'Database error',
        message: error.message,
      });
    }

    res.status(201).json({
      message: 'Contribution created successfully',
      contribution: data,
    });
  } catch (error) {
    console.error('Create contribution error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to create contribution',
    });
  }
});

// Vote on contribution
router.post('/:id/vote', [
  param('id').isUUID().withMessage('Contribution ID must be a valid UUID'),
  body('vote_type').isIn(['upvote', 'downvote']).withMessage('Vote type must be upvote or downvote'),
], validateRequest, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { vote_type } = req.body;

    // Get authenticated user
    const authHeader = req.headers.authorization;
    const user = await getAuthenticatedUser(authHeader || '');

    if (!user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required',
      });
    }

    // Check if user already voted
    const { data: existingVote } = await supabase
      .from('contribution_votes')
      .select('id, vote_type')
      .eq('contribution_id', id)
      .eq('user_id', user.id)
      .single();

    if (existingVote) {
      // Update existing vote
      const { data, error } = await supabase
        .from('contribution_votes')
        .update({ vote_type })
        .eq('id', existingVote.id)
        .select()
        .single();

      if (error) {
        return res.status(400).json({
          error: 'Database error',
          message: error.message,
        });
      }

      res.json({
        message: 'Vote updated successfully',
        vote: data,
      });
    } else {
      // Create new vote
      const { data, error } = await supabase
        .from('contribution_votes')
        .insert([{
          contribution_id: id,
          user_id: user.id,
          vote_type,
        }])
        .select()
        .single();

      if (error) {
        return res.status(400).json({
          error: 'Database error',
          message: error.message,
        });
      }

      res.status(201).json({
        message: 'Vote created successfully',
        vote: data,
      });
    }
  } catch (error) {
    console.error('Vote on contribution error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to vote on contribution',
    });
  }
});

export { router as contributionRoutes };
