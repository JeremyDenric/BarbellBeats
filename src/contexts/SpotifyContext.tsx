/**
 * Spotify Context - Manage Spotify authentication and API access
 * Uses PKCE flow for secure mobile authentication
 * Handles token refresh and persistent storage
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as AuthSession from 'expo-auth-session';
import devLog from '../utils/devLog';
import { getSecureItem, setSecureItem, removeSecureItem } from '../utils/secureStorage';

// ============================================================================
// Types
// ============================================================================

interface SpotifyTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number; // Unix timestamp
}

interface SpotifyUser {
  id: string;
  display_name: string;
  email: string;
  images: { url: string }[];
}

interface SpotifyContextType {
  isConnected: boolean;
  user: SpotifyUser | null;
  accessToken: string | null;
  connectSpotify: () => Promise<void>;
  disconnectSpotify: () => Promise<void>;
  refreshAccessToken: () => Promise<string | null>;
  isLoading: boolean;
  error: string | null;
}

// ============================================================================
// Constants
// ============================================================================

// SecureStore keys must only contain alphanumeric, periods, hyphens, underscores
const STORAGE_KEYS = {
  ACCESS_TOKEN: 'spotify_access_token',
  REFRESH_TOKEN: 'spotify_refresh_token',
  EXPIRES_AT: 'spotify_expires_at',
  USER: 'spotify_user',
};

const TOKEN_REFRESH_SKEW_MS = 5 * 60 * 1000;

// TODO: Replace with your Spotify app credentials
const SPOTIFY_CLIENT_ID = process.env.EXPO_PUBLIC_SPOTIFY_CLIENT_ID || (__DEV__ ? 'YOUR_CLIENT_ID' : '');
const REDIRECT_URI = AuthSession.makeRedirectUri();

const SCOPES = [
  'user-read-email',
  'user-read-private',
  'user-top-read',
  'user-library-read',
  'user-read-recently-played',
  'playlist-read-private',
  'playlist-read-collaborative',
  'playlist-modify-private',
  'streaming',
  'user-read-playback-state',
  'user-modify-playback-state',
].join(' ');

// ============================================================================
// Context
// ============================================================================

const SpotifyContext = createContext<SpotifyContextType | undefined>(undefined);

// ============================================================================
// Provider
// ============================================================================

export function SpotifyProvider({ children }: { children: ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const [user, setUser] = useState<SpotifyUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const appState = useRef<AppStateStatus>(AppState.currentState);
  const lastRefreshCheck = useRef<number>(Date.now());

  const discovery = AuthSession.useAutoDiscovery('https://accounts.spotify.com');

  /**
   * Load saved tokens on mount
   */
  useEffect(() => {
    loadSavedTokens();
  }, []);

  /**
   * Auto-refresh token proactively
   */
  useEffect(() => {
    const checkTokenExpiry = async () => {
      if (!isConnected || !accessToken) return;

      try {
        const expiresAtStr = await getSecureItem(STORAGE_KEYS.EXPIRES_AT);
        if (!expiresAtStr) return;

        const expiresAt = parseInt(expiresAtStr, 10);
        const now = Date.now();

        // Refresh if token expires in less than 10 minutes
        if (expiresAt - now < 10 * 60 * 1000) {
          devLog.log('[SpotifyContext] Token expiring soon, refreshing...');
          await refreshAccessToken();
        }
      } catch (error) {
        devLog.warn('[SpotifyContext] Token expiry check failed:', error);
      }
    };

    // Check immediately on mount if connected
    if (isConnected) {
      checkTokenExpiry();
    }

    // Set up interval to check every 10 minutes
    const refreshInterval = setInterval(() => {
      if (isConnected) {
        checkTokenExpiry();
      }
    }, 10 * 60 * 1000); // 10 minutes

    return () => clearInterval(refreshInterval);
  }, [isConnected, accessToken]);

  /**
   * Listen to app state changes and refresh on foreground
   */
  useEffect(() => {
    const subscription = AppState.addEventListener('change', async (nextAppState) => {
      // App has come to the foreground
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active' &&
        isConnected
      ) {
        // Only check if it's been more than 5 minutes since last check
        const now = Date.now();
        if (now - lastRefreshCheck.current > 5 * 60 * 1000) {
          lastRefreshCheck.current = now;

          try {
            const expiresAtStr = await getSecureItem(STORAGE_KEYS.EXPIRES_AT);
            if (!expiresAtStr) return;

            const expiresAt = parseInt(expiresAtStr, 10);

            // Refresh if token expires in less than 10 minutes
            if (expiresAt - now < 10 * 60 * 1000) {
              devLog.log('[SpotifyContext] Token expiring soon on foreground, refreshing...');
              await refreshAccessToken();
            }
          } catch (error) {
            devLog.warn('[SpotifyContext] Foreground token check failed:', error);
          }
        }
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [isConnected]);

  /**
   * Load tokens from AsyncStorage and check if still valid
   */
  const loadSavedTokens = async () => {
    try {
      setIsLoading(true);
      let savedAccessToken = await getSecureItem(STORAGE_KEYS.ACCESS_TOKEN);
      let savedRefreshToken = await getSecureItem(STORAGE_KEYS.REFRESH_TOKEN);
      let savedExpiresAt = await getSecureItem(STORAGE_KEYS.EXPIRES_AT);

      if (!savedAccessToken && !savedRefreshToken) {
        const [legacyAccess, legacyRefresh, legacyExpires] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN),
          AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN),
          AsyncStorage.getItem(STORAGE_KEYS.EXPIRES_AT),
        ]);
        if (legacyAccess || legacyRefresh || legacyExpires) {
          if (legacyAccess) {
            await setSecureItem(STORAGE_KEYS.ACCESS_TOKEN, legacyAccess);
          }
          if (legacyRefresh) {
            await setSecureItem(STORAGE_KEYS.REFRESH_TOKEN, legacyRefresh);
          }
          if (legacyExpires) {
            await setSecureItem(STORAGE_KEYS.EXPIRES_AT, legacyExpires);
          }
          await Promise.all([
            AsyncStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN),
            AsyncStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN),
            AsyncStorage.removeItem(STORAGE_KEYS.EXPIRES_AT),
          ]);
          savedAccessToken = legacyAccess;
          savedRefreshToken = legacyRefresh;
          savedExpiresAt = legacyExpires;
        }
      }

      const savedUser = await getSecureItem(STORAGE_KEYS.USER);

      if (savedRefreshToken && savedUser) {
        const now = Date.now();
        if (!savedAccessToken || !savedExpiresAt) {
          await refreshAccessTokenInternal(savedRefreshToken);
          setUser(JSON.parse(savedUser));
          return;
        }

        const expiresAt = parseInt(savedExpiresAt, 10);
        if (now + TOKEN_REFRESH_SKEW_MS < expiresAt) {
          setAccessToken(savedAccessToken);
          setUser(JSON.parse(savedUser));
          setIsConnected(true);
          return;
        }

        await refreshAccessTokenInternal(savedRefreshToken);
        setUser(JSON.parse(savedUser));
      }
    } catch (err) {
      devLog.warn('Failed to load Spotify tokens:', err);
      setError('Failed to restore Spotify connection');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Connect to Spotify using PKCE flow
   */
  const connectSpotify = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (!discovery) {
        throw new Error('Discovery document not loaded');
      }

      // Create authorization request (PKCE is handled automatically by AuthRequest)
      const authRequest = new AuthSession.AuthRequest({
        clientId: SPOTIFY_CLIENT_ID,
        scopes: SCOPES.split(' '),
        redirectUri: REDIRECT_URI,
        usePKCE: true,
        codeChallengeMethod: AuthSession.CodeChallengeMethod.S256,
      });

      // Prompt user to authorize
      const result = await authRequest.promptAsync(discovery);

      if (result.type === 'success' && result.params.code) {
        // Exchange code for tokens
        const tokenEndpoint = discovery.tokenEndpoint;
        if (!tokenEndpoint) throw new Error('Token endpoint not available');
        const tokenResponse = await fetch(tokenEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            grant_type: 'authorization_code',
            code: result.params.code,
            redirect_uri: REDIRECT_URI,
            client_id: SPOTIFY_CLIENT_ID,
            code_verifier: authRequest.codeVerifier ?? '',
          }).toString(),
        });

        const tokens = await tokenResponse.json();

        if (tokens.access_token) {
          await saveTokens({
            accessToken: tokens.access_token,
            refreshToken: tokens.refresh_token,
            expiresAt: Date.now() + tokens.expires_in * 1000,
          });

          // Fetch user profile
          await fetchUserProfile(tokens.access_token);
        } else {
          throw new Error('Failed to obtain access token');
        }
      } else if (result.type === 'error') {
        throw new Error(result.params.error_description || 'Authentication failed');
      }
    } catch (err) {
      devLog.warn('Spotify connection error:', err);
      setError(err instanceof Error ? err.message : 'Failed to connect to Spotify');
      setIsConnected(false);
    } finally {
      setIsLoading(false);
    }
  }, [discovery]);

  /**
   * Fetch Spotify user profile
   */
  const fetchUserProfile = async (token: string) => {
    try {
      const response = await fetch('https://api.spotify.com/v1/me', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        // User profile contains email — store in SecureStore, not AsyncStorage.
        await setSecureItem(STORAGE_KEYS.USER, JSON.stringify(userData));
      }
    } catch (err) {
      devLog.warn('Failed to fetch user profile:', err);
    }
  };

  /**
   * Save tokens to AsyncStorage
   */
  const saveTokens = async (tokens: SpotifyTokens) => {
    await Promise.all([
      setSecureItem(STORAGE_KEYS.ACCESS_TOKEN, tokens.accessToken),
      setSecureItem(STORAGE_KEYS.REFRESH_TOKEN, tokens.refreshToken),
      setSecureItem(STORAGE_KEYS.EXPIRES_AT, tokens.expiresAt.toString()),
      AsyncStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN),
      AsyncStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN),
      AsyncStorage.removeItem(STORAGE_KEYS.EXPIRES_AT),
    ]);

    setAccessToken(tokens.accessToken);
    setIsConnected(true);
  };

  /**
   * Refresh access token using refresh token
   */
  const refreshAccessTokenInternal = async (refreshToken: string): Promise<string | null> => {
    try {
      if (!discovery) {
        throw new Error('Discovery document not loaded');
      }

      const tokenEndpoint = discovery.tokenEndpoint;
      if (!tokenEndpoint) throw new Error('Token endpoint not available');
      const response = await fetch(tokenEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
          client_id: SPOTIFY_CLIENT_ID,
        }).toString(),
      });

      const tokens = await response.json();

      if (tokens.access_token) {
        await saveTokens({
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token || refreshToken,
          expiresAt: Date.now() + tokens.expires_in * 1000,
        });

        return tokens.access_token;
      }

      return null;
    } catch (err) {
      devLog.warn('Token refresh error:', err);
      // If refresh fails, disconnect
      await disconnectSpotify();
      return null;
    }
  };

  /**
   * Public method to refresh access token
   */
  const refreshAccessToken = useCallback(async (): Promise<string | null> => {
    const savedRefreshToken = await getSecureItem(STORAGE_KEYS.REFRESH_TOKEN);
    if (!savedRefreshToken) {
      return null;
    }
    return refreshAccessTokenInternal(savedRefreshToken);
  }, []);

  /**
   * Disconnect from Spotify and clear all data
   */
  const disconnectSpotify = useCallback(async () => {
    try {
      await Promise.all([
        removeSecureItem(STORAGE_KEYS.ACCESS_TOKEN),
        removeSecureItem(STORAGE_KEYS.REFRESH_TOKEN),
        removeSecureItem(STORAGE_KEYS.EXPIRES_AT),
        removeSecureItem(STORAGE_KEYS.USER),
        AsyncStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN),
        AsyncStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN),
        AsyncStorage.removeItem(STORAGE_KEYS.EXPIRES_AT),
      ]);

      setAccessToken(null);
      setUser(null);
      setIsConnected(false);
      setError(null);
    } catch (err) {
      devLog.warn('Failed to disconnect Spotify:', err);
    }
  }, []);

  const value = useMemo(
    () => ({
      isConnected,
      user,
      accessToken,
      connectSpotify,
      disconnectSpotify,
      refreshAccessToken,
      isLoading,
      error,
    }),
    [isConnected, user, accessToken, connectSpotify, disconnectSpotify, refreshAccessToken, isLoading, error]
  );

  return (
    <SpotifyContext.Provider value={value}>
      {children}
    </SpotifyContext.Provider>
  );
}

// ============================================================================
// Hook
// ============================================================================

export function useSpotify() {
  const context = useContext(SpotifyContext);
  if (!context) {
    throw new Error('useSpotify must be used within SpotifyProvider');
  }
  return context;
}
