/**
 * Custom Error Classes
 * Type-safe error handling with proper HTTP status codes
 */

// ============================================================================
// Base Application Error
// ============================================================================

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly context?: Record<string, any>;

  constructor(
    message: string,
    statusCode: number = 500,
    isOperational: boolean = true,
    context?: Record<string, any>
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.context = context;
    
    // Maintains proper stack trace for where error was thrown
    Error.captureStackTrace(this, this.constructor);
    
    // Set the prototype explicitly to ensure instanceof works
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

// ============================================================================
// Specific Error Types
// ============================================================================

/**
 * 400 Bad Request
 * Client sent invalid data
 */
export class BadRequestError extends AppError {
  constructor(message: string = "Bad Request", context?: Record<string, any>) {
    super(message, 400, true, context);
    Object.setPrototypeOf(this, BadRequestError.prototype);
  }
}

/**
 * 401 Unauthorized
 * Authentication required or failed
 */
export class UnauthorizedError extends AppError {
  constructor(message: string = "Unauthorized", context?: Record<string, any>) {
    super(message, 401, true, context);
    Object.setPrototypeOf(this, UnauthorizedError.prototype);
  }
}

/**
 * 403 Forbidden
 * User doesn't have permission
 */
export class ForbiddenError extends AppError {
  constructor(message: string = "Forbidden", context?: Record<string, any>) {
    super(message, 403, true, context);
    Object.setPrototypeOf(this, ForbiddenError.prototype);
  }
}

/**
 * 404 Not Found
 * Resource doesn't exist
 */
export class NotFoundError extends AppError {
  constructor(message: string = "Not Found", context?: Record<string, any>) {
    super(message, 404, true, context);
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

/**
 * 409 Conflict
 * Resource already exists or state conflict
 */
export class ConflictError extends AppError {
  constructor(message: string = "Conflict", context?: Record<string, any>) {
    super(message, 409, true, context);
    Object.setPrototypeOf(this, ConflictError.prototype);
  }
}

/**
 * 422 Unprocessable Entity
 * Validation failed
 */
export class ValidationError extends AppError {
  constructor(
    message: string = "Validation Failed",
    context?: Record<string, any>
  ) {
    super(message, 422, true, context);
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

/**
 * 429 Too Many Requests
 * Rate limit exceeded
 */
export class RateLimitError extends AppError {
  constructor(
    message: string = "Too Many Requests",
    context?: Record<string, any>
  ) {
    super(message, 429, true, context);
    Object.setPrototypeOf(this, RateLimitError.prototype);
  }
}

/**
 * 500 Internal Server Error
 * Unexpected server error
 */
export class InternalServerError extends AppError {
  constructor(
    message: string = "Internal Server Error",
    context?: Record<string, any>
  ) {
    super(message, 500, false, context);
    Object.setPrototypeOf(this, InternalServerError.prototype);
  }
}

/**
 * 503 Service Unavailable
 * Service temporarily unavailable
 */
export class ServiceUnavailableError extends AppError {
  constructor(
    message: string = "Service Unavailable",
    context?: Record<string, any>
  ) {
    super(message, 503, true, context);
    Object.setPrototypeOf(this, ServiceUnavailableError.prototype);
  }
}

// ============================================================================
// Error Utilities
// ============================================================================

/**
 * Check if error is an operational error
 */
export const isOperationalError = (error: Error | unknown): boolean => {
  if (error instanceof AppError) {
    return error.isOperational;
  }
  return false;
};

/**
 * Format error for API response
 */
export const formatErrorResponse = (
  error: Error | unknown,
  includeStack: boolean = false
) => {
  if (error instanceof AppError) {
    return {
      error: error.name,
      message: error.message,
      statusCode: error.statusCode,
      ...(error.context && { context: error.context }),
      ...(includeStack && { stack: error.stack }),
      timestamp: new Date().toISOString(),
    };
  }

  // Unknown error
  return {
    error: "InternalServerError",
    message: error instanceof Error ? error.message : "An unexpected error occurred",
    statusCode: 500,
    ...(includeStack && error instanceof Error && { stack: error.stack }),
    timestamp: new Date().toISOString(),
  };
};
