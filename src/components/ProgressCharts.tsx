/**
 * ProgressCharts
 * Visualize workout progress with volume, strength, and weight charts
 */

import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '../theme/tokens';
import type { Workout, BodyMeasurement } from '../../shared/src/types/workout';

const { width } = Dimensions.get('window');
const CHART_WIDTH = width - SPACING.base * 2;
const CHART_HEIGHT = 200;

// ============================================================================
// Types
// ============================================================================

interface ProgressChartsProps {
  workouts?: Workout[];
  measurements?: BodyMeasurement[];
  exerciseId?: string;
}

interface DataPoint {
  date: string;
  value: number;
  label: string;
}

// ============================================================================
// Component
// ============================================================================

export function ProgressCharts({ workouts = [], measurements = [], exerciseId }: ProgressChartsProps) {
  // ============================================================================
  // Data Processing
  // ============================================================================

  const volumeData = useMemo((): DataPoint[] => {
    if (workouts.length === 0) return [];

    // Group workouts by week
    const weekMap = new Map<string, number>();

    workouts.forEach((workout) => {
      const date = new Date(workout.completedAt || workout.createdAt);
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      const weekKey = weekStart.toISOString().split('T')[0];

      const existing = weekMap.get(weekKey) || 0;
      weekMap.set(weekKey, existing + workout.totalVolume);
    });

    return Array.from(weekMap.entries())
      .map(([date, volume]) => ({
        date,
        value: volume,
        label: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-8); // Last 8 weeks
  }, [workouts]);

  const strengthData = useMemo((): DataPoint[] => {
    if (workouts.length === 0 || !exerciseId) return [];

    // Get max weight per workout for the exercise
    const dataPoints: DataPoint[] = [];

    workouts.forEach((workout) => {
      const exerciseSets = workout.sets.filter((s) => s.exerciseId === exerciseId);
      if (exerciseSets.length === 0) return;

      const maxWeight = Math.max(...exerciseSets.map((s) => s.weight));
      dataPoints.push({
        date: workout.completedAt || workout.createdAt,
        value: maxWeight,
        label: new Date(workout.completedAt || workout.createdAt).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        }),
      });
    });

    return dataPoints.slice(-10); // Last 10 workouts
  }, [workouts, exerciseId]);

  const weightData = useMemo((): DataPoint[] => {
    if (measurements.length === 0) return [];

    return measurements
      .map((m) => ({
        date: m.date,
        value: m.weight,
        label: new Date(m.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-10); // Last 10 measurements
  }, [measurements]);

  // ============================================================================
  // Chart Rendering
  // ============================================================================

  const renderLineChart = (
    data: DataPoint[],
    title: string,
    unit: string,
    color: string = COLORS.light.primary
  ) => {
    if (data.length === 0) {
      return (
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>{title}</Text>
          <View style={styles.emptyChart}>
            <Text style={styles.emptyChartText}>No data available</Text>
          </View>
        </View>
      );
    }

    const maxValue = Math.max(...data.map((d) => d.value));
    const minValue = Math.min(...data.map((d) => d.value));
    const range = maxValue - minValue || 1;

    const chartPadding = 40;
    const chartInnerWidth = CHART_WIDTH - chartPadding * 2;
    const chartInnerHeight = CHART_HEIGHT - 60;
    const pointSpacing = chartInnerWidth / (data.length - 1 || 1);

    // Calculate line path
    const points = data.map((d, index) => {
      const x = chartPadding + index * pointSpacing;
      const normalizedValue = (d.value - minValue) / range;
      const y = chartInnerHeight - normalizedValue * chartInnerHeight + 20;
      return { x, y, value: d.value, label: d.label };
    });

    return (
      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>{title}</Text>

        <View style={[styles.chartContainer, { height: CHART_HEIGHT }]}>
          {/* Grid lines */}
          {[0, 1, 2, 3, 4].map((i) => {
            const y = 20 + (chartInnerHeight / 4) * i;
            const gridValue = maxValue - (range / 4) * i;
            return (
              <View key={i} style={[styles.gridLine, { top: y }]}>
                <View style={styles.gridLineBar} />
                <Text style={styles.gridLineLabel}>
                  {gridValue > 1000 ? `${(gridValue / 1000).toFixed(1)}k` : Math.round(gridValue)}
                </Text>
              </View>
            );
          })}

          {/* Data points and line */}
          <View style={styles.lineContainer}>
            {points.map((point, index) => {
              if (index === 0) return null;
              const prevPoint = points[index - 1];

              return (
                <View
                  key={`line-${index}`}
                  style={[
                    styles.line,
                    {
                      left: prevPoint.x,
                      top: prevPoint.y,
                      width: Math.sqrt(
                        Math.pow(point.x - prevPoint.x, 2) + Math.pow(point.y - prevPoint.y, 2)
                      ),
                      transform: [
                        {
                          rotate: `${Math.atan2(point.y - prevPoint.y, point.x - prevPoint.x)}rad`,
                        },
                      ],
                      backgroundColor: color,
                    },
                  ]}
                />
              );
            })}

            {points.map((point, index) => (
              <View
                key={`point-${index}`}
                style={[
                  styles.dataPoint,
                  {
                    left: point.x - 6,
                    top: point.y - 6,
                    backgroundColor: color,
                    borderColor: color,
                  },
                ]}
              >
                <View style={styles.dataPointInner} />
              </View>
            ))}
          </View>

          {/* X-axis labels */}
          <View style={styles.xAxisLabels}>
            {points.map((point, index) => (
              <Text
                key={`label-${index}`}
                style={[
                  styles.xAxisLabel,
                  {
                    left: point.x - 30,
                  },
                ]}
              >
                {point.label}
              </Text>
            ))}
          </View>
        </View>

        {/* Stats */}
        <View style={styles.chartStats}>
          <View style={styles.chartStat}>
            <Text style={styles.chartStatLabel}>Latest</Text>
            <Text style={styles.chartStatValue}>
              {data[data.length - 1].value.toLocaleString()} {unit}
            </Text>
          </View>
          <View style={styles.chartStat}>
            <Text style={styles.chartStatLabel}>Peak</Text>
            <Text style={styles.chartStatValue}>
              {maxValue.toLocaleString()} {unit}
            </Text>
          </View>
          <View style={styles.chartStat}>
            <Text style={styles.chartStatLabel}>Change</Text>
            <Text
              style={[
                styles.chartStatValue,
                data[data.length - 1].value > data[0].value
                  ? styles.chartStatPositive
                  : styles.chartStatNegative,
              ]}
            >
              {data[data.length - 1].value > data[0].value ? '+' : ''}
              {(data[data.length - 1].value - data[0].value).toFixed(1)} {unit}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const renderBarChart = (data: DataPoint[], title: string, unit: string) => {
    if (data.length === 0) {
      return (
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>{title}</Text>
          <View style={styles.emptyChart}>
            <Text style={styles.emptyChartText}>No data available</Text>
          </View>
        </View>
      );
    }

    const maxValue = Math.max(...data.map((d) => d.value));

    return (
      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>{title}</Text>

        <View style={[styles.chartContainer, { height: CHART_HEIGHT }]}>
          <View style={styles.barsContainer}>
            {data.map((point, index) => {
              const percentage = (point.value / maxValue) * 100;

              return (
                <View key={index} style={styles.barWrapper}>
                  <View style={styles.barContainer}>
                    <LinearGradient
                      colors={[COLORS.light.primary, COLORS.light.accent]}
                      style={[styles.bar, { height: `${percentage}%` }]}
                      shouldRasterizeIOS
                    />
                  </View>
                  <Text style={styles.barLabel}>{point.label}</Text>
                  <Text style={styles.barValue}>
                    {point.value > 1000
                      ? `${(point.value / 1000).toFixed(1)}k`
                      : Math.round(point.value)}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        <View style={styles.chartStats}>
          <View style={styles.chartStat}>
            <Text style={styles.chartStatLabel}>Latest</Text>
            <Text style={styles.chartStatValue}>
              {data[data.length - 1].value.toLocaleString()} {unit}
            </Text>
          </View>
          <View style={styles.chartStat}>
            <Text style={styles.chartStatLabel}>Peak</Text>
            <Text style={styles.chartStatValue}>
              {maxValue.toLocaleString()} {unit}
            </Text>
          </View>
          <View style={styles.chartStat}>
            <Text style={styles.chartStatLabel}>Avg</Text>
            <Text style={styles.chartStatValue}>
              {Math.round(data.reduce((sum, d) => sum + d.value, 0) / data.length).toLocaleString()}{' '}
              {unit}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
      snapToInterval={CHART_WIDTH + SPACING.base}
      decelerationRate="fast"
    >
      {volumeData.length > 0 && renderBarChart(volumeData, 'Weekly Volume', 'lbs')}
      {strengthData.length > 0 && renderLineChart(strengthData, 'Strength Progress', 'lbs')}
      {weightData.length > 0 &&
        renderLineChart(weightData, 'Body Weight', measurements[0]?.unit || 'lbs', '#4CAF50')}
    </ScrollView>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: SPACING.base,
    gap: SPACING.base,
  },
  chartCard: {
    width: CHART_WIDTH,
    backgroundColor: COLORS.light.glass,
    borderWidth: 1,
    borderColor: COLORS.light.glassBorder,
    borderRadius: RADIUS.lg,
    padding: SPACING.base,
    ...SHADOWS.md,
  },
  chartTitle: {
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.black,
    color: COLORS.light.textPrimary,
    marginBottom: SPACING.sm,
  },
  chartContainer: {
    position: 'relative',
    marginBottom: SPACING.base,
  },
  emptyChart: {
    height: CHART_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyChartText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: COLORS.light.textSecondary,
  },
  gridLine: {
    position: 'absolute',
    left: 40,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
  },
  gridLineBar: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  gridLineLabel: {
    position: 'absolute',
    left: -35,
    fontSize: TYPOGRAPHY.sizes.xs,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.light.textTertiary,
  },
  lineContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  line: {
    position: 'absolute',
    height: 3,
    transformOrigin: 'left center',
  },
  dataPoint: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: RADIUS.full,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dataPointInner: {
    width: 6,
    height: 6,
    borderRadius: RADIUS.full,
    backgroundColor: '#FFFFFF',
  },
  xAxisLabels: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 30,
  },
  xAxisLabel: {
    position: 'absolute',
    fontSize: TYPOGRAPHY.sizes.xs,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.light.textTertiary,
    width: 60,
    textAlign: 'center',
  },
  barsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: CHART_HEIGHT - 40,
    gap: 4,
  },
  barWrapper: {
    flex: 1,
    alignItems: 'center',
  },
  barContainer: {
    flex: 1,
    width: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  bar: {
    width: '100%',
    borderRadius: RADIUS.md,
  },
  barLabel: {
    fontSize: TYPOGRAPHY.sizes.xs,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.light.textSecondary,
    marginTop: SPACING.xs,
  },
  barValue: {
    fontSize: TYPOGRAPHY.sizes.xs,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.light.primary,
    marginTop: 2,
  },
  chartStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.light.glassBorder,
  },
  chartStat: {
    alignItems: 'center',
  },
  chartStatLabel: {
    fontSize: TYPOGRAPHY.sizes.xs,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.light.textSecondary,
    marginBottom: 2,
  },
  chartStatValue: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.black,
    color: COLORS.light.textPrimary,
  },
  chartStatPositive: {
    color: '#4CAF50',
  },
  chartStatNegative: {
    color: '#F44336',
  },
});
