/**
 * CardioSetupScreen
 * Configure cardio workout settings before starting
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import type { ActivityType, GoalType, CardioLocation } from '../../../shared/src/types/cardio';
import { useCardio } from '../../contexts/CardioContext';
import { getCurrentCheckIn, getGymDetails } from '../../services/gymApi';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '../../theme/tokens';

// Navigation types
type CardioStackParamList = {
  CardioTypeSelection: undefined;
  CardioSetup: { activityType: ActivityType };
  LiveCardioTracking: undefined;
};

type NavigationProp = NativeStackNavigationProp<CardioStackParamList, 'CardioSetup'>;
type RoutePropType = RouteProp<CardioStackParamList, 'CardioSetup'>;

const ACTIVITY_LABELS: Record<ActivityType, string> = {
  running: 'Running',
  cycling: 'Cycling',
  walking: 'Walking',
  rowing: 'Rowing',
  elliptical: 'Elliptical',
  stairs: 'Stairs',
};

export default function CardioSetupScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RoutePropType>();
  const { startWorkout, preferences } = useCardio();

  const { activityType } = route.params;

  const [location, setLocation] = useState<CardioLocation>('outdoor');
  const [goalType, setGoalType] = useState<GoalType>('freeform');
  const [goalValue, setGoalValue] = useState<string>('');
  const [targetPace, setTargetPace] = useState<string>('');
  const [bpmSyncEnabled, setBpmSyncEnabled] = useState(preferences.bpmSyncEnabled);
  const [loading, setLoading] = useState(false);

  // Fetch current check-in status
  const { data: currentCheckIn } = useQuery({
    queryKey: ['current-check-in'],
    queryFn: getCurrentCheckIn,
  });

  // Fetch gym details if checked in
  const { data: gym } = useQuery({
    queryKey: ['gym-details', currentCheckIn?.gymId],
    queryFn: () => getGymDetails(currentCheckIn!.gymId),
    enabled: !!currentCheckIn?.gymId,
  });

  const handleStartWorkout = async () => {
    try {
      setLoading(true);

      // Parse goal value
      let parsedGoalValue: number | undefined;
      if (goalType !== 'freeform' && goalValue) {
        if (goalType === 'distance') {
          // Convert to meters (assuming input is in miles/km based on preference)
          const multiplier = preferences.defaultDistanceUnit === 'miles' ? 1609.34 : 1000;
          parsedGoalValue = parseFloat(goalValue) * multiplier;
        } else {
          // Time in minutes -> seconds
          parsedGoalValue = parseFloat(goalValue) * 60;
        }
      }

      // Parse target pace (format: MM:SS -> seconds per km)
      let parsedTargetPace: number | undefined;
      if (targetPace) {
        const [minutes, seconds] = targetPace.split(':').map(Number);
        parsedTargetPace = (minutes * 60) + (seconds || 0);
      }

      await startWorkout({
        activityType,
        location,
        goalType,
        goalValue: parsedGoalValue,
        targetPace: parsedTargetPace,
        musicPlaylistId: undefined, // TODO: Add playlist selection
        musicPlaylistName: undefined,
        bpmSyncEnabled,
        gymId: currentCheckIn?.gymId, // Auto-select gym if checked in
      });

      // Navigate to tracking screen
      navigation.navigate('LiveCardioTracking');
    } catch (error) {
      console.error('Failed to start workout:', error);
      Alert.alert(
        'Unable to Start Workout',
        error instanceof Error ? error.message : 'An unexpected error occurred. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

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
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.content}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>{ACTIVITY_LABELS[activityType].toUpperCase()}</Text>
              <Text style={styles.subtitle}>Configure your workout</Text>

              <LinearGradient
                colors={['#22C55E', '#A3E635']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.accentBar}
              />
            </View>

            {/* Gym Badge */}
            {currentCheckIn && gym && (
              <View style={styles.gymBadgeContainer}>
                <LinearGradient
                  colors={['rgba(34, 197, 94, 0.2)', 'rgba(163, 230, 53, 0.1)']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.gymBadge}
                >
                  <View style={styles.gymBadgeDot} />
                  <Text style={styles.gymBadgeText}>Checked in at {gym.name}</Text>
                </LinearGradient>
              </View>
            )}

            {/* Setup Form */}
            <View style={styles.formContainer}>
              <View style={styles.glassCard}>
                {/* Location Toggle */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Location</Text>
                  <View style={styles.toggleRow}>
                    <TouchableOpacity
                      style={[styles.toggleButton, location === 'outdoor' && styles.toggleButtonActive]}
                      onPress={() => setLocation('outdoor')}
                    >
                      <Text style={[styles.toggleText, location === 'outdoor' && styles.toggleTextActive]}>
                        Outdoor
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.toggleButton, location === 'indoor' && styles.toggleButtonActive]}
                      onPress={() => setLocation('indoor')}
                    >
                      <Text style={[styles.toggleText, location === 'indoor' && styles.toggleTextActive]}>
                        Indoor
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Goal Selection */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Goal</Text>
                  <View style={styles.goalOptions}>
                    <TouchableOpacity
                      style={[styles.goalOption, goalType === 'distance' && styles.goalOptionActive]}
                      onPress={() => setGoalType('distance')}
                    >
                      <Text style={[styles.goalOptionText, goalType === 'distance' && styles.goalOptionTextActive]}>
                        Distance
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.goalOption, goalType === 'time' && styles.goalOptionActive]}
                      onPress={() => setGoalType('time')}
                    >
                      <Text style={[styles.goalOptionText, goalType === 'time' && styles.goalOptionTextActive]}>
                        Time
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.goalOption, goalType === 'freeform' && styles.goalOptionActive]}
                      onPress={() => setGoalType('freeform')}
                    >
                      <Text style={[styles.goalOptionText, goalType === 'freeform' && styles.goalOptionTextActive]}>
                        Freeform
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* Goal Input */}
                  {goalType !== 'freeform' && (
                    <View style={styles.inputContainer}>
                      <TextInput
                        style={styles.input}
                        placeholder={goalType === 'distance' ? `Enter ${preferences.defaultDistanceUnit}` : 'Enter minutes'}
                        placeholderTextColor={COLORS.light.textTertiary}
                        keyboardType="decimal-pad"
                        value={goalValue}
                        onChangeText={setGoalValue}
                      />
                    </View>
                  )}
                </View>

                {/* Target Pace (Optional) */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Target Pace (Optional)</Text>
                  <View style={styles.inputContainer}>
                    <TextInput
                      style={styles.input}
                      placeholder="MM:SS per km"
                      placeholderTextColor={COLORS.light.textTertiary}
                      keyboardType="numbers-and-punctuation"
                      value={targetPace}
                      onChangeText={setTargetPace}
                    />
                  </View>
                </View>

                {/* BPM Sync Toggle */}
                <View style={styles.section}>
                  <View style={styles.switchRow}>
                    <View>
                      <Text style={styles.switchLabel}>Auto-adjust Music BPM</Text>
                      <Text style={styles.switchSubtext}>Match music tempo to your cadence</Text>
                    </View>
                    <Switch
                      value={bpmSyncEnabled}
                      onValueChange={setBpmSyncEnabled}
                      trackColor={{ false: COLORS.light.borderStrong, true: COLORS.light.primary }}
                      thumbColor="#FFFFFF"
                    />
                  </View>
                </View>

                {/* Start Button */}
                <TouchableOpacity
                  onPress={handleStartWorkout}
                  disabled={loading}
                  activeOpacity={0.8}
                  style={styles.submitButtonContainer}
                >
                  <LinearGradient
                    colors={['#22C55E', '#15803D']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[styles.button, loading && styles.buttonDisabled]}
                  >
                    <Text style={styles.buttonText}>
                      {loading ? 'STARTING...' : 'START WORKOUT 🚀'}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
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
  header: {
    alignItems: 'center',
    marginBottom: SPACING['2xl'],
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
  gymBadgeContainer: {
    marginBottom: SPACING.lg,
    alignItems: 'center',
  },
  gymBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.3)',
    gap: SPACING.xs,
  },
  gymBadgeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22C55E',
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  gymBadgeText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: '#22C55E',
  },
  formContainer: {
    flex: 1,
  },
  glassCard: {
    backgroundColor: COLORS.light.glass,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.light.glassBorder,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.light.textPrimary,
    marginBottom: SPACING.md,
    letterSpacing: 0.5,
  },
  toggleRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.base,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.light.borderStrong,
    alignItems: 'center',
  },
  toggleButtonActive: {
    backgroundColor: COLORS.light.primary,
    borderColor: COLORS.light.primary,
  },
  toggleText: {
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.light.textSecondary,
  },
  toggleTextActive: {
    color: '#FFFFFF',
  },
  goalOptions: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.base,
  },
  goalOption: {
    flex: 1,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.light.borderStrong,
    alignItems: 'center',
  },
  goalOptionActive: {
    backgroundColor: COLORS.light.primary,
    borderColor: COLORS.light.primary,
  },
  goalOptionText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.light.textSecondary,
  },
  goalOptionTextActive: {
    color: '#FFFFFF',
  },
  inputContainer: {
    marginTop: SPACING.sm,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: RADIUS.md,
    padding: SPACING.base,
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.light.textPrimary,
    borderWidth: 1,
    borderColor: COLORS.light.borderStrong,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  switchLabel: {
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.light.textPrimary,
    marginBottom: 4,
  },
  switchSubtext: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.light.textTertiary,
  },
  submitButtonContainer: {
    marginTop: SPACING.base,
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
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 2,
  },
});
