import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, Pressable, RefreshControl } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useThemeMode } from '../contexts/ThemeContext';
import { useToast } from '../contexts/ToastContext';
import { usePreferences } from '../contexts/PreferencesContext';
import { Button, GlassCard, SectionHeader, EmptyState } from '../components/UI';
import { SearchBar } from '../components/SearchBar';
import { COLORS, SPACING, TYPOGRAPHY, LAYOUT, RADIUS, TOUCH_TARGET } from '../theme/tokens';
import {
  FRIEND_PROFILES,
  DEFAULT_FRIEND_IDS,
  DEFAULT_REQUEST_IDS,
  DEFAULT_OUTGOING_IDS,
  type FriendProfile,
} from '../data/friends';
import type { ProfileStackParamList } from '../types';
import devLog from '../utils/devLog';

type ProfileNav = NativeStackNavigationProp<ProfileStackParamList>;

const STORAGE_KEYS = {
  friends: '@friends_ids',
  requests: '@friend_request_ids',
  outgoing: '@friend_outgoing_ids',
};

function useStoredList(key: string, fallback: string[]) {
  const [value, setValue] = useState<string[]>(fallback);

  useEffect(() => {
    const load = async () => {
      try {
        const stored = await AsyncStorage.getItem(key);
        if (stored) {
          setValue(JSON.parse(stored));
        }
      } catch (error) {
        devLog.error(`Failed to load ${key} from AsyncStorage:`, error);
        // Silently fail and use fallback value already set in state
      }
    };
    load();
  }, [key]);

  const save = useCallback(
    async (next: string[]) => {
      setValue(next);
      try {
        await AsyncStorage.setItem(key, JSON.stringify(next));
      } catch (error) {
        devLog.error(`Failed to save ${key} to AsyncStorage:`, error);
        // Note: Callers should add error handling to show user feedback
      }
    },
    [key]
  );

  return [value, save] as const;
}

export default function FriendsScreen() {
  const navigation = useNavigation<ProfileNav>();
  const { isDark } = useThemeMode();
  const colors = isDark ? COLORS.dark : COLORS.light;
  const { showToast } = useToast();
  const { preferences } = usePreferences();
  const compact = preferences.compactMode;

  const [searchQuery, setSearchQuery] = useState('');
  const [friendIds, setFriendIds] = useStoredList(STORAGE_KEYS.friends, DEFAULT_FRIEND_IDS);
  const [requestIds, setRequestIds] = useStoredList(STORAGE_KEYS.requests, DEFAULT_REQUEST_IDS);
  const [outgoingIds, setOutgoingIds] = useStoredList(STORAGE_KEYS.outgoing, DEFAULT_OUTGOING_IDS);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const [storedFriends, storedRequests, storedOutgoing] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.friends),
        AsyncStorage.getItem(STORAGE_KEYS.requests),
        AsyncStorage.getItem(STORAGE_KEYS.outgoing),
      ]);
      if (storedFriends) setFriendIds(JSON.parse(storedFriends));
      if (storedRequests) setRequestIds(JSON.parse(storedRequests));
      if (storedOutgoing) setOutgoingIds(JSON.parse(storedOutgoing));
    } catch (error) {
      devLog.error('Failed to refresh friends data:', error);
    } finally {
      setRefreshing(false);
    }
  }, [setFriendIds, setRequestIds, setOutgoingIds]);

  const friends = useMemo(
    () => FRIEND_PROFILES.filter((profile) => friendIds.includes(profile.id)),
    [friendIds]
  );

  const requests = useMemo(
    () => FRIEND_PROFILES.filter((profile) => requestIds.includes(profile.id)),
    [requestIds]
  );

  const outgoing = useMemo(
    () => FRIEND_PROFILES.filter((profile) => outgoingIds.includes(profile.id)),
    [outgoingIds]
  );

  const suggestions = useMemo(() => {
    const lowered = searchQuery.trim().toLowerCase();
    return FRIEND_PROFILES.filter((profile) => {
      if (friendIds.includes(profile.id) || requestIds.includes(profile.id) || outgoingIds.includes(profile.id)) {
        return false;
      }
      if (!lowered) return true;
      return (
        profile.name.toLowerCase().includes(lowered) ||
        profile.handle.toLowerCase().includes(lowered) ||
        profile.homeGym.toLowerCase().includes(lowered)
      );
    });
  }, [searchQuery, friendIds, requestIds, outgoingIds]);

  const handleAccept = useCallback(
    async (id: string) => {
      try {
        setLoadingAction(`accept-${id}`);
        await setRequestIds(requestIds.filter((item) => item !== id));
        await setFriendIds([id, ...friendIds]);
        showToast('Friend added', { type: 'success' });
      } catch (error) {
        showToast('Failed to accept request', { type: 'error' });
      } finally {
        setLoadingAction(null);
      }
    },
    [requestIds, friendIds, setRequestIds, setFriendIds, showToast]
  );

  const handleDecline = useCallback(
    async (id: string) => {
      try {
        setLoadingAction(`decline-${id}`);
        await setRequestIds(requestIds.filter((item) => item !== id));
        showToast('Request declined', { type: 'info' });
      } catch (error) {
        showToast('Failed to decline request', { type: 'error' });
      } finally {
        setLoadingAction(null);
      }
    },
    [requestIds, setRequestIds, showToast]
  );

  const handleAdd = useCallback(
    async (id: string) => {
      try {
        setLoadingAction(`add-${id}`);
        await setOutgoingIds([id, ...outgoingIds]);
        showToast('Friend request sent', { type: 'success' });
      } catch (error) {
        showToast('Failed to send request', { type: 'error' });
      } finally {
        setLoadingAction(null);
      }
    },
    [outgoingIds, setOutgoingIds, showToast]
  );

  const handleCancel = useCallback(
    async (id: string) => {
      try {
        setLoadingAction(`cancel-${id}`);
        await setOutgoingIds(outgoingIds.filter((item) => item !== id));
        showToast('Request canceled', { type: 'info' });
      } catch (error) {
        showToast('Failed to cancel request', { type: 'error' });
      } finally {
        setLoadingAction(null);
      }
    },
    [outgoingIds, setOutgoingIds, showToast]
  );

  const renderProfileRow = (profile: FriendProfile, action?: React.ReactNode) => (
    <Pressable
      key={profile.id}
      onPress={() => navigation.navigate('FriendProfile', { friendId: profile.id })}
      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
      style={({ pressed }) => [
        styles.row,
        compact && styles.rowCompact,
        pressed && styles.rowPressed,
      ]}
    >
      <View style={[styles.avatar, compact && styles.avatarCompact, { backgroundColor: colors.primary + '20' }]}>
        <Text style={[styles.avatarText, compact && styles.avatarTextCompact]}>
          {profile.name.charAt(0)}
        </Text>
      </View>
      <View style={styles.rowText}>
        <Text style={[styles.rowTitle, compact && styles.rowTitleCompact, { color: colors.textPrimary }]}>
          {profile.name}
        </Text>
        <Text style={[styles.rowSubtitle, compact && styles.rowSubtitleCompact, { color: colors.textSecondary }]}>
          {profile.handle} · {profile.homeGym}
        </Text>
      </View>
      {action}
    </Pressable>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[styles.content, compact && styles.contentCompact]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        <SectionHeader
          title="Friends"
          subtitle="Track progress together and keep each other accountable"
          titleStyle={styles.sectionTitle}
          subtitleStyle={styles.sectionSubtitle}
        />

        <SearchBar
          placeholder="Search people or gyms..."
          onSearch={setSearchQuery}
          style={[styles.searchBar, compact && styles.searchBarCompact]}
        />

        {requests.length > 0 && (
          <GlassCard style={[styles.card, compact && styles.cardCompact]} intensity={16}>
            <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Requests</Text>
            {requests.map((profile) =>
              renderProfileRow(
                profile,
                <View style={[styles.actionRow, compact && styles.actionRowCompact]}>
                  <Button
                    title={loadingAction === `accept-${profile.id}` ? 'Adding...' : 'Accept'}
                    onPress={() => handleAccept(profile.id)}
                    size="small"
                    disabled={loadingAction !== null}
                  />
                  <Button
                    title={loadingAction === `decline-${profile.id}` ? 'Declining...' : 'Decline'}
                    onPress={() => handleDecline(profile.id)}
                    size="small"
                    variant="secondary"
                    disabled={loadingAction !== null}
                  />
                </View>
              )
            )}
          </GlassCard>
        )}

        <GlassCard style={[styles.card, compact && styles.cardCompact]} intensity={16}>
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Your friends</Text>
          {friends.length === 0 && (
            <EmptyState
              title="No friends yet"
              message="Add friends to share progress."
            />
          )}
          {friends.map((profile) => renderProfileRow(profile))}
        </GlassCard>

        {outgoing.length > 0 && (
          <GlassCard style={[styles.card, compact && styles.cardCompact]} intensity={16}>
            <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Pending</Text>
            {outgoing.map((profile) =>
              renderProfileRow(
                profile,
                <Button
                  title={loadingAction === `cancel-${profile.id}` ? 'Canceling...' : 'Cancel'}
                  onPress={() => handleCancel(profile.id)}
                  size="small"
                  variant="secondary"
                  disabled={loadingAction !== null}
                />
              )
            )}
          </GlassCard>
        )}

        <GlassCard style={[styles.card, compact && styles.cardCompact]} intensity={16}>
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Suggestions</Text>
          {suggestions.length === 0 && (
            <EmptyState
              title="No suggestions found"
              message="No suggestions match that search."
            />
          )}
          {suggestions.map((profile) =>
            renderProfileRow(
              profile,
              <Button
                title={loadingAction === `add-${profile.id}` ? 'Adding...' : 'Add'}
                onPress={() => handleAdd(profile.id)}
                size="small"
                disabled={loadingAction !== null}
              />
            )
          )}
        </GlassCard>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingBottom: SPACING['4xl'],
    gap: SPACING.lg,
  },
  contentCompact: {
    paddingBottom: SPACING['3xl'],
    gap: SPACING.md,
  },
  sectionTitle: {
    color: '#F5F7F2',
    textShadowColor: 'rgba(34, 197, 94, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  sectionSubtitle: {
    color: '#B9C2B0',
  },
  searchBar: {
    marginHorizontal: LAYOUT.screenPadding,
  },
  searchBarCompact: {
    marginHorizontal: LAYOUT.screenPadding,
  },
  card: {
    marginHorizontal: LAYOUT.screenPadding,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    gap: SPACING.sm,
  },
  cardCompact: {
    padding: SPACING.md,
    gap: SPACING.xs,
  },
  cardTitle: {
    ...TYPOGRAPHY.presets.heading3,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    paddingVertical: SPACING.md,
    minHeight: TOUCH_TARGET.comfortable,
  },
  rowCompact: {
    gap: SPACING.sm,
    paddingVertical: SPACING.sm,
    minHeight: TOUCH_TARGET.min,
  },
  rowPressed: {
    opacity: 0.85,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarCompact: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  avatarTextCompact: {
    fontSize: 15,
  },
  rowText: {
    flex: 1,
  },
  rowTitle: {
    ...TYPOGRAPHY.presets.bodyBold,
  },
  rowTitleCompact: {
    fontSize: TYPOGRAPHY.sizes.base,
  },
  rowSubtitle: {
    ...TYPOGRAPHY.presets.caption,
  },
  rowSubtitleCompact: {
    fontSize: TYPOGRAPHY.sizes.xs,
  },
  actionRow: {
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  actionRowCompact: {
    gap: 4,
  },
});
