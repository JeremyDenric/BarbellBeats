/**
 * PRVictoryOverlay
 * Full-screen animated modal that reveals after a PR workout.
 * Sequences: dim backdrop → card slide-up → badge pulse → weight count-up →
 * song row → share/close buttons → soft glow loop.
 * Captures the card as a PNG and opens the native share sheet.
 */

import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Dimensions,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  withSequence,
  withRepeat,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import * as FileSystem from 'expo-file-system';
import { captureRef } from 'react-native-view-shot';
import { sharePrVictoryImage } from '../utils/musicShare';
import { PRVictoryCard } from './PRVictoryCard';
import { Icon } from './Icon';
import { usePreferences } from '../contexts/PreferencesContext';
import { useSubscription } from '../contexts/SubscriptionContext';
import { FONTS } from '../theme/tokens';
import haptics from '../utils/haptics';
import devLog from '../utils/devLog';
import type { PRMoment } from '../types';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const LIME = '#FF4D00';
const CARD_WIDTH = 360;

// Animation timing constants (ms delays into the entrance sequence)
const T_CARD_SLIDE   = 150;
const T_CARD_SCALE   = 300;
const T_BADGE_PULSE  = 450;
const T_EXERCISE     = 700;
const T_WEIGHT       = 900;
const T_IMPROVEMENT  = 1100;
const T_ALBUM        = 1300;
const T_ACTIONS      = 1700;
const T_GLOW_START   = 2000;

/** Zero-duration timing — used when reduceMotion is enabled */
const fast = (val: number) => withTiming(val, { duration: 0 });

// ─── Confetti ────────────────────────────────────────────────────────────────

const PARTICLE_DEFS = [
  { x: 0.08, color: LIME,      shape: 'square', delay: 0   },
  { x: 0.18, color: '#00E5C8', shape: 'circle', delay: 50  },
  { x: 0.28, color: LIME,      shape: 'circle', delay: 100 },
  { x: 0.38, color: '#00E5C8', shape: 'square', delay: 30  },
  { x: 0.48, color: LIME,      shape: 'square', delay: 140 },
  { x: 0.55, color: '#FFB800', shape: 'circle', delay: 70  },
  { x: 0.62, color: LIME,      shape: 'circle', delay: 190 },
  { x: 0.72, color: '#00E5C8', shape: 'square', delay: 110 },
  { x: 0.82, color: LIME,      shape: 'square', delay: 250 },
  { x: 0.90, color: '#00E5C8', shape: 'circle', delay: 180 },
  { x: 0.13, color: '#FFB800', shape: 'circle', delay: 300 },
  { x: 0.23, color: LIME,      shape: 'square', delay: 220 },
  { x: 0.43, color: '#00E5C8', shape: 'circle', delay: 160 },
  { x: 0.58, color: LIME,      shape: 'square', delay: 340 },
  { x: 0.68, color: '#FFB800', shape: 'circle', delay: 270 },
  { x: 0.78, color: '#00E5C8', shape: 'square', delay: 80  },
  { x: 0.33, color: LIME,      shape: 'circle', delay: 200 },
  { x: 0.93, color: LIME,      shape: 'square', delay: 130 },
];

interface ParticleProps {
  x: number;
  color: string;
  shape: 'square' | 'circle';
  delay: number;
  index: number;
  reduceMotion: boolean;
}

function ConfettiParticle({ x, color, shape, delay, index, reduceMotion }: ParticleProps) {
  const translateY = useSharedValue(0);
  const translateX = useSharedValue(0);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(1.5);

  useEffect(() => {
    const drift = Math.sin(index * 1.3) * 30;
    if (reduceMotion) {
      opacity.value = 0;
      return;
    }
    opacity.value = withDelay(delay, withSequence(
      withTiming(1, { duration: 100 }),
      withDelay(700, withTiming(0, { duration: 500 }))
    ));
    translateY.value = withDelay(delay,
      withTiming(-SCREEN_H * 0.65, { duration: 1400, easing: Easing.out(Easing.cubic) })
    );
    translateX.value = withDelay(delay,
      withTiming(drift, { duration: 1400, easing: Easing.out(Easing.quad) })
    );
    scale.value = withDelay(delay,
      withTiming(0.8, { duration: 400 })
    );
  }, [index, reduceMotion]);

  const staticStyle = useMemo(() => ({
    left: x * SCREEN_W - 4,
    backgroundColor: color,
    borderRadius: shape === 'circle' ? 4 : 1,
  }), [x, color, shape]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateY: translateY.value as number },
      { translateX: translateX.value as number },
      { scale: scale.value as number },
    ] as { translateY: number }[] | { translateX: number }[] | { scale: number }[],
  }));

  return (
    <Animated.View
      style={[styles.particle, staticStyle, animStyle]}
      pointerEvents="none"
    />
  );
}

// ─── Main overlay ─────────────────────────────────────────────────────────────

export interface PRVictoryOverlayProps {
  moments: PRMoment[];
  gymName?: string;
  visible: boolean;
  onDismiss: () => void;
}

export function PRVictoryOverlay({
  moments,
  gymName,
  visible,
  onDismiss,
}: PRVictoryOverlayProps) {
  const { preferences } = usePreferences();
  const reduceMotion = preferences?.reduceMotion ?? false;
  const { isPro } = useSubscription();

  const cardRef = useRef<View>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [albumArtLoaded, setAlbumArtLoaded] = useState(
    !moments[0]?.song?.albumArt
  );
  const [isSharing, setIsSharing] = useState(false);

  // Animation values
  const backdropOpacity = useSharedValue(0);
  const cardTranslateY = useSharedValue(SCREEN_H);
  const cardScale = useSharedValue(0.84);
  const badgeScale = useSharedValue(1);
  const exerciseOpacity = useSharedValue(0);
  const exerciseX = useSharedValue(-40);
  const weightOpacity = useSharedValue(0);
  const improvementOpacity = useSharedValue(0);
  const improvementY = useSharedValue(10);
  const albumOpacity = useSharedValue(0);
  const albumX = useSharedValue(30);
  const actionsOpacity = useSharedValue(0);
  const actionsY = useSharedValue(20);
  const glowOpacity = useSharedValue(0.3);
  const cardSwapX = useSharedValue(0);

  useEffect(() => {
    if (!visible) return;

    if (reduceMotion) {
      backdropOpacity.value = fast(0.88);
      cardTranslateY.value = fast(0);
      cardScale.value = fast(1);
      exerciseOpacity.value = fast(1);
      exerciseX.value = fast(0);
      weightOpacity.value = fast(1);
      improvementOpacity.value = fast(1);
      improvementY.value = fast(0);
      albumOpacity.value = fast(1);
      albumX.value = fast(0);
      actionsOpacity.value = fast(1);
      actionsY.value = fast(0);
      glowOpacity.value = fast(0.5);
      return;
    }

    backdropOpacity.value = withTiming(0.88, { duration: 250, easing: Easing.out(Easing.quad) });

    cardTranslateY.value = withDelay(T_CARD_SLIDE, withSpring(0, { damping: 22, stiffness: 280 }));
    cardScale.value = withDelay(T_CARD_SCALE, withSpring(1, { damping: 14, stiffness: 200 }));

    badgeScale.value = withDelay(T_BADGE_PULSE, withSequence(
      withSpring(1.15, { damping: 8, stiffness: 300 }),
      withSpring(1.0, { damping: 12, stiffness: 200 })
    ));

    exerciseOpacity.value = withDelay(T_EXERCISE, withTiming(1, { duration: 300 }));
    exerciseX.value = withDelay(T_EXERCISE, withSpring(0, { damping: 18, stiffness: 120 }));

    weightOpacity.value = withDelay(T_WEIGHT, withTiming(1, { duration: 300 }));

    improvementOpacity.value = withDelay(T_IMPROVEMENT, withTiming(1, { duration: 300 }));
    improvementY.value = withDelay(T_IMPROVEMENT, withSpring(0, { damping: 16, stiffness: 120 }));

    albumOpacity.value = withDelay(T_ALBUM, withTiming(1, { duration: 300 }));
    albumX.value = withDelay(T_ALBUM, withSpring(0, { damping: 18, stiffness: 120 }));

    actionsOpacity.value = withDelay(T_ACTIONS, withTiming(1, { duration: 300 }));
    actionsY.value = withDelay(T_ACTIONS, withSpring(0, { damping: 18, stiffness: 120 }));

    glowOpacity.value = withDelay(T_GLOW_START, withRepeat(
      withSequence(
        withTiming(0.7, { duration: 1200 }),
        withTiming(0.3, { duration: 1200 })
      ),
      -1,
      true
    ));
  }, [visible]);

  const goTo = useCallback((nextIndex: number) => {
    if (reduceMotion) {
      setCurrentIndex(nextIndex);
      setAlbumArtLoaded(!moments[nextIndex]?.song?.albumArt);
      return;
    }
    const exitDir = nextIndex > currentIndex ? -1 : 1;
    cardSwapX.value = withTiming(exitDir * SCREEN_W * 0.3, { duration: 100 }, () => {
      runOnJS(setCurrentIndex)(nextIndex);
      runOnJS(setAlbumArtLoaded)(!moments[nextIndex]?.song?.albumArt);
      cardSwapX.value = -exitDir * SCREEN_W * 0.3;
      cardSwapX.value = withSpring(0, { damping: 18, stiffness: 200 });
    });
  }, [currentIndex, moments, reduceMotion]);

  const handleAlbumArtLoad = useCallback(() => setAlbumArtLoaded(true), []);
  const handleAlbumArtError = useCallback(() => setAlbumArtLoaded(true), []);

  const handleShare = useCallback(async () => {
    if (isSharing || !albumArtLoaded) return;
    setIsSharing(true);
    haptics.success();
    let uri: string | null = null;
    try {
      uri = await captureRef(cardRef, {
        format: 'png',
        quality: 1.0,
        result: 'tmpfile',
      });
      const exerciseName = moments[0]?.exerciseName;
      await sharePrVictoryImage(uri, exerciseName);
      uri = null; // sharePrVictoryImage handles cleanup
    } catch (err) {
      devLog.error('PRVictoryOverlay: share failed', err);
      if (uri) FileSystem.deleteAsync(uri, { idempotent: true }).catch(() => {});
    } finally {
      setIsSharing(false);
    }
  }, [isSharing, albumArtLoaded, moments]);

  const handleDismiss = useCallback(() => {
    if (reduceMotion) {
      backdropOpacity.value = fast(0);
      runOnJS(onDismiss)();
      return;
    }
    backdropOpacity.value = withTiming(0, { duration: 200 }, (finished) => {
      if (finished) runOnJS(onDismiss)();
    });
    cardTranslateY.value = withTiming(SCREEN_H * 0.2, { duration: 200 });
    cardScale.value = withTiming(0.92, { duration: 200 });
    actionsOpacity.value = withTiming(0, { duration: 150 });
  }, [onDismiss, reduceMotion]);

  // Animated styles
  const backdropStyle = useAnimatedStyle(() => ({ opacity: backdropOpacity.value }));
  const cardStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: cardTranslateY.value as number },
      { scale: cardScale.value as number },
      { translateX: cardSwapX.value as number },
    ] as { translateY: number }[] | { scale: number }[] | { translateX: number }[],
  }));
  const glowStyle = useAnimatedStyle(() => ({ opacity: glowOpacity.value }));
  const actionsStyle = useAnimatedStyle(() => ({
    opacity: actionsOpacity.value,
    transform: [{ translateY: actionsY.value }],
  }));

  // Pass down to card: the individual element animations are handled by the
  // overlay via opacity/transform on wrapper views around card sections.
  // The card itself remains static for clean image capture.

  if (!visible || moments.length === 0) return null;

  const currentMoment = moments[currentIndex];
  const showPagination = moments.length > 1;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={handleDismiss}
    >
      {/* Backdrop */}
      <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, backdropStyle]} />

      {/* Confetti layer */}
      <View style={styles.confettiContainer} pointerEvents="none">
        {PARTICLE_DEFS.map((p, i) => (
          <ConfettiParticle
            key={i}
            x={p.x}
            color={p.color}
            shape={p.shape as 'square' | 'circle'}
            delay={p.delay}
            index={i}
            reduceMotion={reduceMotion}
          />
        ))}
      </View>

      {/* Main content */}
      <View style={styles.container}>
        {/* Pagination dots */}
        {showPagination && (
          <View style={styles.dotsRow}>
            {moments.map((_, i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  i === currentIndex ? styles.dotActive : styles.dotInactive,
                ]}
              />
            ))}
          </View>
        )}

        {/* Card + glow */}
        <Animated.View style={cardStyle}>
          {/* Lime glow behind card */}
          <Animated.View style={[styles.cardGlow, glowStyle]} />
          <PRVictoryCard
            ref={cardRef}
            moment={currentMoment}
            gymName={gymName}
            isPro={isPro}
            onAlbumArtLoad={handleAlbumArtLoad}
            onAlbumArtError={handleAlbumArtError}
          />
        </Animated.View>

        {/* Pagination nav */}
        {showPagination && (
          <View style={styles.navRow}>
            <Pressable
              onPress={() => { haptics.lightTap(); goTo(currentIndex - 1); }}
              disabled={currentIndex === 0}
              style={[styles.navBtn, currentIndex === 0 && styles.navBtnDisabled]}
              hitSlop={12}
            >
              <Icon name="caret-left" size="sm" color={currentIndex === 0 ? 'rgba(140,136,160,0.3)' : LIME} />
            </Pressable>
            <Text style={styles.navCount}>
              {currentIndex + 1} / {moments.length}
            </Text>
            <Pressable
              onPress={() => { haptics.lightTap(); goTo(currentIndex + 1); }}
              disabled={currentIndex === moments.length - 1}
              style={[styles.navBtn, currentIndex === moments.length - 1 && styles.navBtnDisabled]}
              hitSlop={12}
            >
              <Icon name="caret-right" size="sm" color={currentIndex === moments.length - 1 ? 'rgba(140,136,160,0.3)' : LIME} />
            </Pressable>
          </View>
        )}

        {/* Actions */}
        <Animated.View style={[styles.actionsRow, actionsStyle]}>
          <Pressable
            onPress={handleShare}
            disabled={isSharing || !albumArtLoaded}
            style={[
              styles.shareBtn,
              (isSharing || !albumArtLoaded) && styles.shareBtnDisabled,
            ]}
            accessibilityLabel="Share this PR card"
            accessibilityRole="button"
          >
            {isSharing ? (
              <ActivityIndicator size="small" color="#0A0A0F" />
            ) : (
              <>
                <Icon name="share" size="sm" color="#0A0A0F" />
                <Text style={styles.shareBtnText}>SHARE CARD</Text>
              </>
            )}
          </Pressable>

          <Pressable
            onPress={handleDismiss}
            style={styles.closeBtn}
            hitSlop={12}
            accessibilityLabel="Close victory card"
            accessibilityRole="button"
          >
            <Text style={styles.closeBtnText}>CLOSE</Text>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    backgroundColor: '#0A0A0A',
  },
  confettiContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
  particle: {
    position: 'absolute',
    bottom: SCREEN_H * 0.08,
    width: 7,
    height: 7,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    paddingHorizontal: (SCREEN_W - CARD_WIDTH) / 2,
    paddingBottom: 32,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dotActive: {
    backgroundColor: LIME,
    width: 20,
    borderRadius: 3,
  },
  dotInactive: {
    backgroundColor: 'rgba(203, 255, 0, 0.25)',
    borderWidth: 1,
    borderColor: 'rgba(203, 255, 0, 0.4)',
  },
  cardGlow: {
    position: 'absolute',
    top: -20,
    left: -20,
    right: -20,
    bottom: -20,
    borderRadius: 30,
    backgroundColor: 'rgba(203, 255, 0, 0.06)',
    shadowColor: LIME,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 40,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  navBtn: {
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(203, 255, 0, 0.25)',
    backgroundColor: 'rgba(203, 255, 0, 0.06)',
  },
  navBtnDisabled: {
    borderColor: 'rgba(140, 136, 160, 0.15)',
    backgroundColor: 'transparent',
  },
  navCount: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: 'rgba(203, 255, 0, 0.6)',
    letterSpacing: 1,
  },
  actionsRow: {
    width: CARD_WIDTH,
    gap: 10,
    alignItems: 'center',
  },
  shareBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: LIME,
    borderRadius: 12,
    paddingVertical: 14,
  },
  shareBtnDisabled: {
    backgroundColor: 'rgba(203, 255, 0, 0.35)',
  },
  shareBtnText: {
    fontFamily: FONTS.display,
    fontSize: 13,
    fontWeight: '900',
    color: '#0A0A0F',
    letterSpacing: 2,
  },
  closeBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  closeBtnText: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(140, 136, 160, 0.7)',
    letterSpacing: 2,
  },
});
