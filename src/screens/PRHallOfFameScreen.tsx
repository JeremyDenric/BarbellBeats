import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  SafeAreaView,
  Pressable,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useThemeMode } from '../contexts/ThemeContext';
import { usePreferences } from '../contexts/PreferencesContext';
import { useSubscription } from '../contexts/SubscriptionContext';
import { COLORS, SPACING, RADIUS, SIGNAL, TYPOGRAPHY } from '../theme/tokens';
import { Button, GlassCard, SectionHeader } from '../components/UI';
import haptics from '../utils/haptics';
import { FRIEND_PROFILES } from '../data/friends';
import type { ProfileStackParamList } from '../types';

type Nav = NativeStackNavigationProp<ProfileStackParamList, 'PRHallOfFame'>;

// Seed data — fabricated PR moments from friends for demo purposes
// Replaced by real API data once the backend is live
const SEEDED_MOMENTS = [
  {
    id: 'seed-1',
    friendId: 'maya-chen',
    friendName: 'Maya Chen',
    friendHandle: '@maya.moves',
    exerciseName: 'Deadlift',
    newWeight: '315 lbs',
    gymName: 'Iron Works',
    song: { title: 'Power', artist: 'Kanye West' },
    timeAgo: '2h ago',
  },
  {
    id: 'seed-2',
    friendId: 'darius-lee',
    friendName: 'Darius Lee',
    friendHandle: '@dlee',
    exerciseName: 'Bench Press',
    newWeight: '225 lbs',
    gymName: 'FitZone Elite',
    song: { title: 'Stronger', artist: 'Kanye West' },
    timeAgo: '5h ago',
  },
  {
    id: 'seed-3',
    friendId: 'priya-k',
    friendName: 'Priya K.',
    friendHandle: '@priya.lifts',
    exerciseName: 'Back Squat',
    newWeight: '185 lbs',
    gymName: 'Pinnacle Fitness',
    song: { title: 'Bad Guy', artist: 'Billie Eilish' },
    timeAgo: '1d ago',
  },
  {
    id: 'seed-4',
    friendId: 'maya-chen',
    friendName: 'Maya Chen',
    friendHandle: '@maya.moves',
    exerciseName: 'Romanian Deadlift',
    newWeight: '245 lbs',
    gymName: 'Iron Works',
    song: { title: 'HUMBLE.', artist: 'Kendrick Lamar' },
    timeAgo: '2d ago',
  },
];

type SeedMoment = typeof SEEDED_MOMENTS[number];

function PRFeedCard({ item, colors, compact }: { item: SeedMoment; colors: typeof COLORS.dark; compact: boolean }) {
  return (
    <View style={[styles.feedCard, compact && styles.feedCardCompact, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.feedHeader}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarInitial}>{item.friendName[0]}</Text>
        </View>
        <View style={styles.feedMeta}>
          <Text style={[styles.friendName, { color: colors.textPrimary }]}>{item.friendName}</Text>
          <Text style={[styles.friendHandle, { color: colors.textTertiary }]}>{item.friendHandle} · {item.timeAgo}</Text>
        </View>
        <View style={[styles.prBadge, { backgroundColor: SIGNAL.forge + '22', borderColor: SIGNAL.forge + '44' }]}>
          <Text style={[styles.prBadgeText, { color: SIGNAL.forge }]}>PR</Text>
        </View>
      </View>

      <View style={[styles.prRow, compact && styles.prRowCompact]}>
        <Text style={[styles.exerciseName, { color: colors.textPrimary }]}>{item.exerciseName}</Text>
        <Text style={[styles.weight, { color: SIGNAL.forge }]}>{item.newWeight}</Text>
      </View>

      <View style={styles.contextRow}>
        <Text style={[styles.contextText, { color: colors.textTertiary }]}>
          📍 {item.gymName}
        </Text>
        <Text style={[styles.contextText, { color: colors.textTertiary }]}>
          🎵 {item.song.title} — {item.song.artist}
        </Text>
      </View>
    </View>
  );
}

export default function PRHallOfFameScreen() {
  const navigation = useNavigation<Nav>();
  const { isDark } = useThemeMode();
  const colors = isDark ? COLORS.dark : COLORS.light;
  const { preferences } = usePreferences();
  const compact = preferences.compactMode;
  const { isPro } = useSubscription();

  const renderItem = useCallback(
    ({ item }: { item: SeedMoment }) => (
      <PRFeedCard item={item} colors={colors} compact={compact} />
    ),
    [colors, compact]
  );

  const keyExtractor = useCallback((item: SeedMoment) => item.id, []);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={isPro ? SEEDED_MOMENTS : []}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        contentContainerStyle={[styles.list, compact && styles.listCompact]}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <SectionHeader
            title="PR Hall of Fame"
            subtitle="See when your friends break records"
            titleStyle={styles.headerTitle}
          />
        }
        ListEmptyComponent={
          isPro ? (
            <GlassCard style={styles.emptyCard} intensity={16}>
              <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No PRs yet</Text>
              <Text style={[styles.emptyDesc, { color: colors.textSecondary }]}>
                When your friends break a record, it shows up here.
              </Text>
            </GlassCard>
          ) : (
            <GlassCard style={styles.gateCard} intensity={16}>
              <Text style={[styles.gateBadge, { color: SIGNAL.forge }]}>FORGE PRO</Text>
              <Text style={[styles.gateTitle, { color: colors.textPrimary }]}>PR Hall of Fame</Text>
              <Text style={[styles.gateDesc, { color: colors.textSecondary }]}>
                See when your friends hit PRs in real time — exercise, weight, gym, and the song that was playing.
              </Text>
              <Button
                title="Upgrade to Forge Pro"
                variant="primary"
                onPress={() => {
                  haptics.lightTap();
                  navigation.navigate('SettingsMain');
                  setTimeout(() => navigation.navigate('PRHallOfFame'), 100);
                  // Navigate to paywall via Settings since ForgePaywall is in the Training stack
                  // A direct cross-stack navigation would require a shared navigator
                  navigation.getParent()?.navigate('Training', { screen: 'ForgePaywall' });
                }}
                style={styles.gateButton}
              />
            </GlassCard>
          )
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  list: {
    padding: SPACING.lg,
    gap: SPACING.md,
    paddingBottom: SPACING['4xl'],
  },
  listCompact: {
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  headerTitle: {
    marginBottom: SPACING.xs,
  },
  feedCard: {
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  feedCardCompact: {
    padding: SPACING.sm,
    gap: SPACING.xs,
    borderRadius: RADIUS.md,
  },
  feedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: SIGNAL.forge + '33',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 16,
    fontWeight: '700',
    color: SIGNAL.forge,
  },
  feedMeta: {
    flex: 1,
    gap: 2,
  },
  friendName: {
    fontSize: 14,
    fontWeight: '700',
  },
  friendHandle: {
    fontSize: 12,
  },
  prBadge: {
    borderRadius: 6,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  prBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  prRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingVertical: SPACING.xs,
  },
  prRowCompact: {
    paddingVertical: 2,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '700',
  },
  weight: {
    fontSize: 20,
    fontWeight: '900',
  },
  contextRow: {
    gap: 4,
  },
  contextText: {
    fontSize: 12,
  },
  emptyCard: {
    alignItems: 'center',
    padding: SPACING.xl,
    gap: SPACING.sm,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  emptyDesc: {
    fontSize: 14,
    textAlign: 'center',
  },
  gateCard: {
    alignItems: 'center',
    padding: SPACING.xl,
    gap: SPACING.md,
  },
  gateBadge: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2,
  },
  gateTitle: {
    fontSize: 22,
    fontWeight: '800',
  },
  gateDesc: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  gateButton: {
    marginTop: SPACING.xs,
    minWidth: 200,
  },
});
