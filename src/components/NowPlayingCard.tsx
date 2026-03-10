/**
 * NowPlayingCard Component
 * Displays the currently playing track with animated glow effect
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Image } from 'expo-image';
import { QueueSong } from '../types';
import { IOSCard, Badge } from './UI';
import { useThemeMode } from '../contexts/ThemeContext';
import { usePreferences } from '../contexts/PreferencesContext';
import { COLORS, IOS_COLORS, SIGNAL, SPACING, LAYOUT, TYPOGRAPHY, RADIUS } from '../theme/tokens';

export interface NowPlayingCardProps {
  track: QueueSong;
  compact?: boolean;
}

export function NowPlayingCard({ track, compact = false }: NowPlayingCardProps) {
  const { isDark } = useThemeMode();
  const { preferences } = usePreferences();
  const colors = isDark ? COLORS.dark : COLORS.light;
  const iosColors = isDark ? IOS_COLORS.dark : IOS_COLORS.light;
  const glowOpacity = useRef(new Animated.Value(0.15)).current;

  useEffect(() => {
    if (preferences.reduceMotion) {
      glowOpacity.setValue(0.2);
      return;
    }

    // Resonance pulse — slower, more ambient than a hard glow
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(glowOpacity, { toValue: 0.55, duration: 1800, useNativeDriver: true }),
        Animated.timing(glowOpacity, { toValue: 0.12, duration: 1800, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [glowOpacity, preferences.reduceMotion]);

  return (
    <IOSCard style={[styles.card, compact && styles.cardCompact]}>
      {/* Resonance cyan glow — signals "music is active" */}
      <Animated.View style={[styles.glow, { opacity: glowOpacity }]} />
      {/* Left cyan signal bar — vertical accent line */}
      <View style={[styles.signalBar, { backgroundColor: SIGNAL.resonance }]} />
      <View style={styles.header}>
        <Badge label="Now Playing" variant="info" />
      </View>
      <View style={styles.row}>
        <View style={[styles.cover, { backgroundColor: colors.surfaceAlt }]}>
          {track.albumArt ? (
            <Image source={{ uri: track.albumArt }} style={styles.coverImage} contentFit="cover" />
          ) : (
            <Text style={[styles.coverIcon, { color: SIGNAL.resonance }]}>♪</Text>
          )}
        </View>
        <View style={styles.info}>
          <Text style={[styles.title, { color: iosColors.label }]} numberOfLines={1}>
            {track.title}
          </Text>
          <Text style={[styles.artist, { color: iosColors.secondaryLabel }]} numberOfLines={1}>
            {track.artist}
          </Text>
        </View>
      </View>
      {/* Progress bar — resonance cyan fill */}
      <View style={[styles.progressBar, { backgroundColor: colors.surfaceAlt }]}>
        <View style={[styles.progressFill, { backgroundColor: SIGNAL.resonance, width: '45%' }]} />
      </View>
    </IOSCard>
  );
}

const styles = StyleSheet.create({
  card: {
    margin: LAYOUT.screenPadding,
    marginBottom: SPACING.md,
    position: 'relative',
    overflow: 'hidden',
    paddingLeft: SPACING.xl,  // Extra left padding to clear the signal bar
  },
  cardCompact: {
    margin: SPACING.base,
    marginBottom: SPACING.sm,
  },
  glow: {
    ...StyleSheet.absoluteFillObject,
    // Resonance cyan — music is "cold signal", not "hot forge"
    backgroundColor: SIGNAL.resonanceDim,
  },
  // 2px left-edge accent bar — the visual signature for music context
  signalBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    borderRadius: 0,
  },
  header: {
    marginBottom: SPACING.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  cover: {
    width: 52,
    height: 52,
    borderRadius: RADIUS.xs,   // Sharp corner — album art isn't a circle
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverImage: {
    width: 52,
    height: 52,
  },
  coverIcon: {
    fontSize: 20,
  },
  info: {
    flex: 1,
  },
  title: {
    ...TYPOGRAPHY.presets.bodyBold,
    marginBottom: 3,
  },
  artist: {
    ...TYPOGRAPHY.presets.caption,
    letterSpacing: 0.3,
  },
  progressBar: {
    height: 2,
    borderRadius: 0,     // Sharp — precise progress indicator
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
  },
});

export default NowPlayingCard;
