import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Dimensions,
} from 'react-native';
import { useNavigation, CompositeNavigationProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useThemeMode } from '../contexts/ThemeContext';
import { usePreferences } from '../contexts/PreferencesContext';
import { SectionHeader } from '../components/UI';
import ScreenChrome from '../components/ScreenChrome';
import SectionDivider from '../components/SectionDivider';
import { COLORS, SPACING, TYPOGRAPHY, LAYOUT, RADIUS } from '../theme/tokens';
import { EXTRA_FEATURES, type ExtraFeature } from '../data/extraFeatures';
import {
  TabParamList,
  HomeStackParamList,
  GymsStackParamList,
  TrainingStackParamList,
  MusicStackParamList,
} from '../types';

type FeaturesNavigationProp = CompositeNavigationProp<
  NativeStackNavigationProp<HomeStackParamList, 'Features'>,
  CompositeNavigationProp<
    BottomTabNavigationProp<TabParamList, 'Home'>,
    CompositeNavigationProp<
      NativeStackNavigationProp<GymsStackParamList>,
      CompositeNavigationProp<
        NativeStackNavigationProp<TrainingStackParamList>,
        NativeStackNavigationProp<MusicStackParamList>
      >
    >
  >
>;

const STRENGTH_VERSES = [
  {
    id: 'isaiah-40-31',
    reference: 'Isaiah 40:31',
    text: 'Those who hope in the Lord will renew their strength. They will soar on wings like eagles.',
  },
  {
    id: 'phil-4-13',
    reference: 'Philippians 4:13',
    text: 'I can do all things through Christ who strengthens me.',
  },
  {
    id: '2tim-1-7',
    reference: '2 Timothy 1:7',
    text: 'For God gave us a spirit not of fear but of power, love, and self-control.',
  },
  {
    id: 'psalm-18-32',
    reference: 'Psalm 18:32',
    text: 'It is God who arms me with strength and keeps my way secure.',
  },
  {
    id: 'nehemiah-8-10',
    reference: 'Nehemiah 8:10',
    text: 'Do not grieve, for the joy of the Lord is your strength.',
  },
];

const EXTRA_FEATURE_CATEGORIES = [
  {
    id: 'Training Intelligence',
    subtitle: 'Programs, coaching, and performance insights',
  },
  {
    id: 'Recovery & Wellness',
    subtitle: 'Sleep, soreness, and recovery support',
  },
  {
    id: 'Community & Challenges',
    subtitle: 'Social goals, streaks, and leaderboards',
  },
  {
    id: 'Gym Experience',
    subtitle: 'Crowd energy, events, and live vibes',
  },
  {
    id: 'Music & Energy',
    subtitle: 'BPM automation and intensity matching',
  },
  {
    id: 'Coaching & Creator',
    subtitle: 'Coach tools and creator workflows',
  },
];

function getDayOfYear(date: Date) {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

export default function FeaturesScreen() {
  const navigation = useNavigation<FeaturesNavigationProp>();
  const { isDark } = useThemeMode();
  const colors = isDark ? COLORS.dark : COLORS.light;
  const { preferences } = usePreferences();
  const compact = preferences.compactMode;
  const { width } = Dimensions.get('window');
  const horizontalPadding = compact ? LAYOUT.screenPadding * 0.8 : LAYOUT.screenPadding;
  const actionGap = compact ? SPACING.sm : SPACING.md;
  const cardWidth = useMemo(
    () => (width - horizontalPadding * 2 - actionGap) / 2,
    [width, horizontalPadding, actionGap]
  );
  const verseWidth = width - horizontalPadding * 2;
  const [keptVerses, setKeptVerses] = React.useState<string[]>([]);
  const verseCards = useMemo(() => {
    const offset = getDayOfYear(new Date()) % STRENGTH_VERSES.length;
    return [...STRENGTH_VERSES.slice(offset), ...STRENGTH_VERSES.slice(0, offset)];
  }, []);
  const categorizedExtras = useMemo(() => {
    const groups = new Map<string, ExtraFeature[]>();
    EXTRA_FEATURES.forEach((feature) => {
      const bucket = groups.get(feature.category) || [];
      bucket.push(feature);
      groups.set(feature.category, bucket);
    });
    return groups;
  }, []);

  return (
    <ScreenChrome withPadding={false}>
      <ScrollView
        contentContainerStyle={[styles.content, compact && styles.contentCompact]}
        showsVerticalScrollIndicator={false}
      >
        <SectionHeader
          title="Daily Strength Verse"
          subtitle="Swipe to explore and keep your favorites"
          titleStyle={styles.sectionTitle}
          subtitleStyle={styles.sectionSubtitle}
        />
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[styles.verseRow, compact && styles.verseRowCompact]}
        >
          {verseCards.map((verse) => (
            <View
              key={verse.id}
              style={[
                styles.verseCard,
                compact && styles.verseCardCompact,
                {
                  width: verseWidth,
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                },
              ]}
            >
              <Text style={[styles.verseReference, compact && styles.verseReferenceCompact, { color: colors.primary }]}>
                {verse.reference}
              </Text>
              <Text style={[styles.verseText, compact && styles.verseTextCompact, { color: colors.textPrimary }]}>
                {verse.text}
              </Text>
              <Pressable
                onPress={() =>
                  setKeptVerses((prev) =>
                    prev.includes(verse.id)
                      ? prev.filter((id) => id !== verse.id)
                      : [...prev, verse.id]
                  )
                }
                style={[
                  styles.keepButton,
                  compact && styles.keepButtonCompact,
                  {
                    borderColor: keptVerses.includes(verse.id) ? colors.primary : colors.border,
                    backgroundColor: keptVerses.includes(verse.id)
                      ? colors.primary + '20'
                      : colors.surfaceAlt,
                  },
                ]}
              >
                <Text style={[styles.keepButtonText, compact && styles.keepButtonTextCompact, { color: colors.textPrimary }]}>
                  {keptVerses.includes(verse.id) ? 'Kept' : 'Keep'}
                </Text>
              </Pressable>
            </View>
          ))}
        </ScrollView>

        <SectionDivider label="Jump back in" />

        <SectionHeader
          title="Quick Actions"
          subtitle="Jump into your workout features"
          titleStyle={styles.sectionTitle}
          subtitleStyle={styles.sectionSubtitle}
        />
        <View style={[styles.quickActionsGrid, compact && styles.quickActionsGridCompact]}>
          <Pressable
            style={({ pressed }) => [
              styles.actionCard,
              styles.actionCardSurface,
              compact && styles.actionCardCompact,
              { width: cardWidth },
              pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
            ]}
            onPress={() => navigation.navigate('Discover', { screen: 'GymListMain' })}
          >
            <View style={[styles.actionIcon, compact && styles.actionIconCompact, { backgroundColor: colors.primary + '20' }]}>
              <Text style={[styles.actionEmoji, compact && styles.actionEmojiCompact]}>🏋️</Text>
            </View>
            <Text style={[styles.actionTitle, compact && styles.actionTitleCompact, styles.sectionTitle]}>
              Browse Gyms
            </Text>
            <Text style={[styles.actionSubtitle, compact && styles.actionSubtitleCompact, styles.sectionSubtitle]}>
              Find nearby clubs
            </Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.actionCard,
              styles.actionCardSurface,
              compact && styles.actionCardCompact,
              { width: cardWidth },
              pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
            ]}
            onPress={() => navigation.navigate('Discover', { screen: 'Map' })}
          >
            <View style={[styles.actionIcon, compact && styles.actionIconCompact, { backgroundColor: colors.accentGreen + '20' }]}>
              <Text style={[styles.actionEmoji, compact && styles.actionEmojiCompact]}>📍</Text>
            </View>
            <Text style={[styles.actionTitle, compact && styles.actionTitleCompact, styles.sectionTitle]}>
              Map View
            </Text>
            <Text style={[styles.actionSubtitle, compact && styles.actionSubtitleCompact, styles.sectionSubtitle]}>
              Explore on map
            </Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.actionCard,
              styles.actionCardSurface,
              compact && styles.actionCardCompact,
              { width: cardWidth },
              pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
            ]}
            onPress={() => navigation.navigate('Music', { screen: 'Spotify' })}
          >
            <View style={[styles.actionIcon, compact && styles.actionIconCompact, { backgroundColor: colors.accentPurple + '20' }]}>
              <Text style={[styles.actionEmoji, compact && styles.actionEmojiCompact]}>🎵</Text>
            </View>
            <Text style={[styles.actionTitle, compact && styles.actionTitleCompact, styles.sectionTitle]}>
              Spotify
            </Text>
            <Text style={[styles.actionSubtitle, compact && styles.actionSubtitleCompact, styles.sectionSubtitle]}>
              View library
            </Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.actionCard,
              styles.actionCardSurface,
              compact && styles.actionCardCompact,
              { width: cardWidth },
              pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
            ]}
            onPress={() => navigation.navigate('Training', { screen: 'Timers' })}
          >
            <View style={[styles.actionIcon, compact && styles.actionIconCompact, { backgroundColor: colors.accent + '20' }]}>
              <Text style={[styles.actionEmoji, compact && styles.actionEmojiCompact]}>⏱️</Text>
            </View>
            <Text style={[styles.actionTitle, compact && styles.actionTitleCompact, styles.sectionTitle]}>
              Timers
            </Text>
            <Text style={[styles.actionSubtitle, compact && styles.actionSubtitleCompact, styles.sectionSubtitle]}>
              Track workouts
            </Text>
          </Pressable>
        </View>

        <SectionDivider label="Core tools" />

        <SectionHeader
          title="More Features"
          subtitle="Enhance your workout experience"
          titleStyle={styles.sectionTitle}
          subtitleStyle={styles.sectionSubtitle}
        />
        <View style={styles.moreFeatures}>
          <Pressable
            style={({ pressed }) => [
              styles.featureRow,
              styles.featureRowSurface,
              pressed && { opacity: 0.9 },
            ]}
            onPress={() => navigation.navigate('Training', { screen: 'WorkoutLog' })}
          >
            <View style={[styles.featureIconSmall, { backgroundColor: colors.primary + '20' }]}>
              <Text style={styles.featureEmojiSmall}>📝</Text>
            </View>
            <View style={styles.featureInfo}>
              <Text style={[styles.featureRowTitle, styles.sectionTitle]}>
                Workout Log
              </Text>
              <Text style={[styles.featureRowSubtitle, styles.sectionSubtitle]}>
                Customize fields and track sessions
              </Text>
            </View>
            <Text style={[styles.featureChevron, styles.sectionSubtitle]}>›</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.featureRow,
              styles.featureRowSurface,
              pressed && { opacity: 0.9 },
            ]}
            onPress={() => navigation.navigate('Music', { screen: 'Setlists' })}
          >
            <View style={[styles.featureIconSmall, { backgroundColor: colors.primary + '20' }]}>
              <Text style={styles.featureEmojiSmall}>🎼</Text>
            </View>
            <View style={styles.featureInfo}>
              <Text style={[styles.featureRowTitle, styles.sectionTitle]}>
                Setlists
              </Text>
              <Text style={[styles.featureRowSubtitle, styles.sectionSubtitle]}>
                Create workout playlists
              </Text>
            </View>
            <Text style={[styles.featureChevron, styles.sectionSubtitle]}>›</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.featureRow,
              styles.featureRowSurface,
              pressed && { opacity: 0.9 },
            ]}
            onPress={() => navigation.navigate('Training', { screen: 'WorkoutToolsMain' })}
          >
            <View style={[styles.featureIconSmall, { backgroundColor: colors.accentGreen + '20' }]}>
              <Text style={styles.featureEmojiSmall}>🧰</Text>
            </View>
            <View style={styles.featureInfo}>
              <Text style={[styles.featureRowTitle, styles.sectionTitle]}>
                Workout Tools
              </Text>
              <Text style={[styles.featureRowSubtitle, styles.sectionSubtitle]}>
                Offline logs, plate math, mobility flows
              </Text>
            </View>
            <Text style={[styles.featureChevron, styles.sectionSubtitle]}>›</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.featureRow,
              styles.featureRowSurface,
              pressed && { opacity: 0.9 },
            ]}
            onPress={() => navigation.navigate('Training', { screen: 'PRs' })}
          >
            <View style={[styles.featureIconSmall, { backgroundColor: colors.accentPurple + '20' }]}>
              <Text style={styles.featureEmojiSmall}>📈</Text>
            </View>
            <View style={styles.featureInfo}>
              <Text style={[styles.featureRowTitle, styles.sectionTitle]}>
                PR Tracker
              </Text>
              <Text style={[styles.featureRowSubtitle, styles.sectionSubtitle]}>
                Log and review personal records
              </Text>
            </View>
            <Text style={[styles.featureChevron, styles.sectionSubtitle]}>›</Text>
          </Pressable>
        </View>

        <SectionDivider label="Roadmap" />

        <SectionHeader
          title="Extra Features"
          subtitle="Big ideas on the roadmap"
          titleStyle={styles.sectionTitle}
          subtitleStyle={styles.sectionSubtitle}
        />
        <View style={styles.extraFeatures}>
          {EXTRA_FEATURE_CATEGORIES.map((category) => {
            const items = categorizedExtras.get(category.id) || [];
            if (items.length === 0) return null;
            return (
              <View key={category.id} style={styles.categoryGroup}>
                <View style={styles.categoryHeader}>
                  <View style={styles.categoryHeaderText}>
                    <Text style={[styles.categoryTitle, { color: colors.textPrimary }]}>
                      {category.id}
                    </Text>
                    <Text style={[styles.categorySubtitle, { color: colors.textSecondary }]}>
                      {category.subtitle}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.categoryCountPill,
                      { backgroundColor: colors.surfaceAlt, borderColor: colors.border },
                    ]}
                  >
                    <Text style={[styles.categoryCountText, { color: colors.textSecondary }]}>
                      {items.length}
                    </Text>
                  </View>
                </View>
                <View style={styles.extraFeatures}>
                  {items.map((feature) => (
                    <Pressable
                      key={feature.id}
                      style={({ pressed }) => [
                        styles.featureRow,
                        styles.featureRowSurface,
                        pressed && { opacity: 0.9, transform: [{ scale: 0.99 }] },
                      ]}
                      onPress={() => navigation.navigate('FeatureDetail', { featureId: feature.id })}
                    >
                      <View style={[styles.featureIconSmall, { backgroundColor: colors.primary + '20' }]}>
                        <Text style={styles.featureEmojiSmall}>{feature.icon}</Text>
                      </View>
                      <View style={styles.featureInfo}>
                        <Text style={[styles.featureRowTitle, styles.sectionTitle]}>
                          {feature.title}
                        </Text>
                        <Text style={[styles.featureRowSubtitle, styles.sectionSubtitle]}>
                          {feature.subtitle}
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.extraTag,
                          { borderColor: colors.primary, backgroundColor: colors.primary + '15' },
                        ]}
                      >
                        <Text style={[styles.extraTagText, { color: colors.primary }]}>Soon</Text>
                      </View>
                    </Pressable>
                  ))}
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </ScreenChrome>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: LAYOUT.screenPadding,
    paddingBottom: SPACING['3xl'],
    gap: SPACING.xl,
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
  verseRow: {
    paddingBottom: SPACING.md,
  },
  verseCard: {
    padding: SPACING.lg,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    marginRight: SPACING.md,
    gap: SPACING.md,
  },
  verseReference: {
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  verseText: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: '600',
    lineHeight: 24,
  },
  keepButton: {
    alignSelf: 'flex-start',
    borderRadius: RADIUS.full,
    borderWidth: 1,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
  },
  keepButtonText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  actionCard: {
    padding: SPACING.base,
    borderRadius: RADIUS.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  actionCardSurface: {
    backgroundColor: 'rgba(14, 22, 16, 0.82)',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.35)',
    shadowColor: 'rgba(34, 197, 94, 0.35)',
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  actionEmoji: {
    fontSize: 28,
  },
  actionTitle: {
    ...TYPOGRAPHY.presets.heading3,
    fontSize: TYPOGRAPHY.sizes.lg,
    marginBottom: SPACING.xs,
  },
  actionSubtitle: {
    ...TYPOGRAPHY.presets.caption,
  },
  moreFeatures: {
    gap: SPACING.md,
  },
  extraFeatures: {
    gap: SPACING.md,
  },
  categoryGroup: {
    gap: SPACING.sm,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: SPACING.xs,
  },
  categoryHeaderText: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  categoryTitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.semibold,
    marginBottom: 2,
  },
  categorySubtitle: {
    fontSize: TYPOGRAPHY.sizes.sm,
  },
  categoryCountPill: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    borderWidth: 1,
  },
  categoryCountText: {
    fontSize: TYPOGRAPHY.sizes.xs,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.base,
    borderRadius: RADIUS.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  featureRowSurface: {
    backgroundColor: 'rgba(14, 22, 16, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.28)',
    shadowColor: 'rgba(34, 197, 94, 0.2)',
  },
  featureIconSmall: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  featureEmojiSmall: {
    fontSize: 20,
  },
  featureInfo: {
    flex: 1,
  },
  featureRowTitle: {
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.semibold,
    marginBottom: 2,
  },
  featureRowSubtitle: {
    fontSize: TYPOGRAPHY.sizes.xs,
    fontWeight: TYPOGRAPHY.weights.regular,
  },
  featureChevron: {
    fontSize: 24,
    fontWeight: '300',
  },
  extraTag: {
    borderWidth: 1,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
  },
  extraTagText: {
    fontSize: TYPOGRAPHY.sizes.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  // Compact mode variants
  contentCompact: {
    padding: SPACING.base,
    gap: SPACING.lg,
  },
  verseRowCompact: {},
  verseCardCompact: {
    padding: SPACING.base,
  },
  verseReferenceCompact: {
    fontSize: TYPOGRAPHY.sizes.sm,
  },
  verseTextCompact: {
    fontSize: TYPOGRAPHY.sizes.base,
  },
  keepButtonCompact: {
    paddingHorizontal: SPACING.sm,
  },
  keepButtonTextCompact: {
    fontSize: TYPOGRAPHY.sizes.xs,
  },
  quickActionsGridCompact: {
    gap: SPACING.sm,
  },
  actionCardCompact: {
    padding: SPACING.sm,
  },
  actionIconCompact: {
    width: 44,
    height: 44,
    marginBottom: SPACING.sm,
  },
  actionEmojiCompact: {
    fontSize: 22,
  },
  actionTitleCompact: {
    fontSize: TYPOGRAPHY.sizes.base,
  },
  actionSubtitleCompact: {
    fontSize: TYPOGRAPHY.sizes.xs,
  },
  moreFeaturesCompact: {
    gap: SPACING.sm,
  },
  extraFeaturesCompact: {
    gap: SPACING.sm,
  },
  categoryGroupCompact: {},
  categoryTitleCompact: {
    fontSize: TYPOGRAPHY.sizes.base,
  },
  categorySubtitleCompact: {
    fontSize: TYPOGRAPHY.sizes.xs,
  },
  featureRowCompact: {
    padding: SPACING.sm,
  },
  featureIconSmallCompact: {
    width: 36,
    height: 36,
    marginRight: SPACING.sm,
  },
  featureRowTitleCompact: {
    fontSize: TYPOGRAPHY.sizes.sm,
  },
  featureRowSubtitleCompact: {
    fontSize: 10,
  },
});
