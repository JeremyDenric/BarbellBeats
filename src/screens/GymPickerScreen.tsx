import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { useThemeMode } from '../contexts/ThemeContext';
import { useGym } from '../contexts/GymContext';
import { usePreferences } from '../contexts/PreferencesContext';
import { listGyms } from '../services/gymApi';
import { LoadingView, ErrorView, IOSListRow, EmptyState } from '../components/UI';
import { SearchBar } from '../components/SearchBar';
import { COLORS, IOS_COLORS, SPACING, LAYOUT } from '../theme/tokens';
import type { Gym, MusicStackParamList } from '../types';

type MusicNav = NativeStackNavigationProp<MusicStackParamList>;

export default function GymPickerScreen() {
  const navigation = useNavigation<MusicNav>();
  const { isDark } = useThemeMode();
  const colors = isDark ? COLORS.dark : COLORS.light;
  const iosColors = isDark ? IOS_COLORS.dark : IOS_COLORS.light;
  const { preferences } = usePreferences();
  const compact = preferences.compactMode;
  const { setActiveGymId, activeGymId } = useGym();
  const [searchQuery, setSearchQuery] = useState('');

  const { data: gyms, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['gyms'],
    queryFn: () => listGyms(),
    staleTime: 1000 * 60 * 5,
  });

  const filteredGyms = useMemo(() => {
    if (!gyms) return [];
    if (!searchQuery.trim()) return gyms;
    const query = searchQuery.toLowerCase();
    return gyms.filter(
      (gym) =>
        gym.name.toLowerCase().includes(query) ||
        gym.address.toLowerCase().includes(query)
    );
  }, [gyms, searchQuery]);

  const handleSelect = (gym: Gym) => {
    setActiveGymId(gym.id);
    navigation.navigate('GymPlaylist', { gymId: gym.id });
  };

  if (isLoading) {
    return <LoadingView message="Loading gyms..." />;
  }

  if (isError) {
    return <ErrorView error={error as Error} onRetry={refetch} />;
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: iosColors.systemGroupedBackground }]}>
      <View style={[styles.searchRow, compact && styles.searchRowCompact]}>
        <SearchBar
          placeholder="Search gyms..."
          onSearch={setSearchQuery}
          style={[styles.searchBar, compact && styles.searchBarCompact]}
        />
      </View>
      <FlatList
        data={filteredGyms}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <IOSListRow
            onPress={() => handleSelect(item)}
            separator={index !== filteredGyms.length - 1}
          >
            <View style={styles.rowContent}>
              <View style={styles.rowText}>
                <Text
                  style={[styles.rowTitle, compact && styles.rowTitleCompact, { color: iosColors.label }]}
                  numberOfLines={1}
                >
                  {item.name}
                </Text>
                <Text
                  style={[styles.rowSubtitle, compact && styles.rowSubtitleCompact, { color: iosColors.secondaryLabel }]}
                  numberOfLines={1}
                >
                  {item.address}
                </Text>
              </View>
              {activeGymId === item.id && (
                <Text style={[styles.rowBadge, { color: colors.primary }]}>Active</Text>
              )}
            </View>
          </IOSListRow>
        )}
        ListEmptyComponent={
          <EmptyState
            title="No gyms found"
            message="Try another search or refresh."
          />
        }
        contentContainerStyle={[styles.list, compact && styles.listCompact]}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchRow: {
    paddingHorizontal: LAYOUT.screenPadding,
    paddingTop: SPACING.md,
  },
  searchRowCompact: {
    paddingTop: SPACING.sm,
  },
  searchBar: {
    marginBottom: SPACING.md,
  },
  searchBarCompact: {
    marginBottom: SPACING.sm,
  },
  list: {
    paddingHorizontal: LAYOUT.screenPadding,
    paddingBottom: SPACING.xl,
  },
  listCompact: {
    paddingBottom: SPACING.lg,
  },
  rowContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.sm,
    flex: 1,
  },
  rowText: {
    flex: 1,
  },
  rowTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  rowTitleCompact: {
    fontSize: 15,
  },
  rowSubtitle: {
    fontSize: 13,
  },
  rowSubtitleCompact: {
    fontSize: 12,
  },
  rowBadge: {
    fontSize: 12,
    fontWeight: '700',
  },
});
