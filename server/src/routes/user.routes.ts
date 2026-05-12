/**
 * User routes
 * Handles user profile and management
 */

import { Hono } from "hono";
import { z } from "zod";
import { validate } from "../middleware/validate";
import { requireAuth, requireRole } from "../middleware/auth";
import { userService } from "../services/user.service";
import type { JWTPayload } from "../middleware/auth";
import {
  addFavorites,
  addPr,
  addSetlist,
  addTrackToSetlist,
  assertOwnsResource,
  listFavorites,
  listPrs,
  listSetlists,
} from "../data/store";
import type { AppContext } from "../types";

export const userRoutes = new Hono<AppContext>();

// ============================================================================
// Validation Schemas
// ============================================================================

const updateProfileSchema = z.object({
  name: z.string().min(2).optional(),
  bio: z.string().max(500).optional(),
  avatar: z.string().url()
    .refine(
      (url) => url.startsWith('https://') || url.startsWith('http://'),
      { message: 'Avatar must be an http/https URL' }
    )
    .optional(),
});

const listUsersQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  search: z.string().optional(),
  sortBy: z.enum(["name", "email", "createdAt"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

// ============================================================================
// Routes
// ============================================================================

/**
 * GET /api/users
 * List all users (admin only)
 */
userRoutes.get(
  "/",
  requireAuth(),
  requireRole("admin"),
  validate({ query: listUsersQuerySchema }),
  async (c) => {
    const query = c.get("validatedQuery") as z.infer<typeof listUsersQuerySchema>;

    const result = await userService.listUsers(query);

    return c.json({
      success: true,
      data: result.users,
      pagination: result.pagination,
    });
  }
);

/**
 * GET /api/users/:id
 * Get user by ID.
 * Owners and admins receive the full profile; other users receive a limited public view.
 */
userRoutes.get(
  "/:id",
  requireAuth(),
  validate({
    param: z.object({
      id: z.string().uuid("Invalid user ID"),
    }),
  }),
  async (c) => {
    const { id } = c.get("validatedParam") as { id: string };
    const currentUser = c.get("user") as JWTPayload;

    const user = await userService.getUserById(id);

    // Owners and admins see the full profile (including email).
    // Other authenticated users get a limited public view.
    if (currentUser.userId === id || currentUser.role === "admin") {
      return c.json({ success: true, data: user });
    }

    // Public view: omit sensitive fields (email, role, etc.).
    const { name, avatar } = user as { name: string; avatar?: string };
    return c.json({ success: true, data: { id, name, avatar } });
  }
);

/**
 * PATCH /api/users/:id
 * Update user profile
 */
userRoutes.patch(
  "/:id",
  requireAuth(),
  validate({
    param: z.object({
      id: z.string().uuid("Invalid user ID"),
    }),
    json: updateProfileSchema,
  }),
  async (c) => {
    const { id } = c.get("validatedParam") as { id: string };
    const data = c.get("validatedBody") as z.infer<typeof updateProfileSchema>;
    const currentUser = c.get("user") as JWTPayload;

    // Users can only update their own profile unless they're admin
    if (currentUser.userId !== id && currentUser.role !== "admin") {
      return c.json(
        {
          success: false,
          error: {
            code: "FORBIDDEN",
            message: "You can only update your own profile",
          },
        },
        403
      );
    }

    const user = await userService.updateUser(id, data);

    return c.json({
      success: true,
      data: user,
      message: "Profile updated successfully",
    });
  }
);

/**
 * DELETE /api/users/:id
 * Delete user (admin only)
 */
userRoutes.delete(
  "/:id",
  requireAuth(),
  requireRole("admin"),
  validate({
    param: z.object({
      id: z.string().uuid("Invalid user ID"),
    }),
  }),
  async (c) => {
    const { id } = c.get("validatedParam") as { id: string };

    await userService.deleteUser(id);

    return c.json({
      success: true,
      message: "User deleted successfully",
    });
  }
);

/**
 * GET /api/users/:id/activity
 * Get user activity log
 */
userRoutes.get(
  "/:id/activity",
  requireAuth(),
  validate({
    param: z.object({
      id: z.string().uuid("Invalid user ID"),
    }),
    query: z.object({
      page: z.coerce.number().min(1).default(1),
      limit: z.coerce.number().min(1).max(100).default(20),
    }),
  }),
  async (c) => {
    const { id } = c.get("validatedParam") as { id: string };
    const query = c.get("validatedQuery") as { page: number; limit: number };
    const currentUser = c.get("user") as JWTPayload;

    // Users can only view their own activity unless they're admin
    if (currentUser.userId !== id && currentUser.role !== "admin") {
      return c.json(
        {
          success: false,
          error: {
            code: "FORBIDDEN",
            message: "You can only view your own activity",
          },
        },
        403
      );
    }

    const result = await userService.getUserActivity(id, query);

    return c.json({
      success: true,
      data: result.activity,
      pagination: result.pagination,
    });
  }
);

/**
 * GET /api/users/:id/setlists
 */
userRoutes.get(
  "/:id/setlists",
  requireAuth(),
  validate({
    param: z.object({
      id: z.string().min(1),
    }),
  }),
  async (c) => {
    const { id } = c.get("validatedParam") as { id: string };
    const currentUser = c.get("user") as JWTPayload;

    assertOwnsResource(currentUser.userId, id);

    return c.json({
      success: true,
      data: listSetlists(id),
    });
  }
);

/**
 * POST /api/users/:id/setlists
 */
userRoutes.post(
  "/:id/setlists",
  requireAuth(),
  validate({
    param: z.object({
      id: z.string().min(1),
    }),
    json: z.object({
      name: z.string().min(1),
      tracks: z.array(
        z.object({
          title: z.string().min(1),
          artist: z.string().min(1),
          uri: z.string().min(1),
        })
      ),
    }),
  }),
  async (c) => {
    const { id } = c.get("validatedParam") as { id: string };
    const payload = c.get("validatedBody") as {
      name: string;
      tracks: Array<{ title: string; artist: string; uri: string }>;
    };
    const currentUser = c.get("user") as JWTPayload;

    assertOwnsResource(currentUser.userId, id);

    const setlist = addSetlist({
      userId: id,
      name: payload.name,
      tracks: payload.tracks,
    });

    return c.json(
      {
        success: true,
        data: setlist,
      },
      201
    );
  }
);

/**
 * POST /api/users/:id/setlists/:setlistId/tracks
 */
userRoutes.post(
  "/:id/setlists/:setlistId/tracks",
  requireAuth(),
  validate({
    param: z.object({
      id: z.string().min(1),
      setlistId: z.string().min(1),
    }),
    json: z.object({
      title: z.string().min(1),
      artist: z.string().min(1),
      uri: z.string().min(1),
    }),
  }),
  async (c) => {
    const { id, setlistId } = c.get("validatedParam") as { id: string; setlistId: string };
    const payload = c.get("validatedBody") as {
      title: string;
      artist: string;
      uri: string;
    };
    const currentUser = c.get("user") as JWTPayload;

    assertOwnsResource(currentUser.userId, id);

    const setlist = addTrackToSetlist(id, setlistId, payload);

    return c.json({
      success: true,
      data: setlist,
    });
  }
);

/**
 * GET /api/users/:id/prs
 */
userRoutes.get(
  "/:id/prs",
  requireAuth(),
  validate({
    param: z.object({
      id: z.string().min(1),
    }),
  }),
  async (c) => {
    const { id } = c.get("validatedParam") as { id: string };
    const currentUser = c.get("user") as JWTPayload;

    assertOwnsResource(currentUser.userId, id);

    return c.json({
      success: true,
      data: listPrs(id),
    });
  }
);

/**
 * POST /api/users/:id/prs
 */
userRoutes.post(
  "/:id/prs",
  requireAuth(),
  validate({
    param: z.object({
      id: z.string().min(1),
    }),
    json: z.object({
      exercise: z.string().min(1),
      weight: z.number().min(0),
      reps: z.number().min(1),
      source: z.enum(["manual", "apple-health"]).default("manual"),
    }),
  }),
  async (c) => {
    const { id } = c.get("validatedParam") as { id: string };
    const payload = c.get("validatedBody") as {
      exercise: string;
      weight: number;
      reps: number;
      source: "manual" | "apple-health";
    };
    const currentUser = c.get("user") as JWTPayload;

    assertOwnsResource(currentUser.userId, id);

    const record = addPr({
      userId: id,
      ...payload,
    });

    return c.json(
      {
        success: true,
        data: record,
      },
      201
    );
  }
);

/**
 * GET /api/users/:id/favorites
 */
userRoutes.get(
  "/:id/favorites",
  requireAuth(),
  validate({
    param: z.object({
      id: z.string().min(1),
    }),
  }),
  async (c) => {
    const { id } = c.get("validatedParam") as { id: string };
    const currentUser = c.get("user") as JWTPayload;

    assertOwnsResource(currentUser.userId, id);

    return c.json({
      success: true,
      data: listFavorites(id),
    });
  }
);

/**
 * POST /api/users/:id/favorites
 */
userRoutes.post(
  "/:id/favorites",
  requireAuth(),
  validate({
    param: z.object({
      id: z.string().min(1),
    }),
    json: z.object({
      title: z.string().min(1),
      artist: z.string().min(1),
      uri: z.string().min(1),
    }),
  }),
  async (c) => {
    const { id } = c.get("validatedParam") as { id: string };
    const payload = c.get("validatedBody") as {
      title: string;
      artist: string;
      uri: string;
    };
    const currentUser = c.get("user") as JWTPayload;

    assertOwnsResource(currentUser.userId, id);

    const favorite = addFavorites({
      userId: id,
      ...payload,
    });

    return c.json(
      {
        success: true,
        data: favorite,
      },
      201
    );
  }
);
