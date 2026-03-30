/**
 * Environment Configuration
 * 
 * Type-safe environment variable validation using Zod
 * All environment variables are validated at startup
 */

import { z } from 'zod';

// ============================================================================
// Environment Schema
// ============================================================================

const envSchema = z.object({
  // Server Configuration
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).pipe(z.number().min(1).max(65535)).default('3000'),
  HOST: z.string().default('0.0.0.0'),

  // CORS Configuration
  CORS_ORIGINS: z.string()
    .transform((val) => val.split(',').map((origin) => origin.trim()))
    .default('http://localhost:3000,http://localhost:19006'),

  // Database Configuration
  // Required in production — server will exit at startup if missing.
  DATABASE_URL: z.string().url().optional(),
  DATABASE_MAX_CONNECTIONS: z.string().transform(Number).default('10'),
  DATABASE_TIMEOUT: z.string().transform(Number).default('30000'),

  // Redis Configuration
  // Required in production — server will exit at startup if missing.
  REDIS_URL: z.string().url().optional(),
  REDIS_PASSWORD: z.string().optional(),

  // JWT Configuration
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.string().transform(Number).default('60000'), // 1 minute
  RATE_LIMIT_MAX_REQUESTS: z.string().transform(Number).default('100'),

  // API Keys (for external services)
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_REGION: z.string().default('us-east-1'),
  AWS_S3_BUCKET: z.string().optional(),

  // Email Service (optional)
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().transform(Number).optional(),
  SMTP_SECURE: z.coerce.boolean().default(false),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  SMTP_FROM: z.string().email().optional(),

  // Frontend URL (for email links)
  FRONTEND_URL: z.string().url().default('http://localhost:8081'),

  // Social Auth (optional)
  APPLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_ID: z.string().optional(),

  // Google Places API (for gym discovery)
  GOOGLE_MAPS_API_KEY: z.string().optional(),
  GOOGLE_PLACES_CACHE_TTL_HOURS: z.coerce.number().default(24),
  GOOGLE_PLACES_DEFAULT_RADIUS_METERS: z.coerce.number().default(8000), // ~5 miles
  GOOGLE_PLACES_MAX_RADIUS_METERS: z.coerce.number().default(50000), // ~31 miles

  // Monitoring & Analytics (optional)
  SENTRY_DSN: z.string().url().optional(),
  ANALYTICS_API_KEY: z.string().optional(),

  // Feature Flags
  ENABLE_SWAGGER: z.string().transform((val) => val === 'true').default('true'),
  ENABLE_METRICS: z.string().transform((val) => val === 'true').default('true'),
  ENABLE_RATE_LIMITING: z.string().transform((val) => val === 'true').default('true'),

  // Logging
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug', 'trace']).default('info'),
  LOG_FORMAT: z.enum(['json', 'pretty']).default('json'),
});

// ============================================================================
// Parse & Export Environment
// ============================================================================

/**
 * Parse and validate environment variables
 * Throws error if validation fails
 */
function parseEnv() {
  try {
    const parsed = envSchema.parse(process.env);
    return parsed;
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Environment validation failed:');
      console.error(JSON.stringify(error.errors, null, 2));
      process.exit(1);
    }
    throw error;
  }
}

export const env = parseEnv();

// In production, DATABASE_URL and REDIS_URL must be provided.
// Keeping them optional in the Zod schema preserves dev ergonomics,
// but we fail loudly here so production misconfiguration is caught immediately.
if (env.NODE_ENV === 'production') {
  if (!env.DATABASE_URL) {
    console.error('❌ DATABASE_URL is required in production');
    process.exit(1);
  }
  if (!env.REDIS_URL) {
    console.error('❌ REDIS_URL is required in production');
    process.exit(1);
  }
}

// Type export for use in other files
export type Env = z.infer<typeof envSchema>;

// ============================================================================
// Environment Helpers
// ============================================================================

export const isDevelopment = env.NODE_ENV === 'development';
export const isProduction = env.NODE_ENV === 'production';
export const isTest = env.NODE_ENV === 'test';
