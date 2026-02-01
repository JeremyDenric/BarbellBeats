/**
 * Main API routes
 * Aggregates all route modules
 */

import { Hono } from "hono";
import { authRoutes } from "./auth.routes";
import { userRoutes } from "./user.routes";
import { exampleRoutes } from "./example.routes";
import { gymRoutes } from "./gym.routes";
import type { AppContext } from "../types";

export const apiRoutes = new Hono<AppContext>();

// Mount route modules
apiRoutes.route("/auth", authRoutes);
apiRoutes.route("/users", userRoutes);
apiRoutes.route("/examples", exampleRoutes);
apiRoutes.route("/gyms", gymRoutes);

// API info endpoint
apiRoutes.get("/", (c) => {
  return c.json({
    version: "1.0.0",
    endpoints: {
      auth: "/api/auth",
      users: "/api/users",
      examples: "/api/examples",
      gyms: "/api/gyms",
    },
  });
});
