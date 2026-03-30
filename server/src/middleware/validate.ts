/**
 * Validation middleware using Zod schemas
 */

import type { MiddlewareHandler } from "hono";
import { z, ZodSchema } from "zod";
import { ValidationError } from "../types";

export interface ValidationTargets {
  json?: ZodSchema;
  query?: ZodSchema;
  param?: ZodSchema;
  header?: ZodSchema;
}

/**
 * Validate request data against Zod schemas
 */
export const validate = (targets: ValidationTargets): MiddlewareHandler => {
  return async (c, next) => {
    const errors: Array<{ location: string; field: string; message: string }> = [];

    // Validate JSON body
    if (targets.json) {
      try {
        const body = await c.req.json();
        const validated = targets.json.parse(body);
        c.set("validatedBody", validated);
      } catch (error) {
        if (error instanceof z.ZodError) {
          errors.push(
            ...error.errors.map((e) => ({
              location: "body",
              field: e.path.join("."),
              message: e.message,
            }))
          );
        } else {
          throw error; // Re-throw unexpected errors (e.g., malformed JSON)
        }
      }
    }

    // Validate query parameters
    if (targets.query) {
      try {
        const query = c.req.query();
        const validated = targets.query.parse(query);
        c.set("validatedQuery", validated);
      } catch (error) {
        if (error instanceof z.ZodError) {
          errors.push(
            ...error.errors.map((e) => ({
              location: "query",
              field: e.path.join("."),
              message: e.message,
            }))
          );
        } else {
          throw error;
        }
      }
    }

    // Validate path parameters
    if (targets.param) {
      try {
        const param = c.req.param();
        const validated = targets.param.parse(param);
        c.set("validatedParam", validated);
      } catch (error) {
        if (error instanceof z.ZodError) {
          errors.push(
            ...error.errors.map((e) => ({
              location: "param",
              field: e.path.join("."),
              message: e.message,
            }))
          );
        } else {
          throw error;
        }
      }
    }

    // Validate headers
    if (targets.header) {
      try {
        const headers = Object.fromEntries(
          [...c.req.raw.headers.entries()].map(([key, value]) => [
            key.toLowerCase(),
            value,
          ])
        );
        const validated = targets.header.parse(headers);
        c.set("validatedHeader", validated);
      } catch (error) {
        if (error instanceof z.ZodError) {
          errors.push(
            ...error.errors.map((e) => ({
              location: "header",
              field: e.path.join("."),
              message: e.message,
            }))
          );
        } else {
          throw error;
        }
      }
    }

    // If there are validation errors, throw
    if (errors.length > 0) {
      throw new ValidationError("Request validation failed", errors);
    }

    await next();
  };
};
