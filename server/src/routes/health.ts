/**
 * Health check routes
 */

import { Hono } from "hono";
import type { AppContext } from "../types";

export const healthRoutes = new Hono<AppContext>();

healthRoutes.get("/", (c) => {
  return c.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});
