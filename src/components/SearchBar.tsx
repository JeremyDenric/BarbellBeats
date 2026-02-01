import React, { useState, useEffect } from 'react';
import {
  View,
  TextInput,
  Pressable,
  Text,
  StyleSheet,
  Platform,
} from 'react-native';
import { useThemeMode } from '../contexts/ThemeContext';
import { usePreferences } from '../contexts/PreferencesContext';
import { IOS_COLORS, SPACING, RADIUS, TOUCH_TARGET } from '../theme/tokens';

// ============================================================================
// Types
// ============================================================================

interface SearchBarProps {
  placeholder?: string;
  onSearch: (query: string) => void;
  debounceMs?: number;
  style?: any;
}

// ============================================================================
// SearchBar Component
// ============================================================================

export const SearchBar: React.FC<SearchBarProps> = ({
  placeholder = 'Search gyms or locations...',
  onSearch,
  debounceMs = 300,
  style,
}) => {
  const { isDark } = useThemeMode();
  const { preferences } = usePreferences();
  const iosColors = isDark ? IOS_COLORS.dark : IOS_COLORS.light;
  const compact = preferences.compactMode;

  const [searchText, setSearchText] = useState('');

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      onSearch(searchText);
    }, debounceMs);

    return () => clearTimeout(timeoutId);
  }, [searchText, debounceMs, onSearch]);

  const handleClear = () => {
    setSearchText('');
  };

  return (
    <View style={[styles.container, style]}>
      <View
        style={[
          styles.searchField,
          compact && styles.searchFieldCompact,
          { backgroundColor: iosColors.systemFill },
        ]}
      >
        {/* Search Icon */}
        <Text style={[styles.searchIcon, compact && styles.searchIconCompact]}>🔍</Text>

        {/* Text Input */}
        <TextInput
          style={[
            styles.input,
            {
              color: iosColors.label,
            },
          ]}
          placeholder={placeholder}
          placeholderTextColor={iosColors.placeholderText}
          value={searchText}
          onChangeText={setSearchText}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
          clearButtonMode="never" // We'll use custom clear button
          accessibilityLabel={placeholder}
          accessibilityHint="Enter a search term"
        />

        {/* Clear Button */}
        {searchText.length > 0 && (
          <Pressable
            onPress={handleClear}
            style={[
              styles.clearButton,
              compact && styles.clearButtonCompact,
              { backgroundColor: iosColors.tertiarySystemFill },
            ]}
            hitSlop={{ top: 12, right: 12, bottom: 12, left: 12 }}
            accessibilityRole="button"
            accessibilityLabel="Clear search"
          >
            <Text style={[styles.clearIcon, compact && styles.clearIconCompact]}>✕</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
};

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  searchField: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: RADIUS.lg,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 10 : 8,
    height: TOUCH_TARGET.min,
  },
  searchFieldCompact: {
    paddingVertical: Platform.OS === 'ios' ? 8 : 6,
    height: 44,
    borderRadius: RADIUS.md,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
    opacity: 0.6,
  },
  searchIconCompact: {
    fontSize: 14,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontWeight: '400',
    paddingVertical: 0,
  },
  clearButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  clearButtonCompact: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  clearIcon: {
    fontSize: 11,
    fontWeight: '600',
    opacity: 0.6,
  },
  clearIconCompact: {
    fontSize: 10,
  },
});
