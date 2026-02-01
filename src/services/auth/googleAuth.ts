/**
 * Google Sign-In Authentication Service
 *
 * Handles Google Sign-In authentication for BarbellBeats.
 * Provides methods to configure, initiate sign-in flow, and manage tokens.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// Lazy import to avoid crash when native module is unavailable (e.g., Expo Go)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let GoogleSignin: any = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let statusCodes: any = null;
let nativeModuleAvailable = false;

try {
  const googleSigninModule = require('@react-native-google-signin/google-signin');
  GoogleSignin = googleSigninModule.GoogleSignin;
  statusCodes = googleSigninModule.statusCodes;
  nativeModuleAvailable = true;
} catch (error) {
  console.warn('[GoogleAuth] Native module not available. Google Sign-In will not work in Expo Go. Use a development build instead.');
}

// Storage keys
const GOOGLE_USER_ID_KEY = '@google_user_id';

// Note: Replace with your actual Google Web Client ID from Google Cloud Console
// This should be configured via environment variables in production
const GOOGLE_WEB_CLIENT_ID = process.env.GOOGLE_WEB_CLIENT_ID || 'YOUR_WEB_CLIENT_ID_HERE';

export interface GoogleAuthResult {
  idToken: string;
  serverAuthCode?: string | null;
  user: {
    email: string;
    id: string;
    givenName?: string | null;
    familyName?: string | null;
    photo?: string | null;
    name: string;
  };
}

class GoogleAuthService {
  private configured = false;

  /**
   * Check if Google Sign-In native module is available
   */
  isAvailable(): boolean {
    return nativeModuleAvailable && GoogleSignin !== null;
  }

  /**
   * Configure Google Sign-In
   * Must be called before any other methods
   */
  async configure(): Promise<void> {
    if (!this.isAvailable()) {
      throw new Error('Google Sign-In is not available. Please use a development build instead of Expo Go.');
    }

    try {
      if (this.configured) {
        return;
      }

      GoogleSignin.configure({
        webClientId: GOOGLE_WEB_CLIENT_ID,
        offlineAccess: true,  // Request server auth code for backend
        forceCodeForRefreshToken: true,  // Ensure we get auth code
      });

      this.configured = true;
    } catch (error) {
      console.error('[GoogleAuth] Configuration error:', error);
      throw new Error('Failed to configure Google Sign-In');
    }
  }

  /**
   * Check if Google Play Services are available (Android)
   * Always returns true on iOS
   */
  async hasPlayServices(): Promise<boolean> {
    if (!this.isAvailable()) {
      return false;
    }

    try {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      return true;
    } catch (error) {
      console.error('[GoogleAuth] Play Services error:', error);
      return false;
    }
  }

  /**
   * Initiate Google Sign-In flow
   * @returns GoogleAuthResult with ID token and user info
   * @throws Error if sign-in fails or is canceled
   */
  async signIn(): Promise<GoogleAuthResult> {
    try {
      // Ensure configured
      await this.configure();

      // Check Play Services on Android
      const hasServices = await this.hasPlayServices();
      if (!hasServices) {
        throw new Error('Google Play Services not available');
      }

      // Sign in
      await GoogleSignin.signIn();

      // Get tokens and user info
      const tokens = await GoogleSignin.getTokens();
      const userInfo = GoogleSignin.getCurrentUser();

      if (!userInfo || !tokens.idToken) {
        throw new Error('Failed to get user information');
      }

      // Store Google user ID
      await this.storeGoogleUserId(userInfo.user.id);

      const result: GoogleAuthResult = {
        idToken: tokens.idToken,
        serverAuthCode: userInfo.serverAuthCode,
        user: {
          email: userInfo.user.email,
          id: userInfo.user.id,
          givenName: userInfo.user.givenName,
          familyName: userInfo.user.familyName,
          photo: userInfo.user.photo,
          name: userInfo.user.name || userInfo.user.email,
        },
      };

      return result;
    } catch (error: any) {
      // Handle specific Google Sign-In errors
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        throw new Error('google_signin_canceled');
      }

      if (error.code === statusCodes.IN_PROGRESS) {
        throw new Error('Google Sign-In already in progress');
      }

      if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        throw new Error('Google Play Services not available');
      }

      console.error('[GoogleAuth] Sign-in error:', error);
      throw new Error('Google Sign-In failed. Please try again.');
    }
  }

  /**
   * Check if user is currently signed in
   */
  async isSignedIn(): Promise<boolean> {
    if (!this.isAvailable()) {
      return false;
    }

    try {
      await this.configure();
      return await GoogleSignin.isSignedIn();
    } catch (error) {
      console.error('[GoogleAuth] Error checking sign-in status:', error);
      return false;
    }
  }

  /**
   * Get the current signed-in user
   */
  async getCurrentUser(): Promise<GoogleAuthResult | null> {
    if (!this.isAvailable()) {
      return null;
    }

    try {
      await this.configure();

      const userInfo = GoogleSignin.getCurrentUser();
      if (!userInfo) {
        return null;
      }

      const tokens = await GoogleSignin.getTokens();

      return {
        idToken: tokens.idToken,
        serverAuthCode: userInfo.serverAuthCode,
        user: {
          email: userInfo.user.email,
          id: userInfo.user.id,
          givenName: userInfo.user.givenName,
          familyName: userInfo.user.familyName,
          photo: userInfo.user.photo,
          name: userInfo.user.name || userInfo.user.email,
        },
      };
    } catch (error) {
      console.error('[GoogleAuth] Error getting current user:', error);
      return null;
    }
  }

  /**
   * Sign out from Google
   */
  async signOut(): Promise<void> {
    if (!this.isAvailable()) {
      return;
    }

    try {
      await this.configure();
      await GoogleSignin.signOut();
      await AsyncStorage.removeItem(GOOGLE_USER_ID_KEY);
    } catch (error) {
      console.error('[GoogleAuth] Error signing out:', error);
      throw error;
    }
  }

  /**
   * Revoke Google access (complete sign-out)
   */
  async revokeAccess(): Promise<void> {
    if (!this.isAvailable()) {
      return;
    }

    try {
      await this.configure();
      await GoogleSignin.revokeAccess();
      await AsyncStorage.removeItem(GOOGLE_USER_ID_KEY);
    } catch (error) {
      console.error('[GoogleAuth] Error revoking access:', error);
      throw error;
    }
  }

  /**
   * Store the Google user ID
   */
  private async storeGoogleUserId(userId: string): Promise<void> {
    try {
      await AsyncStorage.setItem(GOOGLE_USER_ID_KEY, userId);
    } catch (error) {
      console.error('[GoogleAuth] Error storing Google user ID:', error);
    }
  }

  /**
   * Get the stored Google user ID
   */
  async getGoogleUserId(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(GOOGLE_USER_ID_KEY);
    } catch (error) {
      console.error('[GoogleAuth] Error getting Google user ID:', error);
      return null;
    }
  }

  /**
   * Get a user-friendly error message
   */
  getErrorMessage(error: string): string {
    const errorMessages: Record<string, string> = {
      'google_signin_canceled': 'Google Sign-In was canceled',
      'play_services_not_available': 'Google Play Services not available. Please update.',
      'network_error': 'Network error. Please check your connection.',
      'in_progress': 'Sign-in already in progress',
      'unknown': 'Google Sign-In failed. Please try again.',
    };

    return errorMessages[error] || 'Google Sign-In failed. Please try again.';
  }

  /**
   * Get user display name from Google auth result
   */
  getDisplayName(user: GoogleAuthResult['user']): string {
    if (user.name) {
      return user.name;
    }

    const parts = [user.givenName, user.familyName].filter(Boolean);
    return parts.length > 0 ? parts.join(' ') : user.email;
  }
}

// Export singleton instance
export default new GoogleAuthService();
