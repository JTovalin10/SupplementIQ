/**
 * Simple input sanitization for Next.js API routes
 * Basic sanitization to prevent XSS and injection attacks
 */

/**
 * Sanitize input string by removing potentially dangerous characters
 * @param input - The input string to sanitize
 * @returns Sanitized string or null if invalid
 */
export function sanitizeInput(input: string | undefined | null): string | null {
  if (!input) return null;
  
  const sanitized = input
    .trim()
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/['"]/g, '') // Remove quotes
    .replace(/[;]/g, '') // Remove semicolons
    .replace(/[&]/g, '') // Remove ampersands
    .replace(/[|]/g, '') // Remove pipes
    .replace(/[`]/g, '') // Remove backticks
    .replace(/[\\]/g, '') // Remove backslashes
    .replace(/[\/]/g, '') // Remove forward slashes
    .replace(/[()]/g, '') // Remove parentheses
    .replace(/[{}]/g, '') // Remove braces
    .replace(/[\[\]]/g, '') // Remove brackets
    .replace(/[!@#$%^&*+=]/g, '') // Remove special characters
    .replace(/\s+/g, ' ') // Normalize whitespace
    .substring(0, 100); // Limit length
  
  return sanitized.length > 0 ? sanitized : null;
}

/**
 * Sanitize search query specifically
 * @param query - The search query to sanitize
 * @returns Sanitized query or null if invalid
 */
export function sanitizeSearchQuery(query: string | undefined | null): string | null {
  if (!query) return null;
  
  // For search queries, be less restrictive but still safe
  const sanitized = query
    .trim()
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/['"]/g, '') // Remove quotes
    .replace(/[;]/g, '') // Remove semicolons
    .replace(/[&]/g, '') // Remove ampersands
    .replace(/[|]/g, '') // Remove pipes
    .replace(/[`]/g, '') // Remove backticks
    .replace(/[\\]/g, '') // Remove backslashes
    .replace(/[()]/g, '') // Remove parentheses
    .replace(/[{}]/g, '') // Remove braces
    .replace(/[\[\]]/g, '') // Remove brackets
    .replace(/[!@#$%^&*+=]/g, '') // Remove special characters
    .replace(/\s+/g, ' ') // Normalize whitespace
    .substring(0, 200); // Limit length
  
  return sanitized.length > 0 ? sanitized : null;
}
