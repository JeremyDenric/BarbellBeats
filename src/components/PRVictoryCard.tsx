/**
 * PRVictoryCard
 * Static, self-contained achievement card for a single PR moment.
 * Designed to be captured as a PNG via react-native-view-shot.
 * Fixed 360px wide so the share image is always consistent.
 */

import React, { forwardRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { Gradient } from './Gradient';
import { Icon } from './Icon';
import { FONTS, SIGNAL } from '../theme/tokens';
import devLog from '../utils/devLog';
import type { PRMoment } from '../types';

const CARD_WIDTH = 360;
const LIME = '#FF4D00';
const LIME_DIM = 'rgba(203, 255, 0, 0.12)';
const LIME_GLOW = 'rgba(203, 255, 0, 0.22)';
const CYAN = '#00E5C8';

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch (err) {
    devLog.warn('PRVictoryCard: invalid date value', iso, err);
    return '—';
  }
}

function formatImprovement(newE1RM: number, previousE1RM: number): string | null {
  if (previousE1RM <= 0) return null;
  const diff = newE1RM - previousE1RM;
  const pct = ((diff / previousE1RM) * 100).toFixed(1);
  return `+${diff} lbs · +${pct}%`;
}

export interface PRVictoryCardProps {
  moment: PRMoment;
  gymName?: string;
  isPro?: boolean;
  onAlbumArtLoad?: () => void;
  onAlbumArtError?: () => void;
}

export const PRVictoryCard = forwardRef<View, PRVictoryCardProps>(
  ({ moment, gymName, isPro = false, onAlbumArtLoad, onAlbumArtError }, ref) => {
    const improvement = formatImprovement(moment.newE1RM, moment.previousE1RM);
    const hasSong = !!moment.song;
    const dateStr = formatDate(moment.achievedAt);
    const displayGymName = gymName ?? moment.gymName;

    return (
      <View ref={ref} style={styles.card}>
        {/* Background gradient */}
        <Gradient
          colors={['#0A0A0F', '#0D1209', '#0A0A0F']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />

        {/* Lime corner glow (decorative) */}
        <View style={styles.glowTopLeft} />
        <View style={styles.glowBottomRight} />

        {/* Border */}
        <View style={styles.border} />

        {/* Content */}
        <View style={styles.content}>
          {/* NEW PR badge */}
          <View style={styles.badge}>
            <Text style={styles.badgeText}>NEW PR</Text>
          </View>

          {/* Exercise name */}
          <Text style={styles.exerciseName} numberOfLines={2} adjustsFontSizeToFit>
            {moment.exerciseName.toUpperCase()}
          </Text>

          {/* Weight display */}
          <View style={styles.weightContainer}>
            <View style={styles.weightGlow} />
            <Text style={styles.weightValue}>{moment.newE1RM} LBS</Text>
            <Text style={styles.weightLabel}>EST. 1RM</Text>
            {improvement && (
              <View style={styles.improvementRow}>
                <Icon name="trend-up" size="xs" color={CYAN} />
                <Text style={styles.improvementText}>{improvement}</Text>
              </View>
            )}
          </View>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Song section */}
          {hasSong ? (
            <View style={styles.songRow}>
              {moment.song!.albumArt ? (
                <Image
                  source={{ uri: moment.song!.albumArt }}
                  style={styles.albumArt}
                  contentFit="cover"
                  onLoad={onAlbumArtLoad}
                  onError={onAlbumArtError}
                />
              ) : (
                <View style={styles.albumArtPlaceholder}>
                  <Icon name="music-note" size="sm" color={LIME} />
                </View>
              )}
              <View style={styles.songInfo}>
                <Text style={styles.songTitle} numberOfLines={1}>
                  {moment.song!.title}
                </Text>
                <Text style={styles.songArtist} numberOfLines={1}>
                  {moment.song!.artist}
                </Text>
                <Text style={styles.songCaption}>playing when you hit this PR</Text>
              </View>
            </View>
          ) : (
            <View style={styles.noSongRow}>
              <Icon name="music-note" size="sm" color="rgba(80, 76, 100, 0.6)" />
              <Text style={styles.noSongText}>No soundtrack recorded</Text>
            </View>
          )}

          {/* Divider */}
          <View style={styles.divider} />

          {/* Footer */}
          <View style={styles.footer}>
            <View style={styles.footerLeft}>
              {displayGymName ? (
                <Text style={styles.footerGym} numberOfLines={1}>
                  {displayGymName}
                </Text>
              ) : null}
              <Text style={styles.footerDate}>{dateStr}</Text>
            </View>
            <View style={styles.brandmark}>
              <Icon name="barbell" size="xs" color={LIME} />
              <Text style={styles.brandmarkText}>BARBELLBEATS</Text>
            </View>
          </View>

          {!isPro && (
            <View style={styles.watermarkStrip}>
              <Text style={styles.watermarkText}>
                Made with BarbellBeats · Upgrade to Pro to remove watermark
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  }
);

PRVictoryCard.displayName = 'PRVictoryCard';

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    backgroundColor: '#0A0A0F',
    borderRadius: 20,
    overflow: 'hidden',
  },
  border: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(203, 255, 0, 0.20)',
    zIndex: 10,
  },
  glowTopLeft: {
    position: 'absolute',
    top: -60,
    left: -60,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: LIME_DIM,
  },
  glowBottomRight: {
    position: 'absolute',
    bottom: -40,
    right: -40,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(0, 229, 200, 0.07)',
  },
  content: {
    padding: 24,
    gap: 0,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: LIME,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 16,
  },
  badgeText: {
    fontFamily: FONTS.display,
    fontSize: 11,
    fontWeight: '900',
    color: '#0A0A0F',
    letterSpacing: 2,
  },
  exerciseName: {
    fontFamily: FONTS.display,
    fontSize: 26,
    fontWeight: '900',
    color: '#F2EEE6',
    letterSpacing: 1,
    lineHeight: 30,
    marginBottom: 20,
  },
  weightContainer: {
    marginBottom: 20,
    position: 'relative',
  },
  weightGlow: {
    position: 'absolute',
    top: -8,
    left: -8,
    right: -8,
    bottom: -8,
    backgroundColor: LIME_GLOW,
    borderRadius: 12,
  },
  weightValue: {
    fontFamily: FONTS.display,
    fontSize: 52,
    fontWeight: '900',
    color: LIME,
    letterSpacing: -1,
    lineHeight: 58,
    textShadowColor: LIME,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 16,
  },
  weightLabel: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    fontWeight: '600',
    color: 'rgba(140, 136, 160, 0.8)',
    letterSpacing: 2,
    marginTop: 2,
    marginBottom: 8,
  },
  improvementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  improvementText: {
    fontFamily: FONTS.body,
    fontSize: 13,
    fontWeight: '600',
    color: '#00E5C8',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(203, 255, 0, 0.10)',
    marginVertical: 16,
  },
  songRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  albumArt: {
    width: 56,
    height: 56,
    borderRadius: 8,
    backgroundColor: '#1C1C2E',
  },
  albumArtPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 8,
    backgroundColor: '#1C1C2E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  songInfo: {
    flex: 1,
    gap: 2,
  },
  songTitle: {
    fontFamily: FONTS.display,
    fontSize: 14,
    fontWeight: '700',
    color: '#F2EEE6',
  },
  songArtist: {
    fontFamily: FONTS.body,
    fontSize: 12,
    fontWeight: '500',
    color: '#A0A0A8',
  },
  songCaption: {
    fontFamily: FONTS.body,
    fontSize: 10,
    fontWeight: '400',
    color: 'rgba(140, 136, 160, 0.6)',
    marginTop: 2,
  },
  noSongRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  noSongText: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: 'rgba(140, 136, 160, 0.5)',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  footerLeft: {
    gap: 2,
  },
  footerGym: {
    fontFamily: FONTS.body,
    fontSize: 11,
    fontWeight: '500',
    color: 'rgba(140, 136, 160, 0.8)',
    maxWidth: 180,
  },
  footerDate: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: 'rgba(140, 136, 160, 0.6)',
    letterSpacing: 0.5,
  },
  brandmark: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  brandmarkText: {
    fontFamily: FONTS.mono,
    fontSize: 9,
    fontWeight: '700',
    color: 'rgba(203, 255, 0, 0.5)',
    letterSpacing: 1.5,
  },
  watermarkStrip: {
    marginTop: 12,
    paddingVertical: 6,
    paddingHorizontal: 8,
    backgroundColor: 'rgba(203, 255, 0, 0.06)',
    borderRadius: 6,
    alignItems: 'center',
  },
  watermarkText: {
    fontFamily: FONTS.mono,
    fontSize: 9,
    color: 'rgba(203, 255, 0, 0.4)',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
});
