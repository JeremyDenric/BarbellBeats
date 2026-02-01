/**
 * Authentication service with Prisma
 * Real database implementation
 */

import { sign, verify } from "hono/jwt";
import { prisma } from "../lib/prisma";
import { env } from "../config/env";
import {
  UnauthorizedError,
  ConflictError,
  NotFoundError,
} from "../types";
import {
  hashPassword,
  verifyPassword,
  generateRandomToken,
} from "../utils/crypto";
import { emailService } from "../lib/email";
import type { JWTPayload } from "../middleware/auth";

class AuthService {
  /**
   * Register a new user
   */
  async register(data: {
    email: string;
    password: string;
    name: string;
  }): Promise<{
    user: {
      id: string;
      email: string;
      name: string;
      role: string;
      verified: boolean;
      createdAt: Date;
    };
    accessToken: string;
    refreshToken: string;
  }> {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new ConflictError("User with this email already exists");
    }

    // Hash password
    const hashedPassword = await hashPassword(data.password);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        name: data.name,
        role: "user",
        verified: false,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        verified: true,
        createdAt: true,
      },
    });

    // Log activity
    await prisma.activity.create({
      data: {
        userId: user.id,
        action: "account_created",
        description: "User account was created",
      },
    });

    // Generate tokens
    const { accessToken, refreshToken } = await this.generateTokens(user);

    // Store refresh token in session
    await this.createSession(user.id, refreshToken);

    // Send welcome email
    emailService.sendWelcomeEmail(user.email, {
      name: user.name,
      verifyUrl: `${env.FRONTEND_URL}/verify-email?token=${generateRandomToken()}`,
    });

    return {
      user,
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
    user: {
      id: string;
      email: string;
      name: string;
      role: string;
      verified: boolean;
      createdAt: Date;
    };
    accessToken: string;
    refreshToken: string;
  }> {
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      throw new UnauthorizedError("Invalid email or password");
    }

    // Verify password
    const isValid = await verifyPassword(data.password, user.password);

    if (!isValid) {
      throw new UnauthorizedError("Invalid email or password");
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Log activity
    await prisma.activity.create({
      data: {
        userId: user.id,
        action: "user_login",
        description: "User logged in",
      },
    });

    // Generate tokens
    const { accessToken, refreshToken } = await this.generateTokens(user);

    // Store refresh token in session
    await this.createSession(user.id, refreshToken);

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

      // Check if session exists and is valid
      const session = await prisma.session.findUnique({
        where: { refreshToken },
        include: { user: true },
      });

      if (!session || session.expiresAt < new Date()) {
        throw new UnauthorizedError("Invalid or expired refresh token");
      }

      // Delete old session
      await prisma.session.delete({
        where: { id: session.id },
      });

      // Generate new tokens
      const tokens = await this.generateTokens(session.user);

      // Create new session
      await this.createSession(session.userId, tokens.refreshToken);

      return tokens;
    } catch (error) {
      throw new UnauthorizedError("Invalid or expired refresh token");
    }
  }

  /**
   * Logout user
   */
  async logout(userId: string): Promise<void> {
    // Delete all user sessions
    await prisma.session.deleteMany({
      where: { userId },
    });

    // Log activity
    await prisma.activity.create({
      data: {
        userId,
        action: "user_logout",
        description: "User logged out",
      },
    });
  }

  /**
   * Get current user
   */
  async getCurrentUser(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        bio: true,
        avatar: true,
        verified: true,
        createdAt: true,
        updatedAt: true,
        lastLoginAt: true,
      },
    });

    if (!user) {
      throw new NotFoundError("User not found");
    }

    return user;
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(email: string): Promise<void> {
    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Don't reveal if user exists
      return;
    }

    // Generate reset token
    const resetToken = generateRandomToken();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Save reset token
    await prisma.passwordReset.create({
      data: {
        userId: user.id,
        token: resetToken,
        expiresAt,
      },
    });

    // Send reset email
    await emailService.sendPasswordResetEmail(user.email, {
      name: user.name,
      resetUrl: `${env.FRONTEND_URL}/reset-password?token=${resetToken}`,
      expiresIn: "1 hour",
    });

    // Log activity
    await prisma.activity.create({
      data: {
        userId: user.id,
        action: "password_reset_requested",
        description: "User requested password reset",
      },
    });
  }

  /**
   * Reset password
   */
  async resetPassword(data: {
    token: string;
    password: string;
  }): Promise<void> {
    // Find valid reset token
    const resetRequest = await prisma.passwordReset.findFirst({
      where: {
        token: data.token,
        used: false,
        expiresAt: { gt: new Date() },
      },
      include: { user: true },
    });

    if (!resetRequest) {
      throw new UnauthorizedError("Invalid or expired reset token");
    }

    // Hash new password
    const hashedPassword = await hashPassword(data.password);

    // Update password
    await prisma.user.update({
      where: { id: resetRequest.userId },
      data: { password: hashedPassword },
    });

    // Mark token as used
    await prisma.passwordReset.update({
      where: { id: resetRequest.id },
      data: { used: true },
    });

    // Delete all user sessions (force re-login)
    await prisma.session.deleteMany({
      where: { userId: resetRequest.userId },
    });

    // Log activity
    await prisma.activity.create({
      data: {
        userId: resetRequest.userId,
        action: "password_reset",
        description: "User reset their password",
      },
    });
  }

  /**
   * Generate access and refresh tokens
   */
  private async generateTokens(user: {
    id: string;
    email: string;
    role: string;
  }): Promise<{
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
        exp:
          Math.floor(Date.now() / 1000) +
          this.parseExpiry(env.JWT_REFRESH_EXPIRES_IN),
      },
      env.JWT_REFRESH_SECRET
    );

    return { accessToken, refreshToken };
  }

  /**
   * Create session
   */
  private async createSession(
    userId: string,
    refreshToken: string
  ): Promise<void> {
    const expiresAt = new Date(
      Date.now() + this.parseExpiry(env.JWT_REFRESH_EXPIRES_IN) * 1000
    );

    await prisma.session.create({
      data: {
        userId,
        refreshToken,
        expiresAt,
      },
    });
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
