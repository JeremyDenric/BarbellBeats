/**
 * QuickWinsCard
 * Dismissible first-time user checklist shown on the Home screen.
 * Celebrates completion and auto-dismisses after all items are checked.
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { CompositeNavigationProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useQuickWins, QUICK_WIN_DEFS, QuickWinKey } from '../hooks/useQuickWins';
import { Icon } from './Icon';
import { SPACING, RADIUS, TYPOGRAPHY, COLORS } from '../theme/tokens';
import { useThemeMode } from '../contexts/ThemeContext';
import haptics from '../utils/haptics';
import type {
  TabParamList,
  HomeStackParamList,
  TrainingStackParamList,
  MusicStackParamList,
} from '../types';

type QuickWinsNav = CompositeNavigationProp<
  NativeStackNavigationProp<HomeStackParamList>,
  CompositeNavigationProp<
    BottomTabNavigationProp<TabParamList>,
    CompositeNavigationProp<
      NativeStackNavigationProp<TrainingStackParamList>,
      NativeStackNavigationProp<MusicStackParamList>
    >
  >
>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyNav = any;

const WIN_NAV_ACTIONS: Record<QuickWinKey, (nav: AnyNav) => void> = {
  first_workout:   (nav) => nav.navigate('Training', { screen: 'WorkoutTemplates' }),
  voted_song:      (nav) => nav.navigate('Music', { screen: 'MusicMain' }),
  connect_spotify: (nav) => nav.navigate('Music', { screen: 'SpotifyConnect' }),
  add_friend:      (nav) => nav.navigate('Profile'),
  first_cardio:    (nav) => nav.navigate('Training', { screen: 'CardioTypeSelection' }),
};

type Props = { style?: object };

export default function QuickWinsCard({ style }: Props) {
  const navigation = useNavigation<QuickWinsNav>();
  const { wins, isDismissed, isLoaded, completedCount, totalCount, allComplete, dismiss } =
    useQuickWins();
  const { isDark } = useThemeMode();
  const colors = isDark ? COLORS.dark : COLORS.light;
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // Auto-dismiss with fade when all complete
  useEffect(() => {
    if (!allComplete) return;
    haptics.success();
    const timer = setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }).start(() => dismiss());
    }, 2000);
    return () => clearTimeout(timer);
  }, [allComplete, dismiss, fadeAnim]);

  if (!isLoaded || isDismissed) return null;

  const progressFraction = completedCount / totalCount;

  const handleItemPress = (key: QuickWinKey) => {
    haptics.lightTap();
    WIN_NAV_ACTIONS[key](navigation);
  };

  return (
    <Animated.View style={[{ opacity: fadeAnim }, style]}>
      <View
        style={[
          styles.card,
          { backgroundColor: isDark ? colors.surface : '#FFFFFF' },
        ]}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={[styles.title, { color: colors.textPrimary }]}>Get Started</Text>
            <Text style={[styles.fraction, { color: colors.textSecondary }]}>
              {completedCount} / {totalCount}
            </Text>
          </View>
          <Pressable
            onPress={() => { haptics.lightTap(); dismiss(); }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel="Dismiss quick wins"
          >
            <Text style={[styles.dismissText, { color: colors.textTertiary }]}>Dismiss</Text>
          </Pressable>
        </View>

        {/* Progress bar */}
        <View style={[styles.progressTrack, { backgroundColor: colors.surfaceAlt }]}>
          <Animated.View
            style={[
              styles.progressFill,
              {
                backgroundColor: colors.primary,
                width: `${Math.round(progressFraction * 100)}%`,
              },
            ]}
          />
        </View>

        {/* Checklist items */}
        <View style={styles.itemList}>
          {QUICK_WIN_DEFS.map((def) => {
            const done = wins[def.key];
            return (
              <Pressable
                key={def.key}
                onPress={() => handleItemPress(def.key)}
                style={({ pressed }) => [styles.item, pressed && { opacity: 0.75 }]}
                accessibilityRole="button"
                accessibilityLabel={`${def.label}${done ? ', completed' : ''}`}
                accessibilityState={{ checked: done }}
              >
                <View
                  style={[
                    styles.checkbox,
                    done
                      ? { backgroundColor: colors.primary, borderColor: colors.primary }
                      : { backgroundColor: 'transparent', borderColor: colors.border },
                  ]}
                >
                  {done && <Icon name="check" size="xs" color="#0A0A0F" />}
                </View>
                <Text
                  style={[
                    styles.itemLabel,
                    { color: done ? colors.textTertiary : colors.textPrimary },
                    done && styles.itemLabelDone,
                  ]}
                >
                  {def.label}
                </Text>
                {!done && (
                  <Icon name="caret-right" size="xs" color={colors.textTertiary} />
                )}
              </Pressable>
            );
          })}
        </View>

        {/* Completion message */}
        {allComplete && (
          <View style={[styles.completionBanner, { backgroundColor: colors.primary + '22' }]}>
            <Text style={[styles.completionText, { color: colors.primary }]}>
              🎉 You're off to a great start!
            </Text>
          </View>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: RADIUS.lg,
    padding: SPACING.base,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
    gap: SPACING.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  title: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: '700',
  },
  fraction: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: '600',
  },
  dismissText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: '500',
  },
  progressTrack: {
    height: 4,
    borderRadius: RADIUS.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: RADIUS.full,
  },
  itemList: {
    gap: 2,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    gap: SPACING.sm,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemLabel: {
    flex: 1,
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: '500',
  },
  itemLabelDone: {
    textDecorationLine: 'line-through',
  },
  completionBanner: {
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    alignItems: 'center',
  },
  completionText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: '700',
  },
});
