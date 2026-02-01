/**
 * Theme Toggle Component
 * Allows users to switch between light, dark, and auto theme modes
 * Displays current mode with appropriate icon
 */

import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { useTheme } from '@react-navigation/native';
import { useThemeMode } from '../contexts/ThemeContext';
import { TOUCH_TARGET, SPACING } from '../theme/tokens';

export default function ThemeToggle() {
  const theme = useTheme();
  const { themeMode, toggleTheme } = useThemeMode();

  // Get icon based on current theme mode
  const getThemeIcon = () => {
    switch (themeMode) {
      case 'light':
        return '☀️';
      case 'dark':
        return '🌙';
      case 'auto':
        return '🔄';
      default:
        return '🔄';
    }
  };

  // Get label for accessibility
  const getThemeLabel = () => {
    switch (themeMode) {
      case 'light':
        return 'Light mode';
      case 'dark':
        return 'Dark mode';
      case 'auto':
        return 'Auto mode';
      default:
        return 'Theme';
    }
  };

  return (
    <TouchableOpacity
      onPress={toggleTheme}
      style={[
        styles.container,
        { backgroundColor: theme.colors.card }
      ]}
      activeOpacity={0.7}
      accessibilityLabel={`Current theme: ${getThemeLabel()}. Tap to change.`}
      accessibilityRole="button"
    >
      <View style={styles.iconContainer}>
        <Text style={styles.icon}>{getThemeIcon()}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: TOUCH_TARGET.min,
    height: TOUCH_TARGET.min,
    borderRadius: TOUCH_TARGET.min / 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
    shadowColor: '#3B9BF5',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  iconContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    fontSize: 20,
  },
});
