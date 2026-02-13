/**
 * GymDetailsScreen
 * Detailed view of a gym with check-in/check-out functionality
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Pressable,
  Alert,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useThemeMode } from '../contexts/ThemeContext';
import { useToast } from '../contexts/ToastContext';
import { usePreferences } from '../contexts/PreferencesContext';
import { getGymDetails, checkInToGym, checkOutFromGym, getCurrentCheckIn } from '../services/gymApi';
import { Button, GlassCard, LoadingView, ErrorView } from '../components/UI';
import { COLORS, SPACING, TYPOGRAPHY, LAYOUT, RADIUS } from '../theme/tokens';
import type { GymsStackParamList } from '../types';
import devLog from '../utils/devLog';

type RouteParams = RouteProp<GymsStackParamList, 'GymDetails'>;
type NavigationProp = NativeStackNavigationProp<GymsStackParamList, 'GymDetails'>;

export default function GymDetailsScreen() {
  const route = useRoute<RouteParams>();
  const navigation = useNavigation<NavigationProp>();
  const queryClient = useQueryClient();
  const { isDark } = useThemeMode();
  const colors = isDark ? COLORS.dark : COLORS.light;
  const { showToast } = useToast();
  const { preferences } = usePreferences();
  const compact = preferences.compactMode;
  const [isCheckingIn, setIsCheckingIn] = useState(false);

  const { gymId } = route.params || {};

  // Fetch gym details
  const { data: gym, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['gym-details', gymId],
    queryFn: () => getGymDetails(gymId),
    enabled: !!gymId,
  });

  // Fetch current check-in status
  const { data: currentCheckIn } = useQuery({
    queryKey: ['current-check-in'],
    queryFn: getCurrentCheckIn,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const isCheckedIn = currentCheckIn?.gymId === gymId;

  // Check-in mutation
  const checkInMutation = useMutation({
    mutationFn: () => checkInToGym(gymId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['current-check-in'] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showToast('Checked in successfully', { type: 'success' });
    },
    onError: (error) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showToast('Failed to check in', { type: 'error' });
      devLog.error('Check-in error:', error);
    },
  });

  // Check-out mutation
  const checkOutMutation = useMutation({
    mutationFn: () => checkOutFromGym(gymId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['current-check-in'] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showToast('Checked out', { type: 'info' });
    },
    onError: (error) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showToast('Failed to check out', { type: 'error' });
      devLog.error('Check-out error:', error);
    },
  });

  const handleCheckIn = useCallback(async () => {
    try {
      setIsCheckingIn(true);
      await checkInMutation.mutateAsync();
    } catch (error) {
      // Error already handled in mutation
    } finally {
      setIsCheckingIn(false);
    }
  }, [checkInMutation]);

  const handleCheckOut = useCallback(() => {
    Haptics.selectionAsync();
    Alert.alert(
      'Check Out?',
      'Are you sure you want to check out from this gym?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Check Out',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsCheckingIn(true);
              await checkOutMutation.mutateAsync();
            } catch (error) {
              // Error already handled in mutation
            } finally {
              setIsCheckingIn(false);
            }
          },
        },
      ]
    );
  }, [checkOutMutation]);

  const handleViewPlaylist = useCallback(() => {
    if (!gymId) return;
    Haptics.selectionAsync();
    (navigation as any).navigate('GymPlaylist', { gymId });
  }, [gymId, navigation]);

  if (!gymId) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.textPrimary }]}>
            No gym selected
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (isLoading) {
    return <LoadingView message="Loading gym details..." />;
  }

  if (isError || !gym) {
    return <ErrorView error={error as Error} onRetry={refetch} />;
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[styles.content, compact && styles.contentCompact]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Card */}
        <GlassCard style={[styles.headerCard, compact && styles.headerCardCompact]} intensity={20}>
          <Text style={[styles.gymName, { color: colors.textPrimary }]}>
            {gym.name}
          </Text>
          <Text style={[styles.address, { color: colors.textSecondary }]}>
            {gym.address}
          </Text>
          {gym.distance !== undefined && (
            <Text style={[styles.distance, { color: colors.textTertiary }]}>
              {gym.distance.toFixed(1)} miles away
            </Text>
          )}
        </GlassCard>

        {/* Status Card */}
        {isCheckedIn && (
          <GlassCard
            style={[styles.statusCard, compact && styles.statusCardCompact, { borderColor: colors.success }]}
            intensity={16}
          >
            <View style={styles.statusRow}>
              <View style={[styles.statusDot, { backgroundColor: colors.success }]} />
              <Text style={[styles.statusText, { color: colors.success }]}>
                Checked In
              </Text>
            </View>
            <Text style={[styles.statusSubtext, compact && styles.statusSubtextCompact, { color: colors.textSecondary }]}>
              Checked in at {new Date(currentCheckIn.checkedInAt).toLocaleTimeString()}
            </Text>
          </GlassCard>
        )}

        {/* Info Card */}
        <GlassCard style={[styles.infoCard, compact && styles.infoCardCompact]} intensity={16}>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
              Members
            </Text>
            <Text style={[styles.infoValue, { color: colors.textPrimary }]}>
              {gym.memberCount}
            </Text>
          </View>

          {gym.currentSong && (
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                Now Playing
              </Text>
              <View style={styles.songInfo}>
                <Text style={[styles.songTitle, { color: colors.textPrimary }]} numberOfLines={1}>
                  {gym.currentSong.title}
                </Text>
                <Text style={[styles.songArtist, { color: colors.textSecondary }]} numberOfLines={1}>
                  {gym.currentSong.artist}
                </Text>
              </View>
            </View>
          )}
        </GlassCard>

        {gym.description && (
          <GlassCard style={[styles.descriptionCard, compact && styles.descriptionCardCompact]} intensity={16}>
            <Text style={[styles.descriptionLabel, { color: colors.textSecondary }]}>
              About
            </Text>
            <Text style={[styles.descriptionText, { color: colors.textPrimary }]}>
              {gym.description}
            </Text>
          </GlassCard>
        )}

        {/* Actions */}
        <View style={[styles.actions, compact && styles.actionsCompact]}>
          {isCheckedIn ? (
            <Button
              title={isCheckingIn ? 'Checking Out...' : 'Check Out'}
              onPress={handleCheckOut}
              variant="secondary"
              fullWidth
              disabled={isCheckingIn}
              accessible={true}
              accessibilityLabel="Check out from gym"
              accessibilityHint="End your check-in session at this gym"
              accessibilityRole="button"
            />
          ) : (
            <Button
              title={isCheckingIn ? 'Checking In...' : 'Check In'}
              onPress={handleCheckIn}
              variant="primary"
              fullWidth
              disabled={isCheckingIn}
              accessible={true}
              accessibilityLabel="Check in to gym"
              accessibilityHint="Start a workout session at this gym"
              accessibilityRole="button"
            />
          )}

          <Button
            title="View Playlist"
            onPress={handleViewPlaylist}
            variant="secondary"
            fullWidth
            accessible={true}
            accessibilityLabel="View gym playlist"
            accessibilityHint="See and vote on songs playing at this gym"
            accessibilityRole="button"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingBottom: SPACING['4xl'],
    gap: SPACING.lg,
    paddingTop: SPACING.lg,
  },
  contentCompact: {
    paddingTop: SPACING.base,
    gap: SPACING.md,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING['3xl'],
  },
  errorText: {
    ...TYPOGRAPHY.presets.body,
  },
  headerCard: {
    marginHorizontal: LAYOUT.screenPadding,
    padding: SPACING.xl,
    alignItems: 'center',
  },
  headerCardCompact: {
    padding: SPACING.lg,
  },
  gymName: {
    ...TYPOGRAPHY.presets.heading1,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  address: {
    ...TYPOGRAPHY.presets.body,
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  distance: {
    ...TYPOGRAPHY.presets.caption,
  },
  statusCard: {
    marginHorizontal: LAYOUT.screenPadding,
    padding: SPACING.lg,
    borderWidth: 2,
  },
  statusCardCompact: {
    padding: SPACING.md,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    ...TYPOGRAPHY.presets.bodyBold,
  },
  statusSubtext: {
    ...TYPOGRAPHY.presets.caption,
    marginLeft: SPACING.lg,
  },
  statusSubtextCompact: {
    marginLeft: SPACING.md,
  },
  infoCard: {
    marginHorizontal: LAYOUT.screenPadding,
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  infoCardCompact: {
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: SPACING.md,
  },
  infoLabel: {
    ...TYPOGRAPHY.presets.bodyBold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontSize: 12,
  },
  infoValue: {
    ...TYPOGRAPHY.presets.bodyBold,
  },
  songInfo: {
    flex: 1,
    alignItems: 'flex-end',
  },
  songTitle: {
    ...TYPOGRAPHY.presets.bodyBold,
    fontSize: 14,
  },
  songArtist: {
    ...TYPOGRAPHY.presets.caption,
  },
  descriptionCard: {
    marginHorizontal: LAYOUT.screenPadding,
    padding: SPACING.lg,
  },
  descriptionCardCompact: {
    padding: SPACING.md,
  },
  descriptionLabel: {
    ...TYPOGRAPHY.presets.bodyBold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontSize: 12,
    marginBottom: SPACING.sm,
  },
  descriptionText: {
    ...TYPOGRAPHY.presets.body,
    lineHeight: 22,
  },
  actions: {
    marginHorizontal: LAYOUT.screenPadding,
    gap: SPACING.md,
  },
  actionsCompact: {
    gap: SPACING.sm,
  },
});
