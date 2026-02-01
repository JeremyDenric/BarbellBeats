import React from 'react';
import { SafeAreaView, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SPOTIFY_THEME } from '../theme/tokens';

interface SpotifyTemplateProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
}

export default function SpotifyTemplate({ children, style, contentStyle }: SpotifyTemplateProps) {
  return (
    <LinearGradient
      colors={SPOTIFY_THEME.backgroundGradient}
      style={[styles.container, style]}
      shouldRasterizeIOS
    >
      <SafeAreaView style={[styles.content, contentStyle]}>
        {children}
      </SafeAreaView>
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
});
