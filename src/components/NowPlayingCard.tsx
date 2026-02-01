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
import { IOS_COLORS, SPACING, LAYOUT } from '../theme/tokens';

export interface NowPlayingCardProps {
  track: QueueSong;
  compact?: boolean;
}

export function NowPlayingCard({ track, compact = false }: NowPlayingCardProps) {
  const { isDark } = useThemeMode();
  const { preferences } = usePreferences();
  const iosColors = isDark ? IOS_COLORS.dark : IOS_COLORS.light;
  const glowOpacity = useRef(new Animated.Value(0.2)).current;

  useEffect(() => {
    if (preferences.reduceMotion) {
      glowOpacity.setValue(0.3);
      return;
    }

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(glowOpacity, { toValue: 0.7, duration: 1200, useNativeDriver: true }),
        Animated.timing(glowOpacity, { toValue: 0.25, duration: 1200, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [glowOpacity, preferences.reduceMotion]);

  return (
    <IOSCard style={[styles.card, compact && styles.cardCompact]}>
      <Animated.View style={[styles.glow, { opacity: glowOpacity }]} />
      <View style={styles.header}>
        <Badge label="Now Playing" variant="success" icon="▶️" />
      </View>
      <View style={styles.row}>
        <View style={[styles.cover, { backgroundColor: iosColors.systemFill }]}>
          {track.albumArt ? (
            <Image source={{ uri: track.albumArt }} style={styles.coverImage} contentFit="cover" />
          ) : (
            <Text style={[styles.coverIcon, { color: iosColors.secondaryLabel }]}>♪</Text>
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
      <View style={[styles.progressBar, { backgroundColor: iosColors.systemFill }]}>
        <View style={[styles.progressFill, { backgroundColor: iosColors.tint, width: '45%' }]} />
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
  },
  cardCompact: {
    margin: SPACING.base,
    marginBottom: SPACING.sm,
  },
  glow: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(34, 197, 94, 0.18)',
  },
  header: {
    marginBottom: SPACING.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  cover: {
    width: 56,
    height: 56,
    borderRadius: 12,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverImage: {
    width: 56,
    height: 56,
  },
  coverIcon: {
    fontSize: 18,
    fontWeight: '600',
  },
  info: {
    flex: 1,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    lineHeight: 22,
    marginBottom: 4,
  },
  artist: {
    fontSize: 15,
    fontWeight: '400',
    lineHeight: 20,
  },
  progressBar: {
    height: 3,
    borderRadius: 1.5,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 1.5,
  },
});

export default NowPlayingCard;
