import { jwtVerify, SignJWT } from 'jose';

/**
 * JWT utility functions for token manipulation and verification
 * Allows routes to be manipulated with custom JWT tokens
 */

// Get JWT secret from environment
const getJWTSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is required');
  }
  return new TextEncoder().encode(secret);
};

/**
 * Verify and decode a JWT token
 * @param {string} token - JWT token to verify
 * @returns {Promise<{payload: any, header: any} | null>} Decoded token data or null if invalid
 */
export async function verifyJWT(token: string) {
  try {
    const secret = getJWTSecret();
    const { payload, protectedHeader } = await jwtVerify(token, secret);
    return { payload, header: protectedHeader };
  } catch (error) {
    console.error('JWT verification error:', error);
    return null;
  }
}

/**
 * Create a custom JWT token with payload
 * @param {object} payload - Data to include in the token
 * @param {string} expiresIn - Token expiration time (e.g., '1h', '7d')
 * @returns {Promise<string>} Signed JWT token
 */
export async function createJWT(payload: any, expiresIn: string = '1h') {
  try {
    const secret = getJWTSecret();
    const token = await new SignJWT(payload)
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime(expiresIn)
      .sign(secret);
    
    return token;
  } catch (error) {
    console.error('JWT creation error:', error);
    throw new Error('Failed to create JWT token');
  }
}

/**
 * Extract JWT payload without verification (for debugging)
 * @param {string} token - JWT token
 * @returns {object | null} Decoded payload or null if invalid
 */
export function decodeJWT(token: string) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }
    
    const payload = parts[1];
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decoded);
  } catch (error) {
    console.error('JWT decode error:', error);
    return null;
  }
}

/**
 * Create a JWT token for a user with role-based claims
 * @param {string} userId - User ID
 * @param {string} role - User role
 * @param {string} expiresIn - Token expiration time
 * @returns {Promise<string>} Signed JWT token
 */
export async function createUserJWT(userId: string, role: string, expiresIn: string = '24h') {
  const payload = {
    sub: userId,
    role: role,
    iat: Math.floor(Date.now() / 1000),
    type: 'user_access'
  };
  
  return createJWT(payload, expiresIn);
}

/**
 * Create an admin JWT token with elevated privileges
 * @param {string} userId - User ID
 * @param {string} role - User role (admin/owner/moderator)
 * @param {string} expiresIn - Token expiration time
 * @returns {Promise<string>} Signed JWT token with admin claims
 */
export async function createAdminJWT(userId: string, role: string, expiresIn: string = '1h') {
  const payload = {
    sub: userId,
    role: role,
    admin: true,
    permissions: ['read', 'write', 'delete'],
    iat: Math.floor(Date.now() / 1000),
    type: 'admin_access'
  };
  
  return createJWT(payload, expiresIn);
}

/**
 * Create a moderator JWT token with specific permissions
 * @param {string} userId - User ID
 * @param {string} expiresIn - Token expiration time
 * @returns {Promise<string>} Signed JWT token with moderator claims
 */
export async function createModeratorJWT(userId: string, expiresIn: string = '2h') {
  const payload = {
    sub: userId,
    role: 'moderator',
    admin: false,
    moderator: true,
    permissions: ['read', 'write', 'moderate'],
    iat: Math.floor(Date.now() / 1000),
    type: 'moderator_access'
  };
  
  return createJWT(payload, expiresIn);
}

/**
 * Create a custom JWT token for route manipulation
 * @param {object} customPayload - Custom data to include in the token
 * @param {string} expiresIn - Token expiration time
 * @returns {Promise<string>} Signed JWT token
 */
export async function createCustomJWT(customPayload: any, expiresIn: string = '1h') {
  const payload = {
    ...customPayload,
    iat: Math.floor(Date.now() / 1000),
    type: 'custom_access'
  };
  
  return createJWT(payload, expiresIn);
}

/**
 * Validate JWT token and extract user info
 * @param {string} token - JWT token to validate
 * @returns {Promise<{payload: any} | null>} JWT payload or null if invalid
 */
export async function validateJWT(token: string) {
  try {
    const jwtData = await verifyJWT(token);
    return jwtData ? { payload: jwtData.payload } : null;
  } catch (error) {
    console.error('JWT validation error:', error);
    return null;
  }
}

/**
 * Check if JWT token has specific permission
 * @param {string} token - JWT token
 * @param {string} permission - Permission to check (e.g., 'read', 'write', 'delete')
 * @returns {Promise<boolean>} True if token has permission
 */
export async function hasPermission(token: string, permission: string): Promise<boolean> {
  try {
    const jwtData = await verifyJWT(token);
    if (!jwtData) return false;
    
    const permissions = jwtData.payload.permissions as string[];
    return permissions?.includes(permission) || false;
  } catch (error) {
    console.error('Permission check error:', error);
    return false;
  }
}

/**
 * Check if JWT token has admin privileges
 * @param {string} token - JWT token
 * @returns {Promise<boolean>} True if token has admin privileges
 */
export async function isAdmin(token: string): Promise<boolean> {
  try {
    const jwtData = await verifyJWT(token);
    if (!jwtData) return false;
    
    return jwtData.payload.admin === true || 
           ['admin', 'owner'].includes(jwtData.payload.role);
  } catch (error) {
    console.error('Admin check error:', error);
    return false;
  }
}

/**
 * Check if JWT token has moderator privileges
 * @param {string} token - JWT token
 * @returns {Promise<boolean>} True if token has moderator privileges
 */
export async function isModerator(token: string): Promise<boolean> {
  try {
    const jwtData = await verifyJWT(token);
    if (!jwtData) return false;
    
    return jwtData.payload.moderator === true || 
           jwtData.payload.role === 'moderator' ||
           ['admin', 'owner', 'moderator'].includes(jwtData.payload.role);
  } catch (error) {
    console.error('Moderator check error:', error);
    return false;
  }
}


