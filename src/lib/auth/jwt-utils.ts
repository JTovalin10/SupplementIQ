import jwt from 'jsonwebtoken';
import { SignJWT, jwtVerify } from 'jose';

// JWT Secret - in production, use environment variable
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d'; // 7 days default

export interface JWTPayload {
  userId: string;
  email: string;
  role: 'user' | 'moderator' | 'admin' | 'owner';
  username: string;
  iat?: number;
  exp?: number;
}

export interface JWTTokens {
  accessToken: string;
  refreshToken: string;
}

/**
 * Generate JWT access and refresh tokens
 */
export async function generateTokens(payload: Omit<JWTPayload, 'iat' | 'exp'>): Promise<JWTTokens> {
  try {
    // Create access token (shorter expiry)
    const accessToken = await new SignJWT({
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
      username: payload.username,
      type: 'access'
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('1h') // Access token expires in 1 hour
      .sign(new TextEncoder().encode(JWT_SECRET));

    // Create refresh token (longer expiry)
    const refreshToken = await new SignJWT({
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
      username: payload.username,
      type: 'refresh'
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('7d') // Refresh token expires in 7 days
      .sign(new TextEncoder().encode(JWT_SECRET));

    return { accessToken, refreshToken };
  } catch (error) {
    console.error('Error generating JWT tokens:', error);
    throw new Error('Failed to generate authentication tokens');
  }
}

/**
 * Verify and decode JWT token
 */
export async function verifyToken(token: string): Promise<JWTPayload> {
  try {
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(JWT_SECRET)
    );

    return payload as JWTPayload;
  } catch (error) {
    console.error('JWT verification failed:', error);
    throw new Error('Invalid or expired token');
  }
}

/**
 * Extract token from Authorization header
 */
export function extractTokenFromHeader(authHeader: string | null): string | null {
  if (!authHeader) return null;
  
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }
  
  return parts[1];
}

/**
 * Check if token is expired (without throwing error)
 */
export function isTokenExpired(token: string): boolean {
  try {
    const decoded = jwt.decode(token) as any;
    if (!decoded || !decoded.exp) return true;
    
    return Date.now() >= decoded.exp * 1000;
  } catch {
    return true;
  }
}

/**
 * Refresh access token using refresh token
 */
export async function refreshAccessToken(refreshToken: string): Promise<string> {
  try {
    const payload = await verifyToken(refreshToken);
    
    if ((payload as any).type !== 'refresh') {
      throw new Error('Invalid refresh token type');
    }

    // Generate new access token
    const newAccessToken = await new SignJWT({
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
      username: payload.username,
      type: 'access'
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('1h')
      .sign(new TextEncoder().encode(JWT_SECRET));

    return newAccessToken;
  } catch (error) {
    console.error('Token refresh failed:', error);
    throw new Error('Failed to refresh token');
  }
}

/**
 * Generate a simple JWT token (legacy compatibility)
 */
export function generateSimpleToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

/**
 * Verify a simple JWT token (legacy compatibility)
 */
export function verifySimpleToken(token: string): JWTPayload {
  return jwt.verify(token, JWT_SECRET) as JWTPayload;
}

