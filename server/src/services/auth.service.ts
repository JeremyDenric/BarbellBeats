/**
 * Authentication service
 * Handles user authentication logic
 */

import { sign, verify } from "hono/jwt";
import { env } from "../config/env";
import {
  UnauthorizedError,
  ConflictError,
  NotFoundError,
  BadRequestError,
} from "../types";
import { hashPassword, verifyPassword } from "../utils/crypto";
import { emailService } from "../lib/email";
import type { JWTPayload } from "../middleware/auth";

// Mock user database (replace with real database)
interface User {
  id: string;
  email: string;
  password: string;
  name: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

const mockUsers: Map<string, User> = new Map();
const mockRefreshTokens: Map<string, string> = new Map(); // userId -> refreshToken
const mockResetTokens: Map<string, { userId: string; expiresAt: number }> = new Map(); // token -> { userId, expiresAt }

class AuthService {
  /**
   * Register a new user
   */
  async register(data: {
    email: string;
    password: string;
    name: string;
  }): Promise<{
    user: Omit<User, "password">;
    accessToken: string;
    refreshToken: string;
  }> {
    // Check if user already exists
    const existingUser = Array.from(mockUsers.values()).find(
      (u) => u.email === data.email
    );

    if (existingUser) {
      throw new ConflictError("User with this email already exists");
    }

    // Hash password
    const hashedPassword = await hashPassword(data.password);

    // Create user with secure UUID
    const user: User = {
      id: crypto.randomUUID(),
      email: data.email,
      password: hashedPassword,
      name: data.name,
      role: "user",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    mockUsers.set(user.id, user);

    // Generate tokens
    const { accessToken, refreshToken } = await this.generateTokens(user);

    // Store refresh token
    mockRefreshTokens.set(user.id, refreshToken);

    // Return user without password
    const { password: _, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      accessToken,
      refreshToken,
    };
  }

  /**
   * Login user
   */
  async login(data: {
    email: string;
    password: string;
  }): Promise<{
    user: Omit<User, "password">;
    accessToken: string;
    refreshToken: string;
  }> {
    // Find user by email
    const user = Array.from(mockUsers.values()).find(
      (u) => u.email === data.email
    );

    if (!user) {
      throw new UnauthorizedError("Invalid email or password");
    }

    // Verify password
    const isValid = await verifyPassword(data.password, user.password);

    if (!isValid) {
      throw new UnauthorizedError("Invalid email or password");
    }

    // Generate tokens
    const { accessToken, refreshToken } = await this.generateTokens(user);

    // Store refresh token
    mockRefreshTokens.set(user.id, refreshToken);

    // Return user without password
    const { password: _, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      accessToken,
      refreshToken,
    };
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    try {
      // Verify refresh token
      const payload = (await verify(
        refreshToken,
        env.JWT_REFRESH_SECRET,
        'HS256'
      )) as unknown as JWTPayload;

      // Check if refresh token is still valid
      const storedToken = mockRefreshTokens.get(payload.userId);
      if (!storedToken || storedToken !== refreshToken) {
        throw new UnauthorizedError("Invalid refresh token");
      }

      // Get user
      const user = mockUsers.get(payload.userId);
      if (!user) {
        throw new UnauthorizedError("User not found");
      }

      // Generate new tokens
      const tokens = await this.generateTokens(user);

      // Update stored refresh token
      mockRefreshTokens.set(user.id, tokens.refreshToken);

      return tokens;
    } catch (error) {
      throw new UnauthorizedError("Invalid or expired refresh token");
    }
  }

  /**
   * Logout user
   */
  async logout(userId: string): Promise<void> {
    // Remove refresh token
    mockRefreshTokens.delete(userId);
  }

  /**
   * Get current user
   */
  async getCurrentUser(userId: string): Promise<Omit<User, "password">> {
    const user = mockUsers.get(userId);

    if (!user) {
      throw new NotFoundError("User not found");
    }

    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(email: string): Promise<void> {
    // Find user
    const user = Array.from(mockUsers.values()).find(
      (u) => u.email === email
    );

    if (!user) {
      // Don't reveal if user exists
      return;
    }

    // Generate a secure reset token
    const resetToken = crypto.randomUUID();
    const expiresAt = Date.now() + 60 * 60 * 1000; // 1 hour from now

    // Store the token
    mockResetTokens.set(resetToken, {
      userId: user.id,
      expiresAt,
    });

    // Build reset URL (in production, use actual frontend URL)
    const resetUrl = `${env.FRONTEND_URL || 'http://localhost:8081'}/reset-password?token=${resetToken}`;

    // Send the email
    await emailService.sendPasswordResetEmail(email, {
      name: user.name,
      resetUrl,
      expiresIn: '1 hour',
    });

    console.log(`Password reset email sent to ${email}`);
  }

  /**
   * Reset password
   */
  async resetPassword(data: {
    token: string;
    password: string;
  }): Promise<void> {
    // Verify token exists and is valid
    const tokenData = mockResetTokens.get(data.token);

    if (!tokenData) {
      throw new BadRequestError("Invalid or expired reset token");
    }

    // Check if token has expired
    if (Date.now() > tokenData.expiresAt) {
      mockResetTokens.delete(data.token);
      throw new BadRequestError("Reset token has expired");
    }

    // Find the user
    const user = mockUsers.get(tokenData.userId);
    if (!user) {
      throw new NotFoundError("User not found");
    }

    // Hash the new password and update
    const hashedPassword = await hashPassword(data.password);
    user.password = hashedPassword;
    user.updatedAt = new Date().toISOString();
    mockUsers.set(user.id, user);

    // Remove the used token
    mockResetTokens.delete(data.token);

    console.log(`Password reset successful for user ${user.email}`);
  }

  /**
   * Generate access and refresh tokens
   */
  private async generateTokens(user: User): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    const payload: JWTPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    // Generate access token (short-lived)
    const accessToken = await sign(
      {
        ...payload,
        exp: Math.floor(Date.now() / 1000) + this.parseExpiry(env.JWT_EXPIRES_IN),
      },
      env.JWT_SECRET
    );

    // Generate refresh token (long-lived)
    const refreshToken = await sign(
      {
        ...payload,
        exp: Math.floor(Date.now() / 1000) + this.parseExpiry(env.JWT_REFRESH_EXPIRES_IN),
      },
      env.JWT_REFRESH_SECRET
    );

    return { accessToken, refreshToken };
  }

  /**
   * Parse expiry string (e.g., "15m", "7d") to seconds
   */
  private parseExpiry(expiry: string): number {
    const unit = expiry.slice(-1);
    const value = parseInt(expiry.slice(0, -1));

    const units: Record<string, number> = {
      s: 1,
      m: 60,
      h: 3600,
      d: 86400,
    };

    return value * (units[unit] || 60);
  }
}

export const authService = new AuthService();
