/**
 * DailyVibeCard
 * A daily curated pairing of training focus + music energy.
 * Rotates by dayOfYear % 7. Unique to BarbellBeats.
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { CompositeNavigationProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { usePreferences, MusicGenre } from '../contexts/PreferencesContext';
import { Icon } from './Icon';
import { SPACING, RADIUS, TYPOGRAPHY, COLORS } from '../theme/tokens';
import { useThemeMode } from '../contexts/ThemeContext';
import type {
  TabParamList,
  HomeStackParamList,
  TrainingStackParamList,
  MusicStackParamList,
} from '../types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type DailyVibeNav = CompositeNavigationProp<
  NativeStackNavigationProp<HomeStackParamList>,
  CompositeNavigationProp<
    BottomTabNavigationProp<TabParamList>,
    CompositeNavigationProp<
      NativeStackNavigationProp<TrainingStackParamList>,
      NativeStackNavigationProp<MusicStackParamList>
    >
  >
>;

type VibeEntry = {
  trainingFocus: string;
  musicPairing: string;
  bpmRange: string;
  accentColor: string;
  navTarget: 'workout' | 'cardio' | 'music';
};

// ---------------------------------------------------------------------------
// Daily vibe table (7 entries, rotated by dayOfYear % 7)
// ---------------------------------------------------------------------------

const VIBES: VibeEntry[] = [
  {
    trainingFocus: 'Push Day',
    musicPairing: 'Hip-Hop / Trap',
    bpmRange: '130–145 BPM',
    accentColor: '#FF6B35',   // Forge Orange
    navTarget: 'workout',
  },
  {
    trainingFocus: 'Pull Day',
    musicPairing: 'Rock / Metal',
    bpmRange: '140–160 BPM',
    accentColor: '#00D9F5',   // Resonance Cyan
    navTarget: 'workout',
  },
  {
    trainingFocus: 'Leg Day',
    musicPairing: 'EDM / Electronic',
    bpmRange: '128–140 BPM',
    accentColor: '#FFD700',   // Gold
    navTarget: 'workout',
  },
  {
    trainingFocus: 'Cardio',
    musicPairing: 'Pop / Electronic',
    bpmRange: '120–130 BPM',
    accentColor: '#FF6B35',
    navTarget: 'cardio',
  },
  {
    trainingFocus: 'Upper Body',
    musicPairing: 'Hip-Hop / R&B',
    bpmRange: '95–115 BPM',
    accentColor: '#00D9F5',
    navTarget: 'workout',
  },
  {
    trainingFocus: 'Full Body',
    musicPairing: 'Mixed',
    bpmRange: '125–145 BPM',
    accentColor: '#FFD700',
    navTarget: 'workout',
  },
  {
    trainingFocus: 'Rest & Mobility',
    musicPairing: 'Lo-fi / Ambient',
    bpmRange: '70–90 BPM',
    accentColor: '#FF6B35',
    navTarget: 'music',
  },
];

// If user's music genre matches a day's pairing, prefer that day's entry.
const GENRE_AFFINITY: Record<MusicGenre, number[]> = {
  hiphop: [0, 4],   // Push Day, Upper Body
  rock:   [1],       // Pull Day
  edm:    [2, 3],   // Leg Day, Cardio
  mixed:  [5],       // Full Body
};

function getDayOfYear(date: Date) {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

type Props = {
  style?: object;
};

export default function DailyVibeCard({ style }: Props) {
  const navigation = useNavigation<DailyVibeNav>();
  const { preferences } = usePreferences();
  const { isDark } = useThemeMode();
  const colors = isDark ? COLORS.dark : COLORS.light;

  const vibe = useMemo(() => {
    const day = getDayOfYear(new Date());
    const genre = preferences.musicGenre;

    // If user has a genre preference, bias toward a matching day this week
    if (genre) {
      const affinityDays = GENRE_AFFINITY[genre];
      // Check if any affinity day falls within ±1 of today's rotation
      const baseIndex = day % 7;
      for (const affinityIndex of affinityDays) {
        if (Math.abs(affinityIndex - baseIndex) <= 1) {
          return VIBES[affinityIndex];
        }
      }
    }

    return VIBES[day % 7];
  }, [preferences.musicGenre]);

  const handlePress = () => {
    if (vibe.navTarget === 'workout') {
      navigation.navigate('Training', { screen: 'WorkoutTemplates' });
    } else if (vibe.navTarget === 'cardio') {
      navigation.navigate('Training', { screen: 'CardioTypeSelection' });
    } else {
      navigation.navigate('Music', { screen: 'MusicMain' });
    }
  };

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.container,
        { backgroundColor: isDark ? colors.surface : '#FFFFFF' },
        pressed && { opacity: 0.92, transform: [{ scale: 0.98 }] },
        style,
      ]}
      accessibilityRole="button"
      accessibilityLabel={`Today's vibe: ${vibe.trainingFocus} with ${vibe.musicPairing}`}
    >
      {/* Left accent bar */}
      <View style={[styles.accentBar, { backgroundColor: vibe.accentColor }]} />

      <View style={styles.body}>
        {/* Badge row */}
        <View style={styles.badgeRow}>
          <View style={[styles.badge, { backgroundColor: vibe.accentColor + '22' }]}>
            <Text style={[styles.badgeText, { color: vibe.accentColor }]}>TODAY'S VIBE</Text>
          </View>
        </View>

        {/* Training focus */}
        <Text style={[styles.focusLabel, { color: colors.textPrimary }]}>
          {vibe.trainingFocus}
        </Text>

        {/* Music pairing */}
        <View style={styles.musicRow}>
          <Icon name="music-notes" size="xs" color={colors.textSecondary} />
          <Text style={[styles.musicLabel, { color: colors.textSecondary }]}>
            {vibe.musicPairing} · {vibe.bpmRange}
          </Text>
        </View>
      </View>

      {/* Chevron */}
      <Icon name="caret-right" size="sm" color={colors.textTertiary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  accentBar: {
    width: 4,
    alignSelf: 'stretch',
  },
  body: {
    flex: 1,
    padding: SPACING.base,
    gap: SPACING.xs,
  },
  badgeRow: {
    flexDirection: 'row',
  },
  badge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  focusLabel: {
    fontSize: TYPOGRAPHY.sizes['2xl'],
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  musicRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  musicLabel: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: '500',
  },
});
