/**
 * Cryptography Utilities
 * Password hashing and verification using bcrypt
 */

import bcrypt from "bcrypt";

const SALT_ROUNDS = 12;

/**
 * Hash a password using bcrypt
 */
export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, SALT_ROUNDS);
};

/**
 * Verify a password against a hash
 */
export const verifyPassword = async (
  password: string,
  hash: string
): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

/**
 * Generate a random token (for email verification, password reset, etc.)
 */
export const generateRandomToken = (length: number = 32): string => {
  const crypto = require("crypto");
  return crypto.randomBytes(length).toString("hex");
};
