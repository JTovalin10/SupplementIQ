import { adminCache } from '@/lib/core/admin-cache';
import { createClient } from '@/lib/supabase/server';
import { NextRequest } from 'next/server';

export interface UserWithRole {
  id: string;
  email: string | undefined;
  role: string;
  username?: string;
}

// Cache for time-based validation
const validationCache = new Map<string, { 
  lastValidated: number; 
  isValid: boolean; 
  role: string;
}>();

const OWNER_VALIDATION_INTERVAL = 5000; // 5 seconds for owner
const ADMIN_VALIDATION_INTERVAL = 20000; // 20 seconds for admin

/**
 * Optimized role verification using admin cache with time-based validation
 * This function performs efficient security checks:
 * 1. Session authentication
 * 2. Cache-based role verification with time intervals
 * 3. Access logging
 */
export async function verifySensitiveAccess(
  request: NextRequest,
  requiredRoles: ('admin' | 'moderator' | 'owner')[],
  operation: string
): Promise<{ user: UserWithRole; allowed: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    
    // 1. Get user from session
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.log(`[SECURITY] ${operation} - Authentication failed:`, authError?.message);
      return { user: {} as UserWithRole, allowed: false, error: 'Authentication required' };
    }
    
    // 2. Check cache for recent validation
    const now = Date.now();
    const cached = validationCache.get(user.id);
    
    if (cached) {
      const timeSinceValidation = now - cached.lastValidated;
      const validationInterval = requiredRoles.includes('owner') ? OWNER_VALIDATION_INTERVAL : ADMIN_VALIDATION_INTERVAL;
      
      // Use cached result if within validation interval
      if (timeSinceValidation < validationInterval && cached.isValid) {
        const userRole = cached.role;
        
        if (requiredRoles.includes(userRole as any)) {
          console.log(`[SECURITY] ${operation} - Access granted (cached):`, {
            userId: user.id,
            role: userRole,
            cacheAge: Math.round(timeSinceValidation / 1000) + 's'
          });
          
          return { 
            user: { id: user.id, email: user.email, role: userRole } as UserWithRole, 
            allowed: true 
          };
        }
      }
    }
    
    // 3. Validate against admin cache (much faster than DB query)
    let userAuthority = await adminCache.getUserAuthority(user.id);
    
    // 3a. If cache is empty, wait for it to refresh and retry
    if (!userAuthority.role) {
      console.log(`[SECURITY] ${operation} - Cache empty, waiting for refresh for:`, user.id);
      
      // Wait 5 seconds for cache to refresh (admin cache has built-in refresh)
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Retry after cache refresh
      userAuthority = await adminCache.getUserAuthority(user.id);
      
      if (!userAuthority.role) {
        console.log(`[SECURITY] ${operation} - Cache still empty after refresh:`, user.id);
        // Return a special status indicating cache is loading
        return { 
          user: { id: user.id, email: user.email, role: 'loading' } as UserWithRole, 
          allowed: false, 
          error: 'Cache loading, please wait' 
        };
      } else {
        console.log(`[SECURITY] ${operation} - Cache refreshed successfully:`, userAuthority.role);
      }
    }
    
    if (!userAuthority.role || !requiredRoles.includes(userAuthority.role as any)) {
      console.log(`[SECURITY] ${operation} - Insufficient role:`, {
        userId: user.id,
        userRole: userAuthority.role,
        requiredRoles,
        userAgent: request.headers.get('user-agent'),
        ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
        usedDatabaseFailsafe: !userAuthority.role
      });
      
      // Cache negative result for shorter time
      validationCache.set(user.id, {
        lastValidated: now,
        isValid: false,
        role: userAuthority.role || 'none'
      });
      
      return { 
        user: { id: user.id, email: user.email, role: userAuthority.role || 'none' } as UserWithRole, 
        allowed: false, 
        error: 'Insufficient permissions' 
      };
    }
    
    // 4. Additional security checks for owner operations
    if (requiredRoles.includes('owner') && userAuthority.role === 'owner') {
      // Double-check owner ID from cache
      let ownerId = await adminCache.getOwnerId();
      
      // If owner ID not in cache, wait for cache refresh
      if (!ownerId) {
        console.log(`[SECURITY] ${operation} - Owner ID not in cache, waiting for refresh`);
        
        // Wait 5 seconds for cache to refresh (admin cache has built-in refresh)
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // Retry after cache refresh
        ownerId = await adminCache.getOwnerId();
        
        if (!ownerId) {
          console.log(`[SECURITY] ${operation} - Owner ID still not in cache after refresh`);
          return { 
            user: { id: user.id, email: user.email, role: 'loading' } as UserWithRole, 
            allowed: false, 
            error: 'Owner cache loading, please wait' 
          };
        }
      }
      
      if (ownerId !== user.id) {
        console.log(`[SECURITY] ${operation} - Owner ID mismatch:`, {
          userId: user.id,
          cachedOwnerId: ownerId
        });
        
        validationCache.set(user.id, {
          lastValidated: now,
          isValid: false,
          role: 'none'
        });
        
        return { 
          user: { id: user.id, email: user.email, role: 'none' } as UserWithRole, 
          allowed: false, 
          error: 'Owner verification failed' 
        };
      }
    }
    
    // 5. Cache successful validation
    validationCache.set(user.id, {
      lastValidated: now,
      isValid: true,
      role: userAuthority.role
    });
    
    // 6. Log successful access
    console.log(`[SECURITY] ${operation} - Access granted:`, {
      userId: user.id,
      role: userAuthority.role,
      timestamp: new Date().toISOString()
    });
    
    return { 
      user: { id: user.id, email: user.email, role: userAuthority.role } as UserWithRole, 
      allowed: true 
    };
    
  } catch (error) {
    console.error(`[SECURITY] ${operation} - Verification error:`, error);
    return { user: {} as UserWithRole, allowed: false, error: 'Security verification failed' };
  }
}

/**
 * Role hierarchy check - ensures proper permission levels
 */
export function hasRequiredRole(userRole: string, requiredRole: string): boolean {
  const roleHierarchy = {
    'newcomer': 0,
    'contributor': 1,
    'trusted_editor': 2,
    'moderator': 3,
    'admin': 4,
    'owner': 5
  };
  
  return roleHierarchy[userRole as keyof typeof roleHierarchy] >= roleHierarchy[requiredRole as keyof typeof roleHierarchy];
}

/**
 * Clean up old validation cache entries (run periodically)
 */
export function cleanupValidationCache(): void {
  const now = Date.now();
  const maxAge = 5 * 60 * 1000; // 5 minutes
  
  for (const [userId, entry] of validationCache.entries()) {
    if (now - entry.lastValidated > maxAge) {
      validationCache.delete(userId);
    }
  }
}

/**
 * Get validation cache statistics
 */
export function getValidationCacheStats(): {
  totalEntries: number;
  validEntries: number;
  invalidEntries: number;
  oldestEntry: number;
} {
  const entries = Array.from(validationCache.values());
  const now = Date.now();
  
  return {
    totalEntries: entries.length,
    validEntries: entries.filter(e => e.isValid).length,
    invalidEntries: entries.filter(e => !e.isValid).length,
    oldestEntry: entries.length > 0 ? Math.max(...entries.map(e => now - e.lastValidated)) : 0
  };
}

/**
 * Audit log for sensitive operations
 */
export async function logSensitiveOperation(
  userId: string,
  operation: string,
  details: any,
  success: boolean
) {
  try {
    const supabase = await createClient();
    
    await supabase
      .from('audit_logs')
      .insert({
        user_id: userId,
        operation,
        details,
        success,
        timestamp: new Date().toISOString(),
        ip_address: 'server-side'
      });
  } catch (error) {
    console.error('[AUDIT] Failed to log operation:', error);
  }
}
