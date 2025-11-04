import { NextRequest, NextResponse } from 'next/server';
import { extractTokenFromHeader, JWTPayload, verifyToken } from './jwt-utils';

export interface AuthenticatedRequest extends NextRequest {
  user?: JWTPayload;
}

type Role = 'user' | 'moderator' | 'admin' | 'owner';

function isValidRole(role: string): role is Role {
  return ['user', 'moderator', 'admin', 'owner'].includes(role);
}

/**
 * JWT Authentication Middleware
 * Protects API routes by verifying JWT tokens
 */
export function withJWTAuth(
  requiredRoles?: Role[],
  handler?: (req: AuthenticatedRequest, user: JWTPayload) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      // Extract token from Authorization header
      const authHeader = request.headers.get('authorization');
      const token = extractTokenFromHeader(authHeader);

      if (!token) {
        return NextResponse.json(
          { error: 'Authentication required', code: 'NO_TOKEN' },
          { status: 401 }
        );
      }

      // Verify the token
      const user = await verifyToken(token);

      // Check role permissions if required
      if (requiredRoles && (!isValidRole(user.role) || !requiredRoles.includes(user.role))) {
        return NextResponse.json(
          { 
            error: 'Insufficient permissions', 
            code: 'INSUFFICIENT_ROLE',
            required: requiredRoles,
            current: user.role
          },
          { status: 403 }
        );
      }

      // If handler is provided, call it with authenticated user
      if (handler) {
        const authenticatedRequest = request as AuthenticatedRequest;
        authenticatedRequest.user = user;
        return handler(authenticatedRequest, user);
      }

      // Otherwise, just return success
      return NextResponse.json({ 
        success: true, 
        user: {
          id: user.userId,
          email: user.email,
          role: user.role,
          username: user.username
        }
      });

    } catch (error: any) {
      console.error('JWT Authentication error:', error);
      
      if (error.message.includes('expired')) {
        return NextResponse.json(
          { error: 'Token expired', code: 'TOKEN_EXPIRED' },
          { status: 401 }
        );
      }
      
      if (error.message.includes('invalid')) {
        return NextResponse.json(
          { error: 'Invalid token', code: 'INVALID_TOKEN' },
          { status: 401 }
        );
      }

      return NextResponse.json(
        { error: 'Authentication failed', code: 'AUTH_FAILED' },
        { status: 401 }
      );
    }
  };
}

/**
 * Higher-order function to protect API routes with JWT
 */
export function protectRoute(
  requiredRoles?: Role[]
) {
  return function(handler: (req: AuthenticatedRequest, user: JWTPayload) => Promise<NextResponse>) {
    return withJWTAuth(requiredRoles, handler);
  };
}

/**
 * Extract user from request (for use in route handlers)
 */
export function getUserFromRequest(request: AuthenticatedRequest): JWTPayload | null {
  return request.user || null;
}

/**
 * Check if user has specific role
 */
export function hasRole(user: JWTPayload, role: Role): boolean {
  return user.role === role;
}

/**
 * Check if user has any of the specified roles
 */
export function hasAnyRole(
  user: JWTPayload, 
  roles: Role[]
): boolean {
  return isValidRole(user.role) && roles.includes(user.role);
}

/**
 * Check if user is admin or owner
 */
export function isAdminOrOwner(user: JWTPayload): boolean {
  return user.role === 'admin' || user.role === 'owner';
}

/**
 * Check if user is moderator, admin, or owner
 */
export function isModeratorOrAbove(user: JWTPayload): boolean {
  return isValidRole(user.role) && ['moderator', 'admin', 'owner'].includes(user.role);
}

/**
 * Get role hierarchy level (higher number = more permissions)
 */
export function getRoleLevel(role: string): number {
  const levels = {
    'user': 0,
    'moderator': 1,
    'admin': 2,
    'owner': 3
  };
  return levels[role as keyof typeof levels] || 0;
}

/**
 * Check if user has higher or equal role level
 */
export function hasRoleLevelOrAbove(
  user: JWTPayload, 
  requiredRole: Role
): boolean {
  const userLevel = getRoleLevel(user.role);
  const requiredLevel = getRoleLevel(requiredRole);
  return userLevel >= requiredLevel;
}

