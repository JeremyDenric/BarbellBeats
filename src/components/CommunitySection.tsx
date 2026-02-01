/**
 * CommunitySection Component
 * Live feed with reactions, comments, and badges for playlist engagement
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput } from 'react-native';
import { IOSCard, Badge } from './UI';
import { useThemeMode } from '../contexts/ThemeContext';
import { IOS_COLORS, SPACING, LAYOUT, TYPOGRAPHY } from '../theme/tokens';

type MusicBadge = {
  id: string;
  title: string;
  description: string;
  icon: string;
  earnedAt: string;
};

type Comment = {
  id: string;
  userId: string;
  message: string;
};

export interface CommunitySectionProps {
  comments: Comment[];
  badges: MusicBadge[];
  onReaction: (emoji: string) => void;
  onSendComment: (message: string) => void;
  onIdentify: () => void;
  compact?: boolean;
}

const REACTION_EMOJIS = ['🔥', '💪', '⚡️', '🎯', '🎵'];

export function CommunitySection({
  comments,
  badges,
  onReaction,
  onSendComment,
  onIdentify,
  compact = false,
}: CommunitySectionProps) {
  const { isDark } = useThemeMode();
  const iosColors = isDark ? IOS_COLORS.dark : IOS_COLORS.light;
  const [commentInput, setCommentInput] = useState('');

  const handleSendComment = () => {
    const trimmed = commentInput.trim();
    if (!trimmed) return;
    onSendComment(trimmed);
    setCommentInput('');
  };

  return (
    <>
      <IOSCard style={[styles.feedSection, compact && styles.feedSectionCompact]}>
        <View style={styles.feedHeader}>
          <Text style={[styles.feedTitle, { color: iosColors.label }]}>Live Feed</Text>
          <Pressable
            onPress={onIdentify}
            style={styles.identifyButton}
            accessible={true}
            accessibilityLabel="Identify song"
            accessibilityHint="Identifies the currently playing song and saves it to your favorites"
            accessibilityRole="button"
          >
            <Text style={[styles.identifyText, { color: iosColors.tint }]}>Identify</Text>
          </Pressable>
        </View>

        <View style={styles.reactionRow}>
          {REACTION_EMOJIS.map((emoji) => (
            <Pressable
              key={emoji}
              onPress={() => onReaction(emoji)}
              style={({ pressed }) => [
                styles.reactionButton,
                { backgroundColor: iosColors.systemFill },
                pressed && { opacity: 0.6 },
              ]}
            >
              <Text style={styles.reactionEmoji}>{emoji}</Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.commentsSection}>
          {comments.slice(0, 3).map((comment) => (
            <View key={comment.id} style={styles.commentRow}>
              <Text style={[styles.commentUser, { color: iosColors.tint }]}>@{comment.userId.slice(-4)}</Text>
              <Text style={[styles.commentMessage, { color: iosColors.label }]}>{comment.message}</Text>
            </View>
          ))}
          {comments.length === 0 && (
            <Text style={[styles.commentEmpty, { color: iosColors.tertiaryLabel }]}>
              No comments yet. Start the hype.
            </Text>
          )}
        </View>

        <View style={styles.commentInputRow}>
          <TextInput
            style={[styles.commentInput, { backgroundColor: iosColors.systemFill, color: iosColors.label }]}
            placeholder="Drop a comment..."
            placeholderTextColor={iosColors.tertiaryLabel}
            value={commentInput}
            onChangeText={setCommentInput}
            accessible={true}
            accessibilityLabel="Comment input"
            accessibilityHint="Enter a comment about the current song"
            returnKeyType="send"
            onSubmitEditing={handleSendComment}
            blurOnSubmit={true}
          />
          <Pressable
            onPress={handleSendComment}
            style={({ pressed }) => [
              styles.commentSend,
              { backgroundColor: iosColors.tint },
              pressed && { opacity: 0.8 },
            ]}
            accessible={true}
            accessibilityLabel="Send comment"
            accessibilityHint="Posts your comment to the live feed"
            accessibilityRole="button"
          >
            <Text style={styles.commentSendText}>Send</Text>
          </Pressable>
        </View>
      </IOSCard>

      {badges.length > 0 && (
        <IOSCard style={[styles.badgeCard, compact && styles.badgeCardCompact]}>
          <View style={styles.badgeHeader}>
            <Text style={[styles.badgeTitle, { color: iosColors.label }]}>Music Rewards</Text>
            <Text style={[styles.badgeMeta, { color: iosColors.secondaryLabel }]}>Earned in this gym</Text>
          </View>
          <View style={styles.badgeRow}>
            {badges.slice(0, 4).map((badge) => (
              <Badge
                key={badge.id}
                label={badge.title}
                icon={badge.icon}
                variant="success"
                size="small"
              />
            ))}
          </View>
        </IOSCard>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  feedSection: {
    margin: LAYOUT.screenPadding,
    marginTop: 0,
    marginBottom: SPACING.md,
  },
  feedSectionCompact: {
    marginHorizontal: SPACING.base,
    marginBottom: SPACING.sm,
  },
  feedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  feedTitle: {
    ...TYPOGRAPHY.presets.bodyBold,
  },
  identifyButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  identifyText: {
    ...TYPOGRAPHY.presets.caption,
    fontWeight: '600',
  },
  reactionRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  reactionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reactionEmoji: {
    fontSize: 20,
  },
  commentsSection: {
    marginBottom: SPACING.md,
  },
  commentRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  commentUser: {
    ...TYPOGRAPHY.presets.caption,
    fontWeight: '600',
  },
  commentMessage: {
    ...TYPOGRAPHY.presets.caption,
    flex: 1,
  },
  commentEmpty: {
    ...TYPOGRAPHY.presets.caption,
    fontStyle: 'italic',
  },
  commentInputRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  commentInput: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    ...TYPOGRAPHY.presets.caption,
  },
  commentSend: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
    justifyContent: 'center',
  },
  commentSendText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 13,
  },
  badgeCard: {
    marginHorizontal: LAYOUT.screenPadding,
    marginBottom: SPACING.md,
  },
  badgeCardCompact: {
    marginHorizontal: SPACING.base,
    marginBottom: SPACING.sm,
  },
  badgeHeader: {
    marginBottom: SPACING.sm,
  },
  badgeTitle: {
    ...TYPOGRAPHY.presets.bodyBold,
  },
  badgeMeta: {
    ...TYPOGRAPHY.presets.caption,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
});

export default CommunitySection;
