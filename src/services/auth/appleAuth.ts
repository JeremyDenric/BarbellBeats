/**
 * Apple Sign-In Authentication Service
 *
 * Handles Apple Sign-In authentication for BarbellBeats.
 * Provides methods to check availability, initiate sign-in flow, and exchange tokens.
 */

import * as AppleAuthentication from 'expo-apple-authentication';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage keys
const APPLE_USER_ID_KEY = '@apple_user_id';

export interface AppleAuthResult {
  identityToken: string;
  authorizationCode: string;
  email?: string | null;
  fullName?: {
    givenName?: string | null;
    familyName?: string | null;
  } | null;
  user: string;  // Apple user ID
}

class AppleAuthService {
  /**
   * Check if Apple Sign-In is available on this device
   * Requires iOS 13+ and proper configuration
   */
  async isAvailable(): Promise<boolean> {
    try {
      if (Platform.OS !== 'ios') {
        return false;
      }

      const available = await AppleAuthentication.isAvailableAsync();
      return available;
    } catch (error) {
      console.error('[AppleAuth] Error checking availability:', error);
      return false;
    }
  }

  /**
   * Initiate Apple Sign-In flow
   * @returns AppleAuthResult with identity token and user info
   * @throws Error if sign-in fails or is canceled
   */
  async signIn(): Promise<AppleAuthResult> {
    try {
      const isAvailable = await this.isAvailable();

      if (!isAvailable) {
        throw new Error('Apple Sign-In is not available on this device');
      }

      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      // Apple only provides email and name on first sign-in
      // Store user ID for future reference
      await this.storeAppleUserId(credential.user);

      const result: AppleAuthResult = {
        identityToken: credential.identityToken || '',
        authorizationCode: credential.authorizationCode || '',
        email: credential.email,
        fullName: credential.fullName ? {
          givenName: credential.fullName.givenName,
          familyName: credential.fullName.familyName,
        } : null,
        user: credential.user,
      };

      return result;
    } catch (error: any) {
      // Handle specific Apple authentication errors
      if (error.code === 'ERR_CANCELED') {
        throw new Error('apple_signin_canceled');
      }

      console.error('[AppleAuth] Sign-in error:', error);
      throw new Error('Apple Sign-In failed. Please try again.');
    }
  }

  /**
   * Get credential state for a specific user
   * Useful for checking if user is still authenticated
   */
  async getCredentialState(userId: string): Promise<AppleAuthentication.AppleAuthenticationCredentialState> {
    try {
      const state = await AppleAuthentication.getCredentialStateAsync(userId);
      return state;
    } catch (error) {
      console.error('[AppleAuth] Error getting credential state:', error);
      return AppleAuthentication.AppleAuthenticationCredentialState.NOT_FOUND;
    }
  }

  /**
   * Check if the stored Apple user is still authenticated
   */
  async isUserAuthenticated(): Promise<boolean> {
    try {
      const userId = await this.getAppleUserId();

      if (!userId) {
        return false;
      }

      const state = await this.getCredentialState(userId);
      return state === AppleAuthentication.AppleAuthenticationCredentialState.AUTHORIZED;
    } catch (error) {
      console.error('[AppleAuth] Error checking authentication:', error);
      return false;
    }
  }

  /**
   * Store the Apple user ID
   */
  private async storeAppleUserId(userId: string): Promise<void> {
    try {
      await AsyncStorage.setItem(APPLE_USER_ID_KEY, userId);
    } catch (error) {
      console.error('[AppleAuth] Error storing Apple user ID:', error);
    }
  }

  /**
   * Get the stored Apple user ID
   */
  async getAppleUserId(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(APPLE_USER_ID_KEY);
    } catch (error) {
      console.error('[AppleAuth] Error getting Apple user ID:', error);
      return null;
    }
  }

  /**
   * Sign out and clear stored Apple user data
   */
  async signOut(): Promise<void> {
    try {
      await AsyncStorage.removeItem(APPLE_USER_ID_KEY);
    } catch (error) {
      console.error('[AppleAuth] Error signing out:', error);
      throw error;
    }
  }

  /**
   * Get a user-friendly error message
   */
  getErrorMessage(error: string): string {
    const errorMessages: Record<string, string> = {
      'apple_signin_canceled': 'Apple Sign-In was canceled',
      'not_available': 'Apple Sign-In is not available on this device',
      'network_error': 'Network error. Please check your connection.',
      'unknown': 'Apple Sign-In failed. Please try again.',
    };

    return errorMessages[error] || 'Apple Sign-In failed. Please try again.';
  }

  /**
   * Get user display name from Apple auth result
   * Combines given name and family name
   */
  getDisplayName(fullName?: { givenName?: string | null; familyName?: string | null } | null): string | undefined {
    if (!fullName) {
      return undefined;
    }

    const parts = [fullName.givenName, fullName.familyName].filter(Boolean);
    return parts.length > 0 ? parts.join(' ') : undefined;
  }
}

// Export singleton instance
export default new AppleAuthService();
