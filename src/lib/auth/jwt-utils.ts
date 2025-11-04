import { SignJWT, jwtVerify } from 'jose';

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  username: string;
  type?: 'access' | 'refresh';
  iat?: number;
  exp?: number;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface GenerateTokensParams {
  userId: string;
  email: string;
  role: string;
  username: string;
}

// Get JWT secret from environment variable
const getJWTSecret = (): Uint8Array => {
  const secret = process.env.JWT_SECRET || process.env.NEXT_PUBLIC_JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not set');
  }
  // Convert string to Uint8Array for jose
  return new TextEncoder().encode(secret);
};

const JWT_SECRET = () => getJWTSecret();
const ACCESS_TOKEN_EXPIRY = '15m'; // 15 minutes
const REFRESH_TOKEN_EXPIRY = '7d'; // 7 days

/**
 * Generate both access and refresh tokens
 */
export async function generateTokens(params: GenerateTokensParams): Promise<TokenPair> {
  const { userId, email, role, username } = params;
  
  const accessToken = await new SignJWT({
    userId,
    email,
    role,
    username,
    type: 'access'
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(ACCESS_TOKEN_EXPIRY)
    .sign(JWT_SECRET());

  const refreshToken = await new SignJWT({
    userId,
    email,
    role,
    username,
    type: 'refresh'
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(REFRESH_TOKEN_EXPIRY)
    .sign(JWT_SECRET());

  return {
    accessToken,
    refreshToken
  };
}

/**
 * Verify a JWT token and return the payload
 */
export async function verifyToken(token: string): Promise<JWTPayload> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET());
    
    // Convert the payload to JWTPayload format
    return {
      userId: payload.userId as string,
      email: payload.email as string,
      role: payload.role as string,
      username: payload.username as string,
      type: payload.type as 'access' | 'refresh' | undefined,
      iat: payload.iat as number | undefined,
      exp: payload.exp as number | undefined
    };
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
 * Refresh an access token using a refresh token
 */
export async function refreshAccessToken(refreshToken: string): Promise<string> {
  // Verify the refresh token
  const payload = await verifyToken(refreshToken);
  
  // Ensure it's a refresh token
  if (payload.type !== 'refresh') {
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
    .setExpirationTime(ACCESS_TOKEN_EXPIRY)
    .sign(JWT_SECRET());

  return newAccessToken;
}

/**
 * Extract JWT token from Authorization header
 * Supports both "Bearer <token>" and plain token formats
 */
export function extractTokenFromHeader(authHeader: string | null): string | null {
  if (!authHeader) {
    return null;
  }

  // Handle "Bearer <token>" format
  if (authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // Handle plain token
  return authHeader;
}


