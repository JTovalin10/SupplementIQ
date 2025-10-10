import { body, param, query } from 'express-validator';

// Common validation rules
export const commonValidations = {
  email: () => body('email').isEmail().normalizeEmail(),
  password: () => body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  uuid: (field: string) => param(field).isUUID().withMessage(`${field} must be a valid UUID`),
  pagination: {
    page: () => query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    limit: (max = 100) => query('limit').optional().isInt({ min: 1, max }).withMessage(`Limit must be between 1 and ${max}`),
  },
};

// Product validations
export const productValidations = {
  create: [
    body('name').trim().isLength({ min: 2 }).withMessage('Product name is required'),
    body('description').optional().isString(),
    body('category').isIn(['protein', 'pre-workout', 'energy-drink', 'bcaa', 'eaa', 'fat-burner', 'appetite-suppressant']).withMessage('Invalid product category'),
    body('brand').optional().isString(),
    body('price').optional().isFloat({ min: 0 }).withMessage('Price must be a positive number'),
    body('image_url').optional().isURL().withMessage('Image URL must be valid'),
  ],
  update: [
    body('name').optional().trim().isLength({ min: 2 }).withMessage('Product name must be at least 2 characters'),
    body('description').optional().isString(),
    body('category_id').optional().isUUID().withMessage('Category ID must be a valid UUID'),
    body('brand').optional().isString(),
    body('price').optional().isFloat({ min: 0 }).withMessage('Price must be a positive number'),
    body('image_url').optional().isURL().withMessage('Image URL must be valid'),
  ],
  filters: [
    query('category').optional().isIn(['protein', 'pre-workout', 'energy-drink', 'bcaa', 'eaa', 'fat-burner', 'appetite-suppressant']).withMessage('Invalid product category'),
    query('search').optional().isString().withMessage('Search must be a string'),
    query('sort').optional().isIn(['name', 'created_at', 'rating', 'price']).withMessage('Invalid sort field'),
    query('order').optional().isIn(['asc', 'desc']).withMessage('Order must be asc or desc'),
    commonValidations.pagination.page(),
    commonValidations.pagination.limit(),
  ],
};

// Contribution validations
export const contributionValidations = {
  create: [
    body('product_id').isUUID().withMessage('Product ID must be a valid UUID'),
    body('type').isIn(['review', 'rating', 'fact_check', 'transparency_score']).withMessage('Invalid contribution type'),
    body('content').optional().isString(),
    body('rating').optional().isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
    body('transparency_score').optional().isInt({ min: 0, max: 100 }).withMessage('Transparency score must be between 0 and 100'),
  ],
  vote: [
    body('vote_type').isIn(['upvote', 'downvote']).withMessage('Vote type must be upvote or downvote'),
  ],
};

// User validations
export const userValidations = {
  register: [
    commonValidations.email(),
    commonValidations.password(),
    body('full_name').trim().isLength({ min: 2 }).withMessage('Full name is required'),
  ],
  login: [
    commonValidations.email(),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  updateProfile: [
    body('full_name').optional().trim().isLength({ min: 2 }).withMessage('Full name must be at least 2 characters'),
    body('bio').optional().isString(),
    body('avatar_url').optional().isURL().withMessage('Avatar URL must be valid'),
  ],
};

// Ingredient validations
export const ingredientValidations = {
  filters: [
    query('type').optional().isString().withMessage('Type must be a string'),
    query('search').optional().isString().withMessage('Search must be a string'),
    commonValidations.pagination.page(),
    commonValidations.pagination.limit(),
  ],
};

// Ranking validations
export const rankingValidations = {
  products: [
    query('category').optional().isString().withMessage('Category must be a string'),
    query('metric').optional().isIn(['rating', 'transparency_score', 'value_for_money']).withMessage('Invalid metric'),
    commonValidations.pagination.limit(),
  ],
  ingredients: [
    query('type').optional().isString().withMessage('Type must be a string'),
    query('metric').optional().isIn(['popularity', 'effectiveness', 'safety_score']).withMessage('Invalid metric'),
    commonValidations.pagination.limit(),
  ],
};
