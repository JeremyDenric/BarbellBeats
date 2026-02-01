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
  ReactNode,
  useRef,
} from 'react';
import { AppState, AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { z } from 'zod';
import * as Sentry from '@sentry/react-native';
import { setAuthToken, clearAuth } from '../utils/api';
import { getSecureItem, setSecureItem, removeSecureItem } from '../utils/secureStorage';
import safeStorage from '../utils/safeStorage';
import { apiClient } from '../api/api-client';
import mockApi from '../services/mockApi';
import { biometricAuth, appleAuth, googleAuth } from '../services/auth';
import type { AppleAuthResult, GoogleAuthResult } from '../services/auth';

// ============================================================================
// Types
// ============================================================================

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  // Add more user fields as needed
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

// Storage keys
const AUTH_TOKEN_KEY = '@auth_token';
const USER_KEY = '@user';
const AUTH_METHOD_KEY = '@auth_method';
const BIOMETRIC_ENABLED_KEY = '@biometric_enabled';
const BIOMETRIC_EMAIL_KEY = '@biometric_email';
const ALLOW_MOCK_AUTH = __DEV__;
const isNetworkError = (error: unknown) =>
  error instanceof Error && /Network request failed|NETWORK_ERROR|Network error/i.test(error.message);

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

  // Auto-refresh token on app foreground
  useEffect(() => {
    const checkAndRefreshToken = async () => {
      if (!user) return;

      try {
        // Verify token by fetching current user
        // apiClient handles auto-refresh on 401
        const response = await apiClient.getCurrentUser();
        if (response.success && response.data) {
          // Token is valid or was refreshed, update user if changed
          if (JSON.stringify(response.data) !== JSON.stringify(user)) {
            setUser(response.data);
            await AsyncStorage.setItem(USER_KEY, JSON.stringify(response.data));
          }
        } else {
          // Token refresh failed, logout
          console.warn('[AuthContext] Token validation failed, logging out');
          await logout();
        }
      } catch (error) {
        console.error('[AuthContext] Token refresh check failed:', error);
        if (!__DEV__) {
          Sentry.captureException(error, {
            tags: { context: 'auth', operation: 'auto_refresh' },
          });
        }
      }
    };

    // Check immediately on mount if user exists
    if (user) {
      checkAndRefreshToken();
    }

    // Set up interval to check every 15 minutes
    const refreshInterval = setInterval(() => {
      if (user) {
        checkAndRefreshToken();
      }
    }, 15 * 60 * 1000); // 15 minutes

    return () => clearInterval(refreshInterval);
  }, [user]);

  // Listen to app state changes and refresh on foreground
  useEffect(() => {
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
                await AsyncStorage.setItem(USER_KEY, JSON.stringify(response.data));
              }
            } else {
              console.warn('[AuthContext] Token validation failed on foreground');
              await logout();
            }
          } catch (error) {
            console.error('[AuthContext] Foreground token check failed:', error);
            if (!__DEV__) {
              Sentry.captureException(error, {
                tags: { context: 'auth', operation: 'foreground_refresh' },
              });
            }
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
      console.error('Failed to check biometric availability:', error);
      setBiometricAvailable(false);
    }
  };

  /**
   * Load saved auth state from AsyncStorage
   */
  const loadAuthState = async () => {
    try {
      let token = await getSecureItem(AUTH_TOKEN_KEY);
      if (!token) {
        const legacyToken = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
        if (legacyToken) {
          await setSecureItem(AUTH_TOKEN_KEY, legacyToken);
          await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
          token = legacyToken;
        }
      }

      const [userData, method] = await Promise.all([
        AsyncStorage.getItem(USER_KEY),
        AsyncStorage.getItem(AUTH_METHOD_KEY),
      ]);

      if (token && userData) {
        setAuthToken(token);
        const user = await safeStorage.getJSON<User>(USER_KEY, {
          defaultValue: null,
        });
        if (user) {
          setUser(user);
        }
      }

      if (method) {
        setAuthMethod(method as 'email' | 'apple' | 'google' | 'biometric');
      }
    } catch (error) {
      console.error('[AuthContext] Failed to load auth state:', error);
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
    try {
      const response = await apiClient.login({ email, password });
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Login failed');
      }

      // Save auth state
      await Promise.all([
        setSecureItem(AUTH_TOKEN_KEY, response.data.accessToken),
        AsyncStorage.setItem(USER_KEY, JSON.stringify(response.data.user)),
        AsyncStorage.setItem(AUTH_METHOD_KEY, 'email'),
        AsyncStorage.removeItem(AUTH_TOKEN_KEY),
      ]);

      setAuthToken(response.data.accessToken);
      setUser(response.data.user);
      setAuthMethod('email');
    } catch (error) {
      if (ALLOW_MOCK_AUTH && isNetworkError(error)) {
        const fallback = await mockApi.login(email, password);
        await Promise.all([
          setSecureItem(AUTH_TOKEN_KEY, fallback.token),
          AsyncStorage.setItem(USER_KEY, JSON.stringify(fallback.user)),
          AsyncStorage.setItem(AUTH_METHOD_KEY, 'email'),
          AsyncStorage.removeItem(AUTH_TOKEN_KEY),
        ]);
        setAuthToken(fallback.token);
        setUser(fallback.user);
        setAuthMethod('email');
        return;
      }
      console.error('Login failed:', error);
      throw error;
    }
  }, []);

  /**
   * Register new user
   */
  const register = useCallback(
    async (email: string, password: string, name: string) => {
      try {
        const response = await apiClient.register({ email, password, name });
        if (!response.success || !response.data) {
          throw new Error(response.message || 'Registration failed');
        }

        // Save auth state
        await Promise.all([
          setSecureItem(AUTH_TOKEN_KEY, response.data.accessToken),
          AsyncStorage.setItem(USER_KEY, JSON.stringify(response.data.user)),
          AsyncStorage.setItem(AUTH_METHOD_KEY, 'email'),
          AsyncStorage.removeItem(AUTH_TOKEN_KEY),
        ]);

        setAuthToken(response.data.accessToken);
        setUser(response.data.user);
        setAuthMethod('email');
      } catch (error) {
        if (ALLOW_MOCK_AUTH && isNetworkError(error)) {
          const fallback = await mockApi.signup(email, password, name);
          await Promise.all([
            setSecureItem(AUTH_TOKEN_KEY, fallback.token),
            AsyncStorage.setItem(USER_KEY, JSON.stringify(fallback.user)),
            AsyncStorage.setItem(AUTH_METHOD_KEY, 'email'),
            AsyncStorage.removeItem(AUTH_TOKEN_KEY),
          ]);
          setAuthToken(fallback.token);
          setUser(fallback.user);
          setAuthMethod('email');
          return;
        }
        console.error('Registration failed:', error);
        throw error;
      }
    },
    []
  );

  /**
   * Logout user
   */
  const logout = useCallback(async () => {
    try {
      // Optional: Call logout endpoint
      // await post('/auth/logout');

      // Clear storage
      await Promise.all([
        removeSecureItem(AUTH_TOKEN_KEY),
        AsyncStorage.removeItem(USER_KEY),
        AsyncStorage.removeItem(AUTH_METHOD_KEY),
        AsyncStorage.removeItem(AUTH_TOKEN_KEY),
      ]);

      clearAuth();
      setUser(null);
      setAuthMethod(null);
    } catch (error) {
      console.error('Logout failed:', error);
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
        console.error('Failed to set biometric enabled:', error);
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

      // Get the stored token (user must already be logged in)
      const token = await getSecureItem(AUTH_TOKEN_KEY);
      const userData = await AsyncStorage.getItem(USER_KEY);

      if (!token || !userData) {
        throw new Error('No saved session found. Please login with email/password first.');
      }

      // Set auth state
      setAuthToken(token);
      const user = await safeStorage.getJSON<User>(USER_KEY, {
        defaultValue: null,
      });
      if (user) {
        setUser(user);
      }
      setAuthMethod('biometric');

      // Update auth method
      await AsyncStorage.setItem(AUTH_METHOD_KEY, 'biometric');
    } catch (error) {
      console.error('[AuthContext] Biometric login failed:', error);
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
        AsyncStorage.setItem(USER_KEY, JSON.stringify(response.data.user)),
        AsyncStorage.setItem(AUTH_METHOD_KEY, 'apple'),
        AsyncStorage.removeItem(AUTH_TOKEN_KEY),
      ]);

      setAuthToken(response.data.accessToken);
      setUser(response.data.user);
      setAuthMethod('apple');
    } catch (error) {
      console.error('Apple Sign-In failed:', error);
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
        AsyncStorage.setItem(USER_KEY, JSON.stringify(response.data.user)),
        AsyncStorage.setItem(AUTH_METHOD_KEY, 'google'),
        AsyncStorage.removeItem(AUTH_TOKEN_KEY),
      ]);

      setAuthToken(response.data.accessToken);
      setUser(response.data.user);
      setAuthMethod('google');
    } catch (error) {
      console.error('Google Sign-In failed:', error);
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
      console.error('Password reset request failed:', error);
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
      console.error('Password reset failed:', error);
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
        await AsyncStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
      } catch (error) {
        console.error('Failed to update user:', error);
      }
    },
    [user]
  );

  const value: AuthContextValue = {
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
  };

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
