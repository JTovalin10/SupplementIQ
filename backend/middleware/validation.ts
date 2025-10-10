import { NextFunction, Request, Response } from 'express';
import { validationResult } from 'express-validator';

/**
 * Secure validation middleware with proper TypeScript types
 * Validates request body against express-validator rules and returns detailed error information
 * 
 * @requires req - Express request object containing validated data
 * @requires res - Express response object for sending validation errors
 * @requires next - Express next function to continue middleware chain
 * 
 * @returns void - Continues to next middleware if validation passes
 * @throws 400 - Returns validation error details if validation fails
 * 
 * @example
 * // Used as middleware in routes
 * router.post('/endpoint', [validationRules], validateRequest, handler);
 */
export const validateRequest = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({
      error: 'Validation failed',
      details: errors.array(),
    });
    return;
  }
  next();
};

/**
 * Sanitize input data to prevent XSS and other attacks
 * Recursively sanitizes strings and objects by removing dangerous characters
 * 
 * @requires data - Any data type (string, object, or other) to be sanitized
 * 
 * @returns any - Sanitized data with dangerous characters removed
 * 
 * @throws None - Always returns sanitized data
 * 
 * @example
 * // Sanitize user input
 * const cleanData = sanitizeInput(userInput);
 * // Removes < and > characters from strings
 */
export const sanitizeInput = (data: any): any => {
  if (typeof data === 'string') {
    // Remove potentially dangerous characters
    return data.trim().replace(/[<>]/g, '');
  }
  
  if (typeof data === 'object' && data !== null) {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(data)) {
      sanitized[key] = sanitizeInput(value);
    }
    return sanitized;
  }
  
  return data;
};

/**
 * Rate limiting configuration helper
 * Creates standardized rate limiting configuration for express-rate-limit middleware
 * 
 * @requires windowMs - Time window in milliseconds for rate limiting
 * @requires max - Maximum number of requests allowed per window
 * 
 * @returns RateLimitConfig - Configuration object for express-rate-limit
 * 
 * @throws None - Always returns configuration object
 * 
 * @example
 * // Create rate limit for 100 requests per 15 minutes
 * const rateLimit = createRateLimit(15 * 60 * 1000, 100);
 * app.use('/api/', rateLimit);
 */
export const createRateLimit = (windowMs: number, max: number) => {
  return {
    windowMs,
    max,
    message: {
      error: 'Too many requests, please try again later.',
    },
    standardHeaders: true,
    legacyHeaders: false,
  };
};
