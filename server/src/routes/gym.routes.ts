/**
 * Gym and music interaction routes
 * Handles queue, now playing feed, reactions, comments, and vibe moments
 */

import { Hono } from "hono";
import { z } from "zod";
import { requireAuth, getCurrentUser } from "../middleware/auth";
import { validate } from "../middleware/validate";
import {
  addComment,
  addMoment,
  addReaction,
  addSongToQueue,
  enforceNewUserRateLimit,
  getNowPlaying,
  getGymMatches,
  getGymWrapped,
  getSpotifyNowPlaying,
  listQueue,
  listFeed,
  listGyms,
  listMoments,
  recordVote,
  seedQueueIfNeeded,
  setSpotifyNowPlaying,
  setNowPlaying,
  voteOnSong,
} from "../data/store";
import {
  searchNearbyGyms,
  getGymDetails,
} from "../services/places.service";
import type { AppContext } from "../types";

export const gymRoutes = new Hono<AppContext>();

gymRoutes.get("/", (c) => {
  return c.json({
    success: true,
    data: listGyms(),
  });
});

gymRoutes.get(
  "/:gymId/queue",
  requireAuth(),
  validate({
    param: z.object({
      gymId: z.string().min(1),
    }),
  }),
  async (c) => {
    const { gymId } = c.get("validatedParam") as { gymId: string };
    seedQueueIfNeeded(gymId);

    const nowPlaying = getNowPlaying(gymId);
    const queue = listQueue(gymId);

    return c.json({
      success: true,
      data: {
        nowPlaying,
        queue,
      },
    });
  }
);

gymRoutes.post(
  "/:gymId/queue",
  requireAuth(),
  validate({
    param: z.object({
      gymId: z.string().min(1),
    }),
    json: z.object({
      title: z.string().min(1),
      artist: z.string().min(1),
      uri: z.string().min(1),
    }),
  }),
  async (c) => {
    const { gymId } = c.get("validatedParam") as { gymId: string };
    const { title, artist, uri } = c.get("validatedBody") as {
      title: string;
      artist: string;
      uri: string;
    };
    const user = getCurrentUser(c);

    enforceNewUserRateLimit(user.userId, "queue-add", 3, 1000 * 60 * 10);

    const song = addSongToQueue(gymId, {
      title,
      artist,
      uri,
      addedBy: user.userId,
    });

    return c.json(
      {
        success: true,
        data: song,
        message: "Added to queue",
      },
      201
    );
  }
);

gymRoutes.post(
  "/:gymId/queue/:songId/vote",
  requireAuth(),
  validate({
    param: z.object({
      gymId: z.string().min(1),
      songId: z.string().min(1),
    }),
    json: z.object({
      direction: z.enum(["up", "down"]),
    }),
  }),
  async (c) => {
    const { gymId, songId } = c.get("validatedParam") as {
      gymId: string;
      songId: string;
    };
    const { direction } = c.get("validatedBody") as { direction: "up" | "down" };
    const delta = direction === "up" ? 1 : -1;
    const user = getCurrentUser(c);

    const song = voteOnSong(gymId, songId, delta);
    recordVote(gymId, songId, user.userId);
    return c.json({
      success: true,
      data: song,
    });
  }
);

gymRoutes.post(
  "/:gymId/now-playing/reactions",
  requireAuth(),
  validate({
    param: z.object({
      gymId: z.string().min(1),
    }),
    json: z.object({
      songId: z.string().min(1),
      emoji: z.string().min(1),
    }),
  }),
  async (c) => {
    const { gymId } = c.get("validatedParam") as { gymId: string };
    const { songId, emoji } = c.get("validatedBody") as {
      songId: string;
      emoji: string;
    };
    const user = getCurrentUser(c);

    enforceNewUserRateLimit(user.userId, "react", 5, 1000 * 60 * 5);

    const reaction = addReaction(gymId, {
      songId,
      userId: user.userId,
      emoji,
    });

    return c.json({
      success: true,
      data: reaction,
    });
  }
);

gymRoutes.post(
  "/:gymId/now-playing/comments",
  requireAuth(),
  validate({
    param: z.object({
      gymId: z.string().min(1),
    }),
    json: z.object({
      songId: z.string().min(1),
      message: z.string().min(1).max(280),
    }),
  }),
  async (c) => {
    const { gymId } = c.get("validatedParam") as { gymId: string };
    const { songId, message } = c.get("validatedBody") as {
      songId: string;
      message: string;
    };
    const user = getCurrentUser(c);

    enforceNewUserRateLimit(user.userId, "comment", 3, 1000 * 60 * 5);

    const comment = addComment(gymId, {
      songId,
      userId: user.userId,
      message,
    });

    return c.json(
      {
        success: true,
        data: comment,
      },
      201
    );
  }
);

gymRoutes.get(
  "/:gymId/now-playing/feed",
  requireAuth(),
  validate({
    param: z.object({
      gymId: z.string().min(1),
    }),
  }),
  async (c) => {
    const { gymId } = c.get("validatedParam") as { gymId: string };
    const feed = listFeed(gymId);
    return c.json({
      success: true,
      data: feed,
    });
  }
);

gymRoutes.post(
  "/:gymId/identify",
  requireAuth(),
  validate({
    param: z.object({
      gymId: z.string().min(1),
    }),
  }),
  async (c) => {
    const { gymId } = c.get("validatedParam") as { gymId: string };
    const song = getNowPlaying(gymId);

    return c.json({
      success: true,
      data: song,
      message: song ? "Track identified" : "No track playing",
    });
  }
);

gymRoutes.post(
  "/:gymId/moments",
  requireAuth(),
  validate({
    param: z.object({
      gymId: z.string().min(1),
    }),
    json: z.object({
      title: z.string().min(1),
      note: z.string().optional(),
      context: z.string().optional(),
      songSnapshot: z
        .object({
          title: z.string().min(1),
          artist: z.string().min(1),
          uri: z.string().min(1),
        })
        .optional(),
    }),
  }),
  async (c) => {
    const { gymId } = c.get("validatedParam") as { gymId: string };
    const payload = c.get("validatedBody") as {
      title: string;
      note?: string;
      context?: string;
      songSnapshot?: { title: string; artist: string; uri: string };
    };
    const user = getCurrentUser(c);

    const moment = addMoment({
      gymId,
      userId: user.userId,
      ...payload,
    });

    return c.json(
      {
        success: true,
        data: moment,
      },
      201
    );
  }
);

gymRoutes.get(
  "/:gymId/moments",
  requireAuth(),
  validate({
    param: z.object({
      gymId: z.string().min(1),
    }),
  }),
  async (c) => {
    const { gymId } = c.get("validatedParam") as { gymId: string };
    return c.json({
      success: true,
      data: listMoments(gymId),
    });
  }
);

gymRoutes.post(
  "/:gymId/now-playing",
  requireAuth(),
  validate({
    param: z.object({
      gymId: z.string().min(1),
    }),
    json: z.object({
      songId: z.string().min(1),
    }),
  }),
  async (c) => {
    const { gymId } = c.get("validatedParam") as { gymId: string };
    const { songId } = c.get("validatedBody") as { songId: string };
    const nowPlaying = setNowPlaying(gymId, songId);

    return c.json({
      success: true,
      data: nowPlaying,
    });
  }
);

gymRoutes.get(
  "/:gymId/spotify/now-playing",
  requireAuth(),
  validate({
    param: z.object({
      gymId: z.string().min(1),
    }),
  }),
  async (c) => {
    const { gymId } = c.get("validatedParam") as { gymId: string };
    return c.json({
      success: true,
      data: getSpotifyNowPlaying(gymId),
    });
  }
);

gymRoutes.post(
  "/:gymId/spotify/now-playing",
  requireAuth(),
  validate({
    param: z.object({
      gymId: z.string().min(1),
    }),
    json: z.object({
      title: z.string().min(1),
      artist: z.string().min(1),
      uri: z.string().min(1),
      deviceName: z.string().optional(),
    }),
  }),
  async (c) => {
    const { gymId } = c.get("validatedParam") as { gymId: string };
    const payload = c.get("validatedBody") as {
      title: string;
      artist: string;
      uri: string;
      deviceName?: string;
    };
    const record = setSpotifyNowPlaying(
      gymId,
      {
        title: payload.title,
        artist: payload.artist,
        uri: payload.uri,
      },
      payload.deviceName
    );
    return c.json({
      success: true,
      data: record,
    });
  }
);

gymRoutes.get(
  "/:gymId/wrapped",
  requireAuth(),
  validate({
    param: z.object({
      gymId: z.string().min(1),
    }),
  }),
  async (c) => {
    const { gymId } = c.get("validatedParam") as { gymId: string };
    return c.json({
      success: true,
      data: getGymWrapped(gymId),
    });
  }
);

gymRoutes.get(
  "/:gymId/matches",
  requireAuth(),
  validate({
    param: z.object({
      gymId: z.string().min(1),
    }),
  }),
  async (c) => {
    const user = getCurrentUser(c);
    return c.json({
      success: true,
      data: getGymMatches(user.userId),
    });
  }
);

// ============================================================================
// Gym Discovery Routes (Google Places Integration)
// ============================================================================

/**
 * Discover gyms near a location using Google Places API
 * GET /gyms/discover?latitude=X&longitude=Y&radius=Z
 */
gymRoutes.get(
  "/discover",
  requireAuth(),
  validate({
    query: z.object({
      latitude: z.string().transform(Number).pipe(z.number().min(-90).max(90)),
      longitude: z.string().transform(Number).pipe(z.number().min(-180).max(180)),
      radius: z.string().transform(Number).pipe(z.number().min(100).max(50000)).optional(),
      pageToken: z.string().optional(),
    }),
  }),
  async (c) => {
    const query = c.get("validatedQuery") as {
      latitude: number;
      longitude: number;
      radius?: number;
      pageToken?: string;
    };

    const result = await searchNearbyGyms({
      latitude: query.latitude,
      longitude: query.longitude,
      radiusMeters: query.radius,
      pageToken: query.pageToken,
    });

    return c.json({
      success: true,
      data: result.gyms,
      meta: {
        fromCache: result.fromCache,
        nextPageToken: result.nextPageToken,
      },
    });
  }
);

/**
 * Get detailed gym information
 * GET /gyms/:gymId/details
 */
gymRoutes.get(
  "/:gymId/details",
  requireAuth(),
  validate({
    param: z.object({
      gymId: z.string().uuid(),
    }),
  }),
  async (c) => {
    const { gymId } = c.get("validatedParam") as { gymId: string };
    const details = await getGymDetails(gymId);

    return c.json({
      success: true,
      data: details,
    });
  }
);
