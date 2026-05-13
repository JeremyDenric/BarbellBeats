/**
 * CelebrationOverlay
 * Full-screen celebration animation triggered on workout completion.
 * Renders animated confetti particles and a bouncing trophy, then auto-dismisses.
 */

import React, { useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  withSequence,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import { usePreferences } from '../contexts/PreferencesContext';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

const PARTICLES = [
  { emoji: '🏆', x: 0.5, delay: 0 },
  { emoji: '⚡', x: 0.2, delay: 80 },
  { emoji: '🔥', x: 0.8, delay: 120 },
  { emoji: '💪', x: 0.35, delay: 200 },
  { emoji: '✨', x: 0.65, delay: 160 },
  { emoji: '🎯', x: 0.15, delay: 240 },
  { emoji: '💥', x: 0.85, delay: 300 },
  { emoji: '⭐', x: 0.45, delay: 350 },
  { emoji: '🎉', x: 0.75, delay: 100 },
  { emoji: '💎', x: 0.25, delay: 280 },
];

interface ParticleProps {
  emoji: string;
  startX: number;
  delay: number;
  reduceMotion: boolean;
}

function Particle({ emoji, startX, delay, reduceMotion }: ParticleProps) {
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.5);

  useEffect(() => {
    if (reduceMotion) {
      opacity.value = withDelay(delay, withTiming(1, { duration: 100 }));
      return;
    }

    opacity.value = withDelay(
      delay,
      withSequence(
        withTiming(1, { duration: 200, easing: Easing.out(Easing.quad) }),
        withDelay(600, withTiming(0, { duration: 400, easing: Easing.in(Easing.quad) }))
      )
    );
    translateY.value = withDelay(
      delay,
      withTiming(-SCREEN_H * 0.65, { duration: 1200, easing: Easing.out(Easing.cubic) })
    );
    scale.value = withDelay(
      delay,
      withSpring(1.2, { damping: 8, stiffness: 120 })
    );
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateY: translateY.value as number },
      { scale: scale.value as number },
    ] as { translateY: number }[] | { scale: number }[],
  }));

  return (
    <Animated.View
      style={[
        styles.particle,
        { left: startX * SCREEN_W - 20 },
        animStyle,
      ]}
    >
      <Text style={styles.particleEmoji}>{emoji}</Text>
    </Animated.View>
  );
}

interface TrophyBounceProps {
  reduceMotion: boolean;
}

function TrophyBounce({ reduceMotion }: TrophyBounceProps) {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 200 });
    if (reduceMotion) {
      scale.value = withTiming(1, { duration: 200 });
    } else {
      scale.value = withSequence(
        withSpring(1.3, { damping: 6, stiffness: 200 }),
        withSpring(1.0, { damping: 10, stiffness: 120 }),
        withDelay(800, withSpring(1.1, { damping: 8 })),
        withSpring(1.0, { damping: 12 })
      );
    }
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[styles.trophy, animStyle]}>
      <Text style={styles.trophyEmoji}>🏆</Text>
    </Animated.View>
  );
}

interface CelebrationOverlayProps {
  visible: boolean;
  onDismiss?: () => void;
  /** Duration in ms before auto-dismiss. Default 2200 */
  duration?: number;
}

export function CelebrationOverlay({
  visible,
  onDismiss,
  duration = 2200,
}: CelebrationOverlayProps) {
  const { preferences } = usePreferences();
  const reduceMotion = preferences?.reduceMotion ?? false;
  const containerOpacity = useSharedValue(0);

  const dismiss = useCallback(() => {
    containerOpacity.value = withTiming(0, { duration: 300 }, (finished) => {
      if (finished && onDismiss) runOnJS(onDismiss)();
    });
  }, [onDismiss]);

  useEffect(() => {
    if (!visible) return;

    containerOpacity.value = withTiming(1, { duration: 200 });
    const timer = setTimeout(dismiss, duration);
    return () => clearTimeout(timer);
  }, [visible]);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: containerOpacity.value,
  }));

  const labelStyle = useAnimatedStyle(() => ({
    opacity: containerOpacity.value,
    transform: [{ scale: withSpring(visible ? 1 : 0, { damping: 8, stiffness: 120 }) }],
  }));

  if (!visible) return null;

  return (
    <Animated.View style={[styles.container, containerStyle]} pointerEvents="none">
      {/* Particles */}
      {PARTICLES.map((p, i) => (
        <Particle
          key={i}
          emoji={p.emoji}
          startX={p.x}
          delay={p.delay}
          reduceMotion={reduceMotion}
        />
      ))}

      {/* Central trophy */}
      <TrophyBounce reduceMotion={reduceMotion} />

      {/* "NICE WORK" label */}
      <Animated.Text style={[styles.label, labelStyle]}>
        NICE WORK
      </Animated.Text>
    </Animated.View>
  );
}

export default CelebrationOverlay;

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
    pointerEvents: 'none',
  },
  particle: {
    position: 'absolute',
    bottom: SCREEN_H * 0.1,
  },
  particleEmoji: {
    fontSize: 28,
  },
  trophy: {
    marginBottom: 16,
  },
  trophyEmoji: {
    fontSize: 80,
  },
  label: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FF4D00',
    letterSpacing: 4,
    textShadowColor: '#FF4D00',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
});
