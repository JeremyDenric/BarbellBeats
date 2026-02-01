/**
 * Offline Banner Component
 * Displays an animated banner when the device loses internet connection
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeMode } from '../contexts/ThemeContext';
import { usePreferences } from '../contexts/PreferencesContext';
import { COLORS, SPACING, TYPOGRAPHY, SHADOWS } from '../theme/tokens';

// ============================================================================
// Types
// ============================================================================

interface OfflineBannerProps {
  /**
   * Whether the device is offline
   */
  isOffline: boolean;
  /**
   * Optional custom message
   */
  message?: string;
  /**
   * Optional message shown when connection is restored
   */
  onlineMessage?: string;
}

// ============================================================================
// Component
// ============================================================================

export const OfflineBanner: React.FC<OfflineBannerProps> = ({
  isOffline,
  message = 'No internet connection',
  onlineMessage = 'Back online',
}) => {
  const { isDark } = useThemeMode();
  const { preferences } = usePreferences();
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(-100)).current;
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasMountedRef = useRef(false);
  const [isVisible, setIsVisible] = useState(isOffline);
  const [status, setStatus] = useState<'offline' | 'online'>(
    isOffline ? 'offline' : 'online'
  );

  const colors = isDark ? COLORS.dark : COLORS.light;
  const reduceMotion = preferences.reduceMotion;

  const animateIn = useCallback(() => {
    if (reduceMotion) {
      slideAnim.setValue(0);
      return;
    }

    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 80,
      friction: 12,
    }).start();
  }, [reduceMotion, slideAnim]);

  const animateOut = useCallback(
    (onComplete?: () => void) => {
      if (reduceMotion) {
        slideAnim.setValue(-100);
        onComplete?.();
        return;
      }

      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 200,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) {
          onComplete?.();
        }
      });
    },
    [reduceMotion, slideAnim]
  );

  const clearHideTimer = useCallback(() => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      if (isOffline) {
        setStatus('offline');
        setIsVisible(true);
        animateIn();
      } else {
        slideAnim.setValue(-100);
        setIsVisible(false);
      }
      return;
    }

    clearHideTimer();

    if (isOffline) {
      setStatus('offline');
      setIsVisible(true);
      animateIn();
      return;
    }

    setStatus('online');
    setIsVisible(true);
    animateIn();

    hideTimerRef.current = setTimeout(() => {
      animateOut(() => setIsVisible(false));
    }, 1400);
  }, [animateIn, animateOut, clearHideTimer, isOffline, slideAnim]);

  useEffect(() => {
    return () => {
      clearHideTimer();
    };
  }, [clearHideTimer]);

  if (!isVisible) {
    return null;
  }

  const bannerMessage = status === 'offline' ? message : onlineMessage;
  const backgroundColor = status === 'offline' ? colors.warning : colors.success;
  const messageColor = status === 'offline' ? '#0B0B0B' : colors.textPrimary;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor,
          paddingTop: insets.top + SPACING.sm,
          transform: [{ translateY: slideAnim }],
          ...SHADOWS.sm,
        },
      ]}
    >
      <View style={styles.content}>
        <Text style={[styles.icon]}>⚠️</Text>
        <Text style={[styles.message, { color: messageColor }]}>
          {bannerMessage}
        </Text>
      </View>
    </Animated.View>
  );
};

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    paddingBottom: SPACING.sm,
    paddingHorizontal: SPACING.lg,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 16,
    marginRight: SPACING.sm,
  },
  message: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.semibold as any,
    letterSpacing: TYPOGRAPHY.letterSpacing.normal,
  },
});

export default OfflineBanner;
