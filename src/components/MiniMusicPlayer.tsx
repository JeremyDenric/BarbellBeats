/**
 * Mini Music Player
 * Compact music player showing current track and controls
 */

import React from 'react';
import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeMode } from '../contexts/ThemeContext';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS } from '../theme/tokens';

// ============================================================================
// Types
// ============================================================================

interface MiniMusicPlayerProps {
  // Track info
  title?: string;
  artist?: string;
  albumArt?: string;
  isPlaying?: boolean;

  // Controls
  onPlayPause?: () => void;
  onSkipPrevious?: () => void;
  onSkipNext?: () => void;

  // BPM sync
  bpmSyncEnabled?: boolean;
  targetBPM?: number;
  currentBPM?: number;

  // Style
  style?: any;
}

// ============================================================================
// Component
// ============================================================================

export function MiniMusicPlayer({
  title = 'No track playing',
  artist = '',
  albumArt,
  isPlaying = false,
  onPlayPause,
  onSkipPrevious,
  onSkipNext,
  bpmSyncEnabled = false,
  targetBPM,
  currentBPM,
  style,
}: MiniMusicPlayerProps) {
  const { isDark } = useThemeMode();
  const colors = isDark ? COLORS.dark : COLORS.light;

  const renderAlbumArt = () => {
    if (albumArt) {
      return (
        <Image
          source={{ uri: albumArt }}
          style={styles.albumArt}
          resizeMode="cover"
        />
      );
    }

    return (
      <View style={[styles.albumArtPlaceholder, { backgroundColor: colors.surfaceElevated }]}>
        <Ionicons name="musical-notes" size={20} color={colors.textSecondary} />
      </View>
    );
  };

  const renderBPMSync = () => {
    if (!bpmSyncEnabled) return null;

    const isInSync = targetBPM && currentBPM && Math.abs(targetBPM - currentBPM) <= 5;

    return (
      <View style={styles.bpmContainer}>
        <View style={[styles.bpmIndicator, { backgroundColor: isInSync ? COLORS.light.success : colors.border }]} />
        <Text style={[styles.bpmText, { color: colors.textSecondary }]}>
          {targetBPM ? `${targetBPM} BPM` : 'Syncing...'}
        </Text>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }, style]}>
      <View style={styles.trackInfo}>
        {renderAlbumArt()}
        <View style={styles.textContainer}>
          <Text style={[styles.title, { color: colors.textPrimary }]} numberOfLines={1}>
            {title}
          </Text>
          {artist ? (
            <Text style={[styles.artist, { color: colors.textSecondary }]} numberOfLines={1}>
              {artist}
            </Text>
          ) : null}
          {renderBPMSync()}
        </View>
      </View>

      <View style={styles.controls}>
        {onSkipPrevious && (
          <Pressable
            onPress={onSkipPrevious}
            style={({ pressed }) => [styles.controlButton, pressed && styles.controlButtonPressed]}
            hitSlop={8}
          >
            <Ionicons name="play-back" size={20} color={colors.textPrimary} />
          </Pressable>
        )}

        {onPlayPause && (
          <Pressable
            onPress={onPlayPause}
            style={({ pressed }) => [
              styles.playPauseButton,
              { backgroundColor: colors.primary },
              pressed && styles.controlButtonPressed,
            ]}
            hitSlop={8}
          >
            <Ionicons
              name={isPlaying ? 'pause' : 'play'}
              size={20}
              color={COLORS.light.background}
            />
          </Pressable>
        )}

        {onSkipNext && (
          <Pressable
            onPress={onSkipNext}
            style={({ pressed }) => [styles.controlButton, pressed && styles.controlButtonPressed]}
            hitSlop={8}
          >
            <Ionicons name="play-forward" size={20} color={colors.textPrimary} />
          </Pressable>
        )}
      </View>
    </View>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    gap: SPACING.md,
  },
  trackInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    minWidth: 0,
  },
  albumArt: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.sm,
  },
  albumArtPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    ...TYPOGRAPHY.presets.bodyBold,
    marginBottom: 2,
  },
  artist: {
    ...TYPOGRAPHY.presets.caption,
  },
  bpmContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  bpmIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  bpmText: {
    ...TYPOGRAPHY.presets.caption,
    fontSize: 11,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  controlButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
  },
  controlButtonPressed: {
    opacity: 0.7,
  },
  playPauseButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
  },
});
