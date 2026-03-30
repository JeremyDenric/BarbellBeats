import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Linking, Image } from 'react-native';
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
import { Icon } from '../components/Icon';
import { COLORS, SPACING, TYPOGRAPHY, LAYOUT, RADIUS, SIGNAL } from '../theme/tokens';
import { listGyms } from '../services/gymApi';
import { loadPrMoments } from '../utils/prSongsStorage';
import { sharePrMoment } from '../utils/musicShare';
import haptics from '../utils/haptics';
import type { MusicStackParamList, PRMoment } from '../types';

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

  const [prMoments, setPrMoments] = useState<PRMoment[]>([]);

  useEffect(() => {
    loadPrMoments().then(setPrMoments).catch(() => {});
  }, []);

  // Deduplicate by song URI — show each song once with the most recent PR label
  const prPlaylist = useMemo(() => {
    const seen = new Map<string, PRMoment>();
    for (const m of prMoments) {
      if (!m.song) continue;
      if (!seen.has(m.song.uri)) {
        seen.set(m.song.uri, m);
      }
    }
    return Array.from(seen.values());
  }, [prMoments]);

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

        <SectionDivider label="PR Playlist" />

        <GlassCard style={[styles.card, compact && styles.cardCompact]} intensity={16}>
          <View style={styles.prPlaylistHeader}>
            <Icon name="trophy" size="sm" color={SIGNAL.forge} />
            <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>PR Soundtrack</Text>
          </View>
          <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
            Songs playing at the gym when you hit personal records.
          </Text>
          {prPlaylist.length === 0 ? (
            <Text style={[styles.prEmptyText, { color: colors.textTertiary }]}>
              Hit a PR at the gym to start your soundtrack 🎵
            </Text>
          ) : (
            <View style={styles.prList}>
              {prPlaylist.map((moment) => (
                <View
                  key={moment.song!.uri}
                  style={[styles.prTrackRow, { borderBottomColor: colors.border }]}
                >
                  {/* Album art — taps open Spotify */}
                  <Pressable
                    onPress={() => {
                      haptics.lightTap();
                      Linking.openURL(moment.song!.uri).catch(() => {});
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={`Open ${moment.song!.title} in Spotify`}
                  >
                    {moment.song!.albumArt ? (
                      <Image
                        source={{ uri: moment.song!.albumArt }}
                        style={styles.prAlbumArt}
                      />
                    ) : (
                      <View style={[styles.prAlbumArt, styles.prAlbumArtPlaceholder, { backgroundColor: colors.surfaceAlt }]}>
                        <Icon name="music-note" size="sm" color={colors.textTertiary} />
                      </View>
                    )}
                  </Pressable>

                  {/* Song info — taps open Spotify */}
                  <Pressable
                    style={styles.prTrackInfo}
                    onPress={() => {
                      haptics.lightTap();
                      Linking.openURL(moment.song!.uri).catch(() => {});
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={`Open ${moment.song!.title} in Spotify`}
                  >
                    <Text style={[styles.prTrackTitle, { color: colors.textPrimary }]} numberOfLines={1}>
                      {moment.song!.title}
                    </Text>
                    <Text style={[styles.prTrackArtist, { color: colors.textSecondary }]} numberOfLines={1}>
                      {moment.song!.artist}
                    </Text>
                  </Pressable>

                  <View style={[styles.prBadge, { backgroundColor: SIGNAL.forge + '22', borderColor: SIGNAL.forge + '44' }]}>
                    <Text style={[styles.prBadgeText, { color: SIGNAL.forge }]} numberOfLines={1}>
                      {moment.exerciseName}
                    </Text>
                  </View>

                  {/* Share this PR moment */}
                  <Pressable
                    onPress={() => {
                      haptics.lightTap();
                      sharePrMoment(moment).catch(() => {});
                    }}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    accessibilityRole="button"
                    accessibilityLabel={`Share ${moment.exerciseName} PR`}
                  >
                    <Icon name="share" size="sm" color={colors.textTertiary} />
                  </Pressable>
                </View>
              ))}
            </View>
          )}
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
    color: '#F0F0F5',
    textShadowColor: 'rgba(203, 255, 0, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  sectionSubtitle: {
    color: '#9B9BAD',
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
  prPlaylistHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  prEmptyText: {
    ...TYPOGRAPHY.presets.caption,
    fontStyle: 'italic',
    marginTop: SPACING.xs,
  },
  prList: {
    marginTop: SPACING.xs,
  },
  prTrackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  prAlbumArt: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.sm,
  },
  prAlbumArtPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  prTrackInfo: {
    flex: 1,
    minWidth: 0,
  },
  prTrackTitle: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
  prTrackArtist: {
    fontSize: TYPOGRAPHY.sizes.xs,
    marginTop: 2,
  },
  prBadge: {
    borderRadius: RADIUS.full,
    borderWidth: 1,
    paddingHorizontal: SPACING.xs,
    paddingVertical: 3,
    maxWidth: 110,
  },
  prBadgeText: {
    fontSize: 11,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
});
