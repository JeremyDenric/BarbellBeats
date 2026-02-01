import React from 'react';
import {
  Pressable,
  Text,
  ActivityIndicator,
  StyleSheet,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { SPOTIFY_THEME, SPACING, RADIUS, TOUCH_TARGET, TYPOGRAPHY } from '../theme/tokens';

interface SpotifyButtonProps {
  title: string;
  onPress?: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
}

export default function SpotifyButton({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  fullWidth = false,
  style,
}: SpotifyButtonProps) {
  const isDisabled = disabled || loading;
  const variantStyles = getVariantStyles(variant);
  const textColor = getTextColor(variant);

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      style={({ pressed }) => [
        styles.button,
        variantStyles,
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
        pressed && styles.pressed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={textColor} />
      ) : (
        <Text style={[styles.text, { color: textColor }]}>{title}</Text>
      )}
    </Pressable>
  );
}

function getVariantStyles(variant: SpotifyButtonProps['variant']) {
  switch (variant) {
    case 'secondary':
      return {
        backgroundColor: SPOTIFY_THEME.surfaceAlt,
        borderColor: SPOTIFY_THEME.border,
      };
    case 'outline':
      return {
        backgroundColor: 'transparent',
        borderColor: SPOTIFY_THEME.accent,
      };
    default:
      return {
        backgroundColor: SPOTIFY_THEME.accent,
        borderColor: SPOTIFY_THEME.accent,
      };
  }
}

function getTextColor(variant: SpotifyButtonProps['variant']) {
  if (variant === 'primary') {
    return SPOTIFY_THEME.background;
  }
  return SPOTIFY_THEME.textPrimary;
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: TOUCH_TARGET.comfortable,
  },
  text: {
    ...TYPOGRAPHY.presets.bodyBold,
    letterSpacing: 0.3,
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.6,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
});
