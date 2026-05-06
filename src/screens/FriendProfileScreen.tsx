import React, { useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, Share } from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import { useThemeMode } from '../contexts/ThemeContext';
import { Button, GlassCard, SectionHeader, Badge, EmptyState } from '../components/UI';
import { COLORS, SPACING, TYPOGRAPHY, LAYOUT, RADIUS, SIGNAL } from '../theme/tokens';
import haptics from '../utils/haptics';
import { FRIEND_PROFILES } from '../data/friends';
import type { ProfileStackParamList } from '../types';

type RouteParams = RouteProp<ProfileStackParamList, 'FriendProfile'>;

export default function FriendProfileScreen() {
  const route = useRoute<RouteParams>();
  const { isDark } = useThemeMode();
  const colors = isDark ? COLORS.dark : COLORS.light;

  const profile = useMemo(
    () => FRIEND_PROFILES.find((item) => item.id === route.params.friendId),
    [route.params.friendId]
  );

  const handleChallenge = useCallback(async () => {
    if (!profile) return;
    haptics.mediumTap();
    const topPr = profile.prs[0];
    const prLine = topPr ? ` Can you beat their ${topPr.label} of ${topPr.value}?` : '';
    await Share.share({
      message: `I challenged ${profile.name} on BarbellBeats!${prLine} barbellbeats://training/prs`,
      title: `Challenge ${profile.name}`,
    });
  }, [profile]);

  const handleInvite = useCallback(async () => {
    if (!profile) return;
    haptics.lightTap();
    await Share.share({
      message: `Hey ${profile.name}, let's train together on BarbellBeats! barbellbeats://training/templates`,
      title: 'Workout invite',
    });
  }, [profile]);

  if (!profile) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <EmptyState title="Friend not found" message="Try selecting another profile." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <SectionHeader
          title={profile.name}
          subtitle={`${profile.handle} · ${profile.homeGym}`}
          titleStyle={styles.sectionTitle}
          subtitleStyle={styles.sectionSubtitle}
        />

        <GlassCard style={styles.card} intensity={16}>
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>About</Text>
          <Text style={[styles.cardBody, { color: colors.textSecondary }]}>{profile.bio}</Text>
          <View style={styles.badgeRow}>
            {profile.goals.map((goal) => (
              <Badge key={goal} label={goal} variant="primary" size="small" />
            ))}
          </View>
        </GlassCard>

        <View style={styles.statsRow}>
          <GlassCard style={styles.statCard} intensity={14}>
            <Text style={[styles.statValue, { color: colors.textPrimary }]}>
              {profile.weeklyWorkouts}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Workouts/week</Text>
          </GlassCard>
          <GlassCard style={styles.statCard} intensity={14}>
            <Text style={[styles.statValue, { color: colors.textPrimary }]}>
              {profile.streakWeeks}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Week streak</Text>
          </GlassCard>
        </View>

        <GlassCard style={styles.card} intensity={16}>
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Personal records</Text>
          {profile.prs.map((pr) => (
            <View key={pr.label} style={styles.listRow}>
              <Text style={[styles.listLabel, { color: colors.textSecondary }]}>{pr.label}</Text>
              <Text style={[styles.listValue, { color: colors.textPrimary }]}>{pr.value}</Text>
            </View>
          ))}
        </GlassCard>

        <GlassCard style={styles.card} intensity={16}>
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Favorite tracks</Text>
          {profile.favoriteTracks.map((track) => (
            <View key={`${track.title}-${track.artist}`} style={styles.listRow}>
              <Text style={[styles.listLabel, { color: colors.textSecondary }]}>{track.title}</Text>
              <Text style={[styles.listValue, { color: colors.textPrimary }]}>{track.artist}</Text>
            </View>
          ))}
        </GlassCard>

        <GlassCard style={styles.card} intensity={16}>
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Badges</Text>
          <View style={styles.badgeRow}>
            {profile.badges.map((badge) => (
              <Badge key={badge} label={badge} variant="success" size="small" />
            ))}
          </View>
        </GlassCard>

        <View style={styles.actionRow}>
          <Button
            title="Challenge"
            onPress={handleChallenge}
          />
          <Button
            title="Invite to workout"
            onPress={handleInvite}
            variant="secondary"
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
  },
  sectionTitle: {
    textShadowColor: SIGNAL.forgeGlow,
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  sectionSubtitle: {},
  card: {
    marginHorizontal: LAYOUT.screenPadding,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    gap: SPACING.sm,
  },
  cardTitle: {
    ...TYPOGRAPHY.presets.heading3,
  },
  cardBody: {
    ...TYPOGRAPHY.presets.body,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
    marginTop: SPACING.xs,
  },
  statsRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginHorizontal: LAYOUT.screenPadding,
  },
  statCard: {
    flex: 1,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    alignItems: 'center',
    gap: SPACING.xs,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 12,
  },
  listRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: SPACING.sm,
  },
  listLabel: {
    ...TYPOGRAPHY.presets.caption,
  },
  listValue: {
    ...TYPOGRAPHY.presets.bodyBold,
  },
  actionRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginHorizontal: LAYOUT.screenPadding,
  },
});
