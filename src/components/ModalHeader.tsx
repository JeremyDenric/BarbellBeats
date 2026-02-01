import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useThemeMode } from '../contexts/ThemeContext';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS } from '../theme/tokens';

interface ModalHeaderProps {
  title: string;
  subtitle?: string;
  onClose?: () => void;
}

export default function ModalHeader({ title, subtitle, onClose }: ModalHeaderProps) {
  const { isDark } = useThemeMode();
  const colors = isDark ? COLORS.dark : COLORS.light;

  return (
    <View style={styles.container}>
      <View style={styles.textBlock}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>
        {subtitle ? (
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{subtitle}</Text>
        ) : null}
        <View style={[styles.accent, { backgroundColor: colors.primary }]} />
      </View>
      {onClose ? (
        <Pressable
          onPress={onClose}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel="Close"
          style={({ pressed }) => [
            styles.closeButton,
            { backgroundColor: colors.surfaceAlt },
            pressed && { opacity: 0.7 },
          ]}
        >
          <Text style={[styles.closeIcon, { color: colors.textPrimary }]}>✕</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  textBlock: {
    flex: 1,
    marginRight: SPACING.md,
  },
  title: {
    ...TYPOGRAPHY.presets.heading2,
    marginBottom: 4,
  },
  subtitle: {
    ...TYPOGRAPHY.presets.body,
    marginBottom: SPACING.sm,
  },
  accent: {
    width: 56,
    height: 3,
    borderRadius: 999,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeIcon: {
    fontSize: 20,
  },
});
