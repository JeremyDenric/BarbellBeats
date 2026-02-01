/**
 * Example test suite for the API
 * Using Vitest for testing
 */

import { describe, it, expect, beforeAll } from "vitest";
import app from "../index";

describe("Health Check", () => {
  it("should return 200 and healthy status", async () => {
    const res = await app.request("/health");
    expect(res.status).toBe(200);
    
    const data = await res.json();
    expect(data.status).toBe("ok");
    expect(data).toHaveProperty("timestamp");
    expect(data).toHaveProperty("uptime");
  });

  it("should return API info on root", async () => {
    const res = await app.request("/");
    expect(res.status).toBe(200);
    
    const data = await res.json();
    expect(data.name).toBe("Modern Hono API");
    expect(data.status).toBe("healthy");
  });
});

describe("Authentication", () => {
  let accessToken: string;
  let refreshToken: string;

  it("should register a new user", async () => {
    const res = await app.request("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "test@example.com",
        password: "TestPass123",
        name: "Test User",
      }),
    });

    expect(res.status).toBe(201);
    
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.data).toHaveProperty("accessToken");
    expect(data.data).toHaveProperty("refreshToken");
    expect(data.data.user.email).toBe("test@example.com");
    
    accessToken = data.data.accessToken;
    refreshToken = data.data.refreshToken;
  });

  it("should not register with weak password", async () => {
    const res = await app.request("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "test2@example.com",
        password: "weak",
        name: "Test User 2",
      }),
    });

    expect(res.status).toBe(422);
    
    const data = await res.json();
    expect(data.success).toBe(false);
    expect(data.error.code).toBe("VALIDATION_ERROR");
  });

  it("should login with correct credentials", async () => {
    const res = await app.request("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "test@example.com",
        password: "TestPass123",
      }),
    });

    expect(res.status).toBe(200);
    
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.data).toHaveProperty("accessToken");
  });

  it("should not login with wrong password", async () => {
    const res = await app.request("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "test@example.com",
        password: "WrongPass123",
      }),
    });

    expect(res.status).toBe(401);
    
    const data = await res.json();
    expect(data.success).toBe(false);
  });

  it("should get current user with valid token", async () => {
    const res = await app.request("/api/auth/me", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    expect(res.status).toBe(200);
    
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.data.email).toBe("test@example.com");
  });

  it("should refresh token", async () => {
    const res = await app.request("/api/auth/refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        refreshToken,
      }),
    });

    expect(res.status).toBe(200);
    
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.data).toHaveProperty("accessToken");
    expect(data.data).toHaveProperty("refreshToken");
  });
});

describe("Examples API", () => {
  it("should list examples", async () => {
    const res = await app.request("/api/examples?page=1&limit=10");
    expect(res.status).toBe(200);
    
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(Array.isArray(data.data)).toBe(true);
    expect(data).toHaveProperty("pagination");
  });

  it("should create example", async () => {
    const res = await app.request("/api/examples", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Test Example",
        description: "This is a test",
        tags: ["test"],
      }),
    });

    expect(res.status).toBe(201);
    
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.data.name).toBe("Test Example");
  });

  it("should get example by id", async () => {
    const res = await app.request("/api/examples/test-id");
    expect(res.status).toBe(200);
    
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.data).toHaveProperty("id");
  });

  it("should search examples", async () => {
    const res = await app.request("/api/examples/search?q=test");
    expect(res.status).toBe(200);
    
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(Array.isArray(data.data)).toBe(true);
  });
});

describe("Error Handling", () => {
  it("should return 404 for unknown route", async () => {
    const res = await app.request("/api/nonexistent");
    expect(res.status).toBe(404);
    
    const data = await res.json();
    expect(data.success).toBe(false);
    expect(data.error.code).toBe("NOT_FOUND");
  });

  it("should validate request body", async () => {
    const res = await app.request("/api/examples", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "a", // Too short
      }),
    });

    expect(res.status).toBe(422);
    
    const data = await res.json();
    expect(data.success).toBe(false);
    expect(data.error.code).toBe("VALIDATION_ERROR");
  });
});

describe("Rate Limiting", () => {
  it("should respect rate limits", async () => {
    // Make many requests quickly
    const requests = Array.from({ length: 105 }, () =>
      app.request("/api/examples")
    );

    const results = await Promise.all(requests);
    
    // Some requests should be rate limited
    const rateLimited = results.filter((r) => r.status === 429);
    expect(rateLimited.length).toBeGreaterThan(0);
  });
});
