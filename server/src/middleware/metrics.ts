/**
 * Metrics Middleware
 * 
 * Tracks request performance and metrics
 */

import type { MiddlewareHandler } from 'hono';
import { logRequest, logMetrics } from '../utils/logger';

// ============================================================================
// In-Memory Metrics Store (use external service in production)
// ============================================================================

interface Metrics {
  totalRequests: number;
  totalErrors: number;
  requestsByStatus: Map<number, number>;
  requestsByEndpoint: Map<string, number>;
  averageResponseTime: number;
  lastReset: Date;
}

const metrics: Metrics = {
  totalRequests: 0,
  totalErrors: 0,
  requestsByStatus: new Map(),
  requestsByEndpoint: new Map(),
  averageResponseTime: 0,
  lastReset: new Date(),
};

let totalResponseTime = 0;

// ============================================================================
// Metrics Middleware
// ============================================================================

export const metricsMiddleware: MiddlewareHandler = async (c, next) => {
  const startTime = Date.now();
  c.set('startTime', startTime);

  try {
    await next();
  } finally {
    const duration = Date.now() - startTime;
    const status = c.res.status;
    const method = c.req.method;
    const path = c.req.path;
    const requestId = c.get('requestId');

    // Update metrics
    metrics.totalRequests++;
    if (status >= 400) {
      metrics.totalErrors++;
    }

    // Track by status code
    const statusCount = metrics.requestsByStatus.get(status) || 0;
    metrics.requestsByStatus.set(status, statusCount + 1);

    // Track by endpoint
    const endpoint = `${method} ${path}`;
    const endpointCount = metrics.requestsByEndpoint.get(endpoint) || 0;
    metrics.requestsByEndpoint.set(endpoint, endpointCount + 1);

    // Calculate average response time
    totalResponseTime += duration;
    metrics.averageResponseTime = totalResponseTime / metrics.totalRequests;

    // Log request
    logRequest(method, path, status, duration, requestId);

    // Log slow requests (> 1 second)
    if (duration > 1000) {
      logMetrics('slow-request', duration, {
        method,
        path,
        status,
        requestId,
      });
    }
  }
};

// ============================================================================
// Metrics API
// ============================================================================

/**
 * Get current metrics
 */
export function getMetrics() {
  return {
    ...metrics,
    requestsByStatus: Object.fromEntries(metrics.requestsByStatus),
    requestsByEndpoint: Object.fromEntries(metrics.requestsByEndpoint),
    uptime: Date.now() - metrics.lastReset.getTime(),
  };
}

/**
 * Reset metrics
 */
export function resetMetrics() {
  metrics.totalRequests = 0;
  metrics.totalErrors = 0;
  metrics.requestsByStatus.clear();
  metrics.requestsByEndpoint.clear();
  metrics.averageResponseTime = 0;
  metrics.lastReset = new Date();
  totalResponseTime = 0;
}
