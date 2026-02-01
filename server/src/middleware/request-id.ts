/**
 * Request ID Middleware
 * 
 * Adds unique ID to every request for tracing and debugging
 */

import type { MiddlewareHandler } from 'hono';
import { randomUUID } from 'crypto';

/**
 * Generate or extract request ID
 */
export const requestId: MiddlewareHandler = async (c, next) => {
  // Check if client provided a request ID
  const clientRequestId = c.req.header('x-request-id');
  
  // Use client ID if valid, otherwise generate new one
  const requestId = clientRequestId || randomUUID();
  
  // Store in context for use in handlers
  c.set('requestId', requestId);
  
  // Add to response headers for client reference
  c.header('x-request-id', requestId);
  
  await next();
};
