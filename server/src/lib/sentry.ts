/**
 * Sentry integration for error tracking and monitoring
 */

import * as Sentry from "@sentry/node";
import { nodeProfilingIntegration } from "@sentry/profiling-node";
import { env } from "../config/env";
import type { Context } from "hono";

/**
 * Initialize Sentry
 */
export function initSentry() {
  // Skip if no DSN configured
  if (!env.SENTRY_DSN) {
    console.log("⚠️  Sentry DSN not configured, running without error tracking");
    return;
  }

  try {
    Sentry.init({
      dsn: env.SENTRY_DSN,
      environment: env.NODE_ENV,
      
      // Performance monitoring
      tracesSampleRate: env.NODE_ENV === "production" ? 0.1 : 1.0,
      
      // Profiling
      profilesSampleRate: env.NODE_ENV === "production" ? 0.1 : 1.0,
      
      integrations: [
        nodeProfilingIntegration(),
      ],
      
      // Don't capture specific errors
      ignoreErrors: [
        // Browser errors
        "ResizeObserver loop limit exceeded",
        "Non-Error promise rejection captured",
        // Network errors
        "Network request failed",
        "Failed to fetch",
      ],
      
      // Sanitize data
      beforeSend(event, hint) {
        // Remove sensitive data
        if (event.request) {
          delete event.request.cookies;
          
          if (event.request.headers) {
            delete event.request.headers.authorization;
            delete event.request.headers.cookie;
          }
        }
        
        return event;
      },
    });

    console.log("✅ Sentry initialized");
  } catch (error) {
    console.error("❌ Sentry initialization failed:", error);
  }
}

/**
 * Capture exception with context
 */
export function captureException(
  error: Error,
  context?: {
    tags?: Record<string, string>;
    extra?: Record<string, any>;
    user?: {
      id: string;
      email?: string;
      username?: string;
    };
    level?: Sentry.SeverityLevel;
  }
) {
  if (!env.SENTRY_DSN) {
    // Just log in development
    console.error("Error:", error);
    return;
  }

  Sentry.withScope((scope) => {
    if (context?.tags) {
      Object.entries(context.tags).forEach(([key, value]) => {
        scope.setTag(key, value);
      });
    }

    if (context?.extra) {
      Object.entries(context.extra).forEach(([key, value]) => {
        scope.setExtra(key, value);
      });
    }

    if (context?.user) {
      scope.setUser(context.user);
    }

    if (context?.level) {
      scope.setLevel(context.level);
    }

    Sentry.captureException(error);
  });
}

/**
 * Capture message
 */
export function captureMessage(
  message: string,
  level: Sentry.SeverityLevel = "info"
) {
  if (!env.SENTRY_DSN) {
    console.log(`[${level}]`, message);
    return;
  }

  Sentry.captureMessage(message, level);
}

/**
 * Add breadcrumb
 */
export function addBreadcrumb(
  category: string,
  message: string,
  data?: Record<string, any>
) {
  if (!env.SENTRY_DSN) return;

  Sentry.addBreadcrumb({
    category,
    message,
    data,
    level: "info",
  });
}

/**
 * Set user context
 */
export function setUser(user: {
  id: string;
  email?: string;
  username?: string;
  [key: string]: any;
}) {
  if (!env.SENTRY_DSN) return;

  Sentry.setUser(user);
}

/**
 * Clear user context
 */
export function clearUser() {
  if (!env.SENTRY_DSN) return;

  Sentry.setUser(null);
}

/**
 * Start transaction for performance monitoring
 */
export function startTransaction(name: string, op: string) {
  if (!env.SENTRY_DSN) return null;

  return Sentry.startTransaction({
    name,
    op,
  });
}

/**
 * Extract user from Hono context for Sentry
 */
export function extractUserFromContext(c: Context): {
  id: string;
  email?: string;
} | null {
  try {
    const user = c.get("user");
    if (user && typeof user === "object") {
      return {
        id: user.userId || user.id,
        email: user.email,
      };
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Sentry middleware for Hono
 */
export function sentryMiddleware() {
  return async (c: Context, next: () => Promise<void>) => {
    if (!env.SENTRY_DSN) {
      return next();
    }

    const transaction = Sentry.startTransaction({
      op: "http.server",
      name: `${c.req.method} ${c.req.path}`,
      data: {
        method: c.req.method,
        url: c.req.url,
      },
    });

    try {
      // Set request context
      Sentry.configureScope((scope) => {
        scope.setSpan(transaction);
        scope.setContext("request", {
          method: c.req.method,
          url: c.req.url,
          headers: Object.fromEntries(c.req.raw.headers.entries()),
        });

        // Set user if available
        const user = extractUserFromContext(c);
        if (user) {
          scope.setUser(user);
        }
      });

      await next();

      // Set response status
      transaction.setStatus("ok");
    } catch (error) {
      // Set error status
      transaction.setStatus("internal_error");

      // Capture exception
      captureException(error as Error, {
        tags: {
          method: c.req.method,
          path: c.req.path,
        },
        extra: {
          url: c.req.url,
          headers: Object.fromEntries(c.req.raw.headers.entries()),
        },
        user: extractUserFromContext(c) || undefined,
      });

      throw error;
    } finally {
      transaction.finish();
    }
  };
}

/**
 * Flush Sentry (useful before shutdown)
 */
export async function flushSentry(timeout = 2000): Promise<boolean> {
  if (!env.SENTRY_DSN) return true;

  try {
    return await Sentry.close(timeout);
  } catch (error) {
    console.error("Failed to flush Sentry:", error);
    return false;
  }
}
