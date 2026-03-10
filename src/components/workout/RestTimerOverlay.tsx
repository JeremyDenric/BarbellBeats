/**
 * RestTimerOverlay
 * Full-screen countdown overlay between sets
 */

import React from 'react';
import { View, Text, Modal, StyleSheet, Pressable } from 'react-native';
import { BlurView } from 'expo-blur';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY, FONTS } from '../../theme/tokens';
import { useThemeMode } from '../../contexts/ThemeContext';
import haptics from '../../utils/haptics';

interface RestTimerOverlayProps {
  visible: boolean;
  seconds: number;
  nextSetPreview?: string;
  onSkip: () => void;
}

function padZero(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

export function RestTimerOverlay({ visible, seconds, nextSetPreview, onSkip }: RestTimerOverlayProps) {
  const { isDark } = useThemeMode();
  const colors = isDark ? COLORS.dark : COLORS.light;

  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const display = minutes > 0 ? `${minutes}:${padZero(secs)}` : `${secs}`;

  const handleSkip = () => {
    haptics.mediumTap();
    onSkip();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.backdrop}>
        <BlurView intensity={40} tint="dark" style={styles.blur}>
          <View style={styles.content}>
            <Text style={[styles.label, { color: colors.textTertiary }]}>REST</Text>
            <Text style={[styles.countdown, { color: colors.primary }]}>{display}</Text>
            {nextSetPreview && (
              <Text style={[styles.preview, { color: colors.textSecondary }]}>
                Next: {nextSetPreview}
              </Text>
            )}
            <Pressable
              onPress={handleSkip}
              style={[styles.skipButton, { borderColor: colors.borderStrong }]}
              accessibilityRole="button"
              accessibilityLabel="Skip rest"
            >
              <Text style={[styles.skipText, { color: colors.textPrimary }]}>Skip Rest</Text>
            </Pressable>
          </View>
        </BlurView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  blur: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    padding: SPACING['3xl'],
  },
  label: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.bold,
    letterSpacing: 4,
    marginBottom: SPACING.md,
  },
  countdown: {
    fontFamily: FONTS.mono,
    fontSize: 96,
    fontWeight: TYPOGRAPHY.weights.black,
    fontVariant: ['tabular-nums'],
    marginBottom: SPACING.lg,
  },
  preview: {
    ...TYPOGRAPHY.presets.body,
    marginBottom: SPACING['2xl'],
    textAlign: 'center',
  },
  skipButton: {
    borderWidth: 2,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING['2xl'],
    paddingVertical: SPACING.md,
  },
  skipText: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
});

export default RestTimerOverlay;
