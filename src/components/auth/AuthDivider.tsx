/**
 * AuthDivider Component
 *
 * "OR" divider between authentication methods with:
 * - Line + text + line layout
 * - Glassmorphic styling
 * - Customizable text
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, TYPOGRAPHY, SPACING } from '../../theme/tokens';

export interface AuthDividerProps {
  text?: string;
}

export default function AuthDivider({ text = 'OR' }: AuthDividerProps) {
  return (
    <View style={styles.container}>
      <View style={styles.line} />
      <Text style={styles.text}>{text}</Text>
      <View style={styles.line} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: SPACING.lg,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  text: {
    marginHorizontal: SPACING.base,
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.bold as any,
    color: COLORS.light.textTertiary,
    letterSpacing: 1,
  },
});
