/**
 * SaveTrackModal Component
 * Modal for saving tracks to favorites or setlists
 */

import React from 'react';
import { View, Text, StyleSheet, Modal, Pressable, SafeAreaView } from 'react-native';
import { Image } from 'expo-image';
import { QueueSong } from '../types';
import { Button } from './UI';
import ModalHeader from './ModalHeader';
import { useThemeMode } from '../contexts/ThemeContext';
import { IOS_COLORS, SPACING, LAYOUT } from '../theme/tokens';

type Setlist = {
  id: string;
  name: string;
  tracks: unknown[];
};

type SaveDestination =
  | { type: 'favorites' }
  | { type: 'setlist'; setlistId: string; name: string };

export interface SaveTrackModalProps {
  visible: boolean;
  track: QueueSong | null;
  setlists: Setlist[];
  isLoadingSetlists: boolean;
  isSaving: boolean;
  onSave: (destination: SaveDestination) => void;
  onOpenSetlists: () => void;
  onClose: () => void;
}

export function SaveTrackModal({
  visible,
  track,
  setlists,
  isLoadingSetlists,
  isSaving,
  onSave,
  onOpenSetlists,
  onClose,
}: SaveTrackModalProps) {
  const { isDark } = useThemeMode();
  const iosColors = isDark ? IOS_COLORS.dark : IOS_COLORS.light;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={[styles.container, { backgroundColor: iosColors.systemBackground }]}>
        <SafeAreaView style={styles.safeArea}>
          <ModalHeader
            title="Save Track"
            subtitle={track ? `${track.title} · ${track.artist}` : 'Choose a destination'}
            onClose={onClose}
          />

          {track && (
            <View style={styles.trackRow}>
              <View style={[styles.trackCover, { backgroundColor: iosColors.systemFill }]}>
                {track.albumArt ? (
                  <Image
                    source={{ uri: track.albumArt }}
                    style={styles.trackCoverImage}
                    contentFit="cover"
                  />
                ) : (
                  <Text style={[styles.coverIcon, { color: iosColors.secondaryLabel }]}>♪</Text>
                )}
              </View>
              <View style={styles.trackInfo}>
                <Text style={[styles.trackTitle, { color: iosColors.label }]} numberOfLines={1}>
                  {track.title}
                </Text>
                <Text style={[styles.trackArtist, { color: iosColors.secondaryLabel }]} numberOfLines={1}>
                  {track.artist}
                </Text>
              </View>
            </View>
          )}

          <View style={styles.options}>
            <Text style={[styles.sectionTitle, { color: iosColors.secondaryLabel }]}>Liked</Text>
            <Pressable
              onPress={() => onSave({ type: 'favorites' })}
              style={({ pressed }) => [
                styles.optionRow,
                { backgroundColor: iosColors.systemFill },
                pressed && { opacity: 0.7 },
              ]}
              disabled={isSaving}
              accessibilityRole="button"
              accessibilityLabel="Save to liked songs"
            >
              <View>
                <Text style={[styles.optionTitle, { color: iosColors.label }]}>Liked Songs</Text>
                <Text style={[styles.optionMeta, { color: iosColors.secondaryLabel }]}>Quick save for later</Text>
              </View>
              <Text style={[styles.optionAction, { color: iosColors.tint }]}>
                {isSaving ? 'Saving...' : 'Save'}
              </Text>
            </Pressable>

            <Text style={[styles.sectionTitle, { color: iosColors.secondaryLabel }]}>Setlists</Text>
            {isLoadingSetlists && (
              <Text style={[styles.loadingText, { color: iosColors.secondaryLabel }]}>
                Loading setlists...
              </Text>
            )}
            {!isLoadingSetlists && setlists.length === 0 && (
              <View style={styles.emptyState}>
                <Text style={[styles.emptyText, { color: iosColors.secondaryLabel }]}>
                  Build a setlist to save tracks here.
                </Text>
                <Button
                  title="Create Setlist"
                  onPress={onOpenSetlists}
                  variant="secondary"
                />
              </View>
            )}
            {setlists.map((setlist) => (
              <Pressable
                key={setlist.id}
                onPress={() => onSave({
                  type: 'setlist',
                  setlistId: setlist.id,
                  name: setlist.name,
                })}
                style={({ pressed }) => [
                  styles.optionRow,
                  { backgroundColor: iosColors.systemFill },
                  pressed && { opacity: 0.7 },
                ]}
                disabled={isSaving}
                accessibilityRole="button"
                accessibilityLabel={`Save to ${setlist.name}`}
              >
                <View>
                  <Text style={[styles.optionTitle, { color: iosColors.label }]}>{setlist.name}</Text>
                  <Text style={[styles.optionMeta, { color: iosColors.secondaryLabel }]}>
                    {setlist.tracks.length} tracks
                  </Text>
                </View>
                <Text style={[styles.optionAction, { color: iosColors.tint }]}>Save</Text>
              </Pressable>
            ))}
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  trackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    paddingHorizontal: LAYOUT.screenPadding,
    paddingBottom: SPACING.md,
  },
  trackCover: {
    width: 54,
    height: 54,
    borderRadius: 12,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  trackCoverImage: {
    width: 54,
    height: 54,
  },
  coverIcon: {
    fontSize: 18,
    fontWeight: '600',
  },
  trackInfo: {
    flex: 1,
  },
  trackTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  trackArtist: {
    fontSize: 14,
  },
  options: {
    paddingHorizontal: LAYOUT.screenPadding,
    gap: SPACING.sm,
  },
  sectionTitle: {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginTop: SPACING.sm,
  },
  optionRow: {
    padding: SPACING.md,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  optionTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  optionMeta: {
    fontSize: 12,
  },
  optionAction: {
    fontSize: 13,
    fontWeight: '600',
  },
  loadingText: {
    fontSize: 13,
    paddingHorizontal: SPACING.xs,
  },
  emptyState: {
    gap: SPACING.sm,
    paddingVertical: SPACING.sm,
  },
  emptyText: {
    fontSize: 13,
  },
});

export default SaveTrackModal;
