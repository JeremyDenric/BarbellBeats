import React from 'react';
import { SafeAreaView, StyleSheet, View, StyleProp, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeMode } from '../contexts/ThemeContext';
import { usePreferences } from '../contexts/PreferencesContext';
import { COLORS, LAYOUT } from '../theme/tokens';

interface ScreenChromeProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  withPadding?: boolean;
}

export default function ScreenChrome({
  children,
  style,
  contentStyle,
  withPadding = true,
}: ScreenChromeProps) {
  const { isDark } = useThemeMode();
  const { preferences } = usePreferences();
  const colors = isDark ? COLORS.dark : COLORS.light;
  const gradient = [colors.background, colors.backgroundAlt] as const;
  const horizontalPadding = withPadding
    ? Math.max(12, LAYOUT.screenPadding - (preferences.compactMode ? 4 : 0))
    : 0;

  return (
    <LinearGradient colors={gradient} style={[styles.container, style]} shouldRasterizeIOS>
      <SafeAreaView
        style={[
          styles.content,
          withPadding && { paddingHorizontal: horizontalPadding },
          contentStyle,
        ]}
      >
        {children}
      </SafeAreaView>
      <View style={styles.noiseOverlay} pointerEvents="none" />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  noiseOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },
});
