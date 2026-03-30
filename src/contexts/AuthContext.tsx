/**
 * Authentication Context
 * Manages user authentication state and operations
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  ReactNode,
  useRef,
} from 'react';
import { AppState, AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { z } from 'zod';
import * as Sentry from '@sentry/react-native';
import devLog from '../utils/devLog';
import { getSecureItem, setSecureItem, removeSecureItem } from '../utils/secureStorage';
import { apiClient, RateLimitError } from '../api/api-client';
import { localAuth } from '../services/localAuth';
import { biometricAuth, appleAuth, googleAuth } from '../services/auth';
import type { AppleAuthResult, GoogleAuthResult } from '../services/auth';

// ============================================================================
// Types
// ============================================================================

export interface User {
  id: string;
  email: string;
  name: string;
  username?: string;
  avatar?: string;
  influencePoints?: number;
  rank?: string;
  level?: number;
  createdAt?: string;
}

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Email/password auth
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<User>) => void;

  // Biometric auth
  biometricEnabled: boolean;
  biometricAvailable: boolean;
  setBiometricEnabled: (enabled: boolean) => Promise<void>;
  loginWithBiometric: () => Promise<void>;

  // Social login
  loginWithApple: () => Promise<void>;
  loginWithGoogle: () => Promise<void>;

  // Password reset
  requestPasswordReset: (email: string) => Promise<void>;
  resetPassword: (token: string, newPassword: string) => Promise<void>;

  // Auth method tracking
  authMethod: 'email' | 'apple' | 'google' | 'biometric' | null;
}

// ============================================================================
// Context
// ============================================================================

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// Storage keys — SecureStore only allows alphanumeric, periods, hyphens, underscores.
// TOKEN keys must stay in sync with api/api-client.ts TOKEN_KEY / REFRESH_TOKEN_KEY.
const AUTH_TOKEN_KEY = 'auth_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const USER_KEY = 'user';
const AUTH_METHOD_KEY = 'auth_method';
const BIOMETRIC_ENABLED_KEY = 'biometric_enabled';
const BIOMETRIC_EMAIL_KEY = 'biometric_email';
// Local auth offline fallback is only active in dev builds.
// __DEV__ is false in production, so local credentials never reach production.
const ALLOW_LOCAL_AUTH = __DEV__;

/** Returns true when the error is a network/connectivity problem (not an auth failure) */
function isNetworkError(error: unknown): boolean {
  if (error instanceof RateLimitError) return false;
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    return (
      msg.includes('network') ||
      msg.includes('fetch') ||
      msg.includes('timeout') ||
      msg.includes('connect') ||
      msg.includes('econnrefused') ||
      error.name === 'AbortError'
    );
  }
  return false;
}

// ============================================================================
// Provider Component
// ============================================================================

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [biometricEnabled, setBiometricEnabledState] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [authMethod, setAuthMethod] = useState<'email' | 'apple' | 'google' | 'biometric' | null>(null);
  const appState = useRef<AppStateStatus>(AppState.currentState);
  const lastRefreshCheck = useRef<number>(Date.now());

  // Initialize auth state from storage
  useEffect(() => {
    loadAuthState();
    checkBiometricAvailability();
  }, []);

  // Auto-refresh token on app foreground (skip in dev mode with mock auth)
  useEffect(() => {
    const checkAndRefreshToken = async () => {
      if (!user) return;

      // Skip token validation in dev mode - mock auth doesn't have a real backend
      if (ALLOW_LOCAL_AUTH) {
        return;
      }

      try {
        // Verify token by fetching current user
        // apiClient handles auto-refresh on 401
        const response = await apiClient.getCurrentUser();
        if (response.success && response.data) {
          // Token is valid or was refreshed, update user if changed
          if (JSON.stringify(response.data) !== JSON.stringify(user)) {
            setUser(response.data);
            await setSecureItem(USER_KEY, JSON.stringify(response.data));
          }
        } else {
          // Token refresh failed, logout
          devLog.warn('[AuthContext] Token validation failed, logging out');
          await logout();
        }
      } catch (error) {
        devLog.error('[AuthContext] Token refresh check failed:', error);
        if (!__DEV__) {
          Sentry.captureException(error, {
            tags: { context: 'auth', operation: 'auto_refresh' },
          });
        }
      }
    };

    // No user — nothing to refresh. Skip creating the interval entirely.
    if (!user) return;

    // Check immediately on mount if user exists
    checkAndRefreshToken();

    // Set up interval to check every 15 minutes. Cleared automatically when user changes.
    const refreshInterval = setInterval(checkAndRefreshToken, 15 * 60 * 1000);

    return () => clearInterval(refreshInterval);
  }, [user]);

  // Listen to app state changes and refresh on foreground (skip in dev mode)
  useEffect(() => {
    // Skip foreground refresh in dev mode - mock auth doesn't have a real backend
    if (ALLOW_LOCAL_AUTH) {
      return;
    }

    const subscription = AppState.addEventListener('change', async (nextAppState) => {
      // App has come to the foreground
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active' &&
        user
      ) {
        // Only check if it's been more than 5 minutes since last check
        const now = Date.now();
        if (now - lastRefreshCheck.current > 5 * 60 * 1000) {
          lastRefreshCheck.current = now;

          try {
            const response = await apiClient.getCurrentUser();
            if (response.success && response.data) {
              if (JSON.stringify(response.data) !== JSON.stringify(user)) {
                setUser(response.data);
                await setSecureItem(USER_KEY, JSON.stringify(response.data));
              }
            } else {
              devLog.warn('[AuthContext] Token validation failed on foreground');
              await logout();
            }
          } catch (error) {
            devLog.error('[AuthContext] Foreground token check failed:', error);
            Sentry.captureException(error, {
              tags: { context: 'auth', operation: 'foreground_refresh' },
            });
          }
        }
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [user]);

  /**
   * Check if biometric authentication is available on this device
   */
  const checkBiometricAvailability = async () => {
    try {
      const available = await biometricAuth.isAvailable();
      setBiometricAvailable(available);

      if (available) {
        const enabled = await biometricAuth.isBiometricEnabled();
        setBiometricEnabledState(enabled);
      }
    } catch (error) {
      devLog.error('Failed to check biometric availability:', error);
      setBiometricAvailable(false);
    }
  };

  /**
   * Load saved auth state from storage on app start.
   */
  const loadAuthState = async () => {
    try {
      let token = await getSecureItem(AUTH_TOKEN_KEY);
      if (!token) {
        // One-time migration: move legacy plaintext AsyncStorage token to SecureStore.
        const legacyToken = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
        if (legacyToken) {
          await setSecureItem(AUTH_TOKEN_KEY, legacyToken);
          await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
          token = legacyToken;
        }
      }

      // Load refresh token and immediately sync both into the fetch api-client so
      // it has the correct in-memory state before any request fires.
      const refreshToken = await getSecureItem(REFRESH_TOKEN_KEY);
      apiClient.setTokens(token, refreshToken);

      const [plainUserData, method] = await Promise.all([
        AsyncStorage.getItem(USER_KEY),   // legacy read — migration only
        AsyncStorage.getItem(AUTH_METHOD_KEY),
      ]);

      // One-time migration: move user object from plaintext AsyncStorage → SecureStore.
      if (plainUserData) {
        try {
          await setSecureItem(USER_KEY, plainUserData);
          await AsyncStorage.removeItem(USER_KEY);
        } catch {
          // Migration failed; secure read below returns null → user re-logs in (safe outcome).
        }
      }

      if (token) {
        // Check token expiry before restoring the session.
        // Decode the JWT payload (base64url part between the two dots) without verification.
        // Verification happens on the first real API call via apiClient's 401 handling.
        let tokenExpired = false;
        try {
          const payloadB64 = token.split('.')[1];
          if (payloadB64) {
            const json = atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/'));
            const { exp } = JSON.parse(json) as { exp?: number };
            if (exp && exp * 1000 < Date.now()) {
              tokenExpired = true;
              devLog.warn('[AuthContext] Stored access token is expired, clearing session');
              await Promise.all([removeSecureItem(AUTH_TOKEN_KEY), removeSecureItem(USER_KEY)]);
              apiClient.setTokens(null, null);
            }
          }
        } catch {
          // Corrupt token — treat as expired
          tokenExpired = true;
          await Promise.all([removeSecureItem(AUTH_TOKEN_KEY), removeSecureItem(USER_KEY)]);
          apiClient.setTokens(null, null);
        }

        if (!tokenExpired) {
          const secureUserJson = await getSecureItem(USER_KEY);
          if (secureUserJson) {
            try {
              setUser(JSON.parse(secureUserJson) as User);
            } catch {
              await removeSecureItem(USER_KEY);
            }
          }
        }
      }

      if (method) {
        setAuthMethod(method as 'email' | 'apple' | 'google' | 'biometric');
      }
    } catch (error) {
      devLog.error('[AuthContext] Failed to load auth state:', error);
      if (!__DEV__) {
        Sentry.captureException(error, {
          tags: { context: 'auth', operation: 'load_state' },
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Login user
   */
  const login = useCallback(async (email: string, password: string) => {
    if (ALLOW_LOCAL_AUTH) {
      try {
        const response = await apiClient.login({ email, password });
        if (response.success && response.data) {
          await Promise.all([
            setSecureItem(AUTH_TOKEN_KEY, response.data.accessToken),
            setSecureItem(USER_KEY, JSON.stringify(response.data.user)),
            AsyncStorage.setItem(AUTH_METHOD_KEY, 'email'),
          ]);
          apiClient.setTokens(response.data.accessToken, null);
          setUser(response.data.user);
          setAuthMethod('email');
          return;
        }
        // API returned an error response (not a network error) — propagate it
        if (!response.success) {
          throw new Error(response.message || 'Login failed');
        }
      } catch (apiError) {
        // Only fall back to local auth when the server is unreachable
        if (!isNetworkError(apiError)) throw apiError;
        devLog.warn('[Auth] Network error, using local auth fallback');
      }

      // Offline fallback — requires prior registration with localAuth
      devLog.log('[Auth] Using local authentication');
      const fallback = await localAuth.login(email, password);
      await Promise.all([
        setSecureItem(AUTH_TOKEN_KEY, fallback.token),
        setSecureItem(USER_KEY, JSON.stringify(fallback.user)),
        AsyncStorage.setItem(AUTH_METHOD_KEY, 'email'),
      ]);
      apiClient.setTokens(fallback.token, null);
      setUser(fallback.user);
      setAuthMethod('email');
      return;
    }

    // Production mode - API only
    const response = await apiClient.login({ email, password });
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Login failed');
    }

    await Promise.all([
      setSecureItem(AUTH_TOKEN_KEY, response.data.accessToken),
      setSecureItem(USER_KEY, JSON.stringify(response.data.user)),
      AsyncStorage.setItem(AUTH_METHOD_KEY, 'email'),
    ]);

    apiClient.setTokens(response.data.accessToken, null);
    setUser(response.data.user);
    setAuthMethod('email');
  }, []);

  /**
   * Register new user
   */
  const register = useCallback(
    async (email: string, password: string, name: string) => {
      if (ALLOW_LOCAL_AUTH) {
        try {
          const response = await apiClient.register({ email, password, name });
          if (response.success && response.data) {
            await Promise.all([
              setSecureItem(AUTH_TOKEN_KEY, response.data.accessToken),
              setSecureItem(USER_KEY, JSON.stringify(response.data.user)),
              AsyncStorage.setItem(AUTH_METHOD_KEY, 'email'),
            ]);
            apiClient.setTokens(response.data.accessToken, null);
            setUser(response.data.user);
            setAuthMethod('email');
            return;
          }
          if (!response.success) {
            throw new Error(response.message || 'Registration failed');
          }
        } catch (apiError) {
          if (!isNetworkError(apiError)) throw apiError;
          devLog.warn('[Auth] Network error, using local auth fallback for registration');
        }

        // Offline fallback — creates a real local account with password hash
        devLog.log('[Auth] Using local registration');
        const fallback = await localAuth.register(name, email, password);
        await Promise.all([
          setSecureItem(AUTH_TOKEN_KEY, fallback.token),
          setSecureItem(USER_KEY, JSON.stringify(fallback.user)),
          AsyncStorage.setItem(AUTH_METHOD_KEY, 'email'),
        ]);
        apiClient.setTokens(fallback.token, null);
        setUser(fallback.user);
        setAuthMethod('email');
        return;
      }

      // Production mode - API only
      const response = await apiClient.register({ email, password, name });
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Registration failed');
      }

      await Promise.all([
        setSecureItem(AUTH_TOKEN_KEY, response.data.accessToken),
        setSecureItem(USER_KEY, JSON.stringify(response.data.user)),
        AsyncStorage.setItem(AUTH_METHOD_KEY, 'email'),
      ]);

      apiClient.setTokens(response.data.accessToken, null);
      setUser(response.data.user);
      setAuthMethod('email');
    },
    []
  );

  /**
   * Logout user — revokes refresh token on the server then clears local state.
   */
  const logout = useCallback(async () => {
    try {
      // Notify the server so the refresh token is revoked (C-3).
      // apiClient.logout() sends POST /auth/logout and clears SecureStore tokens.
      // Errors are intentionally swallowed so local cleanup always runs.
      try {
        await apiClient.logout();
      } catch {
        // Server unreachable — still clear local session.
      }

      await Promise.all([
        removeSecureItem(USER_KEY),
        AsyncStorage.removeItem(AUTH_METHOD_KEY),
        // Belt-and-suspenders: remove access token from SecureStore even if
        // apiClient.logout() already did it.
        removeSecureItem(AUTH_TOKEN_KEY),
      ]);

      apiClient.setTokens(null, null);
      setUser(null);
      setAuthMethod(null);
    } catch (error) {
      devLog.error('Logout failed:', error);
      throw error;
    }
  }, []);

  /**
   * Enable or disable biometric authentication
   */
  const setBiometricEnabled = useCallback(
    async (enabled: boolean) => {
      try {
        if (enabled && !biometricAvailable) {
          throw new Error('Biometric authentication is not available on this device');
        }

        await biometricAuth.setBiometricEnabled(enabled);
        setBiometricEnabledState(enabled);

        // If enabling, save the user's email for biometric login
        if (enabled && user?.email) {
          await biometricAuth.setBiometricEmail(user.email);
        }
      } catch (error) {
        devLog.error('Failed to set biometric enabled:', error);
        throw error;
      }
    },
    [biometricAvailable, user]
  );

  /**
   * Login with biometric authentication
   */
  const loginWithBiometric = useCallback(async () => {
    try {
      if (!biometricAvailable) {
        throw new Error('Biometric authentication is not available');
      }

      if (!biometricEnabled) {
        throw new Error('Biometric authentication is not enabled');
      }

      // Authenticate with biometrics
      const success = await biometricAuth.authenticate();
      if (!success) {
        throw new Error('Biometric authentication failed');
      }

      // Get the stored email
      const email = await biometricAuth.getBiometricEmail();
      if (!email) {
        throw new Error('No email found for biometric login');
      }

      // Get the stored token and user (user must already be logged in)
      const token = await getSecureItem(AUTH_TOKEN_KEY);
      const userJson = await getSecureItem(USER_KEY);

      if (!token || !userJson) {
        throw new Error('No saved session found. Please login with email/password first.');
      }

      apiClient.setTokens(token, null);
      try {
        setUser(JSON.parse(userJson) as User);
      } catch {
        throw new Error('Corrupted user session. Please login with email/password.');
      }
      setAuthMethod('biometric');

      // Update auth method
      await AsyncStorage.setItem(AUTH_METHOD_KEY, 'biometric');
    } catch (error) {
      devLog.error('[AuthContext] Biometric login failed:', error);
      if (!__DEV__) {
        Sentry.captureException(error, {
          tags: { context: 'auth', operation: 'biometric_login' },
        });
      }
      throw error;
    }
  }, [biometricAvailable, biometricEnabled]);

  /**
   * Login with Apple Sign-In
   */
  const loginWithApple = useCallback(async () => {
    try {
      const isAvailable = await appleAuth.isAvailable();
      if (!isAvailable) {
        throw new Error('Apple Sign-In is not available on this device');
      }

      // Perform Apple Sign-In
      const appleResult = await appleAuth.signIn();

      const response = await apiClient.loginWithApple({
        identityToken: appleResult.identityToken,
        email: appleResult.email || undefined,
        name: appleAuth.getDisplayName(appleResult.fullName),
      });

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Apple Sign-In failed');
      }

      await Promise.all([
        setSecureItem(AUTH_TOKEN_KEY, response.data.accessToken),
        setSecureItem(USER_KEY, JSON.stringify(response.data.user)),
        AsyncStorage.setItem(AUTH_METHOD_KEY, 'apple'),
        AsyncStorage.removeItem(AUTH_TOKEN_KEY),
      ]);

      apiClient.setTokens(response.data.accessToken, null);
      setUser(response.data.user);
      setAuthMethod('apple');
    } catch (error: any) {
      if (error?.message !== 'apple_signin_canceled') {
        devLog.warn('Apple Sign-In failed:', error);
      }
      throw error;
    }
  }, []);

  /**
   * Login with Google Sign-In
   */
  const loginWithGoogle = useCallback(async () => {
    try {
      // Configure Google Sign-In
      await googleAuth.configure();

      // Check for Play Services (Android)
      const hasPlayServices = await googleAuth.hasPlayServices();
      if (!hasPlayServices) {
        throw new Error('Google Play Services are not available on this device');
      }

      // Perform Google Sign-In
      const googleResult = await googleAuth.signIn();

      const response = await apiClient.loginWithGoogle({
        idToken: googleResult.idToken,
        email: googleResult.user.email,
        name: googleAuth.getDisplayName(googleResult.user),
      });

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Google Sign-In failed');
      }

      await Promise.all([
        setSecureItem(AUTH_TOKEN_KEY, response.data.accessToken),
        setSecureItem(USER_KEY, JSON.stringify(response.data.user)),
        AsyncStorage.setItem(AUTH_METHOD_KEY, 'google'),
        AsyncStorage.removeItem(AUTH_TOKEN_KEY),
      ]);

      apiClient.setTokens(response.data.accessToken, null);
      setUser(response.data.user);
      setAuthMethod('google');
    } catch (error) {
      devLog.error('Google Sign-In failed:', error);
      throw error;
    }
  }, []);

  /**
   * Request password reset email
   */
  const requestPasswordReset = useCallback(async (email: string) => {
    try {
      const response = await apiClient.forgotPassword(email);
      if (!response.success) {
        throw new Error(response.message || 'Password reset request failed');
      }
    } catch (error) {
      devLog.error('Password reset request failed:', error);
      throw error;
    }
  }, []);

  /**
   * Reset password with token
   */
  const resetPassword = useCallback(async (token: string, newPassword: string) => {
    try {
      const response = await apiClient.resetPassword(token, newPassword);
      if (!response.success) {
        throw new Error(response.message || 'Password reset failed');
      }
    } catch (error) {
      devLog.error('Password reset failed:', error);
      throw error;
    }
  }, []);

  /**
   * Update user data
   */
  const updateUser = useCallback(
    async (updates: Partial<User>) => {
      if (!user) return;

      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);

      // Persist to storage
      try {
        await setSecureItem(USER_KEY, JSON.stringify(updatedUser));
      } catch (error) {
        devLog.error('Failed to update user:', error);
      }
    },
    [user]
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: !!user,
      isLoading,
      login,
      register,
      logout,
      updateUser,
      biometricEnabled,
      biometricAvailable,
      setBiometricEnabled,
      loginWithBiometric,
      loginWithApple,
      loginWithGoogle,
      requestPasswordReset,
      resetPassword,
      authMethod,
    }),
    [user, isLoading, login, register, logout, updateUser, biometricEnabled, biometricAvailable, setBiometricEnabled, loginWithBiometric, loginWithApple, loginWithGoogle, requestPasswordReset, resetPassword, authMethod]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Hook to access authentication context
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// ============================================================================
// Protected Route Hook
// ============================================================================

/**
 * Hook to protect routes that require authentication
 */
export function useRequireAuth() {
  const { isAuthenticated, isLoading } = useAuth();
  return { isAuthenticated, isLoading };
}
