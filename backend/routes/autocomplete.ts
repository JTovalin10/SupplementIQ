import { Request, Response, Router } from 'express';
import { autocompleteService } from '../lib/services/autocomplete';
import { sanitizeInput, validateRequest } from '../middleware/validation';

const router = Router();

/**
 * @route GET /api/v1/autocomplete/products
 * @desc Get product autocomplete suggestions
 * @access Public
 * @param {string} q - Search query (prefix)
 * @param {number} limit - Maximum results (default: 25)
 * @returns {string[]} Array of matching product names
 * @throws {400} If query parameter is missing or invalid
 */
router.get('/products', validateRequest, (req: Request, res: Response) => {
    try {
        const query = sanitizeInput(req.query.q as string);
        const limit = parseInt(req.query.limit as string) || 25;

        if (!query || query.length < 1) {
            return res.status(400).json({
                success: false,
                error: 'Query parameter "q" is required and must be at least 1 character'
            });
        }

        if (limit < 1 || limit > 100) {
            return res.status(400).json({
                success: false,
                error: 'Limit must be between 1 and 100'
            });
        }

        const suggestions = autocompleteService.searchProducts(query, limit);

        res.json({
            success: true,
            data: {
                suggestions,
                query,
                count: suggestions.length
            }
        });
    } catch (error) {
        console.error('Autocomplete products error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});


/**
 * @route GET /api/v1/autocomplete/brands
 * @desc Get brand autocomplete suggestions
 * @access Public
 * @param {string} q - Search query (prefix)
 * @param {number} limit - Maximum results (default: 25)
 * @returns {string[]} Array of matching brand names
 * @throws {400} If query parameter is missing or invalid
 */
router.get('/brands', validateRequest, (req: Request, res: Response) => {
    try {
        const query = sanitizeInput(req.query.q as string);
        const limit = parseInt(req.query.limit as string) || 25;

        if (!query || query.length < 1) {
            return res.status(400).json({
                success: false,
                error: 'Query parameter "q" is required and must be at least 1 character'
            });
        }

        if (limit < 1 || limit > 100) {
            return res.status(400).json({
                success: false,
                error: 'Limit must be between 1 and 100'
            });
        }

        const suggestions = autocompleteService.searchBrands(query, limit);

        res.json({
            success: true,
            data: {
                suggestions,
                query,
                count: suggestions.length
            }
        });
    } catch (error) {
        console.error('Autocomplete brands error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

/**
 * @route POST /api/v1/autocomplete/products
 * @desc Add a new product to autocomplete index
 * @access Private (Admin/Moderator)
 * @param {string} name - Product name to add
 * @returns {object} Success message
 * @throws {400} If product name is missing or invalid
 * @throws {401} If user is not authenticated
 * @throws {403} If user is not authorized
 */
router.post('/products', validateRequest, (req: Request, res: Response) => {
    try {
        const { name } = req.body;

        if (!name || typeof name !== 'string' || name.trim().length < 1) {
            return res.status(400).json({
                success: false,
                error: 'Product name is required and must be a non-empty string'
            });
        }

        const productName = sanitizeInput(name.trim());
        autocompleteService.addProduct(productName);

        res.json({
            success: true,
            message: 'Product added to autocomplete index',
            data: { name: productName }
        });
    } catch (error) {
        console.error('Add product to autocomplete error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

/**
 * @route GET /api/v1/autocomplete/flavors
 * @desc Get flavor autocomplete suggestions
 * @access Public
 * @param {string} q - Search query (prefix)
 * @param {number} limit - Maximum results (default: 25)
 * @returns {string[]} Array of matching flavor names
 * @throws {400} If query parameter is missing or invalid
 */
router.get('/flavors', validateRequest, (req: Request, res: Response) => {
    try {
        const query = sanitizeInput(req.query.q as string);
        const limit = parseInt(req.query.limit as string) || 25;

        if (!query || query.length < 1) {
            return res.status(400).json({
                success: false,
                error: 'Query parameter "q" is required and must be at least 1 character'
            });
        }

        if (limit < 1 || limit > 100) {
            return res.status(400).json({
                success: false,
                error: 'Limit must be between 1 and 100'
            });
        }

        const suggestions = autocompleteService.searchFlavors(query, limit);

        res.json({
            success: true,
            data: {
                suggestions,
                query,
                count: suggestions.length
            }
        });
    } catch (error) {
        console.error('Autocomplete flavors error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

export default router;
