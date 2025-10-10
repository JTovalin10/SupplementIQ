import { Router, Request, Response } from 'express';
import { body, query, param, validationResult } from 'express-validator';
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

// Get all ingredients with pagination and filtering
router.get('/', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('type').optional().isString().withMessage('Type must be a string'),
  query('search').optional().isString().withMessage('Search must be a string'),
], validateRequest, async (req: Request, res: Response) => {
  try {
    const {
      page = 1,
      limit = 20,
      type,
      search,
    } = req.query;

    let query = supabase
      .from('ingredients')
      .select(`
        *,
        ingredient_types(name)
      `);

    // Apply filters
    if (type) {
      query = query.eq('type_id', type);
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
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
      ingredients: data,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: count,
        pages: Math.ceil((count || 0) / Number(limit)),
      },
    });
  } catch (error) {
    console.error('Get ingredients error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch ingredients',
    });
  }
});

// Get ingredient by ID
router.get('/:id', [
  param('id').isUUID().withMessage('Ingredient ID must be a valid UUID'),
], validateRequest, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('ingredients')
      .select(`
        *,
        ingredient_types(name),
        products(
          id,
          name,
          brand,
          ingredients!inner(amount, unit)
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          error: 'Not found',
          message: 'Ingredient not found',
        });
      }
      return res.status(400).json({
        error: 'Database error',
        message: error.message,
      });
    }

    res.json({ ingredient: data });
  } catch (error) {
    console.error('Get ingredient error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch ingredient',
    });
  }
});

export { router as ingredientRoutes };
