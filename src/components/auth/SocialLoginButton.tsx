/**
 * SocialLoginButton Component
 *
 * Reusable social login button with:
 * - Provider-specific styling
 * - Loading state with ActivityIndicator
 * - Glassmorphic background
 * - Haptic feedback
 */

import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  Platform,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '../../theme/tokens';

export interface SocialLoginButtonProps {
  provider: 'apple' | 'google' | 'spotify';
  icon: string;
  label: string;
  onPress: () => void | Promise<void>;
  loading?: boolean;
  disabled?: boolean;
  backgroundColor?: string;
  textColor?: string;
  borderColor?: string;
}

export default function SocialLoginButton({
  provider,
  icon,
  label,
  onPress,
  loading = false,
  disabled = false,
  backgroundColor = 'rgba(255, 255, 255, 0.05)',
  textColor = COLORS.light.textPrimary,
  borderColor = 'rgba(255, 255, 255, 0.1)',
}: SocialLoginButtonProps) {
  const handlePress = async () => {
    if (loading || disabled) return;

    // Haptic feedback
    if (Platform.OS === 'ios') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    await onPress();
  };

  return (
    <TouchableOpacity
      style={[
        styles.button,
        { backgroundColor, borderColor },
        disabled && styles.buttonDisabled,
      ]}
      onPress={handlePress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      accessibilityLabel={`${label}`}
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading }}
    >
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={textColor} />
          <Text style={[styles.label, { color: textColor }]}>Connecting...</Text>
        </View>
      ) : (
        <>
          <Text style={styles.icon}>{icon}</Text>
          <Text style={[styles.label, { color: textColor }]}>{label}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.base,
    paddingHorizontal: SPACING.lg,
    borderWidth: 1,
    marginBottom: SPACING.md,
    ...SHADOWS.sm,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  icon: {
    fontSize: 20,
    marginRight: SPACING.md,
  },
  label: {
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.semibold as any,
    letterSpacing: 0.3,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
});
