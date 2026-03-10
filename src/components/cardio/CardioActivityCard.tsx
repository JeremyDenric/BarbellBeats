/**
 * CardioActivityCard Component
 * Card for selecting a cardio activity type
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { ActivityType } from '../../../shared/src/types/cardio';
import { Icon, IconName } from '../Icon';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '../../theme/tokens';

export interface CardioActivityCardProps {
  activityType: ActivityType;
  icon: IconName;
  label: string;
  description?: string;
  selected?: boolean;
  onPress: () => void;
  style?: ViewStyle;
}

const ACTIVITY_COLORS: Record<ActivityType, readonly [string, string]> = {
  running: ['#CBFF00', '#4A7A00'],
  cycling: ['#3B82F6', '#1E40AF'],
  walking: ['#DBFF4D', '#84CC16'],
  rowing: ['#8B5CF6', '#6D28D9'],
  elliptical: ['#EC4899', '#BE185D'],
  stairs: ['#F59E0B', '#D97706'],
};

export default function CardioActivityCard({
  activityType,
  icon,
  label,
  description,
  selected = false,
  onPress,
  style,
}: CardioActivityCardProps) {
  const gradientColors = ACTIVITY_COLORS[activityType];

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      style={[styles.container, selected && styles.selectedContainer, style]}
    >
      <LinearGradient
        colors={selected ? gradientColors : [COLORS.light.glass, COLORS.light.glass] as const}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.gradient,
          selected && styles.selectedGradient,
        ]}
        shouldRasterizeIOS
      >
        {/* Icon */}
        <View style={styles.iconContainer}>
          <Icon name={icon} size="xl" color={selected ? '#FFFFFF' : COLORS.light.textPrimary} />
        </View>

        {/* Label */}
        <Text style={[styles.label, selected && styles.selectedLabel]}>
          {label}
        </Text>

        {/* Description */}
        {description && (
          <Text style={[styles.description, selected && styles.selectedDescription]}>
            {description}
          </Text>
        )}

        {/* Selection Indicator */}
        {selected && (
          <View style={styles.checkmark}>
            <Icon name="check" size="sm" color="#FFFFFF" variant="bold" />
          </View>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minWidth: 150,
    aspectRatio: 1,
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    ...SHADOWS.md,
  },
  selectedContainer: {
    ...SHADOWS.lg,
  },
  gradient: {
    flex: 1,
    padding: SPACING.base,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.light.glassBorder,
    borderRadius: RADIUS.xl,
  },
  selectedGradient: {
    borderColor: 'transparent',
  },
  iconContainer: {
    marginBottom: SPACING.sm,
  },
  label: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.light.textPrimary,
    textAlign: 'center',
    letterSpacing: 0.5,
    marginBottom: SPACING.xs,
  },
  selectedLabel: {
    color: '#FFFFFF',
    fontWeight: TYPOGRAPHY.weights.black,
  },
  description: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: COLORS.light.textTertiary,
    textAlign: 'center',
  },
  selectedDescription: {
    color: 'rgba(255, 255, 255, 0.9)',
  },
  checkmark: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
