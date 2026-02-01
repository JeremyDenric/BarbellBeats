/**
 * VolumeChart Component
 *
 * Interactive workout volume charts using Victory Native.
 * Displays volume trends over time with multi-exercise support.
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
// Victory Native v40+ has different exports - using type assertions for compatibility
// @ts-expect-error - Victory Native API changed in v40
import { VictoryChart, VictoryLine, VictoryAxis, VictoryTheme, VictoryTooltip, VictoryVoronoiContainer } from 'victory-native';
import { IOSCard, Badge, EmptyState } from '../UI';
import { useThemeMode } from '../../contexts/ThemeContext';
import { COLORS, IOS_COLORS, SPACING, TYPOGRAPHY } from '../../theme/tokens';

// ============================================================================
// Types
// ============================================================================

export interface VolumeDataPoint {
  date: string; // ISO date string
  volume: number;
  exerciseName?: string;
  sets?: number;
  reps?: number;
}

export interface VolumeChartProps {
  data: VolumeDataPoint[];
  title?: string;
  subtitle?: string;
  timeRange?: 'week' | 'month' | 'year';
  height?: number;
  showLegend?: boolean;
  groupBy?: 'total' | 'exercise'; // Group by total volume or per exercise
}

// ============================================================================
// Helper Functions
// ============================================================================

function formatDate(dateString: string, range: 'week' | 'month' | 'year'): string {
  const date = new Date(dateString);

  switch (range) {
    case 'week':
      // Show day abbreviation (Mon, Tue, etc.)
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    case 'month':
      // Show day number (1, 2, 3, etc.)
      return date.getDate().toString();
    case 'year':
      // Show month abbreviation (Jan, Feb, etc.)
      return date.toLocaleDateString('en-US', { month: 'short' });
    default:
      return dateString;
  }
}

function formatVolume(volume: number): string {
  if (volume >= 1000000) {
    return `${(volume / 1000000).toFixed(1)}M`;
  }
  if (volume >= 1000) {
    return `${(volume / 1000).toFixed(1)}K`;
  }
  return volume.toFixed(0);
}

function groupDataByDate(data: VolumeDataPoint[]): Map<string, VolumeDataPoint[]> {
  const grouped = new Map<string, VolumeDataPoint[]>();

  data.forEach((point) => {
    const date = point.date.split('T')[0]; // Get date part only
    if (!grouped.has(date)) {
      grouped.set(date, []);
    }
    grouped.get(date)!.push(point);
  });

  return grouped;
}

function groupDataByExercise(data: VolumeDataPoint[]): Map<string, VolumeDataPoint[]> {
  const grouped = new Map<string, VolumeDataPoint[]>();

  data.forEach((point) => {
    const exercise = point.exerciseName || 'Unknown';
    if (!grouped.has(exercise)) {
      grouped.set(exercise, []);
    }
    grouped.get(exercise)!.push(point);
  });

  return grouped;
}

// Exercise colors for multi-line charts
const EXERCISE_COLORS = [
  '#34C759', // Green
  '#5AC8FA', // Blue
  '#FF9500', // Orange
  '#AF52DE', // Purple
  '#FF2D55', // Pink
  '#FFCC00', // Yellow
];

// ============================================================================
// VolumeChart Component
// ============================================================================

export const VolumeChart: React.FC<VolumeChartProps> = ({
  data,
  title = 'Volume Trend',
  subtitle,
  timeRange = 'week',
  height = 250,
  showLegend = true,
  groupBy = 'total',
}) => {
  const { isDark } = useThemeMode();
  const colors = isDark ? COLORS.dark : COLORS.light;
  const iosColors = isDark ? IOS_COLORS.dark : IOS_COLORS.light;

  const screenWidth = Dimensions.get('window').width;

  // Process data based on grouping
  const chartData = useMemo(() => {
    if (data.length === 0) return [];

    if (groupBy === 'total') {
      // Group by date and sum volumes
      const grouped = groupDataByDate(data);
      const points: Array<{ x: string; y: number; label: string }> = [];

      grouped.forEach((dayData, date) => {
        const totalVolume = dayData.reduce((sum, point) => sum + point.volume, 0);
        points.push({
          x: formatDate(date, timeRange),
          y: totalVolume,
          label: `${formatVolume(totalVolume)} lbs`,
        });
      });

      return [{ data: points, name: 'Total Volume', color: colors.primary }];
    } else {
      // Group by exercise
      const grouped = groupDataByExercise(data);
      const exerciseLines: Array<{
        data: Array<{ x: string; y: number; label: string }>;
        name: string;
        color: string;
      }> = [];

      let colorIndex = 0;
      grouped.forEach((exerciseData, exerciseName) => {
        const exerciseGrouped = groupDataByDate(exerciseData);
        const points: Array<{ x: string; y: number; label: string }> = [];

        exerciseGrouped.forEach((dayData, date) => {
          const totalVolume = dayData.reduce((sum, point) => sum + point.volume, 0);
          points.push({
            x: formatDate(date, timeRange),
            y: totalVolume,
            label: `${exerciseName}: ${formatVolume(totalVolume)} lbs`,
          });
        });

        exerciseLines.push({
          data: points,
          name: exerciseName,
          color: EXERCISE_COLORS[colorIndex % EXERCISE_COLORS.length],
        });

        colorIndex++;
      });

      // Limit to top 5 exercises by total volume
      return exerciseLines
        .sort((a, b) => {
          const aTotal = a.data.reduce((sum, point) => sum + point.y, 0);
          const bTotal = b.data.reduce((sum, point) => sum + point.y, 0);
          return bTotal - aTotal;
        })
        .slice(0, 5);
    }
  }, [data, groupBy, timeRange, colors.primary]);

  // Calculate stats
  const stats = useMemo(() => {
    if (data.length === 0) {
      return { total: 0, average: 0, peak: 0 };
    }

    const total = data.reduce((sum, point) => sum + point.volume, 0);
    const grouped = groupDataByDate(data);
    const dailyVolumes = Array.from(grouped.values()).map((dayData) =>
      dayData.reduce((sum, point) => sum + point.volume, 0)
    );
    const average = dailyVolumes.reduce((sum, vol) => sum + vol, 0) / dailyVolumes.length;
    const peak = Math.max(...dailyVolumes);

    return { total, average, peak };
  }, [data]);

  // Empty state
  if (data.length === 0) {
    return (
      <IOSCard style={styles.card}>
        <EmptyState
          title="No Data Yet"
          message="Start logging workouts to see your volume trends"
        />
      </IOSCard>
    );
  }

  return (
    <IOSCard style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleSection}>
          <Text style={[styles.title, { color: iosColors.label }]}>
            {title}
          </Text>
          {subtitle && (
            <Text style={[styles.subtitle, { color: iosColors.secondaryLabel }]}>
              {subtitle}
            </Text>
          )}
        </View>
      </View>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.primary }]}>
            {formatVolume(stats.total)}
          </Text>
          <Text style={[styles.statLabel, { color: iosColors.secondaryLabel }]}>
            Total
          </Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.primary }]}>
            {formatVolume(stats.average)}
          </Text>
          <Text style={[styles.statLabel, { color: iosColors.secondaryLabel }]}>
            Avg/Day
          </Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.primary }]}>
            {formatVolume(stats.peak)}
          </Text>
          <Text style={[styles.statLabel, { color: iosColors.secondaryLabel }]}>
            Peak
          </Text>
        </View>
      </View>

      {/* Chart */}
      <View style={styles.chartContainer}>
        <VictoryChart
          width={screenWidth - SPACING.md * 4}
          height={height}
          theme={VictoryTheme.material}
          containerComponent={
            <VictoryVoronoiContainer
              labels={({ datum }) => datum.label}
              labelComponent={
                <VictoryTooltip
                  cornerRadius={8}
                  flyoutStyle={{
                    fill: isDark ? iosColors.secondarySystemGroupedBackground : '#FFFFFF',
                    stroke: iosColors.separator,
                    strokeWidth: 1,
                  }}
                  style={{
                    fill: iosColors.label,
                    fontSize: 12,
                    fontWeight: '600',
                  }}
                />
              }
            />
          }
          padding={{ top: 20, bottom: 40, left: 60, right: 20 }}
        >
          {/* X Axis */}
          <VictoryAxis
            style={{
              axis: { stroke: iosColors.separator },
              tickLabels: {
                fill: iosColors.secondaryLabel,
                fontSize: 11,
                fontWeight: '500',
              },
              grid: { stroke: 'none' },
            }}
          />

          {/* Y Axis */}
          <VictoryAxis
            dependentAxis
            tickFormat={(value) => formatVolume(value)}
            style={{
              axis: { stroke: iosColors.separator },
              tickLabels: {
                fill: iosColors.secondaryLabel,
                fontSize: 11,
                fontWeight: '500',
              },
              grid: {
                stroke: iosColors.separator,
                strokeDasharray: '4, 4',
                strokeOpacity: 0.3,
              },
            }}
          />

          {/* Lines */}
          {chartData.map((line, index) => (
            <VictoryLine
              key={line.name}
              data={line.data}
              x="x"
              y="y"
              style={{
                data: {
                  stroke: line.color,
                  strokeWidth: 3,
                },
              }}
              interpolation="monotoneX"
            />
          ))}
        </VictoryChart>
      </View>

      {/* Legend */}
      {showLegend && groupBy === 'exercise' && chartData.length > 1 && (
        <View style={styles.legend}>
          {chartData.map((line) => (
            <View key={line.name} style={styles.legendItem}>
              <View
                style={[
                  styles.legendColor,
                  { backgroundColor: line.color },
                ]}
              />
              <Text
                style={[styles.legendText, { color: iosColors.label }]}
                numberOfLines={1}
              >
                {line.name}
              </Text>
            </View>
          ))}
        </View>
      )}
    </IOSCard>
  );
};

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  card: {
    padding: SPACING.md,
  },

  // Header
  header: {
    marginBottom: SPACING.md,
  },
  titleSection: {
    gap: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    ...TYPOGRAPHY.presets.heading3,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginBottom: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  statItem: {
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(128, 128, 128, 0.2)',
  },

  // Chart
  chartContainer: {
    alignItems: 'center',
    marginVertical: SPACING.sm,
  },

  // Legend
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: SPACING.md,
    paddingTop: SPACING.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(128, 128, 128, 0.2)',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendColor: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  legendText: {
    fontSize: 13,
    fontWeight: '500',
    maxWidth: 120,
  },
});
