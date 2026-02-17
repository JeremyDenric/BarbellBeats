/**
 * LoadingOverlay Component
 *
 * Full-screen loading overlay for auth operations with:
 * - Glassmorphic background with BlurView
 * - ActivityIndicator
 * - Dynamic loading message
 * - Prevents user interaction during async operations
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Modal,
  Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '../../theme/tokens';

export interface LoadingOverlayProps {
  visible: boolean;
  message?: string;
}

export default function LoadingOverlay({
  visible,
  message = 'Loading...',
}: LoadingOverlayProps) {
  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      statusBarTranslucent
    >
      <BlurView intensity={30} style={styles.container} tint="dark">
        <View style={styles.content}>
          <View style={styles.card}>
            <ActivityIndicator size="large" color={COLORS.light.primary} />
            <Text style={styles.message}>{message}</Text>
          </View>
        </View>
      </BlurView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  content: {
    width: '80%',
    maxWidth: 300,
  },
  card: {
    backgroundColor: 'rgba(9, 14, 10, 0.88)',
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    padding: SPACING['2xl'],
    alignItems: 'center',
  },
  message: {
    marginTop: SPACING.base,
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.light.textPrimary,
    textAlign: 'center',
  },
});
