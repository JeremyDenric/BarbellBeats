import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, TouchableOpacity, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useThemeMode } from '../contexts/ThemeContext';
import { usePreferences } from '../contexts/PreferencesContext';
import { COLORS, SPACING } from '../theme/tokens';
import { RootStackParamList } from '../types';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { EmptyState } from '../components/UI';

const STORAGE_KEY = '@saved_timers';
const ACTIVE_TIMER_KEY = '@active_timer';

type SavedTimer = {
  id: string;
  elapsedMs: number;
  savedAt: string;
};

function formatElapsed(ms: number) {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const centis = Math.floor((ms % 1000) / 10);
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(centis).padStart(2, '0')}`;
}

export default function TimersScreen() {
  const { isDark } = useThemeMode();
  const colors = isDark ? COLORS.dark : COLORS.light;
  const { preferences } = usePreferences();
  const compact = preferences.compactMode;
  const [timers, setTimers] = useState<SavedTimer[]>([]);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const loadTimers = useCallback(async () => {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) {
      setTimers(JSON.parse(raw));
      return;
    }
    setTimers([]);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadTimers();
    }, [loadTimers])
  );

  const handleLoad = async (timer: SavedTimer) => {
    await AsyncStorage.setItem(ACTIVE_TIMER_KEY, JSON.stringify(timer));
    navigation.navigate('Home');
  };

  const renderTimerItem = useCallback(
    ({ item }: { item: SavedTimer }) => (
      <TouchableOpacity
        onPress={() => handleLoad(item)}
        style={[
          styles.card,
          compact && styles.cardCompact,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        <Text style={[styles.timeText, compact && styles.timeTextCompact, { color: colors.textPrimary }]}>
          {formatElapsed(item.elapsedMs)}
        </Text>
        <Text style={[styles.metaText, compact && styles.metaTextCompact, { color: colors.textTertiary }]}>
          Saved {new Date(item.savedAt).toLocaleString()}
        </Text>
        <Text style={[styles.loadHint, compact && styles.loadHintCompact, { color: colors.textSecondary }]}>
          Tap to load
        </Text>
      </TouchableOpacity>
    ),
    [colors, compact, handleLoad]
  );

  const timerKeyExtractor = useCallback((item: SavedTimer) => item.id, []);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={timers}
        keyExtractor={timerKeyExtractor}
        contentContainerStyle={[styles.list, compact && styles.listCompact]}
        removeClippedSubviews={Platform.OS === 'android'}
        initialNumToRender={8}
        maxToRenderPerBatch={8}
        windowSize={9}
        updateCellsBatchingPeriod={50}
        ListEmptyComponent={
          <EmptyState
            icon={<Text style={[styles.emptyIcon, compact && styles.emptyIconCompact]}>⏱️</Text>}
            title="No saved timers"
            message="Save a timer from your workout to reuse it later."
          />
        }
        renderItem={renderTimerItem}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  list: {
    padding: SPACING.lg,
  },
  listCompact: {
    padding: SPACING.md,
  },
  card: {
    borderRadius: 16,
    padding: SPACING.md,
    borderWidth: 1,
    marginBottom: SPACING.sm,
  },
  cardCompact: {
    borderRadius: 14,
    padding: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  timeText: {
    fontSize: 20,
    fontWeight: '800',
  },
  timeTextCompact: {
    fontSize: 16,
  },
  metaText: {
    marginTop: 4,
    fontSize: 12,
  },
  metaTextCompact: {
    fontSize: 11,
  },
  loadHint: {
    marginTop: 6,
    fontSize: 11,
    fontWeight: '600',
  },
  loadHintCompact: {
    marginTop: 4,
    fontSize: 10,
  },
  emptyIcon: {
    fontSize: 32,
  },
  emptyIconCompact: {
    fontSize: 26,
  },
});
