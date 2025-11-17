/**
 * Rate limiting utility for authentication endpoints
 * Uses Redis with sliding window algorithm to prevent brute force attacks
 */

import { getRedis } from "../../../Database/Redis/client";
import type { NextRequest } from "next/server";

export interface RateLimitConfig {
  /** Maximum number of requests allowed in the time window */
  maxAttempts: number;
  /** Time window in seconds */
  windowSeconds: number;
  /** Optional custom error message */
  message?: string;
}

export interface RateLimitResult {
  /** Whether the request is allowed */
  success: boolean;
  /** Number of attempts remaining */
  remaining: number;
  /** Total limit */
  limit: number;
  /** Unix timestamp when the limit will reset */
  resetAt: number;
  /** Seconds until reset */
  retryAfter?: number;
}

/**
 * Predefined rate limit configurations for different auth operations
 */
export const RATE_LIMIT_CONFIGS = {
  login: {
    maxAttempts: 5,
    windowSeconds: 15 * 60, // 15 minutes
    message: "Too many login attempts. Please try again later.",
  },
  register: {
    maxAttempts: 3,
    windowSeconds: 60 * 60, // 1 hour
    message: "Too many registration attempts. Please try again later.",
  },
  forgotPassword: {
    maxAttempts: 5,
    windowSeconds: 60 * 60, // 1 hour
    message: "Too many password reset requests. Please try again later.",
  },
  resetPassword: {
    maxAttempts: 3,
    windowSeconds: 15 * 60, // 15 minutes
    message: "Too many password reset attempts. Please try again later.",
  },
} as const;

/**
 * Extract client IP from Next.js request
 */
export function getClientIp(request: NextRequest): string {
  // Check multiple headers for IP (common reverse proxy headers)
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    // x-forwarded-for can contain multiple IPs, take the first one
    return forwarded.split(",")[0].trim();
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp.trim();
  }

  const cfConnectingIp = request.headers.get("cf-connecting-ip"); // Cloudflare
  if (cfConnectingIp) {
    return cfConnectingIp.trim();
  }

  // Fallback to unknown if no IP found
  return "unknown";
}

/**
 * Generate a rate limit key for Redis
 */
export function getRateLimitKey(prefix: string, identifier: string): string {
  return `ratelimit:${prefix}:${identifier}`;
}

/**
 * Check rate limit using sliding window algorithm with Redis
 * This provides more accurate rate limiting than fixed windows
 */
export async function checkRateLimit(
  key: string,
  config: RateLimitConfig,
): Promise<RateLimitResult> {
  try {
    const redis = getRedis();
    const now = Date.now();
    const windowMs = config.windowSeconds * 1000;
    const windowStart = now - windowMs;

    // Use Redis sorted set for sliding window
    // Score is timestamp, member is unique request ID

    // Remove old entries outside the window
    await redis.zremrangebyscore(key, 0, windowStart);

    // Count current requests in window
    const currentCount = await redis.zcard(key);

    // Check if limit exceeded
    if (currentCount >= config.maxAttempts) {
      // Get the oldest entry to calculate when it will expire
      const oldestEntries = await redis.zrange(key, 0, 0, "WITHSCORES");
      const oldestTimestamp = oldestEntries[1]
        ? parseInt(oldestEntries[1])
        : now;
      const resetAt = Math.floor((oldestTimestamp + windowMs) / 1000);
      const retryAfter = Math.ceil((oldestTimestamp + windowMs - now) / 1000);

      return {
        success: false,
        remaining: 0,
        limit: config.maxAttempts,
        resetAt,
        retryAfter: Math.max(retryAfter, 1), // At least 1 second
      };
    }

    // Add current request to the window
    const requestId = `${now}:${Math.random().toString(36).substring(7)}`;
    await redis.zadd(key, now, requestId);

    // Set expiration on the key (cleanup)
    await redis.expire(key, config.windowSeconds);

    const remaining = config.maxAttempts - (currentCount + 1);
    const resetAt = Math.floor((now + windowMs) / 1000);

    return {
      success: true,
      remaining: Math.max(remaining, 0),
      limit: config.maxAttempts,
      resetAt,
    };
  } catch (error) {
    console.error("Rate limit check failed:", error);

    // On Redis error, allow the request but log the error
    // This ensures availability even if Redis is down
    return {
      success: true,
      remaining: config.maxAttempts,
      limit: config.maxAttempts,
      resetAt: Math.floor((Date.now() + config.windowSeconds * 1000) / 1000),
    };
  }
}

/**
 * Combined rate limiting by both IP and identifier (email)
 * Both limits must pass for the request to be allowed
 */
export async function checkCombinedRateLimit(
  ipKey: string,
  identifierKey: string,
  config: RateLimitConfig,
): Promise<RateLimitResult> {
  // Check IP-based rate limit
  const ipResult = await checkRateLimit(ipKey, config);

  if (!ipResult.success) {
    return ipResult;
  }

  // Check identifier-based rate limit (e.g., email)
  const identifierResult = await checkRateLimit(identifierKey, config);

  if (!identifierResult.success) {
    return identifierResult;
  }

  // Return the more restrictive result
  return {
    success: true,
    remaining: Math.min(ipResult.remaining, identifierResult.remaining),
    limit: config.maxAttempts,
    resetAt: Math.max(ipResult.resetAt, identifierResult.resetAt),
  };
}

/**
 * Reset rate limit for a specific key
 * Useful for clearing limits after successful authentication
 */
export async function resetRateLimit(key: string): Promise<void> {
  try {
    const redis = getRedis();
    await redis.del(key);
  } catch (error) {
    console.error("Failed to reset rate limit:", error);
  }
}

/**
 * Helper to check IP-based rate limit for auth endpoints
 */
export async function checkAuthRateLimit(
  request: NextRequest,
  operation: keyof typeof RATE_LIMIT_CONFIGS,
  identifier?: string,
): Promise<RateLimitResult> {
  const ip = getClientIp(request);
  const config = RATE_LIMIT_CONFIGS[operation];

  const ipKey = getRateLimitKey(operation, ip);

  // If identifier (email) is provided, use combined rate limiting
  if (identifier) {
    const identifierKey = getRateLimitKey(
      `${operation}:email`,
      identifier.toLowerCase().trim(),
    );
    return checkCombinedRateLimit(ipKey, identifierKey, config);
  }

  // Otherwise, just check IP-based rate limiting
  return checkRateLimit(ipKey, config);
}
