import React from 'react';
import { SafeAreaView, StyleSheet, View, StyleProp, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeMode } from '../contexts/ThemeContext';
import { usePreferences } from '../contexts/PreferencesContext';
import { COLORS, GRADIENTS, LAYOUT } from '../theme/tokens';

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
  const horizontalPadding = withPadding
    ? Math.max(12, LAYOUT.screenPadding - (preferences.compactMode ? 4 : 0))
    : 0;

  // 3-stop gradient: deepest ink → void → slate — creates atmospheric depth
  const gradient = isDark
    ? GRADIENTS.darkBase
    : ([colors.background, colors.backgroundAlt] as const);

  return (
    <LinearGradient
      colors={gradient}
      locations={isDark ? [0, 0.5, 1] : [0, 1]}
      style={[styles.container, style]}
      shouldRasterizeIOS
    >
      <SafeAreaView
        style={[
          styles.content,
          withPadding && { paddingHorizontal: horizontalPadding },
          contentStyle,
        ]}
      >
        {children}
      </SafeAreaView>
      {/* Subtle noise texture — adds material quality without heavy texture assets */}
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
    // A single-color overlay at very low opacity creates a grain/noise feel
    // without needing a texture image asset.
    backgroundColor: 'rgba(255, 200, 150, 0.012)',
  },
});
