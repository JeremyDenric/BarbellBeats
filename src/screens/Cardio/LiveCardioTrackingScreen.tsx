/**
 * LiveCardioTrackingScreen
 * Real-time cardio workout tracking with metrics and controls
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCardio } from '../../contexts/CardioContext';
import { CardioMetricCard } from '../../components/cardio';
import { formatPace, formatDistance, formatDuration } from '../../services/cardio';
import { ScreenErrorBoundary } from '../../components/ScreenErrorBoundary';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '../../theme/tokens';

type CardioStackParamList = {
  CardioTypeSelection: undefined;
  CardioSetup: { activityType: any };
  LiveCardioTracking: undefined;
  CardioSummary: { workoutId: string };
};

type NavigationProp = NativeStackNavigationProp<CardioStackParamList, 'LiveCardioTracking'>;

function LiveCardioTrackingScreenContent() {
  const navigation = useNavigation<NavigationProp>();
  const { activeWorkout, isPaused, currentMetrics, pauseWorkout, resumeWorkout, endWorkout, preferences } = useCardio();

  const [isEnding, setIsEnding] = useState(false);

  useEffect(() => {
    if (!activeWorkout) {
      // No active workout, redirect back
      navigation.goBack();
    }
  }, [activeWorkout, navigation]);

  const handlePauseResume = () => {
    if (isPaused) {
      resumeWorkout();
    } else {
      pauseWorkout();
    }
  };

  const handleEnd = () => {
    Alert.alert(
      'End Workout?',
      'Are you sure you want to end this workout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'End Workout',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsEnding(true);
              const completedWorkout = await endWorkout();
              navigation.navigate('CardioSummary', { workoutId: completedWorkout.id });
            } catch (error) {
              console.error('Failed to end workout:', error);
              Alert.alert('Error', 'Failed to save workout');
            } finally {
              setIsEnding(false);
            }
          },
        },
      ]
    );
  };

  if (!activeWorkout) {
    return null;
  }

  const distanceDisplay = formatDistance(currentMetrics.distance, preferences.defaultDistanceUnit);
  const paceDisplay = formatPace(currentMetrics.averagePace, preferences.defaultDistanceUnit);
  const durationDisplay = formatDuration(currentMetrics.duration);

  return (
    <LinearGradient
      colors={['#060A07', '#0B120D', '#08100B']}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          {/* Header with Activity Type */}
          <View style={styles.header}>
            <Text style={styles.activityLabel}>{activeWorkout.activityType.toUpperCase()}</Text>
            {isPaused && <Text style={styles.pausedLabel}>PAUSED</Text>}
          </View>

          {/* Main Metrics Section */}
          <View style={styles.metricsSection}>
            {/* Large Duration Display */}
            <View style={styles.mainMetric}>
              <Text style={styles.mainMetricLabel}>DURATION</Text>
              <Text style={styles.mainMetricValue}>{durationDisplay}</Text>
            </View>

            {/* Secondary Metrics Grid */}
            <View style={styles.metricsGrid}>
              <CardioMetricCard
                label="Distance"
                value={distanceDisplay}
                unit={preferences.defaultDistanceUnit}
                size="medium"
                style={styles.metricCard}
              />
              <CardioMetricCard
                label="Avg Pace"
                value={paceDisplay}
                unit={`/${preferences.defaultDistanceUnit === 'miles' ? 'mi' : 'km'}`}
                size="medium"
                style={styles.metricCard}
              />
            </View>

            <View style={styles.metricsGrid}>
              <CardioMetricCard
                label="Calories"
                value={currentMetrics.calories}
                unit="cal"
                icon="🔥"
                size="medium"
                style={styles.metricCard}
              />
              <CardioMetricCard
                label="Elevation"
                value={Math.round(currentMetrics.elevationGain)}
                unit="m"
                icon="⛰️"
                size="medium"
                style={styles.metricCard}
              />
            </View>
          </View>

          {/* Controls */}
          <View style={styles.controls}>
            {/* Pause/Resume Button */}
            <TouchableOpacity
              onPress={handlePauseResume}
              activeOpacity={0.8}
              style={styles.controlButton}
            >
              <LinearGradient
                colors={isPaused ? ['#22C55E', '#15803D'] : ['#FBBF24', '#D97706']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.pauseButton}
              >
                <Text style={styles.controlButtonText}>
                  {isPaused ? '▶️ RESUME' : '⏸️ PAUSE'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            {/* End Button */}
            <TouchableOpacity
              onPress={handleEnd}
              disabled={isEnding}
              activeOpacity={0.8}
              style={styles.controlButton}
            >
              <View style={[styles.endButton, isEnding && styles.buttonDisabled]}>
                <Text style={styles.endButtonText}>
                  {isEnding ? 'SAVING...' : '⏹️ END WORKOUT'}
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Bottom Info */}
          <View style={styles.bottomInfo}>
            <Text style={styles.bottomText}>
              {activeWorkout.location === 'outdoor' ? '📍 GPS Tracking Active' : '🏠 Indoor Mode'}
            </Text>
          </View>
        </View>
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
  content: {
    flex: 1,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING['2xl'],
  },
  activityLabel: {
    fontSize: TYPOGRAPHY.sizes['2xl'],
    fontWeight: TYPOGRAPHY.weights.black,
    color: COLORS.light.textPrimary,
    letterSpacing: 2,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  pausedLabel: {
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.light.warning,
    letterSpacing: 1,
  },
  metricsSection: {
    flex: 1,
    justifyContent: 'center',
  },
  mainMetric: {
    alignItems: 'center',
    marginBottom: SPACING['3xl'],
  },
  mainMetricLabel: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.light.textSecondary,
    letterSpacing: 1.5,
    marginBottom: SPACING.sm,
  },
  mainMetricValue: {
    fontSize: 72,
    fontWeight: TYPOGRAPHY.weights.black,
    color: COLORS.light.textPrimary,
    letterSpacing: -2,
    fontVariant: ['tabular-nums'],
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: SPACING.base,
    marginBottom: SPACING.base,
  },
  metricCard: {
    flex: 1,
  },
  controls: {
    gap: SPACING.base,
    marginBottom: SPACING.xl,
  },
  controlButton: {
    width: '100%',
  },
  pauseButton: {
    borderRadius: RADIUS.lg,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
    elevation: 8,
  },
  endButton: {
    borderRadius: RADIUS.lg,
    padding: 20,
    alignItems: 'center',
    backgroundColor: COLORS.light.glass,
    borderWidth: 2,
    borderColor: COLORS.light.error,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  controlButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: TYPOGRAPHY.weights.black,
    letterSpacing: 1.5,
  },
  endButtonText: {
    color: COLORS.light.error,
    fontSize: 18,
    fontWeight: TYPOGRAPHY.weights.black,
    letterSpacing: 1.5,
  },
  bottomInfo: {
    alignItems: 'center',
  },
  bottomText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.light.textTertiary,
    letterSpacing: 0.5,
  },
});

export default function LiveCardioTrackingScreen() {
  return (
    <ScreenErrorBoundary fallbackTitle="Workout Tracking Error">
      <LiveCardioTrackingScreenContent />
    </ScreenErrorBoundary>
  );
}
