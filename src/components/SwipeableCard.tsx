/**
 * Swipeable Card Component
 * Smooth swipe gestures for playlist items, workouts, and notifications
 */

import React, { useCallback, ReactNode } from 'react';
import { StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { usePreferences } from '../contexts/PreferencesContext';
import { ANIMATION } from '../theme/tokens';

// ============================================================================
// Types
// ============================================================================

export interface SwipeAction {
  /**
   * Icon or component to display for this action
   */
  icon: ReactNode;
  /**
   * Background color for this action
   */
  color: string;
  /**
   * Callback when this action is triggered
   */
  onTrigger: () => void;
  /**
   * Label for accessibility
   */
  label: string;
}

interface SwipeableCardProps {
  /**
   * Card content
   */
  children: ReactNode;
  /**
   * Left swipe action (swipe left to reveal)
   */
  leftAction?: SwipeAction;
  /**
   * Right swipe action (swipe right to reveal)
   */
  rightAction?: SwipeAction;
  /**
   * Swipe threshold distance to trigger action (default: 120px)
   */
  swipeThreshold?: number;
  /**
   * Whether swiping is enabled
   */
  enabled?: boolean;
  /**
   * Custom styles for the card
   */
  style?: StyleProp<ViewStyle>;
  /**
   * Haptic feedback on threshold cross
   */
  hapticFeedback?: boolean;
}

// ============================================================================
// Component
// ============================================================================

export const SwipeableCard: React.FC<SwipeableCardProps> = ({
  children,
  leftAction,
  rightAction,
  swipeThreshold = 120,
  enabled = true,
  style,
  hapticFeedback = true,
}) => {
  const { preferences } = usePreferences();
  const translateX = useSharedValue(0);
  const thresholdCrossed = useSharedValue(false);

  const triggerHaptic = useCallback(() => {
    if (hapticFeedback && preferences.hapticsEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    }
  }, [hapticFeedback, preferences.hapticsEnabled]);

  const resetPosition = useCallback(() => {
    translateX.value = withSpring(0, ANIMATION.spring.snappy);
    thresholdCrossed.value = false;
  }, [translateX, thresholdCrossed]);

  const gesture = Gesture.Pan()
    .enabled(enabled && (!!leftAction || !!rightAction))
    .activeOffsetX([-10, 10])
    .onUpdate((event) => {
      const { translationX } = event;

      // Only allow swipe if action exists in that direction
      if (translationX > 0 && !rightAction) return;
      if (translationX < 0 && !leftAction) return;

      translateX.value = translationX;

      // Check threshold crossing for haptic feedback
      const crossed = Math.abs(translationX) > swipeThreshold;
      if (crossed !== thresholdCrossed.value) {
        thresholdCrossed.value = crossed;
        if (crossed) {
          runOnJS(triggerHaptic)();
        }
      }
    })
    .onEnd((event) => {
      const { translationX, velocityX } = event;
      const shouldTrigger =
        Math.abs(translationX) > swipeThreshold || Math.abs(velocityX) > 500;

      if (shouldTrigger) {
        // Determine which action to trigger
        if (translationX > 0 && rightAction) {
          runOnJS(rightAction.onTrigger)();
        } else if (translationX < 0 && leftAction) {
          runOnJS(leftAction.onTrigger)();
        }
      }

      // Reset position
      runOnJS(resetPosition)();
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const leftActionStyle = useAnimatedStyle(() => {
    if (!rightAction) return { opacity: 0 };

    const opacity = Math.min(translateX.value / swipeThreshold, 1);
    const scale = Math.min(0.8 + (translateX.value / swipeThreshold) * 0.2, 1);

    return {
      opacity: Math.max(0, opacity),
      transform: [{ scale: Math.max(0.8, scale) }],
    };
  });

  const rightActionStyle = useAnimatedStyle(() => {
    if (!leftAction) return { opacity: 0 };

    const progress = Math.abs(translateX.value) / swipeThreshold;
    const opacity = Math.min(progress, 1);
    const scale = Math.min(0.8 + progress * 0.2, 1);

    return {
      opacity: Math.max(0, opacity),
      transform: [{ scale: Math.max(0.8, scale) }],
    };
  });

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={[styles.container, style]}>
        {/* Left action (revealed when swiping right) */}
        {rightAction && (
          <Animated.View
            style={[
              styles.actionContainer,
              styles.leftAction,
              { backgroundColor: rightAction.color },
              leftActionStyle,
            ]}
            accessibilityLabel={rightAction.label}
          >
            {rightAction.icon}
          </Animated.View>
        )}

        {/* Right action (revealed when swiping left) */}
        {leftAction && (
          <Animated.View
            style={[
              styles.actionContainer,
              styles.rightAction,
              { backgroundColor: leftAction.color },
              rightActionStyle,
            ]}
            accessibilityLabel={leftAction.label}
          >
            {leftAction.icon}
          </Animated.View>
        )}

        {/* Card content */}
        <Animated.View style={[styles.content, animatedStyle]}>
          {children}
        </Animated.View>
      </Animated.View>
    </GestureDetector>
  );
};

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'hidden',
  },
  actionContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    zIndex: 0,
  },
  leftAction: {
    left: 0,
    paddingLeft: 20,
  },
  rightAction: {
    right: 0,
    paddingRight: 20,
  },
  content: {
    zIndex: 1,
  },
});

export default SwipeableCard;
