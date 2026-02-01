/**
 * SkeletonLoader
 * Animated loading placeholders for better UX during data fetching
 */

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, ViewStyle, StyleProp } from 'react-native';
import { useThemeMode } from '../contexts/ThemeContext';
import { COLORS, RADIUS, SPACING } from '../theme/tokens';

interface SkeletonLoaderProps {
  variant?: 'text' | 'card' | 'circle' | 'rect';
  width?: number | string;
  height?: number;
  style?: StyleProp<ViewStyle>;
}

export function SkeletonLoader({
  variant = 'rect',
  width = '100%',
  height = 20,
  style,
}: SkeletonLoaderProps) {
  const { isDark } = useThemeMode();
  const colors = isDark ? COLORS.dark : COLORS.light;
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );

    animation.start();

    return () => {
      animation.stop();
    };
  }, [opacity]);

  const getVariantStyle = (): ViewStyle => {
    switch (variant) {
      case 'text':
        return {
          height: 16,
          borderRadius: RADIUS.sm,
        };
      case 'card':
        return {
          height: 120,
          borderRadius: RADIUS.lg,
        };
      case 'circle':
        return {
          width: height,
          height,
          borderRadius: height / 2,
        };
      case 'rect':
      default:
        return {
          height,
          borderRadius: RADIUS.md,
        };
    }
  };

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          backgroundColor: colors.surfaceAlt,
          opacity,
          width,
        } as any,
        getVariantStyle(),
        style,
      ]}
    />
  );
}

/**
 * Common skeleton patterns for different UI elements
 */

interface SkeletonListItemProps {
  style?: ViewStyle;
}

export function SkeletonListItem({ style }: SkeletonListItemProps) {
  return (
    <View style={[styles.listItem, style]}>
      <SkeletonLoader variant="circle" height={48} style={styles.listItemAvatar} />
      <View style={styles.listItemContent}>
        <SkeletonLoader variant="text" width="70%" height={18} style={styles.listItemTitle} />
        <SkeletonLoader variant="text" width="50%" height={14} />
      </View>
    </View>
  );
}

interface SkeletonCardProps {
  style?: ViewStyle;
}

export function SkeletonCard({ style }: SkeletonCardProps) {
  return (
    <View style={[styles.card, style]}>
      <SkeletonLoader variant="text" width="40%" height={20} style={styles.cardTitle} />
      <SkeletonLoader variant="text" width="90%" height={16} style={styles.cardLine} />
      <SkeletonLoader variant="text" width="75%" height={16} style={styles.cardLine} />
      <SkeletonLoader variant="text" width="85%" height={16} />
    </View>
  );
}

interface SkeletonPlaylistProps {
  count?: number;
  style?: ViewStyle;
}

export function SkeletonPlaylist({ count = 5, style }: SkeletonPlaylistProps) {
  return (
    <View style={style}>
      {Array.from({ length: count }).map((_, index) => (
        <View key={index} style={styles.playlistItem}>
          <SkeletonLoader variant="rect" width={48} height={48} style={styles.playlistCover} />
          <View style={styles.playlistInfo}>
            <SkeletonLoader variant="text" width="80%" height={16} style={styles.playlistTitle} />
            <SkeletonLoader variant="text" width="60%" height={14} />
          </View>
          <View style={styles.playlistActions}>
            <SkeletonLoader variant="circle" height={32} />
            <SkeletonLoader variant="text" width={40} height={16} />
            <SkeletonLoader variant="circle" height={32} />
          </View>
        </View>
      ))}
    </View>
  );
}

interface SkeletonGridProps {
  columns?: number;
  rows?: number;
  style?: ViewStyle;
}

export function SkeletonGrid({ columns = 2, rows = 3, style }: SkeletonGridProps) {
  return (
    <View style={[styles.grid, style]}>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <View key={rowIndex} style={styles.gridRow}>
          {Array.from({ length: columns }).map((_, colIndex) => (
            <SkeletonLoader
              key={colIndex}
              variant="card"
              style={[styles.gridItem, { flex: 1 / columns }]}
            />
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  skeleton: {
    overflow: 'hidden',
  },
  // List Item
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    gap: SPACING.md,
  },
  listItemAvatar: {
    flexShrink: 0,
  },
  listItemContent: {
    flex: 1,
    gap: SPACING.xs,
  },
  listItemTitle: {
    marginBottom: SPACING.xs,
  },
  // Card
  card: {
    padding: SPACING.lg,
    gap: SPACING.sm,
  },
  cardTitle: {
    marginBottom: SPACING.sm,
  },
  cardLine: {
    marginBottom: SPACING.xs,
  },
  // Playlist
  playlistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    gap: SPACING.md,
  },
  playlistCover: {
    flexShrink: 0,
  },
  playlistInfo: {
    flex: 1,
    gap: SPACING.xs,
  },
  playlistTitle: {
    marginBottom: SPACING.xs,
  },
  playlistActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  // Grid
  grid: {
    gap: SPACING.md,
  },
  gridRow: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  gridItem: {
    marginHorizontal: SPACING.xs,
  },
});
