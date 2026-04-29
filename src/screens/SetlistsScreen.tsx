import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, TextInput, FlatList, Platform, Pressable, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { usePreferences } from '../contexts/PreferencesContext';
import { SPOTIFY_THEME, SPACING } from '../theme/tokens';
import { LoadingView, ErrorView, EmptyState } from '../components/UI';
import { useToast } from '../contexts/ToastContext';
import SpotifySearch, { SpotifyTrack } from '../components/SpotifySearch';
import { createSetlist, listSetlists, deleteSetlist } from '../services/userDataApi';
import haptics from '../utils/haptics';
import { useSubscription } from '../contexts/SubscriptionContext';
import type { Setlist } from '../types';
import SpotifyTemplate from '../components/SpotifyTemplate';
import SpotifyButton from '../components/SpotifyButton';

export default function SetlistsScreen() {
  const colors = SPOTIFY_THEME;
  const { preferences } = usePreferences();
  const compact = preferences.compactMode;
  const { user } = useAuth();
  const { isPro } = useSubscription();
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [name, setName] = useState('');
  const [tracks, setTracks] = useState<SpotifyTrack[]>([]);
  const [showPicker, setShowPicker] = useState(false);

  const setlistKeyExtractor = useCallback((item: Setlist) => item.id, []);

  const { data: setlists, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['setlists', user?.id],
    queryFn: () => listSetlists(user?.id || ''),
    enabled: !!user?.id,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      return createSetlist(user?.id || '', {
        name,
        tracks: tracks.map((track) => ({
          title: track.name,
          artist: track.artists.map((a) => a.name).join(', '),
          uri: track.uri,
        })),
      });
    },
    onSuccess: () => {
      setName('');
      setTracks([]);
      setShowPicker(false);
      queryClient.invalidateQueries({ queryKey: ['setlists', user?.id] });
      showToast('Setlist saved', { type: 'success' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (setlistId: string) => deleteSetlist(user?.id || '', setlistId),
    onMutate: async (setlistId) => {
      await queryClient.cancelQueries({ queryKey: ['setlists', user?.id] });
      const previous = queryClient.getQueryData<Setlist[]>(['setlists', user?.id]);
      queryClient.setQueryData<Setlist[]>(['setlists', user?.id], (old) =>
        old ? old.filter((s) => s.id !== setlistId) : []
      );
      return { previous };
    },
    onError: (_err, _setlistId, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['setlists', user?.id], context.previous);
      }
      showToast('Failed to delete setlist', { type: 'error' });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['setlists', user?.id] });
    },
    onSuccess: () => {
      showToast('Setlist deleted', { type: 'success' });
    },
  });

  const handleDeletePress = useCallback((item: Setlist) => {
    haptics.lightTap();
    Alert.alert(
      'Delete Setlist',
      `Remove "${item.name}" (${item.tracks.length} tracks)?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            haptics.mediumTap();
            deleteMutation.mutate(item.id);
          },
        },
      ]
    );
  }, [deleteMutation]);

  const renderSetlistItem = useCallback(
    ({ item }: { item: Setlist }) => (
      <View
        style={[
          styles.card,
          compact && styles.cardCompact,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        <View style={styles.cardHeader}>
          <View style={styles.cardInfo}>
            <Text style={[styles.cardTitle, compact && styles.cardTitleCompact, { color: colors.textPrimary }]}>
              {item.name}
            </Text>
            <Text style={[styles.cardMeta, compact && styles.cardMetaCompact, { color: colors.textSecondary }]}>
              {item.tracks.length} tracks
            </Text>
          </View>
          <Pressable
            onPress={() => handleDeletePress(item)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={({ pressed }) => [styles.deleteButton, pressed && { opacity: 0.5 }]}
            accessibilityRole="button"
            accessibilityLabel={`Delete ${item.name} setlist`}
          >
            <Text style={[styles.deleteIcon, { color: colors.error }]}>✕</Text>
          </Pressable>
        </View>
      </View>
    ),
    [colors, compact, handleDeletePress]
  );

  if (isLoading) {
    return <LoadingView message="Loading setlists..." />;
  }

  if (isError) {
    return <ErrorView error={error as Error} onRetry={refetch} />;
  }

  return (
    <SpotifyTemplate>
      <View style={[styles.form, compact && styles.formCompact]}>
        <Text style={[styles.heading, compact && styles.headingCompact, { color: colors.textPrimary }]}>
          Build a Lift Setlist
        </Text>
        <TextInput
          style={[
            styles.input,
            compact && styles.inputCompact,
            { backgroundColor: colors.surface, color: colors.textPrimary },
          ]}
          placeholder="Setlist name"
          placeholderTextColor={colors.textTertiary}
          value={name}
          onChangeText={setName}
        />
        <SpotifyButton
          title={showPicker ? 'Hide Track Picker' : 'Add Tracks'}
          onPress={() => setShowPicker((prev) => !prev)}
          variant="secondary"
        />
        {showPicker && (
          <SpotifySearch onSelectTrack={(track) => setTracks((prev) => [...prev, track])} />
        )}
        <SpotifyButton
          title={
            !isPro && (setlists?.length ?? 0) >= 3
              ? `Upgrade for unlimited setlists (${setlists?.length ?? 0}/3)`
              : 'Save Setlist'
          }
          onPress={() => {
            if (!isPro && (setlists?.length ?? 0) >= 3) {
              haptics.lightTap();
              navigation.navigate('ForgePaywall' as never);
              return;
            }
            createMutation.mutate();
          }}
          variant="primary"
          disabled={!name.trim() || tracks.length === 0 || createMutation.isPending}
        />
      </View>

      <FlatList
        data={setlists || []}
        keyExtractor={setlistKeyExtractor}
        contentContainerStyle={[styles.list, compact && styles.listCompact]}
        removeClippedSubviews={Platform.OS === 'android'}
        initialNumToRender={8}
        maxToRenderPerBatch={8}
        windowSize={9}
        updateCellsBatchingPeriod={50}
        ListEmptyComponent={
          <EmptyState
            icon={<Text style={[styles.emptyIcon, compact && styles.emptyIconCompact]}>🎼</Text>}
            title="No setlists yet"
            message="Build a setlist to power your next workout."
          />
        }
        renderItem={renderSetlistItem}
      />
    </SpotifyTemplate>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  form: {
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  formCompact: {
    padding: SPACING.sm,
    gap: SPACING.xs,
  },
  heading: {
    fontSize: 18,
    fontWeight: '800',
  },
  headingCompact: {
    fontSize: 16,
  },
  input: {
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 14,
  },
  inputCompact: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    fontSize: 13,
  },
  list: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.xl,
    gap: SPACING.sm,
  },
  listCompact: {
    paddingHorizontal: SPACING.sm,
    paddingBottom: SPACING.lg,
    gap: SPACING.xs,
  },
  emptyIcon: {
    fontSize: 32,
  },
  emptyIconCompact: {
    fontSize: 26,
  },
  card: {
    borderRadius: 18,
    padding: SPACING.md,
    borderWidth: 1,
    marginBottom: SPACING.sm,
  },
  cardCompact: {
    borderRadius: 14,
    padding: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
  },
  cardInfo: {
    flex: 1,
  },
  deleteButton: {
    paddingTop: 2,
    paddingLeft: SPACING.xs,
  },
  deleteIcon: {
    fontSize: 16,
    fontWeight: '600',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  cardTitleCompact: {
    fontSize: 14,
  },
  cardMeta: {
    marginTop: 4,
    fontSize: 12,
  },
  cardMetaCompact: {
    marginTop: 2,
    fontSize: 11,
  },
});
