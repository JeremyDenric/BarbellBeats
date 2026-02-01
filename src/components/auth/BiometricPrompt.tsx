/**
 * BiometricPrompt Component
 *
 * Biometric authentication prompt with:
 * - Detect available biometric type (Face ID/Touch ID)
 * - Show appropriate icon and messaging
 * - Handle failures gracefully
 * - Fallback to password
 * - Store preference in AsyncStorage
 * - Glassmorphic design
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useAuth } from '../../contexts/AuthContext';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '../../theme/tokens';

export interface BiometricPromptProps {
  onSuccess?: () => void;
  onFallback?: () => void;
  onError?: (error: Error) => void;
}

export default function BiometricPrompt({
  onSuccess,
  onFallback,
  onError,
}: BiometricPromptProps) {
  const { biometricAvailable, biometricEnabled, loginWithBiometric } = useAuth();
  const [biometricType, setBiometricType] = useState<'faceId' | 'touchId' | 'none'>('none');
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  useEffect(() => {
    detectBiometricType();
  }, []);

  /**
   * Detect the type of biometric authentication available
   */
  const detectBiometricType = async () => {
    try {
      const { biometricAuth } = await import('../../services/auth');
      const type = await biometricAuth.getBiometricType();
      setBiometricType(type);
    } catch (error) {
      console.error('Failed to detect biometric type:', error);
      setBiometricType('none');
    }
  };

  /**
   * Handle biometric authentication
   */
  const handleBiometricAuth = async () => {
    if (!biometricAvailable || !biometricEnabled) {
      return;
    }

    try {
      setIsAuthenticating(true);

      // Haptic feedback
      if (Platform.OS === 'ios') {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }

      await loginWithBiometric();

      // Success haptic
      if (Platform.OS === 'ios') {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      onSuccess?.();
    } catch (error) {
      console.error('Biometric authentication failed:', error);

      // Error haptic
      if (Platform.OS === 'ios') {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }

      onError?.(error as Error);
    } finally {
      setIsAuthenticating(false);
    }
  };

  /**
   * Handle fallback to password
   */
  const handleFallback = async () => {
    if (Platform.OS === 'ios') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onFallback?.();
  };

  // Don't render if biometric auth is not available or not enabled
  if (!biometricAvailable || !biometricEnabled) {
    return null;
  }

  const biometricIcon = biometricType === 'faceId' ? '👤' : '👆';
  const biometricText = biometricType === 'faceId' ? 'Use Face ID' : 'Use Touch ID';

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <TouchableOpacity
          style={styles.biometricButton}
          onPress={handleBiometricAuth}
          disabled={isAuthenticating}
          activeOpacity={0.8}
          accessibilityLabel={biometricText}
          accessibilityRole="button"
        >
          <View style={styles.iconContainer}>
            {isAuthenticating ? (
              <ActivityIndicator size="large" color={COLORS.light.primary} />
            ) : (
              <Text style={styles.icon}>{biometricIcon}</Text>
            )}
          </View>

          <Text style={styles.title}>
            {isAuthenticating ? 'Authenticating...' : biometricText}
          </Text>

          <Text style={styles.subtitle}>
            Tap to sign in quickly and securely
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.fallbackButton}
          onPress={handleFallback}
          activeOpacity={0.7}
          accessibilityLabel="Use password instead"
          accessibilityRole="button"
        >
          <Text style={styles.fallbackText}>Use Password Instead</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.lg,
  },
  card: {
    backgroundColor: 'rgba(9, 14, 10, 0.82)',
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: SPACING.xl,
    ...SHADOWS.glass,
  },
  biometricButton: {
    alignItems: 'center',
    paddingVertical: SPACING.lg,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    borderWidth: 2,
    borderColor: COLORS.light.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.base,
  },
  icon: {
    fontSize: 40,
  },
  title: {
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: TYPOGRAPHY.weights.bold as any,
    color: COLORS.light.textPrimary,
    marginBottom: SPACING.xs,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.light.textSecondary,
    textAlign: 'center',
    fontWeight: TYPOGRAPHY.weights.medium as any,
  },
  fallbackButton: {
    marginTop: SPACING.base,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
  },
  fallbackText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.light.accent,
    fontWeight: TYPOGRAPHY.weights.semibold as any,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});
