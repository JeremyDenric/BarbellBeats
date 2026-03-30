/**
 * SongCard Component
 * Displays a song in the playlist queue with voting controls
 */

import React, { memo, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { QueueSong } from '../types';
import { IOSListRow, Badge } from './UI';
import { useThemeMode } from '../contexts/ThemeContext';
import { COLORS, IOS_COLORS, SPACING } from '../theme/tokens';
import { shareGymSong } from '../utils/musicShare';

export interface SongCardProps {
  item: QueueSong;
  index: number;
  onVote: (songId: string, voteType: 'up' | 'down') => void;
  onLike: (song: QueueSong) => void;
  onLongPress?: (song: QueueSong) => void;
  isVoting: boolean;
  isLiked: boolean;
  userVote?: 'up' | 'down';
  recommenderScore: number;
  compact: boolean;
  gymName?: string;
}

function SongCardComponent({
  item,
  index,
  onVote,
  onLike,
  onLongPress,
  isVoting,
  isLiked,
  userVote,
  recommenderScore,
  compact,
  gymName,
}: SongCardProps) {
  const { isDark } = useThemeMode();
  const iosColors = isDark ? IOS_COLORS.dark : IOS_COLORS.light;
  const colors = isDark ? COLORS.dark : COLORS.light;
  const coverUrl = item.albumArt;
  const isUpvoted = userVote === 'up';
  const isDownvoted = userVote === 'down';
  const addedByLabel = item.isAutoSeed ? 'Auto' : `#${item.addedBy.slice(-4)}`;
  const propsLabel = recommenderScore > 0 ? ` · +${recommenderScore} props` : '';

  const getRankEmoji = () => {
    if (index === 0) return '🥇';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return `#${index + 1}`;
  };

  const handleLongPress = useCallback(() => {
    if (onLongPress) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onLongPress(item);
    }
  }, [onLongPress, item]);

  return (
    <IOSListRow separator={false} onLongPress={handleLongPress} delayLongPress={400}>
      <View style={[styles.songCardContent, compact && styles.songCardContentCompact]}>
        {/* Rank Badge */}
        <View
          style={[
            styles.rankBadge,
            compact && styles.rankBadgeCompact,
            { backgroundColor: iosColors.systemFill },
          ]}
        >
          <Text style={[styles.rankText, compact && styles.rankTextCompact, { color: iosColors.label }]}>
            {getRankEmoji()}
          </Text>
        </View>

        <View style={[styles.songCover, compact && styles.songCoverCompact, { backgroundColor: iosColors.systemFill }]}>
          {coverUrl ? (
            <Image
              source={{ uri: coverUrl }}
              style={[styles.songCoverImage, compact && styles.songCoverImageCompact]}
              contentFit="cover"
            />
          ) : (
            <Text style={[styles.songCoverIcon, compact && styles.songCoverIconCompact, { color: iosColors.secondaryLabel }]}>
              ♪
            </Text>
          )}
        </View>

        {/* Song Info */}
        <View style={styles.songInfo}>
          <View style={styles.songHeader}>
            <Text style={[styles.songTitle, compact && styles.songTitleCompact, { color: iosColors.label }]} numberOfLines={1}>
              {item.title}
            </Text>
            {isLiked && (
              <Text
                style={[styles.likedIcon, compact && styles.likedIconCompact, { color: iosColors.tint }]}
                accessibilityLabel="Saved"
              >
                ♥
              </Text>
            )}
            {item.isPlaying && (
              <Badge label="Now Playing" variant="success" size="small" />
            )}
          </View>
          <Text style={[styles.songArtist, compact && styles.songArtistCompact, { color: iosColors.secondaryLabel }]} numberOfLines={1}>
            {item.artist}
          </Text>
          <Text
            style={[styles.songMeta, compact && styles.songMetaCompact, { color: iosColors.tertiaryLabel }]}
            numberOfLines={1}
          >
            Added by {addedByLabel}{propsLabel}
          </Text>
        </View>

        {/* Vote Buttons */}
        <View style={styles.voteSection}>
          <Pressable
            style={({ pressed }) => [
              styles.voteButton,
              compact && styles.voteButtonCompact,
              { backgroundColor: isUpvoted ? iosColors.tint : iosColors.systemFill },
              pressed && { opacity: 0.6 },
            ]}
            onPress={() => onVote(item.id, 'up')}
            disabled={isVoting}
            accessible={true}
            accessibilityLabel="Vote up"
            accessibilityHint={`Vote for ${item.title} to play sooner`}
            accessibilityRole="button"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={[styles.voteIcon, compact && styles.voteIconCompact, { color: isUpvoted ? '#FFF' : iosColors.tint }]}>
              ▲
            </Text>
          </Pressable>

          <Text
            style={[
              styles.scoreText,
              compact && styles.scoreTextCompact,
              { color: isUpvoted ? iosColors.tint : isDownvoted ? colors.error : iosColors.label },
            ]}
          >
            {Math.round(item.voteScore)}
          </Text>

          <Pressable
            style={({ pressed }) => [
              styles.voteButton,
              compact && styles.voteButtonCompact,
              { backgroundColor: isDownvoted ? colors.error : iosColors.systemFill },
              pressed && { opacity: 0.6 },
            ]}
            onPress={() => onVote(item.id, 'down')}
            disabled={isVoting}
            accessible={true}
            accessibilityLabel="Vote down"
            accessibilityHint={`Vote against ${item.title}`}
            accessibilityRole="button"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text
              style={[
                styles.voteIcon,
                compact && styles.voteIconCompact,
                { color: isDownvoted ? '#FFF' : iosColors.secondaryLabel },
              ]}
            >
              ▼
            </Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.likeButton,
              compact && styles.likeButtonCompact,
              { backgroundColor: isLiked ? iosColors.tint : iosColors.systemFill },
              pressed && { opacity: 0.6 },
            ]}
            onPress={() => onLike(item)}
            accessible={true}
            accessibilityLabel={isLiked ? 'Saved track' : 'Save track'}
            accessibilityHint="Save this track to your liked songs or a setlist"
            accessibilityRole="button"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={[styles.likeIcon, compact && styles.likeIconCompact, { color: isLiked ? '#FFF' : iosColors.secondaryLabel }]}>
              ♥
            </Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.likeButton,
              compact && styles.likeButtonCompact,
              { backgroundColor: iosColors.systemFill },
              pressed && { opacity: 0.6 },
            ]}
            onPress={() => shareGymSong(item, gymName).catch(() => {})}
            accessible={true}
            accessibilityLabel="Share song"
            accessibilityHint={`Share "${item.title}" via your apps`}
            accessibilityRole="button"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={[styles.likeIcon, compact && styles.likeIconCompact, { color: iosColors.secondaryLabel }]}>
              ⬆
            </Text>
          </Pressable>
        </View>
      </View>
    </IOSListRow>
  );
}

export const SongCard = memo<SongCardProps>(SongCardComponent, (prev, next) => (
  prev.item.id === next.item.id &&
  prev.item.voteScore === next.item.voteScore &&
  prev.item.isPlaying === next.item.isPlaying &&
  prev.index === next.index &&
  prev.isVoting === next.isVoting &&
  prev.isLiked === next.isLiked &&
  prev.userVote === next.userVote &&
  prev.recommenderScore === next.recommenderScore &&
  prev.compact === next.compact &&
  prev.gymName === next.gymName
));

SongCard.displayName = 'SongCard';

const styles = StyleSheet.create({
  songCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  songCardContentCompact: {
    gap: SPACING.sm,
  },
  songCover: {
    width: 48,
    height: 48,
    borderRadius: 10,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  songCoverCompact: {
    width: 40,
    height: 40,
    borderRadius: 8,
  },
  songCoverImage: {
    width: 48,
    height: 48,
  },
  songCoverImageCompact: {
    width: 40,
    height: 40,
  },
  songCoverIcon: {
    fontSize: 18,
    fontWeight: '600',
  },
  songCoverIconCompact: {
    fontSize: 16,
  },
  rankBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rankBadgeCompact: {
    width: 34,
    height: 34,
    borderRadius: 17,
    marginRight: 10,
  },
  rankText: {
    fontSize: 16,
    fontWeight: '600',
  },
  rankTextCompact: {
    fontSize: 13,
  },
  songInfo: {
    flex: 1,
  },
  songHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: 2,
  },
  likedIcon: {
    fontSize: 12,
    fontWeight: '700',
  },
  likedIconCompact: {
    fontSize: 11,
  },
  songTitle: {
    fontSize: 17,
    fontWeight: '400',
    lineHeight: 22,
    flex: 1,
  },
  songTitleCompact: {
    fontSize: 15,
    lineHeight: 20,
  },
  songArtist: {
    fontSize: 15,
    fontWeight: '400',
    lineHeight: 20,
    marginBottom: 2,
  },
  songArtistCompact: {
    fontSize: 13,
    lineHeight: 18,
  },
  songMeta: {
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 18,
  },
  songMetaCompact: {
    fontSize: 11,
    lineHeight: 16,
  },
  voteSection: {
    alignItems: 'center',
    gap: SPACING.sm,
  },
  voteButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  voteButtonCompact: {
    width: 30,
    height: 30,
    borderRadius: 15,
  },
  voteIcon: {
    fontSize: 14,
    fontWeight: '600',
  },
  voteIconCompact: {
    fontSize: 12,
  },
  likeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  likeButtonCompact: {
    width: 30,
    height: 30,
    borderRadius: 15,
  },
  likeIcon: {
    fontSize: 13,
    fontWeight: '700',
  },
  likeIconCompact: {
    fontSize: 11,
  },
  scoreText: {
    fontSize: 15,
    fontWeight: '600',
    minWidth: 32,
    textAlign: 'center',
  },
  scoreTextCompact: {
    fontSize: 13,
    minWidth: 26,
  },
});

export default SongCard;
