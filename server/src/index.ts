/**
 * Main application entry point
 * 
 * This is the root of the Hono server with:
 * - Environment configuration
 * - Middleware setup
 * - Route registration
 * - Error handling
 * - Graceful shutdown
 */

import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';
import { secureHeaders } from 'hono/secure-headers';
import { compress } from 'hono/compress';
import { timeout } from 'hono/timeout';
import { validator } from 'hono/validator';
import { env } from './config/env';
import { errorHandler } from './middleware/error-handler';
import { rateLimiter } from './middleware/rate-limiter';
import { requestId } from './middleware/request-id';
import { metricsMiddleware } from './middleware/metrics';
import { apiRoutes } from './routes';
import { healthRoutes } from './routes/health';
import { log } from './utils/logger';
import type { AppContext } from './types';

// ============================================================================
// Application Setup
// ============================================================================

/**
 * Create Hono app instance with type-safe context
 */
export const app = new Hono<AppContext>();

// ============================================================================
// Global Middleware (Order matters!)
// ============================================================================

// Request ID - Add unique ID to every request for tracing
app.use('*', requestId);

// Logging - Log all requests (uses request ID)
app.use('*', logger((message) => {
  log.info(message);
}));

// Security Headers - Add security headers to all responses
app.use('*', secureHeaders({
  contentSecurityPolicy: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "'unsafe-inline'"],
    styleSrc: ["'self'", "'unsafe-inline'"],
    imgSrc: ["'self'", 'data:', 'https:'],
  },
  xFrameOptions: 'DENY',
  xContentTypeOptions: 'nosniff',
  referrerPolicy: 'strict-origin-when-cross-origin',
}));

// CORS - Configure cross-origin resource sharing
app.use('*', cors({
  origin: env.CORS_ORIGINS,
  credentials: true,
  allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
  exposeHeaders: ['X-Request-ID', 'X-RateLimit-Limit', 'X-RateLimit-Remaining'],
  maxAge: 86400, // 24 hours
}));

// Compression - Compress responses (gzip, deflate, brotli)
app.use('*', compress({
  encoding: 'gzip',
}));

// Pretty JSON - Format JSON responses in development
if (env.NODE_ENV === 'development') {
  app.use('*', prettyJSON());
}

// Timeout - Prevent long-running requests
app.use('*', timeout(30000));

// Rate Limiting - Protect against abuse
app.use('/api/*', rateLimiter);

// Metrics - Track request performance
app.use('/api/*', metricsMiddleware);

// ============================================================================
// Route Registration
// ============================================================================

// Health check routes (no auth required)
app.route('/health', healthRoutes);

// API routes
app.route('/api', apiRoutes);

// Root endpoint
app.get('/', (c) => {
  return c.json({
    name: 'Modern Hono API',
    version: '1.0.0',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
  });
});

// 404 handler for undefined routes
app.notFound((c) => {
  return c.json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${c.req.method} ${c.req.path} not found`,
      path: c.req.path,
    },
  }, 404);
});

// ============================================================================
// Error Handling
// ============================================================================

// Global error handler (must be last)
app.onError(errorHandler);

// ============================================================================
// Server Startup
// ============================================================================

/**
 * Start the HTTP server
 */
const startServer = () => {
  return serve(
    {
      fetch: app.fetch,
      port: env.PORT,
      hostname: env.HOST,
    },
    (info) => {
      log.info(`🚀 Server running at http://${info.address}:${info.port}`);
      log.info(`📝 Environment: ${env.NODE_ENV}`);
      log.info(`🔒 CORS enabled for: ${env.CORS_ORIGINS.join(', ')}`);
    }
  );
};

// ============================================================================
// Graceful Shutdown
// ============================================================================

/**
 * Handle graceful shutdown on SIGTERM/SIGINT
 */
async function gracefulShutdown(signal: string, server: ReturnType<typeof serve> | null) {
  log.info(`${signal} received, starting graceful shutdown...`);

  // Stop accepting new connections
  if (server) {
    server.close((err) => {
      if (err) {
        log.error('Error during server shutdown:', err);
        process.exit(1);
      }

      log.info('Server closed successfully');
    });
  }

  // Give existing requests 10 seconds to complete
  setTimeout(() => {
    log.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);

  try {
    // Close database connections, cleanup resources, etc.
    // await prisma.$disconnect();
    // await redis.quit();
    
    log.info('Cleanup completed successfully');
    process.exit(0);
  } catch (error) {
    log.error('Error during cleanup:', error);
    process.exit(1);
  }
}

// Register shutdown handlers
if (process.env.NODE_ENV !== 'test') {
  const server = startServer();
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM', server));
  process.on('SIGINT', () => gracefulShutdown('SIGINT', server));
}

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  log.error('Uncaught Exception:', error);
  gracefulShutdown('UNCAUGHT_EXCEPTION', null);
});

process.on('unhandledRejection', (reason, promise) => {
  log.error('Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown('UNHANDLED_REJECTION', null);
});

// ============================================================================
// Export for testing
// ============================================================================

export default app;
export type { AppContext };
