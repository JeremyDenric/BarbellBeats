/**
 * Rate Limiting Middleware
 * 
 * Protects API from abuse using token bucket algorithm
 * Can be configured per-route or globally
 */

import type { MiddlewareHandler } from 'hono';
import { env } from '../config/env';
import { RateLimitError } from '../types';

// ============================================================================
// In-Memory Store (use Redis in production for multi-instance deployments)
// ============================================================================

interface RateLimitEntry {
  tokens: number;
  lastRefill: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// ============================================================================
// Rate Limiter Configuration
// ============================================================================

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  keyGenerator?: (c: any) => string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

const defaultConfig: RateLimitConfig = {
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  maxRequests: env.RATE_LIMIT_MAX_REQUESTS,
  keyGenerator: (c) => {
    // Use IP address as key, or user ID if authenticated
    const userId = c.get('userId');
    if (userId) return `user:${userId}`;
    
    // Get IP from various headers (handle proxy scenarios)
    const forwarded = c.req.header('x-forwarded-for');
    const realIp = c.req.header('x-real-ip');
    const ip = forwarded?.split(',')[0] || realIp || 'unknown';
    
    return `ip:${ip}`;
  },
};

// ============================================================================
// Token Bucket Algorithm
// ============================================================================

function checkRateLimit(key: string, config: RateLimitConfig): {
  allowed: boolean;
  remaining: number;
  resetTime: number;
} {
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  if (!entry) {
    // First request - initialize with max tokens minus 1
    rateLimitStore.set(key, {
      tokens: config.maxRequests - 1,
      lastRefill: now,
    });

    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetTime: now + config.windowMs,
    };
  }

  // Calculate tokens to add based on time passed
  const timePassed = now - entry.lastRefill;
  const refillRate = config.maxRequests / config.windowMs;
  const tokensToAdd = Math.floor(timePassed * refillRate);

  // Refill tokens up to max
  const newTokens = Math.min(config.maxRequests, entry.tokens + tokensToAdd);
  
  if (newTokens > 0) {
    // Allow request and consume token
    rateLimitStore.set(key, {
      tokens: newTokens - 1,
      lastRefill: now,
    });

    return {
      allowed: true,
      remaining: newTokens - 1,
      resetTime: now + config.windowMs,
    };
  }

  // No tokens available - rate limited
  return {
    allowed: false,
    remaining: 0,
    resetTime: entry.lastRefill + config.windowMs,
  };
}

// ============================================================================
// Cleanup Old Entries
// ============================================================================

// Clean up old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  const expireThreshold = now - defaultConfig.windowMs * 2;

  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.lastRefill < expireThreshold) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

// ============================================================================
// Middleware Factory
// ============================================================================

/**
 * Create rate limiter middleware with custom config
 */
export function createRateLimiter(config?: Partial<RateLimitConfig>): MiddlewareHandler {
  const finalConfig = { ...defaultConfig, ...config };

  return async (c, next) => {
    if (!env.ENABLE_RATE_LIMITING) {
      return next();
    }

    const key = finalConfig.keyGenerator!(c);
    const { allowed, remaining, resetTime } = checkRateLimit(key, finalConfig);

    // Add rate limit headers
    c.header('X-RateLimit-Limit', finalConfig.maxRequests.toString());
    c.header('X-RateLimit-Remaining', remaining.toString());
    c.header('X-RateLimit-Reset', new Date(resetTime).toISOString());

    if (!allowed) {
      const retryAfter = Math.ceil((resetTime - Date.now()) / 1000);
      c.header('Retry-After', retryAfter.toString());
      
      throw new RateLimitError(
        `Too many requests. Please try again in ${retryAfter} seconds.`
      );
    }

    await next();
  };
}

// ============================================================================
// Default Rate Limiter
// ============================================================================

export const rateLimiter = createRateLimiter();

// ============================================================================
// Preset Rate Limiters
// ============================================================================

/**
 * Strict rate limiter for auth endpoints
 */
export const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5, // 5 requests per 15 minutes
});

/**
 * Lenient rate limiter for public endpoints
 */
export const publicRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 200, // 200 requests per minute
});

/**
 * Rate limiter for file uploads
 */
export const uploadRateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 10, // 10 uploads per hour
});
