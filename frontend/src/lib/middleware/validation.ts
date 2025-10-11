/**
 * Validation utilities for Next.js API routes
 * Provides input sanitization and validation functions
 */

/**
 * Sanitize input string to prevent injection attacks
 * Removes potentially dangerous characters and normalizes whitespace
 * 
 * @param input - Raw input string to sanitize
 * @returns Sanitized string safe for database queries
 * 
 * @example
 * const sanitized = sanitizeInput("user' input; DROP TABLE users;");
 * // Returns: "user input DROP TABLE users"
 */
export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }

  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/['";]/g, '') // Remove SQL injection characters
    .replace(/[()]/g, '') // Remove parentheses
    .replace(/[{}]/g, '') // Remove braces
    .replace(/[\[\]]/g, '') // Remove brackets
    .replace(/[\\]/g, '') // Remove backslashes
    .replace(/[\/]/g, ' ') // Replace forward slashes with spaces
    .replace(/\s+/g, ' ') // Normalize whitespace
    .slice(0, 1000); // Limit length to prevent buffer overflow
}

/**
 * Validate email format
 * 
 * @param email - Email string to validate
 * @returns boolean indicating if email is valid
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate UUID format
 * 
 * @param uuid - UUID string to validate
 * @returns boolean indicating if UUID is valid
 */
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Validate URL format
 * 
 * @param url - URL string to validate
 * @returns boolean indicating if URL is valid
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate password strength
 * 
 * @param password - Password string to validate
 * @returns object with validation result and error message
 */
export function validatePassword(password: string): { isValid: boolean; error?: string } {
  if (!password || password.length < 8) {
    return { isValid: false, error: 'Password must be at least 8 characters long' };
  }

  if (!/[A-Z]/.test(password)) {
    return { isValid: false, error: 'Password must contain at least one uppercase letter' };
  }

  if (!/[a-z]/.test(password)) {
    return { isValid: false, error: 'Password must contain at least one lowercase letter' };
  }

  if (!/[0-9]/.test(password)) {
    return { isValid: false, error: 'Password must contain at least one number' };
  }

  return { isValid: true };
}

/**
 * Validate pagination parameters
 * 
 * @param page - Page number
 * @param limit - Items per page
 * @returns object with validation result and sanitized values
 */
export function validatePagination(page: string | null, limit: string | null): {
  isValid: boolean;
  error?: string;
  page?: number;
  limit?: number;
} {
  const pageNum = page ? parseInt(page) : 1;
  const limitNum = limit ? parseInt(limit) : 25;

  if (isNaN(pageNum) || pageNum < 1) {
    return { isValid: false, error: 'Page must be a positive integer' };
  }

  if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
    return { isValid: false, error: 'Limit must be between 1 and 100' };
  }

  return { isValid: true, page: pageNum, limit: limitNum };
}

/**
 * Validate sort parameters
 * 
 * @param sort - Sort field
 * @param order - Sort order
 * @param allowedFields - Array of allowed sort fields
 * @returns object with validation result and sanitized values
 */
export function validateSort(
  sort: string | null,
  order: string | null,
  allowedFields: string[] = ['name', 'created_at', 'rating', 'price']
): {
  isValid: boolean;
  error?: string;
  sort?: string;
  order?: string;
} {
  const sortField = sort || 'created_at';
  const sortOrder = order || 'desc';

  if (!allowedFields.includes(sortField)) {
    return { isValid: false, error: `Invalid sort field. Allowed: ${allowedFields.join(', ')}` };
  }

  if (!['asc', 'desc'].includes(sortOrder)) {
    return { isValid: false, error: 'Sort order must be "asc" or "desc"' };
  }

  return { isValid: true, sort: sortField, order: sortOrder };
}

/**
 * Create validation error response
 * 
 * @param message - Error message
 * @param details - Additional error details
 * @returns NextResponse with validation error
 */
export function createValidationError(message: string, details?: any) {
  return {
    error: 'Validation error',
    message,
    ...(details && { details })
  };
}

/**
 * Create database error response
 * 
 * @param message - Error message
 * @param originalError - Original database error
 * @returns NextResponse with database error
 */
export function createDatabaseError(message: string, originalError?: any) {
  return {
    error: 'Database error',
    message,
    ...(originalError && { details: originalError })
  };
}

/**
 * Create authentication error response
 * 
 * @param message - Error message
 * @returns NextResponse with authentication error
 */
export function createAuthError(message: string) {
  return {
    error: 'Unauthorized',
    message
  };
}

/**
 * Create authorization error response
 * 
 * @param message - Error message
 * @returns NextResponse with authorization error
 */
export function createAuthorizationError(message: string) {
  return {
    error: 'Forbidden',
    message
  };
}

/**
 * Create not found error response
 * 
 * @param message - Error message
 * @returns NextResponse with not found error
 */
export function createNotFoundError(message: string) {
  return {
    error: 'Not found',
    message
  };
}

/**
 * Create internal server error response
 * 
 * @param message - Error message
 * @returns NextResponse with internal server error
 */
export function createInternalError(message: string) {
  return {
    error: 'Internal server error',
    message
  };
}