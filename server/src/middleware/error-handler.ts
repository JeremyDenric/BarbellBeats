/**
 * Global Error Handler Middleware
 * 
 * Catches and formats all errors consistently
 * Provides appropriate responses based on error type
 */

import type { ErrorHandler } from 'hono';
import { env, isDevelopment } from '../config/env';
import { log, logError } from '../utils/logger';
import {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  type ApiErrorResponse,
} from '../types';
import { ZodError } from 'zod';

// ============================================================================
// Error Handler
// ============================================================================

export const errorHandler: ErrorHandler = (err, c) => {
  const requestId = c.get('requestId');

  // Log error with context
  logError(err as Error, {
    requestId,
    path: c.req.path,
    method: c.req.method,
  });

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    const response: ApiErrorResponse = {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request data',
        details: err.errors.map((e) => ({
          path: e.path.join('.'),
          message: e.message,
        })),
        ...(isDevelopment && { stack: err.stack }),
      },
      timestamp: new Date().toISOString(),
    };

    return c.json(response, 422);
  }

  // Handle known application errors
  if (err instanceof AppError) {
    const response: ApiErrorResponse = {
      success: false,
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
        ...(isDevelopment && { stack: err.stack }),
      },
      timestamp: new Date().toISOString(),
    };

    return c.json(response, err.statusCode);
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    const response: ApiErrorResponse = {
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: err.name === 'TokenExpiredError' ? 'Token expired' : 'Invalid token',
        ...(isDevelopment && { stack: err.stack }),
      },
      timestamp: new Date().toISOString(),
    };

    return c.json(response, 401);
  }

  // Handle database errors (adjust based on your ORM)
  if (err.name === 'PrismaClientKnownRequestError') {
    const response: ApiErrorResponse = {
      success: false,
      error: {
        code: 'DATABASE_ERROR',
        message: 'Database operation failed',
        ...(isDevelopment && { details: err.message, stack: err.stack }),
      },
      timestamp: new Date().toISOString(),
    };

    return c.json(response, 500);
  }

  // Handle unknown errors
  const response: ApiErrorResponse = {
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: isDevelopment ? err.message : 'An unexpected error occurred',
      ...(isDevelopment && { stack: err.stack }),
    },
    timestamp: new Date().toISOString(),
  };

  return c.json(response, 500);
};

// ============================================================================
// Error Factory Functions
// ============================================================================

/**
 * Throw a validation error
 */
export function throwValidationError(message: string, details?: unknown): never {
  throw new ValidationError(message, details);
}

/**
 * Throw an authentication error
 */
export function throwAuthenticationError(message?: string): never {
  throw new AuthenticationError(message);
}

/**
 * Throw an authorization error
 */
export function throwAuthorizationError(message?: string): never {
  throw new AuthorizationError(message);
}

/**
 * Throw a not found error
 */
export function throwNotFoundError(resource?: string): never {
  throw new NotFoundError(resource);
}

/**
 * Throw a conflict error
 */
export function throwConflictError(message: string): never {
  throw new ConflictError(message);
}

/**
 * Throw a rate limit error
 */
export function throwRateLimitError(message?: string): never {
  throw new RateLimitError(message);
}

/**
 * Throw a custom error
 */
export function throwError(
  message: string,
  statusCode: number = 500,
  code: string = 'ERROR',
  details?: unknown
): never {
  throw new AppError(message, statusCode, code, details);
}
