/**
 * Winston Logger Configuration
 * 
 * Production-grade logging with:
 * - Structured logging (JSON format)
 * - Multiple transports (console, file, external services)
 * - Log levels and filtering
 * - Request ID correlation
 * - Performance monitoring
 */

import winston from 'winston';
import { env, isDevelopment } from '../config/env';

// ============================================================================
// Custom Log Formats
// ============================================================================

/**
 * Format for development - pretty and colorful
 */
const devFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, requestId, ...meta }) => {
    const reqId = requestId ? `[${requestId}]` : '';
    const metaStr = Object.keys(meta).length ? `\n${JSON.stringify(meta, null, 2)}` : '';
    return `${timestamp} ${level} ${reqId} ${message}${metaStr}`;
  })
);

/**
 * Format for production - structured JSON
 */
const prodFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// ============================================================================
// Transports Configuration
// ============================================================================

const transports: winston.transport[] = [
  // Console transport - always enabled
  new winston.transports.Console({
    format: isDevelopment ? devFormat : prodFormat,
  }),
];

// File transports for production
if (!isDevelopment) {
  // Error log file
  transports.push(
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 10485760, // 10MB
      maxFiles: 5,
      format: prodFormat,
    })
  );

  // Combined log file
  transports.push(
    new winston.transports.File({
      filename: 'logs/combined.log',
      maxsize: 10485760, // 10MB
      maxFiles: 5,
      format: prodFormat,
    })
  );
}

// External logging services (optional)
// if (env.SENTRY_DSN) {
//   transports.push(new SentryTransport({ level: 'error' }));
// }

// ============================================================================
// Logger Instance
// ============================================================================

export const log = winston.createLogger({
  level: env.LOG_LEVEL,
  format: prodFormat,
  defaultMeta: {
    service: 'api',
    environment: env.NODE_ENV,
  },
  transports,
  // Don't exit on error
  exitOnError: false,
});

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Create child logger with additional context
 */
export function createLogger(context: Record<string, unknown>) {
  return log.child(context);
}

/**
 * Log request information
 */
export function logRequest(
  method: string,
  path: string,
  statusCode: number,
  duration: number,
  requestId: string
) {
  const level = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info';
  
  log.log(level, 'HTTP Request', {
    method,
    path,
    statusCode,
    duration: `${duration}ms`,
    requestId,
  });
}

/**
 * Log error with full context
 */
export function logError(
  error: Error,
  context?: Record<string, unknown>
) {
  log.error('Error occurred', {
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack,
    },
    ...context,
  });
}

/**
 * Log performance metrics
 */
export function logMetrics(
  operation: string,
  duration: number,
  meta?: Record<string, unknown>
) {
  log.info('Performance metric', {
    operation,
    duration: `${duration}ms`,
    ...meta,
  });
}

// ============================================================================
// Stream for Morgan HTTP Logger (if needed)
// ============================================================================

export const morganStream = {
  write: (message: string) => {
    log.info(message.trim());
  },
};

// ============================================================================
// Export Types
// ============================================================================

export type Logger = typeof log;
