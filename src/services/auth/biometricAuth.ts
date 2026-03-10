/**
 * Biometric Authentication Service
 *
 * Handles Face ID and Touch ID authentication for BarbellBeats.
 * Provides methods to check availability, authenticate users, and manage preferences.
 */

import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';
import devLog from '../../utils/devLog';
import { getSecureItem, setSecureItem, removeSecureItem } from '../../utils/secureStorage';

// Storage keys
const BIOMETRIC_CONFIG_KEY = '@biometric_config';
const BIOMETRIC_ENABLED_KEY = '@biometric_enabled';
const BIOMETRIC_EMAIL_KEY = '@biometric_email';

export interface BiometricConfig {
  enabled: boolean;
  type: 'faceId' | 'touchId' | 'none';
  lastUsed?: string;
}

class BiometricAuthService {
  /**
   * Check if biometric authentication is available on this device
   */
  async isAvailable(): Promise<boolean> {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      return hasHardware && isEnrolled;
    } catch (error) {
      devLog.error('[BiometricAuth] Error checking availability:', error);
      return false;
    }
  }

  /**
   * Check if device has biometric hardware
   */
  async hasHardware(): Promise<boolean> {
    try {
      return await LocalAuthentication.hasHardwareAsync();
    } catch (error) {
      devLog.error('[BiometricAuth] Error checking hardware:', error);
      return false;
    }
  }

  /**
   * Check if user has enrolled biometric records
   */
  async isEnrolled(): Promise<boolean> {
    try {
      return await LocalAuthentication.isEnrolledAsync();
    } catch (error) {
      devLog.error('[BiometricAuth] Error checking enrollment:', error);
      return false;
    }
  }

  /**
   * Get the type of biometric authentication available
   * @returns 'faceId', 'touchId', or 'none'
   */
  async getBiometricType(): Promise<'faceId' | 'touchId' | 'none'> {
    try {
      const types = await LocalAuthentication.supportedAuthenticationTypesAsync();

      if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
        return 'faceId';
      }

      if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
        return 'touchId';
      }

      return 'none';
    } catch (error) {
      devLog.error('[BiometricAuth] Error getting biometric type:', error);
      return 'none';
    }
  }

  /**
   * Authenticate the user with biometrics
   * @param promptMessage - Optional custom message to show to the user
   * @returns true if authentication successful, false otherwise
   */
  async authenticate(promptMessage?: string): Promise<boolean> {
    try {
      const isAvailable = await this.isAvailable();

      if (!isAvailable) {
        devLog.warn('[BiometricAuth] Biometric authentication not available');
        return false;
      }

      const biometricType = await this.getBiometricType();
      const defaultMessage = biometricType === 'faceId'
        ? 'Use Face ID to sign in'
        : 'Use Touch ID to sign in';

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: promptMessage || defaultMessage,
        cancelLabel: 'Cancel',
        fallbackLabel: 'Use Password',
        disableDeviceFallback: false,
      });

      if (result.success) {
        // Update last used timestamp
        await this.updateLastUsed();
        return true;
      }

      const failedResult = result as { success: false; error: string };
      devLog.warn('[BiometricAuth] Authentication failed:', failedResult.error);
      return false;
    } catch (error) {
      devLog.error('[BiometricAuth] Error during authentication:', error);
      return false;
    }
  }

  /**
   * Enable or disable biometric authentication for the user
   * @param enabled - Whether to enable biometric auth
   */
  async setBiometricEnabled(enabled: boolean): Promise<void> {
    try {
      await setSecureItem(BIOMETRIC_ENABLED_KEY, enabled ? '1' : '0');

      // Update config
      const config = await this.getBiometricConfig();
      config.enabled = enabled;
      await AsyncStorage.setItem(BIOMETRIC_CONFIG_KEY, JSON.stringify(config));
    } catch (error) {
      devLog.error('[BiometricAuth] Error setting biometric enabled:', error);
      throw error;
    }
  }

  /**
   * Check if biometric authentication is enabled for the current user
   */
  async isBiometricEnabled(): Promise<boolean> {
    try {
      const enabled = await getSecureItem(BIOMETRIC_ENABLED_KEY);
      return enabled === '1';
    } catch (error) {
      devLog.error('[BiometricAuth] Error checking if enabled:', error);
      return false;
    }
  }

  /**
   * Store the email associated with biometric login
   * @param email - User's email address
   */
  async setBiometricEmail(email: string): Promise<void> {
    try {
      await setSecureItem(BIOMETRIC_EMAIL_KEY, email);
    } catch (error) {
      devLog.error('[BiometricAuth] Error setting biometric email:', error);
      throw error;
    }
  }

  /**
   * Get the email associated with biometric login
   */
  async getBiometricEmail(): Promise<string | null> {
    try {
      return await getSecureItem(BIOMETRIC_EMAIL_KEY);
    } catch (error) {
      devLog.error('[BiometricAuth] Error getting biometric email:', error);
      return null;
    }
  }

  /**
   * Get the full biometric configuration
   */
  async getBiometricConfig(): Promise<BiometricConfig> {
    try {
      const stored = await AsyncStorage.getItem(BIOMETRIC_CONFIG_KEY);

      if (stored) {
        return JSON.parse(stored);
      }

      // Default config
      const type = await this.getBiometricType();
      const defaultConfig: BiometricConfig = {
        enabled: false,
        type,
        lastUsed: undefined,
      };

      await AsyncStorage.setItem(BIOMETRIC_CONFIG_KEY, JSON.stringify(defaultConfig));
      return defaultConfig;
    } catch (error) {
      devLog.error('[BiometricAuth] Error getting config:', error);
      return {
        enabled: false,
        type: 'none',
        lastUsed: undefined,
      };
    }
  }

  /**
   * Update the last used timestamp
   */
  private async updateLastUsed(): Promise<void> {
    try {
      const config = await this.getBiometricConfig();
      config.lastUsed = new Date().toISOString();
      await AsyncStorage.setItem(BIOMETRIC_CONFIG_KEY, JSON.stringify(config));
    } catch (error) {
      devLog.error('[BiometricAuth] Error updating last used:', error);
    }
  }

  /**
   * Clear all biometric authentication data
   */
  async clearBiometricData(): Promise<void> {
    try {
      await Promise.all([
        AsyncStorage.removeItem(BIOMETRIC_CONFIG_KEY),
        removeSecureItem(BIOMETRIC_ENABLED_KEY),
        removeSecureItem(BIOMETRIC_EMAIL_KEY),
      ]);
    } catch (error) {
      devLog.error('[BiometricAuth] Error clearing biometric data:', error);
      throw error;
    }
  }

  /**
   * Get a user-friendly error message based on the error type
   */
  getErrorMessage(error: string): string {
    const errorMessages: Record<string, string> = {
      'user_cancel': 'Authentication was canceled',
      'system_cancel': 'Authentication was canceled by the system',
      'not_available': 'Biometric authentication is not available on this device',
      'not_enrolled': 'No biometric records are enrolled. Please set up Face ID or Touch ID in Settings.',
      'lockout': 'Too many failed attempts. Please try again later.',
      'permanent_lockout': 'Biometric authentication is locked. Please unlock your device.',
    };

    return errorMessages[error] || 'Biometric authentication failed. Please try again.';
  }
}

// Export singleton instance
export default new BiometricAuthService();
