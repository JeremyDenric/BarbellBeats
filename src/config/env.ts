/**
 * Environment variable validation at module load time.
 * Provides a single source of truth for required env vars and
 * fails loudly in production if required vars are missing.
 */

import devLog from '../utils/devLog';

function requireEnv(key: string): string {
  const val = process.env[key];
  if (!val) {
    if (__DEV__) {
      devLog.warn(`[env] ${key} not set — feature disabled`);
      return '';
    }
    throw new Error(`[Config] Required env var ${key} missing in production.`);
  }
  return val;
}

export const ENV = {
  /** API base URL. Throws in production if not set; falls back to localhost in dev. */
  API_URL: (() => {
    const url = process.env.EXPO_PUBLIC_API_URL ?? (__DEV__ ? 'http://localhost:3000/api' : null);
    if (!url) {
      throw new Error('[Config] EXPO_PUBLIC_API_URL is required in production.');
    }
    if (!__DEV__ && !url.startsWith('https://')) {
      throw new Error(`[Config] EXPO_PUBLIC_API_URL must use HTTPS in production. Got: "${url.split('://')[0]}://..."`);
    }
    return url;
  })(),

  /** Spotify PKCE OAuth client ID. */
  SPOTIFY_CLIENT_ID: requireEnv('EXPO_PUBLIC_SPOTIFY_CLIENT_ID'),

  /** Google OAuth Web Client ID. */
  GOOGLE_WEB_CLIENT_ID: requireEnv('EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID'),
};
