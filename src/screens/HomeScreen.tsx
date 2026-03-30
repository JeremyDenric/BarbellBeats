/**
 * Home Screen - Clean Dashboard
 * Apple Music-inspired with hero section and featured content
 */

import React, { useMemo, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  SafeAreaView,
  RefreshControl,
  Dimensions,
  ImageBackground,
} from 'react-native';
import { AnimatedPressable } from '../components/AnimatedPressable';
import { Icon } from '../components/Icon';
import { useNavigation, CompositeNavigationProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { useThemeMode } from '../contexts/ThemeContext';
import { usePreferences } from '../contexts/PreferencesContext';
import useInteractionReady from '../hooks/useInteractionReady';
import {
  TabParamList,
  HomeStackParamList,
  GymsStackParamList,
  TrainingStackParamList,
  MusicStackParamList,
} from '../types';
import { listGyms } from '../services/gymApi';
import { GlassCard, SectionHeader, Badge, LoadingView, ErrorView } from '../components/UI';
import { MapPreviewCard } from '../components/MapPreviewCard';
import { SearchBar } from '../components/SearchBar';
import { COLORS, TYPOGRAPHY, SPACING, LAYOUT, RADIUS } from '../theme/tokens';
import { StaggerItem } from '../components/StaggerItem';
import DailyVibeCard from '../components/DailyVibeCard';
import QuickWinsCard from '../components/QuickWinsCard';
import ForgeDashboardCard from '../components/ForgeDashboardCard';
import { usePrograms } from '../contexts/ProgramContext';
import { useForgeMode } from '../hooks/useForgeMode';
import { FORGE_PROGRAM_IDS } from '../data/forgePrograms';
import { LIVE_FEATURES } from '../data/currentFeatures';
import type { FitnessGoal } from '../contexts/PreferencesContext';

type HomeScreenNavigationProp = CompositeNavigationProp<
  NativeStackNavigationProp<HomeStackParamList, 'HomeMain'>,
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

const { width } = Dimensions.get('window');
const COMPACT_HALF_CARD = (width - LAYOUT.screenPadding * 2 - SPACING.sm) / 2;
// Local asset — replace assets/images/gym-background.jpg with a real gym photo before launch
const GYM_BACKGROUND = require('../../assets/images/gym-background.jpg');
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

function getDayOfYear(date: Date) {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 5) return 'Late night';
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  if (hour < 21) return 'Good evening';
  return 'Late night';
}

const GOAL_HERO_SUBTITLES: Record<FitnessGoal, string> = {
  strength: 'Time to get strong.',
  cardio: "Let's move.",
  'weight-loss': 'Progress over perfection.',
  consistency: 'Show up. Every day.',
};

export default function HomeScreen() {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const { user } = useAuth();
  const { isDark } = useThemeMode();
  const { preferences } = usePreferences();
  const { activeProgram } = usePrograms();
  const forge = useForgeMode();
  const colors = isDark ? COLORS.dark : COLORS.light;
  const interactionReady = useInteractionReady();
  const compact = preferences.compactMode;
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const { data: gyms, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['gyms'],
    queryFn: () => listGyms(),
    enabled: interactionReady,
    staleTime: 1000 * 60 * 5,
  });

  const totalMembers = useMemo(
    () => gyms?.reduce((sum, gym) => sum + (gym.memberCount || 0), 0) ?? 0,
    [gyms]
  );

  // Filter gyms based on search query
  const filteredGyms = useMemo(() => {
    if (!gyms) return [];
    if (!searchQuery.trim()) return gyms;

    const query = searchQuery.toLowerCase();
    return gyms.filter(
      (gym) =>
        gym.name.toLowerCase().includes(query) ||
        gym.address.toLowerCase().includes(query)
    );
  }, [gyms, searchQuery]);
  const verseCards = useMemo(() => {
    const offset = getDayOfYear(new Date()) % STRENGTH_VERSES.length;
    return [...STRENGTH_VERSES.slice(offset), ...STRENGTH_VERSES.slice(0, offset)];
  }, []);

  const nearbyGyms = useMemo(() => filteredGyms.slice(0, 10) || [], [filteredGyms]);

  const featuredGyms = useMemo(() => gyms?.slice(0, 3) || [], [gyms]);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  if (!interactionReady || isLoading) {
    return <LoadingView message="Loading your fitness hub..." />;
  }

  if (isError) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <ErrorView error={error as Error} onRetry={() => refetch()} />
      </SafeAreaView>
    );
  }

  return (
    <ImageBackground
      source={GYM_BACKGROUND}
      style={styles.background}
      imageStyle={styles.backgroundImage}
      resizeMode="cover"
    >
      <View style={styles.backgroundOverlay}>
        <SafeAreaView style={[styles.container, { backgroundColor: 'transparent' }]}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={colors.primary}
              />
            }
          >
          {/* Hero Section */}
          <View style={[styles.hero, compact && styles.heroCompact]}>
            <Text style={[styles.greeting, styles.textGlowSoft]}>
              {getGreeting()}{user?.name ? `, ${user.name.split(' ')[0]}` : ''}
            </Text>
            <Text style={[styles.heroTitle, styles.textGlow, compact && styles.heroTitleCompact]}>
              Barbell Beats
            </Text>
            {preferences.fitnessGoal && (
              <Text style={[styles.heroSubtitle, styles.textGlowSoft, compact && styles.heroSubtitleCompact]}>
                {GOAL_HERO_SUBTITLES[preferences.fitnessGoal]}
              </Text>
            )}

          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.verseRow}
          >
            {verseCards.map((verse) => (
              <View
                key={verse.id}
                style={[
                  styles.verseCard,
                  compact && styles.verseCardCompact,
                  {
                    width: width - LAYOUT.screenPadding * 2,
                    backgroundColor: 'rgba(9, 14, 10, 0.82)',
                    borderColor: 'rgba(203, 255, 0, 0.25)',
                  },
                ]}
              >
                <Text style={[styles.verseReference, styles.textGlowAccent]}>
                  {verse.reference}
                </Text>
                <Text style={[styles.verseText, styles.textGlowSoft]}>
                  {verse.text}
                </Text>
              </View>
            ))}
          </ScrollView>

          {/* Map Preview */}
          <MapPreviewCard
            gyms={nearbyGyms}
            onGymPress={(gymId) => navigation.navigate('Music', { screen: 'GymPlaylist', params: { gymId } })}
            onMapPress={() => navigation.navigate('Discover', { screen: 'Map' })}
            style={[styles.mapPreview, compact && styles.mapPreviewCompact]}
          />

          {/* Search Bar */}
          <SearchBar
            placeholder="Search gyms or locations..."
            onSearch={setSearchQuery}
            debounceMs={300}
            style={[styles.searchBar, compact && styles.searchBarCompact]}
          />

          {/* Quick Stats Footer */}
          <View style={[styles.quickStats, compact && styles.quickStatsCompact]}>
            <Text style={[styles.quickStatsText, styles.textGlowSoft]}>
              📍 {filteredGyms.length} gyms nearby • {totalMembers} training now
            </Text>
          </View>
          </View>

        {/* Daily Vibe */}
        <View style={[styles.section, compact && styles.sectionCompact]}>
          <DailyVibeCard style={styles.vibeCard} />
        </View>

        {/* Forge Mode Dashboard — only when a Forge program is active */}
        {activeProgram && FORGE_PROGRAM_IDS.includes(activeProgram.program.id) && (
          <View style={[styles.section, compact && styles.sectionCompact]}>
            <SectionHeader
              title="Forge Mode"
              action={{
                label: 'Open',
                onPress: () => navigation.navigate('Training', { screen: 'ForgeMain' }),
              }}
              titleStyle={styles.textGlow}
            />
            <ForgeDashboardCard
              program={activeProgram.program}
              progress={activeProgram.progress}
              isDeloadWeek={forge.isDeloadWeek}
              nextWorkoutName={forge.nextWorkoutName}
              progressPercent={forge.progressPercent}
              currentStreak={forge.currentStreak}
              isGeneratingPlaylist={forge.isGeneratingPlaylist}
              lastPlaylist={forge.lastPlaylist}
              isPro={forge.isPro}
              onStartSession={() => navigation.navigate('Training', { screen: 'ForgeMain' })}
              onViewDetails={() => navigation.navigate('Training', { screen: 'ForgeMain' })}
            />
          </View>
        )}

        {/* Quick Wins checklist — only for new users */}
        <View style={[styles.section, compact && styles.sectionCompact]}>
          <QuickWinsCard />
        </View>

        {/* Quick Actions */}
        <View style={[styles.section, compact && styles.sectionCompact]}>
          <SectionHeader
            title="Quick Start"
            subtitle="Jump right in"
            titleStyle={styles.textGlow}
            subtitleStyle={styles.textGlowSoft}
          />
          <View style={styles.quickActionsGrid}>
            <AnimatedPressable
              onPress={() => navigation.navigate('Training', { screen: 'WorkoutTemplates' })}
              accessibilityRole="button"
              accessibilityLabel="Start a workout"
              style={[styles.actionCard, styles.actionCardSurface]}
            >
              <Icon name="barbell" size="xl" color={colors.primary} />
              <Text style={[styles.actionTitle, styles.textGlow]}>Workout</Text>
              <Text style={[styles.actionSubtitle, styles.textGlowMuted]}>Start training</Text>
            </AnimatedPressable>
            <AnimatedPressable
              onPress={() => navigation.navigate('Training', { screen: 'CardioTypeSelection' })}
              accessibilityRole="button"
              accessibilityLabel="Track cardio"
              style={[styles.actionCard, styles.actionCardSurface]}
            >
              <Icon name="person-run" size="xl" color={colors.primary} />
              <Text style={[styles.actionTitle, styles.textGlow]}>Cardio</Text>
              <Text style={[styles.actionSubtitle, styles.textGlowMuted]}>Track a run</Text>
            </AnimatedPressable>
            <AnimatedPressable
              onPress={() => navigation.navigate('Music', { screen: 'MusicMain' })}
              accessibilityRole="button"
              accessibilityLabel="Browse music"
              style={[styles.actionCard, styles.actionCardSurface]}
            >
              <Icon name="music-notes" size="xl" color={colors.primary} />
              <Text style={[styles.actionTitle, styles.textGlow]}>Music</Text>
              <Text style={[styles.actionSubtitle, styles.textGlowMuted]}>Gym playlists</Text>
            </AnimatedPressable>
            <AnimatedPressable
              onPress={() => navigation.navigate('Training', { screen: 'ProgressTracking' })}
              accessibilityRole="button"
              accessibilityLabel="View progress"
              style={[styles.actionCard, styles.actionCardSurface]}
            >
              <Icon name="chart-line-up" size="xl" color={colors.primary} />
              <Text style={[styles.actionTitle, styles.textGlow]}>Progress</Text>
              <Text style={[styles.actionSubtitle, styles.textGlowMuted]}>Track gains</Text>
            </AnimatedPressable>
          </View>
        </View>

        {/* Local Gyms (shows when searching or by default) */}
        {searchQuery.trim() !== '' && filteredGyms.length === 0 && (
          <View style={[styles.section, compact && styles.sectionCompact]}>
            <View style={styles.emptySearch}>
              <Icon name="search" size="xl" color="#94A3B8" />
              <Text style={[styles.emptySearchTitle, styles.textGlowSoft]}>No gyms found</Text>
              <Text style={[styles.emptySearchSubtitle, styles.textGlowMuted]}>Try a different search term</Text>
            </View>
          </View>
        )}
        {filteredGyms.length > 0 && (
          <View style={[styles.section, compact && styles.sectionCompact]}>
            <SectionHeader
              title={searchQuery ? "Search Results" : "Local Gyms"}
              subtitle={searchQuery ? `${filteredGyms.length} gyms found` : "Gyms near you"}
              action={{
                label: "See All",
                onPress: () => navigation.navigate('Discover', { screen: 'GymListMain' }),
              }}
              titleStyle={styles.textGlow}
              subtitleStyle={styles.textGlowSoft}
              actionTextStyle={styles.textGlowAccent}
            />
            <View style={[styles.localGymsList, compact && styles.localGymsListCompact]}>
              {filteredGyms.slice(0, 5).map((gym, i) => (
                <StaggerItem key={gym.id} index={i}>
                <Pressable
                  key={gym.id}
                  style={({ pressed }) => [
                    styles.localGymCard,
                    compact && styles.localGymCardCompact,
                    pressed && { opacity: 0.9 },
                  ]}
                  onPress={() => navigation.navigate('Music', { screen: 'GymPlaylist', params: { gymId: gym.id } })}
                  accessibilityRole="button"
                  accessibilityLabel={`${gym.name}, ${gym.address}, ${gym.memberCount} training`}
                >
                  <GlassCard style={[styles.localGymContent, compact && styles.localGymContentCompact]} intensity={12}>
                    <View style={styles.localGymInfo}>
                      <Text style={[styles.localGymName, styles.textGlow]} numberOfLines={1}>
                        {gym.name}
                      </Text>
                      <Text style={[styles.localGymAddress, styles.textGlowSoft]} numberOfLines={1}>
                        {gym.address}
                      </Text>
                      <View style={styles.localGymMeta}>
                        <Text style={[styles.localGymMetaText, styles.textGlowMuted]}>
                          👥 {gym.memberCount} training
                        </Text>
                        <Text style={[styles.localGymMetaText, styles.textGlowMuted]}>
                          📍 {gym.distance?.toFixed(1)} mi
                        </Text>
                      </View>
                    </View>
                    {gym.memberCount > 0 && (
                      <View
                        style={[
                          styles.liveIndicator,
                          compact && styles.liveIndicatorCompact,
                          { backgroundColor: colors.primary },
                        ]}
                      >
                        <Text style={[styles.liveIndicatorText, compact && styles.liveIndicatorTextCompact]}>
                          Live
                        </Text>
                      </View>
                    )}
                  </GlassCard>
                </Pressable>
                </StaggerItem>
              ))}
            </View>
          </View>
        )}

        {/* Featured Gyms */}
        <View style={[styles.section, compact && styles.sectionCompact]}>
          <SectionHeader
            title="Featured Gyms"
            subtitle="Popular spots in your area"
            action={{
              label: "See All",
              onPress: () => navigation.navigate('Discover', { screen: 'GymListMain' }),
            }}
            titleStyle={styles.textGlow}
            subtitleStyle={styles.textGlowSoft}
            actionTextStyle={styles.textGlowAccent}
          />
          <View style={[styles.featuredList, compact && styles.featuredListCompact]}>
            {featuredGyms.map((gym, index) => (
              <Pressable
                key={gym.id}
                style={({ pressed }) => [
                  styles.featuredCard,
                  compact && styles.featuredCardCompact,
                  pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
                ]}
                onPress={() => navigation.navigate('Music', { screen: 'GymPlaylist', params: { gymId: gym.id } })}
                accessibilityRole="button"
                accessibilityLabel={`Featured gym: ${gym.name}, ranked number ${index + 1}`}
              >
                <GlassCard
                  style={[styles.featuredCardContent, compact && styles.featuredCardContentCompact]}
                  intensity={15}
                >
                  <View style={[styles.featuredHeader, compact && styles.featuredHeaderCompact]}>
                    <Badge
                      label={`#${index + 1}`}
                      variant={index === 0 ? 'primary' : 'neutral'}
                      icon={index === 0 ? '🏆' : ''}
                      size="small"
                    />
                    {gym.currentSong && (
                      <Badge label="Live" variant="success" size="small" />
                    )}
                  </View>
                  <Text
                    style={[styles.featuredGymName, styles.textGlow]}
                    numberOfLines={1}
                  >
                    {gym.name}
                  </Text>
                  <Text
                    style={[styles.featuredGymAddress, styles.textGlowSoft]}
                    numberOfLines={1}
                  >
                    {gym.address}
                  </Text>
                  <View style={[styles.featuredMeta, compact && styles.featuredMetaCompact]}>
                    <View style={styles.featuredMetaItem}>
                      <Text style={styles.featuredMetaIcon}>👥</Text>
                      <Text style={[styles.featuredMetaText, styles.textGlowSoft]}>
                        {gym.memberCount} active
                      </Text>
                    </View>
                    <View style={styles.featuredMetaItem}>
                      <Text style={styles.featuredMetaIcon}>📍</Text>
                      <Text style={[styles.featuredMetaText, styles.textGlowMuted]}>
                        {gym.distance?.toFixed(1)} mi
                      </Text>
                    </View>
                  </View>
                </GlassCard>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={[styles.section, compact && styles.sectionCompact]}>
          <SectionHeader
            title="Explore"
            subtitle="Discover extra features and ideas"
            action={{
              label: "Browse",
              onPress: () => navigation.navigate('Features'),
            }}
            titleStyle={styles.textGlow}
            subtitleStyle={styles.textGlowSoft}
            actionTextStyle={styles.textGlowAccent}
          />
          <Pressable
            onPress={() => navigation.navigate('Features')}
            accessibilityRole="button"
            accessibilityLabel="Explore app features"
            style={({ pressed }) => [
              styles.exploreCard,
              pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
            ]}
          >
            <GlassCard style={styles.exploreCardContent} intensity={12}>
              <Text style={[styles.exploreTitle, styles.textGlow]}>What's available</Text>
              <Text style={[styles.exploreSubtitle, styles.textGlowSoft]}>
                Discover every feature BarbellBeats has to offer.
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.featureChipsRow}
              >
                {LIVE_FEATURES.slice(0, 4).map((feature) => (
                  <View
                    key={feature.id}
                    style={[styles.featureChip, { borderColor: feature.accentColor + '50' }]}
                  >
                    <Text style={styles.featureChipEmoji}>{feature.icon}</Text>
                    <Text style={[styles.featureChipLabel, { color: feature.accentColor }]}>
                      {feature.title}
                    </Text>
                  </View>
                ))}
              </ScrollView>
            </GlassCard>
          </Pressable>
        </View>

          </ScrollView>
        </SafeAreaView>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    flex: 1,
  },
  backgroundImage: {
    opacity: 0.75,
  },
  backgroundOverlay: {
    flex: 1,
    backgroundColor: 'rgba(7, 12, 9, 0.78)',
  },
  athleteOverlay: {
    position: 'absolute',
    right: -width * 0.15,
    bottom: -width * 0.1,
    width: width * 0.85,
    height: width * 1.1,
    opacity: 0.18,
  },
  hero: {
    padding: LAYOUT.screenPadding,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING['2xl'],
  },
  heroCompact: {
    paddingTop: SPACING.base,
    paddingBottom: SPACING.xl,
  },
  greeting: {
    ...TYPOGRAPHY.presets.body,
    fontSize: TYPOGRAPHY.sizes.lg,
    marginBottom: SPACING.xs,
  },
  heroTitle: {
    ...TYPOGRAPHY.presets.displayLarge,
    marginBottom: SPACING.sm,
  },
  heroTitleCompact: {
    marginBottom: SPACING.xs,
    fontSize: TYPOGRAPHY.sizes['4xl'],
  },
  heroSubtitle: {
    ...TYPOGRAPHY.presets.body,
    marginBottom: SPACING.xl,
    maxWidth: width * 0.8,
  },
  heroSubtitleCompact: {
    marginBottom: SPACING.md,
  },
  verseRow: {
    paddingBottom: SPACING.md,
  },
  verseCard: {
    padding: SPACING.lg,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    marginBottom: SPACING.md,
    marginRight: SPACING.md,
  },
  verseCardCompact: {
    padding: SPACING.base,
    marginBottom: SPACING.sm,
  },
  verseReference: {
    ...TYPOGRAPHY.presets.caption,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: SPACING.xs,
  },
  verseText: {
    ...TYPOGRAPHY.presets.body,
  },
  textGlow: {
    color: '#FFFFFF',
    textShadowColor: 'rgba(203, 255, 0, 0.6)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  textGlowSoft: {
    color: '#F8FAFC',
    textShadowColor: 'rgba(203, 255, 0, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  textGlowMuted: {
    color: '#E2E8F0',
    textShadowColor: 'rgba(203, 255, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  textGlowAccent: {
    color: '#DCFCE7',
    textShadowColor: 'rgba(52, 211, 153, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  mapPreview: {
    marginBottom: SPACING.md,
  },
  mapPreviewCompact: {
    marginBottom: SPACING.sm,
  },
  searchBar: {
    marginBottom: SPACING.md,
  },
  searchBarCompact: {
    marginBottom: SPACING.sm,
  },
  quickStats: {
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  quickStatsCompact: {
    paddingVertical: SPACING.xs,
  },
  quickStatsText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  section: {
    paddingHorizontal: LAYOUT.screenPadding,
    marginBottom: SPACING['3xl'],
  },
  sectionCompact: {
    marginBottom: SPACING.xl,
  },
  vibeCard: {
    marginTop: SPACING.xs,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
    marginTop: SPACING.base,
  },
  actionCard: {
    width: (width - LAYOUT.screenPadding * 2 - SPACING.md) / 2,
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
    borderColor: 'rgba(203, 255, 0, 0.35)',
    shadowColor: 'rgba(203, 255, 0, 0.35)',
  },
  exploreCard: {
    marginTop: SPACING.base,
  },
  exploreCardContent: {
    padding: SPACING.lg,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: 'rgba(203, 255, 0, 0.35)',
    backgroundColor: 'rgba(9, 14, 10, 0.82)',
  },
  exploreTitle: {
    ...TYPOGRAPHY.presets.heading3,
    marginBottom: SPACING.xs,
  },
  exploreSubtitle: {
    ...TYPOGRAPHY.presets.body,
    marginBottom: SPACING.md,
  },
  featureChipsRow: {
    gap: SPACING.sm,
    paddingBottom: SPACING.xs,
  },
  featureChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  featureChipEmoji: {
    fontSize: 14,
  },
  featureChipLabel: {
    fontSize: TYPOGRAPHY.sizes.xs,
    fontWeight: '700',
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  actionTitle: {
    ...TYPOGRAPHY.presets.heading3,
    fontSize: TYPOGRAPHY.sizes.lg,
    marginBottom: SPACING.xs,
  },
  actionSubtitle: {
    ...TYPOGRAPHY.presets.caption,
  },

  // Local Gyms List
  localGymsList: {
    marginTop: SPACING.base,
    gap: SPACING.md,
  },
  localGymsListCompact: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  localGymCard: {
    marginBottom: SPACING.xs,
  },
  localGymCardCompact: {
    width: COMPACT_HALF_CARD,
  },
  localGymContent: {
    padding: SPACING.base,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  localGymContentCompact: {
    padding: SPACING.sm,
    gap: SPACING.sm,
  },
  localGymInfo: {
    flex: 1,
  },
  localGymName: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.semibold,
    marginBottom: 4,
  },
  localGymAddress: {
    fontSize: TYPOGRAPHY.sizes.sm,
    marginBottom: SPACING.sm,
  },
  localGymMeta: {
    flexDirection: 'row',
    gap: SPACING.base,
  },
  localGymMetaText: {
    fontSize: TYPOGRAPHY.sizes.xs,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  liveIndicator: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    shadowColor: '#CBFF00',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 2,
  },
  liveIndicatorCompact: {
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  liveIndicatorText: {
    color: '#0A0A0F',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  liveIndicatorTextCompact: {
    fontSize: 10,
  },

  featuredList: {
    marginTop: SPACING.base,
    gap: SPACING.md,
  },
  featuredListCompact: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  featuredCard: {
    marginBottom: SPACING.xs,
  },
  featuredCardCompact: {
    width: COMPACT_HALF_CARD,
  },
  featuredCardContent: {
    padding: SPACING.base,
  },
  featuredCardContentCompact: {
    padding: SPACING.sm,
  },
  featuredHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  featuredHeaderCompact: {
    marginBottom: SPACING.sm,
  },
  featuredGymName: {
    ...TYPOGRAPHY.presets.heading3,
    marginBottom: SPACING.xs,
  },
  featuredGymAddress: {
    ...TYPOGRAPHY.presets.caption,
    marginBottom: SPACING.md,
  },
  featuredMeta: {
    flexDirection: 'row',
    gap: SPACING.base,
  },
  featuredMetaCompact: {
    gap: SPACING.sm,
  },
  featuredMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  featuredMetaIcon: {
    fontSize: 14,
  },
  featuredMetaText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
  moreFeatures: {
    marginTop: SPACING.base,
    gap: SPACING.md,
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
    borderColor: 'rgba(203, 255, 0, 0.28)',
    shadowColor: 'rgba(203, 255, 0, 0.2)',
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
  emptySearch: {
    alignItems: 'center',
    paddingVertical: SPACING['2xl'],
    gap: SPACING.sm,
  },
  emptySearchTitle: {
    ...TYPOGRAPHY.presets.heading3,
    marginTop: SPACING.sm,
  },
  emptySearchSubtitle: {
    ...TYPOGRAPHY.presets.caption,
  },
});
