import { SignJWT, jwtVerify, decodeJwt } from 'jose';

// Get JWT secret from environment variable
const getJWTSecret = (): Uint8Array => {
  const secret = process.env.JWT_SECRET || process.env.NEXT_PUBLIC_JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not set');
  }
  return new TextEncoder().encode(secret);
};

const JWT_SECRET = () => getJWTSecret();

/**
 * Create a basic JWT token
 */
export async function createJWT(payload: any, expiresIn: string = '1h'): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(JWT_SECRET());
}

/**
 * Create a user JWT token
 */
export async function createUserJWT(userId: string, role: string = 'user', expiresIn: string = '24h'): Promise<string> {
  return createJWT({
    sub: userId,
    role,
    permissions: ['read', 'write']
  }, expiresIn);
}

/**
 * Create an admin JWT token
 */
export async function createAdminJWT(userId: string, role: string = 'admin', expiresIn: string = '1h'): Promise<string> {
  return createJWT({
    sub: userId,
    role,
    permissions: ['read', 'write', 'delete', 'admin']
  }, expiresIn);
}

/**
 * Create a moderator JWT token
 */
export async function createModeratorJWT(userId: string, expiresIn: string = '2h'): Promise<string> {
  return createJWT({
    sub: userId,
    role: 'moderator',
    permissions: ['read', 'write', 'moderate']
  }, expiresIn);
}

/**
 * Create a custom JWT token with arbitrary data
 */
export async function createCustomJWT(payload: any, expiresIn: string = '1h'): Promise<string> {
  return createJWT(payload, expiresIn);
}

/**
 * Verify a JWT token
 */
export async function verifyJWT(token: string): Promise<any> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET());
    return payload;
  } catch (error: any) {
    if (error.code === 'ERR_JWT_EXPIRED') {
      throw new Error('Token expired');
    }
    if (error.code === 'ERR_JWT_INVALID') {
      throw new Error('Invalid token');
    }
    throw new Error('Token verification failed');
  }
}

/**
 * Decode a JWT token without verification (for demo purposes)
 */
export function decodeJWT(token: string): any {
  try {
    return decodeJwt(token);
  } catch (error) {
    throw new Error('Failed to decode token');
  }
}

/**
 * Check if a token has a specific permission
 */
export async function hasPermission(token: string, permission: string): Promise<boolean> {
  try {
    const payload = await verifyJWT(token);
    const permissions = payload.permissions || [];
    return permissions.includes(permission);
  } catch {
    return false;
  }
}

/**
 * Check if a token represents an admin user
 */
export async function isAdmin(token: string): Promise<boolean> {
  try {
    const payload = await verifyJWT(token);
    return payload.role === 'admin' || payload.role === 'owner';
  } catch {
    return false;
  }
}

/**
 * Check if a token represents a moderator user
 */
export async function isModerator(token: string): Promise<boolean> {
  try {
    const payload = await verifyJWT(token);
    return payload.role === 'moderator' || payload.role === 'admin' || payload.role === 'owner';
  } catch {
    return false;
  }
}


