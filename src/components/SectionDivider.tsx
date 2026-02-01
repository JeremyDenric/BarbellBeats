import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle, TextStyle } from 'react-native';
import { useThemeMode } from '../contexts/ThemeContext';
import { COLORS, SPACING, TYPOGRAPHY } from '../theme/tokens';

interface SectionDividerProps {
  label?: string;
  style?: StyleProp<ViewStyle>;
  labelStyle?: StyleProp<TextStyle>;
}

export default function SectionDivider({ label, style, labelStyle }: SectionDividerProps) {
  const { isDark } = useThemeMode();
  const colors = isDark ? COLORS.dark : COLORS.light;

  return (
    <View style={[styles.container, style]}>
      <View style={[styles.line, { backgroundColor: colors.divider }]} />
      {label ? (
        <Text style={[styles.label, { color: colors.textTertiary }, labelStyle]}>
          {label}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: SPACING.md,
    alignItems: 'flex-start',
  },
  line: {
    height: 1,
    width: '100%',
    marginBottom: SPACING.xs,
  },
  label: {
    ...TYPOGRAPHY.presets.caption,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
});
