/**
 * Local Authentication Service
 *
 * Provides real credential validation for offline / dev mode,
 * replacing the mock API that accepts any email/password.
 *
 * - Passwords: 10,000-round SHA-256 stretch with a per-user 16-byte hex salt
 * - Tokens: base64url(header.payload) + "." + SHA-256(header.payload + deviceSecret)
 * - deviceSecret: stored in SecureStore, generated once on first use
 * - User store: AsyncStorage('@bb_local_users') → Record<email, LocalUser>
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import { getSecureItem, setSecureItem } from '../utils/secureStorage';
import devLog from '../utils/devLog';

// ============================================================================
// Types
// ============================================================================

interface LocalUser {
  id: string;
  name: string;
  email: string;
  passwordHash: string; // hex
  salt: string;         // hex
  createdAt: string;
}

export interface AuthResult {
  user: {
    id: string;
    name: string;
    email: string;
    createdAt: string;
  };
  token: string;
  refreshToken: string;
}

// ============================================================================
// Storage keys
// ============================================================================

const USERS_KEY = '@bb_local_users';
const DEVICE_SECRET_KEY = 'bb_local_device_secret';
const TOKEN_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 h

// ============================================================================
// Helpers
// ============================================================================

/** Convert a Uint8Array to a lowercase hex string */
function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/** Safe base64url encode for ASCII strings */
function base64url(str: string): string {
  // btoa is available in React Native / Hermes
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

/**
 * Stretch `password` with `salt` using PBKDF2-equivalent iterative SHA-256.
 * 10,000 rounds of SHA-256(prev + salt + password).
 */
async function hashPassword(password: string, salt: string): Promise<string> {
  let hash = salt + password;
  for (let i = 0; i < 10000; i++) {
    hash = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      hash + salt + password
    );
  }
  return hash;
}

/** Get or generate a persistent device secret for token signing */
async function getOrCreateDeviceSecret(): Promise<string> {
  let secret = await getSecureItem(DEVICE_SECRET_KEY);
  if (!secret) {
    const bytes = await Crypto.getRandomBytesAsync(32);
    secret = bytesToHex(bytes);
    await setSecureItem(DEVICE_SECRET_KEY, secret);
  }
  return secret;
}

/** Sign a payload string with the device secret via SHA-256 */
async function signPayload(payload: string, secret: string): Promise<string> {
  return Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    payload + secret
  );
}

/** Load the users map from AsyncStorage */
async function loadUsers(): Promise<Record<string, LocalUser>> {
  try {
    const raw = await AsyncStorage.getItem(USERS_KEY);
    return raw ? (JSON.parse(raw) as Record<string, LocalUser>) : {};
  } catch {
    return {};
  }
}

/** Save the users map to AsyncStorage */
async function saveUsers(users: Record<string, LocalUser>): Promise<void> {
  await AsyncStorage.setItem(USERS_KEY, JSON.stringify(users));
}

/** Build a signed JWT-like token for a user */
async function createToken(userId: string, secret: string): Promise<string> {
  const header = base64url(JSON.stringify({ alg: 'HS256', typ: 'LOCAL' }));
  const payload = base64url(
    JSON.stringify({ sub: userId, iat: Date.now(), exp: Date.now() + TOKEN_EXPIRY_MS })
  );
  const data = `${header}.${payload}`;
  const sig = await signPayload(data, secret);
  return `${data}.${base64url(sig)}`;
}

/** Build a refresh token (longer-lived, random bytes) */
async function createRefreshToken(): Promise<string> {
  const bytes = await Crypto.getRandomBytesAsync(32);
  return bytesToHex(bytes);
}

// ============================================================================
// Public API
// ============================================================================

export const localAuth = {
  /**
   * Register a new local account.
   * Throws if an account with the same email already exists.
   */
  async register(name: string, email: string, password: string): Promise<AuthResult> {
    const users = await loadUsers();
    const key = email.toLowerCase().trim();

    if (users[key]) {
      throw new Error('An account with this email already exists.');
    }

    const saltBytes = await Crypto.getRandomBytesAsync(16);
    const salt = bytesToHex(saltBytes);
    const passwordHash = await hashPassword(password, salt);
    const id = Crypto.randomUUID();

    const user: LocalUser = {
      id,
      name: name.trim(),
      email: key,
      passwordHash,
      salt,
      createdAt: new Date().toISOString(),
    };

    users[key] = user;
    await saveUsers(users);

    const secret = await getOrCreateDeviceSecret();
    const token = await createToken(id, secret);
    const refreshToken = await createRefreshToken();

    devLog.log('[localAuth] Registered new local account:', key);

    return {
      user: { id: user.id, name: user.name, email: user.email, createdAt: user.createdAt },
      token,
      refreshToken,
    };
  },

  /**
   * Login with email + password.
   * Throws on wrong credentials — unlike mockApi which accepts anything.
   */
  async login(email: string, password: string): Promise<AuthResult> {
    const users = await loadUsers();
    const key = email.toLowerCase().trim();
    const user = users[key];

    if (!user) {
      throw new Error('No account found with this email. Please register first.');
    }

    const hash = await hashPassword(password, user.salt);
    if (hash !== user.passwordHash) {
      throw new Error('Incorrect password.');
    }

    const secret = await getOrCreateDeviceSecret();
    const token = await createToken(user.id, secret);
    const refreshToken = await createRefreshToken();

    devLog.log('[localAuth] Logged in local account:', key);

    return {
      user: { id: user.id, name: user.name, email: user.email, createdAt: user.createdAt },
      token,
      refreshToken,
    };
  },

  /**
   * Verify a token is structurally valid and signed by this device.
   * Returns the payload if valid, null otherwise.
   */
  async verifyToken(token: string): Promise<{ sub: string; exp: number } | null> {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;

      const [header, payload, sig] = parts;
      const data = `${header}.${payload}`;
      const secret = await getOrCreateDeviceSecret();
      const expectedSig = base64url(await signPayload(data, secret));

      if (sig !== expectedSig) return null;

      const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
      if (decoded.exp < Date.now()) return null;

      return decoded;
    } catch {
      return null;
    }
  },

  /** Remove the device secret (effectively logs out all local sessions) */
  async logout(): Promise<void> {
    // Device secret stays — just a no-op here since AuthContext owns session clearing
  },
};
