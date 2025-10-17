import { NextRequest, NextResponse } from 'next/server';
import { cleanupValidationCache, logSensitiveOperation, verifySensitiveAccess } from './role-verification';

/**
 * Middleware for protecting admin/owner pages with comprehensive security
 */
export function withAdminSecurity(
  requiredRoles: ('admin' | 'moderator' | 'owner')[],
  operation: string
) {
  return function(handler: (request: NextRequest, user: any) => Promise<NextResponse>) {
    return async (request: NextRequest) => {
      try {
        // Clean up old cache entries periodically
        if (Math.random() < 0.1) { // 10% chance to cleanup
          cleanupValidationCache();
        }
        
        // Comprehensive security verification using optimized cache
        const { user, allowed, error } = await verifySensitiveAccess(
          request,
          requiredRoles,
          operation
        );
        
        if (!allowed) {
          // Log failed access attempt
          await logSensitiveOperation(
            user.id || 'unknown',
            operation,
            { 
              reason: error,
              userAgent: request.headers.get('user-agent'),
              ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
              url: request.url
            },
            false
          );
          
          // Special handling for cache loading
          if (error === 'Cache loading, please wait' || error === 'Owner cache loading, please wait') {
            return NextResponse.json(
              { 
                error: error,
                cacheLoading: true,
                retryAfter: 5000,
                operation,
                timestamp: new Date().toISOString()
              },
              { status: 503 } // Service Unavailable
            );
          }
          
          return NextResponse.json(
            { 
              error: error || 'Access denied',
              operation,
              timestamp: new Date().toISOString()
            },
            { status: error === 'Authentication required' ? 401 : 403 }
          );
        }
        
        // Log successful access
        await logSensitiveOperation(
          user.id,
          operation,
          { 
            userRole: user.role,
            userAgent: request.headers.get('user-agent'),
            ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip')
          },
          true
        );
        
        // Call the actual handler with authenticated user
        return handler(request, user);
        
      } catch (error) {
        console.error(`[ADMIN_SECURITY] ${operation} - Middleware error:`, error);
        
        await logSensitiveOperation(
          'system',
          operation,
          { error: error instanceof Error ? error.message : 'Unknown error' },
          false
        );
        
        return NextResponse.json(
          { 
            error: 'Security verification failed',
            operation,
            timestamp: new Date().toISOString()
          },
          { status: 500 }
        );
      }
    };
  };
}

/**
 * Rate limiting for sensitive operations
 */
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export function withRateLimit(
  maxRequests: number = 10,
  windowMs: number = 60000 // 1 minute
) {
  return function(handler: (request: NextRequest) => Promise<NextResponse>) {
    return async (request: NextRequest) => {
      const ip = request.headers.get('x-forwarded-for') || 
                 request.headers.get('x-real-ip') || 
                 'unknown';
      
      const now = Date.now();
      const key = `${ip}:${request.url}`;
      
      const current = rateLimitMap.get(key);
      
      if (current) {
        if (now < current.resetTime) {
          if (current.count >= maxRequests) {
            return NextResponse.json(
              { 
                error: 'Rate limit exceeded',
                retryAfter: Math.ceil((current.resetTime - now) / 1000)
              },
              { status: 429 }
            );
          }
          current.count++;
        } else {
          rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
        }
      } else {
        rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
      }
      
      return handler(request);
    };
  };
}

/**
 * Security headers middleware
 */
export function withSecurityHeaders(handler: (request: NextRequest) => Promise<NextResponse>) {
  return async (request: NextRequest) => {
    const response = await handler(request);
    
    // Add security headers
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
    
    return response;
  };
}
