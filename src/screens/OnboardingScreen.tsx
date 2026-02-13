/**
 * Onboarding Screen
 * Shown once on first app launch to welcome new users
 */

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  FlatList,
  Pressable,
  ViewToken,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { TYPOGRAPHY, SPACING, RADIUS } from '../theme/tokens';

const { width, height } = Dimensions.get('window');

type OnboardingPage = {
  id: string;
  emoji: string;
  title: string;
  subtitle: string;
  gradient: readonly [string, string, string];
};

const PAGES: OnboardingPage[] = [
  {
    id: 'welcome',
    emoji: '🏋️',
    title: 'Welcome to\nBarbellBeats',
    subtitle: 'Where strength meets sound. Train harder with the music you love.',
    gradient: ['#060A07', '#0B120D', '#08100B'] as const,
  },
  {
    id: 'music',
    emoji: '🎵',
    title: 'Your Gym,\nYour Music',
    subtitle: 'Vote on what plays at your gym. Connect Spotify and build setlists with your crew.',
    gradient: ['#0A0D0B', '#0D1510', '#091009'] as const,
  },
  {
    id: 'training',
    emoji: '📊',
    title: 'Track Every\nRep & Run',
    subtitle: 'Log workouts, track PRs, and monitor cardio with GPS. See your progress over time.',
    gradient: ['#070C09', '#0C140E', '#081008'] as const,
  },
  {
    id: 'community',
    emoji: '🤝',
    title: 'Join the\nMovement',
    subtitle: 'Discover gyms near you, climb leaderboards, and train alongside your community.',
    gradient: ['#080B09', '#0B130D', '#07100A'] as const,
  },
];

type Props = {
  onComplete: () => void;
};

export default function OnboardingScreen({ onComplete }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index != null) {
        setCurrentIndex(viewableItems[0].index);
      }
    }
  ).current;

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const isLastPage = currentIndex === PAGES.length - 1;

  const handleNext = () => {
    if (isLastPage) {
      onComplete();
    } else {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
    }
  };

  const renderPage = ({ item }: { item: OnboardingPage }) => (
    <LinearGradient
      colors={item.gradient}
      style={styles.page}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <View style={styles.pageContent}>
        <Text style={styles.emoji}>{item.emoji}</Text>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.subtitle}>{item.subtitle}</Text>
      </View>
    </LinearGradient>
  );

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={PAGES}
        renderItem={renderPage}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        bounces={false}
      />

      {/* Bottom Controls */}
      <View style={styles.controls}>
        {/* Page Dots */}
        <View style={styles.dots}>
          {PAGES.map((page, index) => (
            <View
              key={page.id}
              style={[
                styles.dot,
                index === currentIndex ? styles.dotActive : styles.dotInactive,
              ]}
            />
          ))}
        </View>

        {/* Action Buttons */}
        <View style={styles.buttons}>
          {!isLastPage && (
            <Pressable
              onPress={onComplete}
              style={({ pressed }) => [styles.skipButton, pressed && { opacity: 0.7 }]}
            >
              <Text style={styles.skipText}>Skip</Text>
            </Pressable>
          )}

          <Pressable
            onPress={handleNext}
            style={({ pressed }) => [styles.nextButton, pressed && { opacity: 0.85, transform: [{ scale: 0.97 }] }]}
          >
            <LinearGradient
              colors={['#22C55E', '#15803D']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.nextButtonGradient}
            >
              <Text style={styles.nextButtonText}>
                {isLastPage ? "LET'S GO" : 'NEXT'}
              </Text>
            </LinearGradient>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#060A07',
  },
  page: {
    width,
    height,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pageContent: {
    paddingHorizontal: SPACING['3xl'],
    alignItems: 'center',
    marginTop: -height * 0.1,
  },
  emoji: {
    fontSize: 80,
    marginBottom: SPACING['2xl'],
  },
  title: {
    fontSize: TYPOGRAPHY.sizes['4xl'],
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 1,
    marginBottom: SPACING.lg,
    textShadowColor: 'rgba(34, 197, 94, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: '500',
    color: '#B9C2B0',
    textAlign: 'center',
    lineHeight: 26,
    maxWidth: width * 0.8,
  },
  controls: {
    position: 'absolute',
    bottom: 60,
    left: 0,
    right: 0,
    paddingHorizontal: SPACING['2xl'],
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING['2xl'],
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotActive: {
    backgroundColor: '#22C55E',
    width: 24,
  },
  dotInactive: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  skipButton: {
    paddingVertical: SPACING.base,
    paddingHorizontal: SPACING.lg,
  },
  skipText: {
    color: '#8B9482',
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  nextButton: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  nextButtonGradient: {
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.base,
    alignItems: 'center',
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: '900',
    letterSpacing: 2,
  },
});
