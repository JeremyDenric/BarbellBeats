/**
 * CardioSummaryScreen
 * Post-workout summary with stats and save functionality
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCardio } from '../../contexts/CardioContext';
import { CardioMetricCard } from '../../components/cardio';
import { formatPace, formatDistance, formatDuration } from '../../services/cardio';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '../../theme/tokens';

type CardioStackParamList = {
  CardioTypeSelection: undefined;
  CardioSetup: { activityType: any };
  LiveCardioTracking: undefined;
  CardioSummary: { workoutId: string };
  Home: undefined;
};

type NavigationProp = NativeStackNavigationProp<CardioStackParamList, 'CardioSummary'>;
type RoutePropType = RouteProp<CardioStackParamList, 'CardioSummary'>;

export default function CardioSummaryScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RoutePropType>();
  const { workouts, preferences } = useCardio();

  // Find the workout by ID
  const workout = workouts.find(w => w.id === route.params.workoutId);

  if (!workout) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Workout not found</Text>
      </View>
    );
  }

  const handleDone = () => {
    // Navigate back to home or cardio list
    navigation.navigate('Home');
  };

  const distanceDisplay = formatDistance(workout.distance, workout.distanceUnit);
  const avgPaceDisplay = formatPace(workout.averagePace, workout.distanceUnit);
  const durationDisplay = formatDuration(workout.duration);

  return (
    <LinearGradient
      colors={['#060A07', '#0B120D', '#08100B']}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            {/* Header */}
            <View style={styles.header}>
              <LinearGradient
                colors={['#22C55E', '#10B981', '#A3E635']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.iconCircle}
              >
                <Text style={styles.iconEmoji}>✅</Text>
              </LinearGradient>

              <Text style={styles.title}>WORKOUT COMPLETE</Text>
              <Text style={styles.subtitle}>
                {workout.activityType.charAt(0).toUpperCase() + workout.activityType.slice(1)} • {workout.location}
              </Text>

              <LinearGradient
                colors={['#22C55E', '#A3E635']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.accentBar}
              />
            </View>

            {/* Summary Card */}
            <View style={styles.summarySection}>
              <View style={styles.glassCard}>
                {/* Main Stats */}
                <View style={styles.mainStats}>
                  <View style={styles.mainStat}>
                    <Text style={styles.mainStatValue}>{durationDisplay}</Text>
                    <Text style={styles.mainStatLabel}>Duration</Text>
                  </View>
                  <View style={styles.divider} />
                  <View style={styles.mainStat}>
                    <Text style={styles.mainStatValue}>{distanceDisplay}</Text>
                    <Text style={styles.mainStatLabel}>
                      {workout.distanceUnit === 'miles' ? 'Miles' : 'Kilometers'}
                    </Text>
                  </View>
                  <View style={styles.divider} />
                  <View style={styles.mainStat}>
                    <Text style={styles.mainStatValue}>{workout.calories}</Text>
                    <Text style={styles.mainStatLabel}>Calories</Text>
                  </View>
                </View>

                {/* Secondary Metrics */}
                <View style={styles.metricsGrid}>
                  <CardioMetricCard
                    label="Avg Pace"
                    value={avgPaceDisplay}
                    unit={`/${workout.distanceUnit === 'miles' ? 'mi' : 'km'}`}
                    size="small"
                    style={styles.metricCard}
                  />
                  <CardioMetricCard
                    label="Elevation"
                    value={Math.round(workout.elevationGain || 0)}
                    unit="m"
                    icon="⛰️"
                    size="small"
                    style={styles.metricCard}
                  />
                </View>

                {workout.averageHeartRate && (
                  <View style={styles.metricsGrid}>
                    <CardioMetricCard
                      label="Avg HR"
                      value={workout.averageHeartRate}
                      unit="bpm"
                      icon="❤️"
                      size="small"
                      style={styles.metricCard}
                    />
                    <CardioMetricCard
                      label="Max HR"
                      value={workout.maxHeartRate || 0}
                      unit="bpm"
                      icon="❤️"
                      size="small"
                      style={styles.metricCard}
                    />
                  </View>
                )}

                {/* Goal Achievement */}
                {workout.goalType && workout.goalType !== 'freeform' && (
                  <View style={styles.goalSection}>
                    <Text style={styles.goalLabel}>
                      {workout.goalAchieved ? '🎯 Goal Achieved!' : '📊 Goal Progress'}
                    </Text>
                    <Text style={styles.goalText}>
                      {workout.goalType === 'distance'
                        ? `Target: ${formatDistance(workout.goalValue || 0, workout.distanceUnit)} ${workout.distanceUnit}`
                        : `Target: ${Math.round((workout.goalValue || 0) / 60)} minutes`}
                    </Text>
                  </View>
                )}

                {/* Splits Info */}
                {workout.splits && workout.splits.length > 0 && (
                  <View style={styles.splitsSection}>
                    <Text style={styles.splitsTitle}>
                      Splits ({workout.splits.length} {workout.distanceUnit === 'miles' ? 'miles' : 'km'})
                    </Text>
                    <Text style={styles.splitsSubtext}>
                      Fastest: {formatPace(
                        Math.min(...workout.splits.map(s => s.pace)),
                        workout.distanceUnit
                      )}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* Actions */}
            <View style={styles.actionsSection}>
              <TouchableOpacity
                onPress={handleDone}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#22C55E', '#15803D']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.button}
                >
                  <Text style={styles.buttonText}>DONE</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {/* Bottom Info */}
            <View style={styles.bottomSection}>
              <Text style={styles.bottomText}>WORKOUT SAVED</Text>
              <LinearGradient
                colors={['#A3E635', '#22C55E']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.bottomBar}
              />
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.xl,
    paddingVertical: 40,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: COLORS.light.error,
    fontSize: TYPOGRAPHY.sizes.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING['2xl'],
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xl,
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 10,
  },
  iconEmoji: {
    fontSize: 48,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: '#fff',
    textAlign: 'center',
    letterSpacing: 2,
    marginBottom: 8,
    textShadowColor: '#22C55E',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 15,
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.light.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.base,
    fontWeight: '600',
  },
  accentBar: {
    width: 60,
    height: 4,
    borderRadius: 2,
  },
  summarySection: {
    flex: 1,
    marginBottom: SPACING.xl,
  },
  glassCard: {
    backgroundColor: COLORS.light.glass,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.light.glassBorder,
  },
  mainStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: SPACING.xl,
    paddingVertical: SPACING.base,
  },
  mainStat: {
    alignItems: 'center',
    flex: 1,
  },
  mainStatValue: {
    fontSize: 28,
    fontWeight: TYPOGRAPHY.weights.black,
    color: COLORS.light.textPrimary,
    marginBottom: SPACING.xs,
  },
  mainStatLabel: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.light.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  divider: {
    width: 1,
    backgroundColor: COLORS.light.borderStrong,
    marginHorizontal: SPACING.sm,
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: SPACING.base,
    marginBottom: SPACING.base,
  },
  metricCard: {
    flex: 1,
  },
  goalSection: {
    marginTop: SPACING.base,
    padding: SPACING.base,
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.3)',
  },
  goalLabel: {
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.light.success,
    marginBottom: SPACING.xs,
  },
  goalText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.light.textSecondary,
  },
  splitsSection: {
    marginTop: SPACING.base,
    padding: SPACING.base,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: RADIUS.md,
  },
  splitsTitle: {
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.light.textPrimary,
    marginBottom: SPACING.xs,
  },
  splitsSubtext: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.light.textSecondary,
  },
  actionsSection: {
    marginBottom: SPACING.xl,
  },
  button: {
    borderRadius: RADIUS.lg,
    padding: 18,
    alignItems: 'center',
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
    elevation: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 2,
  },
  bottomSection: {
    alignItems: 'center',
  },
  bottomText: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.light.textSecondary,
    letterSpacing: 2,
    marginBottom: 8,
  },
  bottomBar: {
    width: 120,
    height: 3,
    borderRadius: 2,
  },
});
