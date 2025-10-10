import { Request, Response, Router } from 'express';
import { body, param, query } from 'express-validator';
import { CACHE_PAGINATION, PAGINATION_DEFAULTS } from '../../shared/constants';
import { getCachedProducts, setCachedProducts } from '../lib/core/cache';
import { supabase } from '../lib/supabase';
import { sanitizeInput, validateRequest } from '../middleware/validation';

const router = Router();

/**
 * Get all products with pagination and filtering
 * Caches only the first 2 pages for performance optimization
 * 
 * @requires Optional query parameters:
 *   - page: Page number (default: 1)
 *   - limit: Items per page (default: 25, max: 100)
 *   - category: Filter by product category
 *   - search: Search in product name and description
 *   - sort: Sort field (name, created_at, rating, price)
 *   - order: Sort order (asc, desc)
 * 
 * @returns 200 - Success response with products and pagination info
 * @returns 400 - Validation or database error
 * @returns 500 - Internal server error
 * 
 * @throws ValidationError - When query parameters are invalid
 * @throws DatabaseError - When database query fails
 * 
 * @example
 * GET /api/v1/products?page=1&limit=25&category=protein&search=whey
 */
router.get('/', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('category').optional().isString().withMessage('Category must be a string'),
  query('search').optional().isString().withMessage('Search must be a string'),
  query('sort').optional().isIn(['name', 'created_at', 'rating', 'price']).withMessage('Invalid sort field'),
  query('order').optional().isIn(['asc', 'desc']).withMessage('Order must be asc or desc'),
], validateRequest, async (req: Request, res: Response) => {
  try {
    const {
      page = PAGINATION_DEFAULTS.PAGE,
      limit = PAGINATION_DEFAULTS.LIMIT,
      category,
      search,
      sort = 'created_at',
      order = 'desc',
    } = req.query;

    const pageNum = Number(page);
    const limitNum = Number(limit);

    // Check if this page should be cached (first 2 pages only)
    const shouldCache = pageNum <= CACHE_PAGINATION.CACHE_FIRST_PAGES;

    // Sanitize search input to prevent injection
    const sanitizedSearch = search ? sanitizeInput(search) : null;

    // Try to get from cache first (only for first 2 pages)
    if (shouldCache) {
      const cachedData = getCachedProducts(
        pageNum,
        limitNum,
        category as string,
        sanitizedSearch,
        sort as string,
        order as string
      );

      if (cachedData) {
        res.set({
          'Cache-Control': 'public, max-age=3600',
          'X-Cache-Status': 'hit',
        });
        return res.json(cachedData);
      }
    }

    let query = supabase
      .from('products')
      .select(`
        *,
        categories(name),
        ingredients(
          id,
          name,
          amount,
          unit,
          ingredient_types(name)
        )
      `)
      .order(sort as string, { ascending: order === 'asc' });

    // Apply filters with sanitized inputs
    if (category) {
      query = query.eq('category_id', category);
    }

    if (sanitizedSearch) {
      query = query.or(`name.ilike.%${sanitizedSearch}%,description.ilike.%${sanitizedSearch}%`);
    }

    // Apply pagination
    const from = (pageNum - 1) * limitNum;
    const to = from + limitNum - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      res.status(400).json({
        error: 'Database error',
        message: error.message,
      });
      return;
    }

    // Calculate pagination info
    const totalPages = Math.ceil((count || 0) / limitNum);
    const hasNext = pageNum < totalPages;
    const hasPrev = pageNum > 1;

    const response = {
      products: data,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: count || 0,
        pages: totalPages,
        hasNext,
        hasPrev,
        cached: shouldCache, // Indicate if this response was cached
      },
    };

    // Cache the response for first 2 pages only
    if (shouldCache) {
      setCachedProducts(
        pageNum,
        limitNum,
        response,
        category as string,
        sanitizedSearch,
        sort as string,
        order as string,
        3600 // Cache for 1 hour
      );

      res.set({
        'Cache-Control': 'public, max-age=3600',
        'X-Cache-Status': 'miss',
      });
    } else {
      res.set({
        'Cache-Control': 'no-cache',
        'X-Cache-Status': 'not-cached',
      });
    }

    res.json(response);
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch products',
    });
  }
});

// Get product by ID
router.get('/:id', [
  param('id').isUUID().withMessage('Product ID must be a valid UUID'),
], validateRequest, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        categories(name),
        ingredients(
          id,
          name,
          amount,
          unit,
          ingredient_types(name)
        ),
        contributions(
          id,
          type,
          content,
          rating,
          created_at,
          users(full_name)
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          error: 'Not found',
          message: 'Product not found',
        });
      }
      return res.status(400).json({
        error: 'Database error',
        message: error.message,
      });
    }

    res.json({ product: data });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch product',
    });
  }
});

// Create new product
router.post('/', [
  body('name').trim().isLength({ min: 2 }).withMessage('Product name is required'),
  body('description').optional().isString(),
  body('category_id').isUUID().withMessage('Category ID must be a valid UUID'),
  body('brand').optional().isString(),
  body('price').optional().isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('image_url').optional().isURL().withMessage('Image URL must be valid'),
], validateRequest, async (req: Request, res: Response) => {
  try {
    const productData = req.body;

    // Get user from auth header
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authorization header required',
      });
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid token',
      });
    }

    const { data, error } = await supabase
      .from('products')
      .insert([{
        ...productData,
        created_by: user.id,
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
      message: 'Product created successfully',
      product: data,
    });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to create product',
    });
  }
});

// Update product
router.put('/:id', [
  param('id').isUUID().withMessage('Product ID must be a valid UUID'),
  body('name').optional().trim().isLength({ min: 2 }).withMessage('Product name must be at least 2 characters'),
  body('description').optional().isString(),
  body('category_id').optional().isUUID().withMessage('Category ID must be a valid UUID'),
  body('brand').optional().isString(),
  body('price').optional().isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('image_url').optional().isURL().withMessage('Image URL must be valid'),
], validateRequest, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Get user from auth header
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authorization header required',
      });
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid token',
      });
    }

    const { data, error } = await supabase
      .from('products')
      .update(updateData)
      .eq('id', id)
      .eq('created_by', user.id) // Only allow creator to update
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          error: 'Not found',
          message: 'Product not found or you do not have permission to update it',
        });
      }
      return res.status(400).json({
        error: 'Database error',
        message: error.message,
      });
    }

    res.json({
      message: 'Product updated successfully',
      product: data,
    });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to update product',
    });
  }
});

// Delete product
router.delete('/:id', [
  param('id').isUUID().withMessage('Product ID must be a valid UUID'),
], validateRequest, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Get user from auth header
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authorization header required',
      });
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid token',
      });
    }

    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id)
      .eq('created_by', user.id); // Only allow creator to delete

    if (error) {
      return res.status(400).json({
        error: 'Database error',
        message: error.message,
      });
    }

    res.json({
      message: 'Product deleted successfully',
    });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to delete product',
    });
  }
});

// Search products
router.get('/search/:query', [
  param('query').isLength({ min: 2 }).withMessage('Search query must be at least 2 characters'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
], validateRequest, async (req: Request, res: Response) => {
  try {
    const { query } = req.params;
    const { limit = 10 } = req.query;

    // Sanitize the search query to prevent injection
    const sanitizedQuery = sanitizeInput(query);

    const { data, error } = await supabase
      .from('products')
      .select(`
        id,
        name,
        description,
        brand,
        price,
        image_url,
        categories(name)
      `)
      .or(`name.ilike.%${sanitizedQuery}%,description.ilike.%${sanitizedQuery}%,brand.ilike.%${sanitizedQuery}%`)
      .limit(Number(limit));

    if (error) {
      return res.status(400).json({
        error: 'Database error',
        message: error.message,
      });
    }

    res.json({
      query: sanitizedQuery,
      results: data,
      count: data?.length || 0,
    });
  } catch (error) {
    console.error('Search products error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to search products',
    });
  }
});

export { router as productRoutes };
