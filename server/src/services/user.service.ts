/**
 * User service
 * Handles user management logic
 */

import { NotFoundError, ForbiddenError } from "../types";

// Mock user database (replace with real database)
interface User {
  id: string;
  email: string;
  password: string;
  name: string;
  role: string;
  bio?: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

interface Activity {
  id: string;
  userId: string;
  action: string;
  description: string;
  metadata?: Record<string, any>;
  timestamp: string;
}

const mockUsers: Map<string, User> = new Map();
const mockActivity: Activity[] = [];

class UserService {
  /**
   * List users with pagination and filters
   */
  async listUsers(query: {
    page: number;
    limit: number;
    search?: string;
    sortBy: string;
    sortOrder: string;
  }): Promise<{
    users: Array<Omit<User, "password">>;
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    let users = Array.from(mockUsers.values());

    // Apply search filter
    if (query.search) {
      const searchLower = query.search.toLowerCase();
      users = users.filter(
        (u) =>
          u.name.toLowerCase().includes(searchLower) ||
          u.email.toLowerCase().includes(searchLower)
      );
    }

    // Sort users
    users.sort((a, b) => {
      let aVal = a[query.sortBy as keyof User] || "";
      let bVal = b[query.sortBy as keyof User] || "";

      if (query.sortOrder === "asc") {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    // Pagination
    const total = users.length;
    const totalPages = Math.ceil(total / query.limit);
    const start = (query.page - 1) * query.limit;
    const end = start + query.limit;
    const paginatedUsers = users.slice(start, end);

    // Remove passwords
    const usersWithoutPasswords = paginatedUsers.map((u) => {
      const { password, ...rest } = u;
      return rest;
    });

    return {
      users: usersWithoutPasswords,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages,
      },
    };
  }

  /**
   * Get user by ID
   */
  async getUserById(id: string): Promise<Omit<User, "password">> {
    const user = mockUsers.get(id);

    if (!user) {
      throw new NotFoundError("User not found");
    }

    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  /**
   * Update user
   */
  async updateUser(
    id: string,
    data: {
      name?: string;
      bio?: string;
      avatar?: string;
    }
  ): Promise<Omit<User, "password">> {
    const user = mockUsers.get(id);

    if (!user) {
      throw new NotFoundError("User not found");
    }

    // Update user
    const updatedUser: User = {
      ...user,
      ...data,
      updatedAt: new Date().toISOString(),
    };

    mockUsers.set(id, updatedUser);

    // Log activity
    this.logActivity({
      userId: id,
      action: "profile_updated",
      description: "User updated their profile",
      metadata: { updates: Object.keys(data) },
    });

    const { password, ...userWithoutPassword } = updatedUser;
    return userWithoutPassword;
  }

  /**
   * Delete user
   */
  async deleteUser(id: string): Promise<void> {
    const user = mockUsers.get(id);

    if (!user) {
      throw new NotFoundError("User not found");
    }

    // Don't allow deleting admin users (for safety)
    if (user.role === "admin") {
      throw new ForbiddenError("Cannot delete admin users");
    }

    mockUsers.delete(id);

    // Log activity
    this.logActivity({
      userId: id,
      action: "account_deleted",
      description: "User account was deleted",
    });
  }

  /**
   * Get user activity
   */
  async getUserActivity(
    userId: string,
    query: { page: number; limit: number }
  ): Promise<{
    activity: Activity[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    // Filter activity by user
    const userActivity = mockActivity.filter((a) => a.userId === userId);

    // Sort by timestamp (newest first)
    userActivity.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    // Pagination
    const total = userActivity.length;
    const totalPages = Math.ceil(total / query.limit);
    const start = (query.page - 1) * query.limit;
    const end = start + query.limit;
    const paginatedActivity = userActivity.slice(start, end);

    return {
      activity: paginatedActivity,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages,
      },
    };
  }

  /**
   * Log user activity
   */
  private logActivity(data: {
    userId: string;
    action: string;
    description: string;
    metadata?: Record<string, any>;
  }): void {
    const activity: Activity = {
      id: `activity-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ...data,
      timestamp: new Date().toISOString(),
    };

    mockActivity.push(activity);

    // Keep only last 1000 activities
    if (mockActivity.length > 1000) {
      mockActivity.shift();
    }
  }
}

export const userService = new UserService();
