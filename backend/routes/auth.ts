import { Request, Response, Router } from 'express';
import { body, validationResult } from 'express-validator';
import { supabase } from '../lib/supabase';

const router = Router();

/**
 * Validation middleware for request body validation
 * Validates the request body against express-validator rules and returns validation errors if any
 * 
 * @requires req.body - Request body to be validated against express-validator rules
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
const validateRequest = (req: Request, res: Response, next: Function): void => {
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
 * Register a new user account
 * Creates a new user account with email, password, and full name
 * 
 * @requires req.body containing:
 *   - email: Valid email address (automatically normalized, must be unique)
 *   - password: Password string with minimum 8 characters (will be hashed by Supabase)
 *   - full_name: User's full name with minimum 2 characters (stored in user_metadata)
 * 
 * @returns 201 - Success response containing:
 *   - message: "User registered successfully"
 *   - user: User object with id, email, user_metadata, app_metadata, created_at, updated_at
 * @returns 400 - Validation error or registration failure (email already exists, invalid format)
 * @returns 500 - Internal server error
 * 
 * @throws ValidationError - When required fields are missing or invalid
 * @throws SupabaseError - When user registration fails (email already exists, weak password, etc.)
 * 
 * @example
 * POST /api/auth/register
 * Request body: {
 *   "email": "user@example.com",
 *   "password": "securepassword123",
 *   "full_name": "John Doe"
 * }
 */
router.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('full_name').trim().isLength({ min: 2 }).withMessage('Full name is required'),
], validateRequest, async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, full_name } = req.body;

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name,
        },
      },
    });

    if (error) {
      res.status(400).json({
        error: 'Registration failed',
        message: error.message,
      });
      return;
    }

    res.status(201).json({
      message: 'User registered successfully',
      user: data.user,
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to register user',
    });
  }
});

/**
 * Authenticate user login
 * Validates user credentials and returns user session data upon successful authentication
 * 
 * @requires req.body containing:
 *   - email: Valid email address (automatically normalized, must match registered email)
 *   - password: User's password (non-empty string, must match registered password)
 * 
 * @returns 200 - Success response containing:
 *   - message: "Login successful"
 *   - user: User object with id, email, user_metadata, app_metadata, created_at, updated_at
 *   - session: Session object with access_token, refresh_token, expires_at, expires_in, token_type
 * @returns 400 - Validation error for missing or invalid fields
 * @returns 401 - Authentication failure (invalid credentials, user not found)
 * @returns 500 - Internal server error
 * 
 * @throws ValidationError - When email or password fields are missing/invalid
 * @throws AuthenticationError - When credentials don't match existing user
 * @throws SupabaseError - When authentication service fails
 * 
 * @example
 * POST /api/auth/login
 * Request body: {
 *   "email": "user@example.com",
 *   "password": "userpassword"
 * }
 */
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
], validateRequest, async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      res.status(401).json({
        error: 'Login failed',
        message: error.message,
      });
      return;
    }

    res.json({
      message: 'Login successful',
      user: data.user,
      session: data.session,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to login',
    });
  }
});

/**
 * Logout current user session
 * Invalidates the current user's authentication session
 * 
 * @requires req.body - Empty object or no body required
 * 
 * @returns 200 - Success response containing:
 *   - message: "Logout successful"
 * @returns 400 - Logout failure (session already invalid)
 * @returns 500 - Internal server error
 * 
 * @throws SupabaseError - When logout operation fails
 * 
 * @example
 * POST /api/auth/logout
 * Request body: {} // Empty body or no body required
 */
router.post('/logout', async (req: Request, res: Response): Promise<void> => {
  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      res.status(400).json({
        error: 'Logout failed',
        message: error.message,
      });
      return;
    }

    res.json({
      message: 'Logout successful',
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to logout',
    });
  }
});

/**
 * Get current authenticated user information
 * Retrieves the current user's profile data using the JWT token from Authorization header
 * 
 * @requires req.headers.authorization - Bearer token in format "Bearer <jwt_token>"
 * 
 * @returns 200 - Success response with user object containing:
 *   - user.id: User's unique identifier
 *   - user.email: User's email address
 *   - user.user_metadata: Object containing full_name and other custom data
 *   - user.app_metadata: Object containing provider and role information
 *   - user.created_at: Account creation timestamp
 *   - user.updated_at: Last update timestamp
 * @returns 401 - Unauthorized (missing or invalid token)
 * @returns 500 - Internal server error
 * 
 * @throws AuthorizationError - When Authorization header is missing
 * @throws TokenError - When JWT token is invalid or expired
 * @throws SupabaseError - When user lookup fails
 * 
 * @example
 * GET /api/auth/me
 * Headers: { "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." }
 */
router.get('/me', async (req: Request, res: Response): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'No authorization header provided',
      });
      return;
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error) {
      res.status(401).json({
        error: 'Unauthorized',
        message: error.message,
      });
      return;
    }

    res.json({
      user,
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to get user',
    });
  }
});

/**
 * Refresh user authentication token
 * Generates a new access token using a valid refresh token to maintain user session
 * 
 * @requires req.body.refresh_token - Valid refresh token string obtained from login response
 * 
 * @returns 200 - Success response with new session data containing:
 *   - session.access_token: New JWT access token for API authentication
 *   - session.refresh_token: New refresh token for future token renewals
 *   - session.expires_at: Token expiration timestamp
 *   - session.expires_in: Token validity duration in seconds
 *   - session.token_type: Token type (usually "bearer")
 *   - session.user: Updated user object with current profile data
 * @returns 400 - Bad request (missing refresh token)
 * @returns 401 - Token refresh failed (invalid or expired refresh token)
 * @returns 500 - Internal server error
 * 
 * @throws ValidationError - When refresh_token is missing from request body
 * @throws TokenError - When refresh token is invalid, expired, or revoked
 * @throws SupabaseError - When token refresh service fails
 * 
 * @example
 * POST /api/auth/refresh
 * {
 *   "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9..."
 * }
 */
router.post('/refresh', async (req: Request, res: Response): Promise<void> => {
  try {
    const { refresh_token } = req.body;

    if (!refresh_token) {
      res.status(400).json({
        error: 'Bad request',
        message: 'Refresh token is required',
      });
      return;
    }

    const { data, error } = await supabase.auth.refreshSession({
      refresh_token,
    });

    if (error) {
      res.status(401).json({
        error: 'Token refresh failed',
        message: error.message,
      });
      return;
    }

    res.json({
      session: data.session,
      user: data.user,
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to refresh token',
    });
  }
});

export { router as authRoutes };
