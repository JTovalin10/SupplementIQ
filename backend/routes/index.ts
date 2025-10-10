import { Router } from 'express';
import { adminRoutes } from './admin';
import { authRoutes } from './auth';
import autocompleteRoutes from './autocomplete';
import { contributionRoutes } from './contributions';
import { ingredientRoutes } from './ingredients';
import ownerRoutes from './owner';
import { productRoutes } from './products';
import { rankingRoutes } from './rankings';
import { uploadRoutes } from './upload';
import { userRoutes } from './users';

/**
 * Main API router configuration
 * Centralizes all API route registration and provides API documentation endpoint
 */

const router = Router();

// API version prefix for all routes
const API_VERSION = '/api/v1';

// Route registration - mounts all feature routes under versioned API paths
router.use(`${API_VERSION}/auth`, authRoutes);
router.use(`${API_VERSION}/products`, productRoutes);
router.use(`${API_VERSION}/ingredients`, ingredientRoutes);
router.use(`${API_VERSION}/contributions`, contributionRoutes);
router.use(`${API_VERSION}/users`, userRoutes);
router.use(`${API_VERSION}/rankings`, rankingRoutes);
router.use(`${API_VERSION}/upload`, uploadRoutes);
router.use(`${API_VERSION}/autocomplete`, autocompleteRoutes);
router.use(`${API_VERSION}/admin`, adminRoutes);
router.use(`${API_VERSION}/owner`, ownerRoutes);

/**
 * API documentation endpoint
 * Provides API information, available endpoints, and documentation links
 * 
 * @requires No request parameters or body required
 * 
 * @returns 200 - Success response containing:
 *   - name: API name ("SupplementIQ API")
 *   - version: API version ("1.0.0")
 *   - description: API purpose description
 *   - endpoints: Object mapping feature names to their base URLs
 *   - documentation: Link to full API documentation
 * 
 * @throws None - Always returns 200 with API information
 * 
 * @example
 * GET /api/v1/docs
 * Response: {
 *   "name": "SupplementIQ API",
 *   "version": "1.0.0",
 *   "description": "Transparency engine for supplement industry",
 *   "endpoints": {
 *     "auth": "/api/v1/auth",
 *     "products": "/api/v1/products",
 *     ...
 *   },
 *   "documentation": "https://docs.supplementiq.com"
 * }
 */
router.get(`${API_VERSION}/docs`, (req, res) => {
  res.json({
    name: 'SupplementIQ API',
    version: '1.0.0',
    description: 'Transparency engine for supplement industry',
    endpoints: {
      auth: `${API_VERSION}/auth`,
      products: `${API_VERSION}/products`,
      ingredients: `${API_VERSION}/ingredients`,
      contributions: `${API_VERSION}/contributions`,
      users: `${API_VERSION}/users`,
      rankings: `${API_VERSION}/rankings`,
      upload: `${API_VERSION}/upload`,
      autocomplete: `${API_VERSION}/autocomplete`,
      admin: `${API_VERSION}/admin`,
      owner: `${API_VERSION}/owner`,
    },
    documentation: 'https://docs.supplementiq.com',
  });
});

/**
 * Exports the configured API router
 * Contains all API routes mounted under /api/v1 prefix
 */
export { router as apiRoutes };
