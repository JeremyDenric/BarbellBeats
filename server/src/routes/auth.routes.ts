/**
 * Authentication Routes
 * Handles user registration, login, token refresh, logout
 */

import { Hono } from "hono";
import { z } from "zod";
import {
  requireAuth,
  generateTokenPair,
  verifyRefreshToken,
  getCurrentUser,
} from "../middleware/auth";
import { authRateLimiter } from "../middleware/rate-limiter";
import { validate } from "../middleware/validate";
import { AppContext, BadRequestError, ConflictError, UnauthorizedError } from "../types";
import { generateRandomToken, hashPassword, verifyPassword } from "../utils/crypto";
import {
  consumePasswordResetToken,
  createPasswordResetToken,
  createUser,
  findUserByEmail,
  findUserById,
  updateUserPassword,
} from "../data/store";
import { env } from "../config/env";
import { emailService } from "../lib/email";
import {
  verifyAppleIdentityToken,
  verifyGoogleIdToken,
} from "../services/social-auth";

// ============================================================================
// Validation Schemas
// ============================================================================

const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Password must contain at least one uppercase letter, one lowercase letter, and one number"
    ),
  name: z.string().min(2, "Name must be at least 2 characters"),
});

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

const appleSchema = z.object({
  identityToken: z.string().min(1, "Identity token is required"),
  email: z.string().email("Invalid email address").optional(),
  name: z.string().min(1).optional(),
});

const googleSchema = z.object({
  idToken: z.string().min(1, "ID token is required"),
  email: z.string().email("Invalid email address").optional(),
  name: z.string().min(1).optional(),
});

const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

const resetPasswordSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Password must contain at least one uppercase letter, one lowercase letter, and one number"
    ),
});

const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token is required"),
});

// ============================================================================
// Router
// ============================================================================

export const authRouter = new Hono<AppContext>();

/**
 * POST /auth/register
 * Register a new user
 */
authRouter.post(
  "/register",
  authRateLimiter, // Strict rate limiting for registration
  validate({ json: registerSchema }),
  async (c) => {
    const { email, password, name } = c.get("validatedBody") as z.infer<
      typeof registerSchema
    >;

    // Check if user already exists
    // const existingUser = await db.user.findUnique({ where: { email } });
    // if (existingUser) {
    //   throw new ConflictError("User with this email already exists");
    // }

    // Example: Check in-memory store (replace with real database)
    const existingUser = findUserByEmail(email);
    if (existingUser) {
      throw new ConflictError("User with this email already exists");
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    // const user = await db.user.create({
    //   data: { email, passwordHash, name },
    // });

    // Example: Mock user creation
    const user = createUser({
      id: `user_${Date.now()}`,
      email,
      name,
      passwordHash,
      role: "user",
    });

    // Generate tokens
    const tokens = await generateTokenPair({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return c.json(
      {
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          },
          ...tokens,
        },
        message: "User registered successfully",
      },
      201
    );
  }
);

/**
 * POST /auth/login
 * Login user and return tokens
 */
authRouter.post(
  "/login",
  authRateLimiter,
  validate({ json: loginSchema }),
  async (c) => {
    const { email, password } = c.get("validatedBody") as z.infer<
      typeof loginSchema
    >;

    // Find user
    // const user = await db.user.findUnique({ where: { email } });
    
    // Example: Mock user lookup
    const user = findUserByEmail(email);
    
    if (!user) {
      throw new UnauthorizedError("Invalid email or password");
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, user.passwordHash);
    if (!isValidPassword) {
      throw new UnauthorizedError("Invalid email or password");
    }

    // Generate tokens
    const tokens = await generateTokenPair({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return c.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
        ...tokens,
      },
      message: "Login successful",
    });
  }
);

/**
 * POST /auth/apple
 * Login or register with Apple Sign-In
 */
authRouter.post(
  "/apple",
  authRateLimiter,
  validate({ json: appleSchema }),
  async (c) => {
    const { identityToken, email, name } = c.get("validatedBody") as z.infer<
      typeof appleSchema
    >;

    const payload = await verifyAppleIdentityToken(identityToken);
    const resolvedEmail = (payload.email as string | undefined) || email;

    if (!resolvedEmail) {
      throw new BadRequestError("Apple Sign-In did not return an email address");
    }

    const resolvedName =
      (name && name.trim()) ||
      (payload.name as string | undefined) ||
      "Apple User";

    let user = findUserByEmail(resolvedEmail);
    if (!user) {
      const passwordHash = await hashPassword(generateRandomToken(16));
      user = createUser({
        id: `user_${Date.now()}`,
        email: resolvedEmail,
        name: resolvedName,
        role: "user",
        passwordHash,
      });
    }

    const tokens = await generateTokenPair({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return c.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
        ...tokens,
      },
      message: "Login successful",
    });
  }
);

/**
 * POST /auth/google
 * Login or register with Google Sign-In
 */
authRouter.post(
  "/google",
  authRateLimiter,
  validate({ json: googleSchema }),
  async (c) => {
    const { idToken, email, name } = c.get("validatedBody") as z.infer<
      typeof googleSchema
    >;

    const payload = await verifyGoogleIdToken(idToken);
    const resolvedEmail = (payload.email as string | undefined) || email;

    if (!resolvedEmail) {
      throw new BadRequestError("Google Sign-In did not return an email address");
    }

    const resolvedName =
      (payload.name as string | undefined) || (name && name.trim()) || "Google User";

    let user = findUserByEmail(resolvedEmail);
    if (!user) {
      const passwordHash = await hashPassword(generateRandomToken(16));
      user = createUser({
        id: `user_${Date.now()}`,
        email: resolvedEmail,
        name: resolvedName,
        role: "user",
        passwordHash,
      });
    } else if (resolvedName && user.name !== resolvedName) {
      user.name = resolvedName;
      user.updatedAt = new Date();
    }

    const tokens = await generateTokenPair({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return c.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
        ...tokens,
      },
      message: "Login successful",
    });
  }
);

/**
 * POST /auth/forgot-password
 * Request password reset email
 */
authRouter.post(
  "/forgot-password",
  authRateLimiter,
  validate({ json: forgotPasswordSchema }),
  async (c) => {
    const { email } = c.get("validatedBody") as z.infer<
      typeof forgotPasswordSchema
    >;

    const user = findUserByEmail(email);
    if (user) {
      const { token } = createPasswordResetToken(user.id);
      const resetUrl = `${env.FRONTEND_URL}/reset-password?token=${token}`;
      await emailService.sendPasswordResetEmail(user.email, {
        name: user.name,
        resetUrl,
        expiresIn: "1 hour",
      });
    }

    return c.json({
      success: true,
      message: "If the email exists, a reset link has been sent.",
    });
  }
);

/**
 * POST /auth/reset-password
 * Reset password with token
 */
authRouter.post(
  "/reset-password",
  authRateLimiter,
  validate({ json: resetPasswordSchema }),
  async (c) => {
    const { token, password } = c.get("validatedBody") as z.infer<
      typeof resetPasswordSchema
    >;

    const userId = consumePasswordResetToken(token);
    if (!userId) {
      throw new UnauthorizedError("Invalid or expired reset token");
    }

    const passwordHash = await hashPassword(password);
    updateUserPassword(userId, passwordHash);

    return c.json({
      success: true,
      message: "Password reset successful",
    });
  }
);

/**
 * POST /auth/refresh
 * Refresh access token using refresh token
 */
authRouter.post(
  "/refresh",
  validate({ json: refreshTokenSchema }),
  async (c) => {
    const { refreshToken } = c.get("validatedBody") as z.infer<
      typeof refreshTokenSchema
    >;

    // Verify refresh token
    const payload = await verifyRefreshToken(refreshToken);

    // Get user
    // const user = await db.user.findUnique({ where: { id: payload.userId } });
    
    // Example: Mock user lookup
    const user = findUserById(payload.userId);
    
    if (!user) {
      throw new UnauthorizedError("Invalid refresh token");
    }

    // Optional: Check token version for token invalidation
    // if (payload.tokenVersion !== user.tokenVersion) {
    //   throw new UnauthorizedError("Token has been revoked");
    // }

    // Generate new tokens
    const tokens = await generateTokenPair({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return c.json({
      success: true,
      data: {
        ...tokens,
      },
      message: "Token refreshed successfully",
    });
  }
);

/**
 * POST /auth/logout
 * Logout user (invalidate tokens)
 */
authRouter.post("/logout", requireAuth(), async (c) => {
  const user = getCurrentUser(c);

  // In a real app, you might:
  // 1. Add token to blacklist (Redis)
  // 2. Increment user's token version in database
  // 3. Delete refresh token from database
  
  // Example: Increment token version
  // await db.user.update({
  //   where: { id: user.userId },
  //   data: { tokenVersion: { increment: 1 } },
  // });

  return c.json({
    success: true,
    data: {
      userId: user.userId,
    },
    message: "Logout successful",
  });
});

/**
 * GET /auth/me
 * Get current authenticated user
 */
authRouter.get("/me", requireAuth(), async (c) => {
  const user = getCurrentUser(c);

  // Fetch full user details
  // const userDetails = await db.user.findUnique({
  //   where: { id: user.userId },
  // });

  // Example: Mock user lookup
  const userDetails = findUserById(user.userId);

  if (!userDetails) {
    throw new UnauthorizedError("User not found");
  }

  return c.json({
    success: true,
    data: {
      id: userDetails.id,
      email: userDetails.email,
      name: userDetails.name,
      role: userDetails.role,
      createdAt: userDetails.createdAt,
    },
  });
});

export const authRoutes = authRouter;
