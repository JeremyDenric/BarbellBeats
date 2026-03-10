/**
 * Animated Pressable Component
 * Standard press feedback with reanimated spring physics
 */

import React, { useCallback } from 'react';
import { Pressable, PressableProps, ViewStyle, StyleProp } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { usePreferences } from '../contexts/PreferencesContext';
import { ANIMATION, TOUCH_TARGET } from '../theme/tokens';

// ============================================================================
// Types
// ============================================================================

interface AnimatedPressableProps extends Omit<PressableProps, 'style' | 'children'> {
  /**
   * Content - must be ReactNode, not a render function
   */
  children?: React.ReactNode;
  /**
   * Content style (will be animated)
   */
  style?: StyleProp<ViewStyle>;
  /**
   * Scale value when pressed (default: 0.96)
   */
  pressScale?: number;
  /**
   * Opacity when pressed (default: 0.9)
   */
  pressOpacity?: number;
  /**
   * Enable haptic feedback (default: true)
   */
  hapticFeedback?: boolean;
  /**
   * Minimum touch target size enforcement (default: 48px)
   */
  minTouchTarget?: number;
  /**
   * Spring animation config (default: snappy)
   */
  springConfig?: {
    damping?: number;
    stiffness?: number;
  };
}

// ============================================================================
// Component
// ============================================================================

export const AnimatedPressable: React.FC<AnimatedPressableProps> = ({
  children,
  style,
  pressScale = 0.95,
  pressOpacity = 0.88,
  hapticFeedback = true,
  minTouchTarget = TOUCH_TARGET.min,
  springConfig = ANIMATION.spring.snap,
  onPressIn,
  onPressOut,
  onPress,
  disabled = false,
  ...props
}) => {
  const { preferences } = usePreferences();
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  // Animated style
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  // Handle press in
  const handlePressIn = useCallback(
    (event: any) => {
      if (!disabled) {
        if (!preferences.reduceMotion) {
          // Press-in: fast/sharp — snaps into pressed state with high stiffness
          scale.value = withSpring(pressScale, ANIMATION.spring.snap);
          opacity.value = withSpring(pressOpacity, ANIMATION.spring.snap);
        }

        // Haptic feedback
        if (hapticFeedback && preferences.hapticsEnabled) {
          Haptics.selectionAsync().catch(() => {});
        }
      }

      onPressIn?.(event);
    },
    [
      disabled,
      preferences.reduceMotion,
      preferences.hapticsEnabled,
      scale,
      opacity,
      pressScale,
      pressOpacity,
      hapticFeedback,
      onPressIn,
    ]
  );

  // Handle press out
  const handlePressOut = useCallback(
    (event: any) => {
      if (!preferences.reduceMotion) {
        // Press-out: controlled return — precise spring, no bounce
        scale.value = withSpring(1, ANIMATION.spring.precise);
        opacity.value = withSpring(1, ANIMATION.spring.precise);
      }

      onPressOut?.(event);
    },
    [preferences.reduceMotion, scale, opacity, onPressOut]
  );

  // Handle press
  const handlePress = useCallback(
    (event: any) => {
      if (!disabled) {
        onPress?.(event);
      }
    },
    [disabled, onPress]
  );

  return (
    <Pressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      disabled={disabled}
      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
      {...props}
    >
      <Animated.View style={[style, animatedStyle]}>
        {children}
      </Animated.View>
    </Pressable>
  );
};

export default AnimatedPressable;
