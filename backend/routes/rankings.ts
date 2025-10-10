import { Router, Request, Response } from 'express';
import { query, validationResult } from 'express-validator';
import { supabase } from '../lib/supabase';

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

// Get product rankings
router.get('/products', [
  query('category').optional().isString().withMessage('Category must be a string'),
  query('metric').optional().isIn(['rating', 'transparency_score', 'value_for_money']).withMessage('Invalid metric'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
], validateRequest, async (req: Request, res: Response) => {
  try {
    const {
      category,
      metric = 'rating',
      limit = 20,
    } = req.query;

    let query = supabase
      .from('products')
      .select(`
        id,
        name,
        brand,
        price,
        image_url,
        rating,
        transparency_score,
        value_for_money,
        categories(name),
        contributions!inner(rating, transparency_score)
      `);

    // Apply category filter
    if (category) {
      query = query.eq('category_id', category);
    }

    // Order by selected metric
    query = query.order(metric as string, { ascending: false });

    // Apply limit
    query = query.limit(Number(limit));

    const { data, error } = await query;

    if (error) {
      return res.status(400).json({
        error: 'Database error',
        message: error.message,
      });
    }

    res.json({
      rankings: data,
      metric,
      category,
      generated_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Get product rankings error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch product rankings',
    });
  }
});

// Get ingredient rankings
router.get('/ingredients', [
  query('type').optional().isString().withMessage('Type must be a string'),
  query('metric').optional().isIn(['popularity', 'effectiveness', 'safety_score']).withMessage('Invalid metric'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
], validateRequest, async (req: Request, res: Response) => {
  try {
    const {
      type,
      metric = 'popularity',
      limit = 20,
    } = req.query;

    let query = supabase
      .from('ingredients')
      .select(`
        id,
        name,
        description,
        effectiveness_score,
        safety_score,
        popularity_score,
        ingredient_types(name)
      `);

    // Apply type filter
    if (type) {
      query = query.eq('type_id', type);
    }

    // Order by selected metric
    query = query.order(metric as string, { ascending: false });

    // Apply limit
    query = query.limit(Number(limit));

    const { data, error } = await query;

    if (error) {
      return res.status(400).json({
        error: 'Database error',
        message: error.message,
      });
    }

    res.json({
      rankings: data,
      metric,
      type,
      generated_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Get ingredient rankings error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch ingredient rankings',
    });
  }
});

export { router as rankingRoutes };
