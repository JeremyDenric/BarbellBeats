/**
 * CardioMetricCard Component
 * Displays a single cardio metric in a glassmorphic card
 */

import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '../../theme/tokens';

export interface CardioMetricCardProps {
  label: string;
  value: string | number;
  unit?: string;
  icon?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  size?: 'small' | 'medium' | 'large';
  style?: ViewStyle;
}

export default function CardioMetricCard({
  label,
  value,
  unit,
  icon,
  trend,
  trendValue,
  size = 'medium',
  style,
}: CardioMetricCardProps) {
  const containerStyle = [
    styles.container,
    size === 'small' && styles.containerSmall,
    size === 'large' && styles.containerLarge,
    style,
  ];

  const valueStyle = [
    styles.value,
    size === 'small' && styles.valueSmall,
    size === 'large' && styles.valueLarge,
  ];

  const getTrendColor = () => {
    if (!trend || trend === 'neutral') return COLORS.light.textSecondary;
    // For cardio: down arrow (faster pace) is good for pace, up arrow (more distance) is good for distance
    return trend === 'up' ? COLORS.light.success : COLORS.light.warning;
  };

  const getTrendIcon = () => {
    if (!trend || trend === 'neutral') return '→';
    return trend === 'up' ? '↑' : '↓';
  };

  return (
    <View style={containerStyle}>
      {/* Icon and Label Row */}
      <View style={styles.header}>
        {icon && <Text style={styles.icon}>{icon}</Text>}
        <Text style={styles.label}>{label}</Text>
      </View>

      {/* Value Row */}
      <View style={styles.valueRow}>
        <Text style={valueStyle}>{value}</Text>
        {unit && <Text style={styles.unit}>{unit}</Text>}
      </View>

      {/* Trend Row */}
      {trend && trendValue && (
        <View style={styles.trendRow}>
          <Text style={[styles.trendIcon, { color: getTrendColor() }]}>
            {getTrendIcon()}
          </Text>
          <Text style={[styles.trendValue, { color: getTrendColor() }]}>
            {trendValue}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.light.glass,
    borderWidth: 1,
    borderColor: COLORS.light.glassBorder,
    borderRadius: RADIUS.lg,
    padding: SPACING.base,
    minWidth: 120,
    ...SHADOWS.glass,
  },
  containerSmall: {
    padding: SPACING.sm,
    minWidth: 90,
  },
  containerLarge: {
    padding: SPACING.lg,
    minWidth: 150,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  icon: {
    fontSize: 16,
    marginRight: SPACING.xs,
  },
  label: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.light.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: SPACING.xs,
  },
  value: {
    fontSize: 32,
    fontWeight: TYPOGRAPHY.weights.black,
    color: COLORS.light.textPrimary,
    letterSpacing: -0.5,
  },
  valueSmall: {
    fontSize: 24,
  },
  valueLarge: {
    fontSize: 48,
  },
  unit: {
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: COLORS.light.textTertiary,
    marginLeft: SPACING.xs,
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trendIcon: {
    fontSize: 14,
    fontWeight: TYPOGRAPHY.weights.bold,
    marginRight: 4,
  },
  trendValue: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
});
