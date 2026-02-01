/**
 * Example routes demonstrating various patterns
 */

import { Hono } from "hono";
import { z } from "zod";
import { validate } from "../middleware/validate";
import { optionalAuth } from "../middleware/auth";
import { stream, streamText } from "hono/streaming";
import type { AppContext } from "../types";

export const exampleRoutes = new Hono<AppContext>();

// ============================================================================
// Basic CRUD Examples
// ============================================================================

/**
 * GET /api/examples
 * List all examples with pagination
 */
exampleRoutes.get(
  "/",
  validate({
    query: z.object({
      page: z.coerce.number().min(1).default(1),
      limit: z.coerce.number().min(1).max(100).default(20),
    }),
  }),
  async (c) => {
    const { page, limit } = c.get("validatedQuery") as {
      page: number;
      limit: number;
    };

    // Mock data
    const examples = Array.from({ length: limit }, (_, i) => ({
      id: `example-${(page - 1) * limit + i + 1}`,
      name: `Example ${(page - 1) * limit + i + 1}`,
      description: "This is an example item",
      createdAt: new Date().toISOString(),
    }));

    return c.json({
      success: true,
      data: examples,
      pagination: {
        page,
        limit,
        total: 100,
        totalPages: Math.ceil(100 / limit),
      },
    });
  }
);

/**
 * GET /api/examples/:id
 * Get single example by ID
 */
exampleRoutes.get(
  "/:id",
  validate({
    param: z.object({
      id: z.string().min(1),
    }),
  }),
  async (c) => {
    const { id } = c.get("validatedParam") as { id: string };

    // Mock data
    const example = {
      id,
      name: `Example ${id}`,
      description: "This is a detailed example item",
      metadata: {
        views: 42,
        likes: 13,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return c.json({
      success: true,
      data: example,
    });
  }
);

/**
 * POST /api/examples
 * Create new example
 */
exampleRoutes.post(
  "/",
  validate({
    json: z.object({
      name: z.string().min(2, "Name must be at least 2 characters"),
      description: z.string().optional(),
      tags: z.array(z.string()).optional(),
    }),
  }),
  async (c) => {
    const data = c.get("validatedBody") as {
      name: string;
      description?: string;
      tags?: string[];
    };

    // Mock creation
    const example = {
      id: `example-${Date.now()}`,
      ...data,
      createdAt: new Date().toISOString(),
    };

    return c.json(
      {
        success: true,
        data: example,
        message: "Example created successfully",
      },
      201
    );
  }
);

/**
 * PUT /api/examples/:id
 * Update example
 */
exampleRoutes.put(
  "/:id",
  validate({
    param: z.object({
      id: z.string().min(1),
    }),
    json: z.object({
      name: z.string().min(2).optional(),
      description: z.string().optional(),
      tags: z.array(z.string()).optional(),
    }),
  }),
  async (c) => {
    const { id } = c.get("validatedParam") as { id: string };
    const data = c.get("validatedBody") as Record<string, any>;

    // Mock update
    const example = {
      id,
      name: data.name || `Example ${id}`,
      description: data.description || "Updated description",
      tags: data.tags || [],
      updatedAt: new Date().toISOString(),
    };

    return c.json({
      success: true,
      data: example,
      message: "Example updated successfully",
    });
  }
);

/**
 * DELETE /api/examples/:id
 * Delete example
 */
exampleRoutes.delete(
  "/:id",
  validate({
    param: z.object({
      id: z.string().min(1),
    }),
  }),
  async (c) => {
    const { id } = c.get("validatedParam") as { id: string };

    // Mock deletion
    return c.json({
      success: true,
      message: `Example ${id} deleted successfully`,
    });
  }
);

// ============================================================================
// Advanced Examples
// ============================================================================

/**
 * GET /api/examples/search
 * Search examples with filters
 */
exampleRoutes.get(
  "/search",
  validate({
    query: z.object({
      q: z.string().min(1, "Search query is required"),
      category: z.string().optional(),
      sortBy: z.enum(["name", "date", "relevance"]).default("relevance"),
      page: z.coerce.number().min(1).default(1),
      limit: z.coerce.number().min(1).max(100).default(20),
    }),
  }),
  async (c) => {
    const query = c.get("validatedQuery") as {
      q: string;
      category?: string;
      sortBy: string;
      page: number;
      limit: number;
    };

    // Mock search results
    const results = Array.from({ length: 5 }, (_, i) => ({
      id: `search-result-${i + 1}`,
      name: `${query.q} Result ${i + 1}`,
      description: `Search result for "${query.q}"`,
      relevance: 0.95 - i * 0.1,
      category: query.category || "general",
    }));

    return c.json({
      success: true,
      data: results,
      meta: {
        query: query.q,
        category: query.category,
        sortBy: query.sortBy,
      },
      pagination: {
        page: query.page,
        limit: query.limit,
        total: 5,
        totalPages: 1,
      },
    });
  }
);

/**
 * GET /api/examples/stream
 * Example of streaming response
 */
exampleRoutes.get("/stream", (c) => {
  return streamText(c, async (stream) => {
    const messages = [
      "Starting stream...",
      "Processing data...",
      "Almost done...",
      "Complete!",
    ];

    for (const message of messages) {
      await stream.writeln(message);
      await stream.sleep(1000); // Wait 1 second between messages
    }
  });
});

/**
 * POST /api/examples/batch
 * Batch create examples
 */
exampleRoutes.post(
  "/batch",
  validate({
    json: z.object({
      items: z
        .array(
          z.object({
            name: z.string().min(2),
            description: z.string().optional(),
          })
        )
        .min(1, "At least one item is required")
        .max(100, "Maximum 100 items allowed"),
    }),
  }),
  async (c) => {
    const { items } = c.get("validatedBody") as {
      items: Array<{ name: string; description?: string }>;
    };

    // Mock batch creation
    const created = items.map((item, i) => ({
      id: `batch-${Date.now()}-${i}`,
      ...item,
      createdAt: new Date().toISOString(),
    }));

    return c.json(
      {
        success: true,
        data: created,
        message: `${created.length} examples created successfully`,
      },
      201
    );
  }
);

/**
 * GET /api/examples/stats
 * Get statistics (optionally authenticated)
 */
exampleRoutes.get("/stats", optionalAuth(), async (c) => {
  const user = c.get("user");

  return c.json({
    success: true,
    data: {
      total: 1234,
      active: 890,
      archived: 344,
      userSpecific: user ? `Stats for user ${user.userId}` : null,
    },
  });
});
