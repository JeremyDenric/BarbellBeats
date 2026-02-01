/**
 * Authentication Middleware
 * JWT-based authentication with access and refresh tokens
 */

import type { Context, Next } from "hono";
import { verify, sign } from "hono/jwt";
import { env } from "../config/env";
import { UnauthorizedError, ForbiddenError } from "../types";

// ============================================================================
// Types
// ============================================================================

export interface JWTPayload {
  userId: string;
  email: string;
  role?: string;
  iat?: number;
  exp?: number;
}

export interface RefreshTokenPayload {
  userId: string;
  tokenVersion?: number;
  iat?: number;
  exp?: number;
}

// ============================================================================
// Token Generation
// ============================================================================

/**
 * Generate access token (short-lived)
 */
export const generateAccessToken = async (payload: Omit<JWTPayload, "iat" | "exp">): Promise<string> => {
  return sign(
    {
      ...payload,
      exp: Math.floor(Date.now() / 1000) + parseExpiry(env.JWT_EXPIRES_IN),
    },
    env.JWT_SECRET
  );
};

/**
 * Generate refresh token (long-lived)
 */
export const generateRefreshToken = async (
  payload: Omit<RefreshTokenPayload, "iat" | "exp">
): Promise<string> => {
  return sign(
    {
      ...payload,
      exp: Math.floor(Date.now() / 1000) + parseExpiry(env.JWT_REFRESH_EXPIRES_IN),
    },
    env.JWT_REFRESH_SECRET
  );
};

/**
 * Generate token pair (access + refresh)
 */
export const generateTokenPair = async (user: {
  userId: string;
  email: string;
  role?: string;
  tokenVersion?: number;
}) => {
  const [accessToken, refreshToken] = await Promise.all([
    generateAccessToken({
      userId: user.userId,
      email: user.email,
      role: user.role,
    }),
    generateRefreshToken({
      userId: user.userId,
      tokenVersion: user.tokenVersion,
    }),
  ]);

  return { accessToken, refreshToken };
};

// ============================================================================
// Token Verification
// ============================================================================

/**
 * Verify access token
 */
export const verifyAccessToken = async (token: string): Promise<JWTPayload> => {
  try {
    const payload = await verify(token, env.JWT_SECRET, 'HS256');
    return payload as unknown as JWTPayload;
  } catch (error) {
    throw new UnauthorizedError("Invalid or expired access token");
  }
};

/**
 * Verify refresh token
 */
export const verifyRefreshToken = async (token: string): Promise<RefreshTokenPayload> => {
  try {
    const payload = await verify(token, env.JWT_REFRESH_SECRET, 'HS256');
    return payload as unknown as RefreshTokenPayload;
  } catch (error) {
    throw new UnauthorizedError("Invalid or expired refresh token");
  }
};

// ============================================================================
// Authentication Middleware
// ============================================================================

/**
 * Require authentication middleware
 * Validates JWT token and attaches user to context
 */
export const requireAuth = () => {
  return async (c: Context, next: Next) => {
    // Extract token from Authorization header
    const authHeader = c.req.header("Authorization");
    
    if (!authHeader?.startsWith("Bearer ")) {
      throw new UnauthorizedError("Missing or invalid authorization header");
    }

    const token = authHeader.substring(7);

    try {
      // Verify token
      const payload = await verifyAccessToken(token);

      // Attach user to context
      c.set("user", payload);
      c.set("userId", payload.userId);

      await next();
    } catch (error) {
      if (error instanceof UnauthorizedError) {
        throw error;
      }
      throw new UnauthorizedError("Invalid or expired token");
    }
  };
};

/**
 * Optional authentication middleware
 * Attaches user if token is valid, but doesn't require it
 */
export const optionalAuth = () => {
  return async (c: Context, next: Next) => {
    const authHeader = c.req.header("Authorization");

    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.substring(7);

      try {
        const payload = await verifyAccessToken(token);
        c.set("user", payload);
        c.set("userId", payload.userId);
      } catch (error) {
        // Token invalid, but that's okay for optional auth
        // Just continue without user context
      }
    }

    await next();
  };
};

/**
 * Require specific role middleware
 */
export const requireRole = (...allowedRoles: string[]) => {
  return async (c: Context, next: Next) => {
    const user = c.get("user") as JWTPayload | undefined;

    if (!user) {
      throw new UnauthorizedError("Authentication required");
    }

    if (!user.role || !allowedRoles.includes(user.role)) {
      throw new ForbiddenError(
        `Insufficient permissions. Required roles: ${allowedRoles.join(", ")}`
      );
    }

    await next();
  };
};

/**
 * Require user to be the owner of a resource
 */
export const requireOwnership = (userIdParam: string = "userId") => {
  return async (c: Context, next: Next) => {
    const user = c.get("user") as JWTPayload | undefined;
    const resourceUserId = c.req.param(userIdParam);

    if (!user) {
      throw new UnauthorizedError("Authentication required");
    }

    // Allow if user is admin or owner
    if (user.role === "admin" || user.userId === resourceUserId) {
      await next();
      return;
    }

    throw new ForbiddenError("You don't have permission to access this resource");
  };
};

// ============================================================================
// Utilities
// ============================================================================

/**
 * Parse expiry string to seconds
 * Examples: "15m", "7d", "1h", "30s"
 */
function parseExpiry(expiry: string): number {
  const match = expiry.match(/^(\d+)([smhd])$/);
  if (!match) {
    throw new Error(`Invalid expiry format: ${expiry}`);
  }

  const value = parseInt(match[1], 10);
  const unit = match[2];

  const multipliers: Record<string, number> = {
    s: 1,
    m: 60,
    h: 60 * 60,
    d: 60 * 60 * 24,
  };

  return value * multipliers[unit];
}

/**
 * Extract user from context (type-safe)
 */
export const getCurrentUser = (c: Context): JWTPayload => {
  const user = c.get("user") as JWTPayload | undefined;
  if (!user) {
    throw new UnauthorizedError("Authentication required");
  }
  return user;
};

/**
 * Extract optional user from context
 */
export const getOptionalUser = (c: Context): JWTPayload | null => {
  return (c.get("user") as JWTPayload | undefined) ?? null;
};
