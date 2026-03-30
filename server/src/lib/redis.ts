/**
 * Redis client for caching and session management
 */

import { createClient } from "redis";
import { env } from "../config/env";

type RedisClient = ReturnType<typeof createClient>;
let redisClient: RedisClient | null = null;

/**
 * Initialize Redis client
 */
export async function initRedis(): Promise<RedisClient | null> {
  // Skip if no Redis URL configured
  if (!env.REDIS_URL) {
    console.log("⚠️  Redis URL not configured, running without cache");
    return null;
  }

  try {
    const client = createClient({
      url: env.REDIS_URL,
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 10) {
            console.error("❌ Redis reconnection failed after 10 attempts");
            return new Error("Redis reconnection failed");
          }
          return Math.min(retries * 100, 3000);
        },
      },
    });

    // Event handlers
    client.on("error", (err) => {
      console.error("Redis Client Error:", err);
    });

    client.on("connect", () => {
      console.log("🔄 Redis connecting...");
    });

    client.on("ready", () => {
      console.log("✅ Redis connection established");
    });

    client.on("reconnecting", () => {
      console.log("🔄 Redis reconnecting...");
    });

    await client.connect();
    redisClient = client;
    return client;
  } catch (error) {
    console.error("❌ Failed to connect to Redis:", error);
    console.log("⚠️  Running without cache");
    return null;
  }
}

/**
 * Get Redis client instance
 */
export function getRedis(): RedisClient | null {
  return redisClient;
}

/**
 * Close Redis connection
 */
export async function closeRedis(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    console.log("👋 Redis connection closed");
  }
}

// ============================================================================
// Cache Helper Functions
// ============================================================================

/**
 * Get value from cache
 */
export async function cacheGet<T>(key: string): Promise<T | null> {
  if (!redisClient) return null;

  try {
    const value = await redisClient.get(key);
    return value ? JSON.parse(value) : null;
  } catch (error) {
    console.error("Cache get error:", error);
    return null;
  }
}

/**
 * Set value in cache with TTL
 */
export async function cacheSet(
  key: string,
  value: any,
  ttl: number = 3600
): Promise<boolean> {
  if (!redisClient) return false;

  try {
    await redisClient.setEx(key, ttl, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error("Cache set error:", error);
    return false;
  }
}

/**
 * Delete value from cache
 */
export async function cacheDel(key: string): Promise<boolean> {
  if (!redisClient) return false;

  try {
    await redisClient.del(key);
    return true;
  } catch (error) {
    console.error("Cache delete error:", error);
    return false;
  }
}

/**
 * Delete multiple keys matching pattern.
 * Uses SCAN instead of KEYS to avoid blocking the Redis event loop (I-6).
 */
export async function cacheDelPattern(pattern: string): Promise<number> {
  if (!redisClient) return 0;

  try {
    let deleted = 0;
    let cursor = 0;
    do {
      const reply = await redisClient.scan(cursor, { MATCH: pattern, COUNT: 100 });
      cursor = reply.cursor;
      if (reply.keys.length > 0) {
        deleted += await redisClient.del(reply.keys);
      }
    } while (cursor !== 0);
    return deleted;
  } catch (error) {
    console.error("Cache delete pattern error:", error);
    return 0;
  }
}

/**
 * Check if key exists
 */
export async function cacheExists(key: string): Promise<boolean> {
  if (!redisClient) return false;

  try {
    const exists = await redisClient.exists(key);
    return exists === 1;
  } catch (error) {
    console.error("Cache exists error:", error);
    return false;
  }
}

/**
 * Increment counter
 */
export async function cacheIncr(key: string): Promise<number> {
  if (!redisClient) return 0;

  try {
    return await redisClient.incr(key);
  } catch (error) {
    console.error("Cache increment error:", error);
    return 0;
  }
}

/**
 * Set expiration on key
 */
export async function cacheExpire(key: string, ttl: number): Promise<boolean> {
  if (!redisClient) return false;

  try {
    return await redisClient.expire(key, ttl);
  } catch (error) {
    console.error("Cache expire error:", error);
    return false;
  }
}

// Graceful shutdown
process.on("beforeExit", async () => {
  await closeRedis();
});
