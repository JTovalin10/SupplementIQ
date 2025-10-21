// Shared constants between frontend and backend

export const API_VERSION = 'v1';
export const API_BASE_URL = `/api/${API_VERSION}`;

// Product categories (matches database schema)
export const PRODUCT_CATEGORIES = {
  PROTEIN: 'protein',
  PRE_WORKOUT: 'pre-workout',
  ENERGY_DRINK: 'energy-drink',
  BCAA: 'bcaa',
  EAA: 'eaa',
  FAT_BURNER: 'fat-burner',
  APPETITE_SUPPRESSANT: 'appetite-suppressant',
} as const;

// Ingredient types
export const INGREDIENT_TYPES = {
  AMINO_ACID: 'amino-acid',
  VITAMIN: 'vitamin',
  MINERAL: 'mineral',
  HERBAL: 'herbal',
  PROBIOTIC: 'probiotic',
  OMEGA: 'omega',
} as const;

// Contribution types
export const CONTRIBUTION_TYPES = {
  REVIEW: 'review',
  RATING: 'rating',
  FACT_CHECK: 'fact_check',
  TRANSPARENCY_SCORE: 'transparency_score',
} as const;

// Rating scales
export const RATING_SCALES = {
  PRODUCT_RATING: { min: 1, max: 5 },
  TRANSPARENCY_SCORE: { min: 0, max: 100 },
  VALUE_FOR_MONEY: { min: 1, max: 5 },
} as const;

// Pagination defaults
export const PAGINATION_DEFAULTS = {
  PAGE: 1,
  LIMIT: 25, // 25 products per page
  MAX_LIMIT: 100,
} as const;

// Cache configuration for pagination
export const CACHE_PAGINATION = {
  CACHE_FIRST_PAGES: 2, // Cache only the first 2 pages
  PRODUCTS_PER_PAGE: 25, // 25 products per page
} as const;

// File upload limits
export const UPLOAD_LIMITS = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
} as const;

// Cache durations (in seconds) - Daily caching to limit load
export const CACHE_DURATIONS = {
  PRODUCTS: 86400, // 24 hours (1 day)
  INGREDIENTS: 86400, // 24 hours (1 day)
  RANKINGS: 86400, // 24 hours (1 day)
  USER_PROFILE: 86400, // 24 hours (1 day)
  BRANDS: 86400, // 24 hours (1 day)
  CATEGORIES: 86400, // 24 hours (1 day)
  CONTRIBUTIONS: 43200, // 12 hours (half day for user-generated content)
  SEARCH_RESULTS: 3600, // 1 hour for search results
} as const;

// Environment variables
export const ENV_VARS = {
  NODE_ENV: 'NODE_ENV',
  PORT: 'PORT',
  HOSTNAME: 'HOSTNAME',
  DATABASE_URL: 'DATABASE_URL',
  SUPABASE_URL: 'NEXT_PUBLIC_SUPABASE_URL',
  SUPABASE_ANON_KEY: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  SUPABASE_SERVICE_KEY: 'SUPABASE_SERVICE_ROLE_KEY',
  FRONTEND_URL: 'FRONTEND_URL',
} as const;

// Error messages
export const ERROR_MESSAGES = {
  UNAUTHORIZED: 'Authentication required',
  FORBIDDEN: 'You do not have permission to perform this action',
  NOT_FOUND: 'Resource not found',
  VALIDATION_ERROR: 'Validation failed',
  INTERNAL_ERROR: 'Internal server error',
  RATE_LIMIT_EXCEEDED: 'Too many requests, please try again later',
} as const;

// Success messages
export const SUCCESS_MESSAGES = {
  CREATED: 'Resource created successfully',
  UPDATED: 'Resource updated successfully',
  DELETED: 'Resource deleted successfully',
  LOGIN: 'Login successful',
  LOGOUT: 'Logout successful',
  REGISTER: 'Registration successful',
} as const;
