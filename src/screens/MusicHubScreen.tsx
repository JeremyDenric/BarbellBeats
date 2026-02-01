import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { useThemeMode } from '../contexts/ThemeContext';
import { useGym } from '../contexts/GymContext';
import { useSpotify } from '../contexts/SpotifyContext';
import { usePreferences } from '../contexts/PreferencesContext';
import { Button, GlassCard } from '../components/UI';
import ScreenChrome from '../components/ScreenChrome';
import SectionDivider from '../components/SectionDivider';
import { COLORS, SPACING, TYPOGRAPHY, LAYOUT, RADIUS } from '../theme/tokens';
import { listGyms } from '../services/gymApi';
import type { MusicStackParamList } from '../types';

type MusicNav = NativeStackNavigationProp<MusicStackParamList>;

export default function MusicHubScreen() {
  const navigation = useNavigation<MusicNav>();
  const { isDark } = useThemeMode();
  const colors = isDark ? COLORS.dark : COLORS.light;
  const { preferences } = usePreferences();
  const compact = preferences.compactMode;
  const { activeGymId } = useGym();
  const { isConnected, user } = useSpotify();

  const { data: gyms } = useQuery({
    queryKey: ['gyms'],
    queryFn: () => listGyms(),
    staleTime: 1000 * 60 * 5,
  });

  const activeGym = useMemo(
    () => gyms?.find((gym) => gym.id === activeGymId),
    [gyms, activeGymId]
  );

  const handlePlaylist = () => {
    if (activeGymId) {
      navigation.navigate('GymPlaylist', { gymId: activeGymId });
      return;
    }
    navigation.navigate('GymPicker');
  };

  const handleSpotify = () => {
    navigation.navigate(isConnected ? 'Spotify' : 'SpotifyConnect');
  };

  return (
    <ScreenChrome withPadding={false}>
      <ScrollView
        contentContainerStyle={[styles.content, compact && styles.contentCompact]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.hero, compact && styles.heroCompact]}>
          <Text style={[styles.heroTitle, { color: colors.textPrimary }]}>Music</Text>
          <Text style={[styles.heroSubtitle, { color: colors.textSecondary }]}>
            Gym playlists, Spotify, and setlists
          </Text>
          <View style={[styles.statsRow, compact && styles.statsRowCompact]}>
            <View
              style={[
                styles.statPill,
                compact && styles.statPillCompact,
                { backgroundColor: colors.surfaceAlt, borderColor: colors.border },
              ]}
            >
              <Text style={[styles.statValue, compact && styles.statValueCompact, { color: colors.textPrimary }]}>
                {activeGym ? 'Live' : 'Select'}
              </Text>
              <Text style={[styles.statLabel, compact && styles.statLabelCompact, { color: colors.textTertiary }]}>
                Gym
              </Text>
            </View>
            <View
              style={[
                styles.statPill,
                compact && styles.statPillCompact,
                { backgroundColor: colors.surfaceAlt, borderColor: colors.border },
              ]}
            >
              <Text style={[styles.statValue, compact && styles.statValueCompact, { color: colors.textPrimary }]}>
                {isConnected ? 'Connected' : 'Off'}
              </Text>
              <Text style={[styles.statLabel, compact && styles.statLabelCompact, { color: colors.textTertiary }]}>
                Spotify
              </Text>
            </View>
          </View>
        </View>

        <SectionDivider label="Gym playlist" />

        <GlassCard style={[styles.card, compact && styles.cardCompact]} intensity={16}>
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Active gym</Text>
          <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
            {activeGym ? activeGym.name : 'Select a gym to unlock the live playlist.'}
          </Text>
          {activeGym && (
            <Text style={[styles.cardMeta, { color: colors.textTertiary }]}>
              {activeGym.address}
            </Text>
          )}
          <View style={[styles.buttonRow, compact && styles.buttonRowCompact]}>
            <Button title={activeGym ? 'Open Playlist' : 'Choose Gym'} onPress={handlePlaylist} />
            <Button title="Change Gym" onPress={() => navigation.navigate('GymPicker')} variant="secondary" />
          </View>
        </GlassCard>

        <SectionDivider label="Spotify access" />

        <GlassCard style={[styles.card, compact && styles.cardCompact]} intensity={16}>
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Spotify</Text>
          <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
            {isConnected
              ? `Connected as ${user?.display_name || 'Spotify user'}`
              : 'Connect Spotify to access your library.'}
          </Text>
          <Button
            title={isConnected ? 'Open Spotify' : 'Connect Spotify'}
            onPress={handleSpotify}
            variant={isConnected ? 'secondary' : 'primary'}
          />
        </GlassCard>

        <SectionDivider label="Setlists" />

        <GlassCard style={[styles.card, compact && styles.cardCompact]} intensity={16}>
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Setlists</Text>
          <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
            Build custom workout playlists and reuse them.
          </Text>
          <Button title="Open Setlists" onPress={() => navigation.navigate('Setlists')} variant="secondary" />
        </GlassCard>
      </ScrollView>
    </ScreenChrome>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: LAYOUT.screenPadding,
    paddingBottom: SPACING['4xl'],
    gap: SPACING.lg,
  },
  contentCompact: {
    paddingHorizontal: LAYOUT.screenPadding * 0.8,
    paddingBottom: SPACING['3xl'],
    gap: SPACING.md,
  },
  hero: {
    paddingTop: SPACING.lg,
    gap: SPACING.xs,
  },
  heroCompact: {
    paddingTop: SPACING.md,
    gap: SPACING.xs / 2,
  },
  heroTitle: {
    ...TYPOGRAPHY.presets.heading1,
  },
  heroSubtitle: {
    ...TYPOGRAPHY.presets.body,
  },
  statsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },
  statsRowCompact: {
    gap: SPACING.xs,
    marginTop: SPACING.xs,
  },
  statPill: {
    flex: 1,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    paddingVertical: 10,
    alignItems: 'center',
  },
  statPillCompact: {
    paddingVertical: 8,
  },
  statValue: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
  statValueCompact: {
    fontSize: TYPOGRAPHY.sizes.xs,
  },
  statLabel: {
    fontSize: TYPOGRAPHY.sizes.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  statLabelCompact: {
    fontSize: 10,
    letterSpacing: 0.3,
  },
  sectionTitle: {
    color: '#F5F7F2',
    textShadowColor: 'rgba(34, 197, 94, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  sectionSubtitle: {
    color: '#B9C2B0',
  },
  card: {
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    gap: SPACING.sm,
  },
  cardCompact: {
    padding: SPACING.md,
    gap: SPACING.xs,
  },
  cardTitle: {
    ...TYPOGRAPHY.presets.heading3,
  },
  cardSubtitle: {
    ...TYPOGRAPHY.presets.body,
  },
  cardMeta: {
    ...TYPOGRAPHY.presets.caption,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    flexWrap: 'wrap',
  },
  buttonRowCompact: {
    gap: SPACING.xs,
  },
});
