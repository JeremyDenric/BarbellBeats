import { Share, Platform } from 'react-native';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import type { PRMoment, QueueSong } from '../types';

// App Store / Play Store fallback when the app isn't installed
const APP_STORE_URL = 'https://apps.apple.com/app/barbellbeats/id0000000000';
const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.jeremydenric.barbellbeats';

/** Universal download link shown in share messages. */
function appDownloadUrl(): string {
  return Platform.OS === 'android' ? PLAY_STORE_URL : APP_STORE_URL;
}

/** Deep link into a specific app screen. Falls back to download URL on web. */
function deepLink(path: string): string {
  return `barbellbeats://${path}`;
}

/**
 * Convert a Spotify URI (spotify:track:ID) to a shareable web URL.
 * Falls back gracefully if the URI is already a URL or an unrecognized format.
 */
export function spotifyUriToWebUrl(uri: string): string {
  // Already a web URL
  if (uri.startsWith('http')) return uri;
  // spotify:track:ID → https://open.spotify.com/track/ID
  const match = uri.match(/^spotify:(\w+):(.+)$/);
  if (match) {
    return `https://open.spotify.com/${match[1]}/${match[2]}`;
  }
  return uri;
}

/**
 * Share a song from the gym playlist.
 * Shows the native share sheet with a pre-filled message.
 */
export async function shareGymSong(
  song: Pick<QueueSong, 'title' | 'artist' | 'uri'>,
  gymName?: string
): Promise<void> {
  const spotifyUrl = spotifyUriToWebUrl(song.uri);
  const locationLine = gymName ? ` at ${gymName}` : ' at the gym';
  const link = deepLink('discover');
  await Share.share({
    message: `🔥 "${song.title}" by ${song.artist} is playing${locationLine} right now!\n\nListen: ${spotifyUrl}\n\nJoin the gym queue: ${link}`,
    url: link,
    title: `${song.title} — ${song.artist}`,
  });
}

/**
 * Share a PR moment — exercise milestone + the song that was playing.
 */
export async function sharePrMoment(moment: PRMoment): Promise<void> {
  const lines: string[] = [];
  lines.push(`🏆 New PR: ${moment.exerciseName} — ${moment.newE1RM} lbs est. 1RM`);
  if (moment.previousE1RM > 0) {
    lines.push(`↑ +${moment.newE1RM - moment.previousE1RM} lbs from my previous best`);
  }
  if (moment.song) {
    const spotifyUrl = spotifyUriToWebUrl(moment.song.uri);
    lines.push(`\n🎵 "${moment.song.title}" by ${moment.song.artist} was playing`);
    lines.push(spotifyUrl);
  }
  lines.push(`\nTrack yours: ${deepLink('training/prs')}`);
  lines.push('#BarbellBeats #PR');

  await Share.share({
    message: lines.join('\n'),
    title: `New PR — ${moment.exerciseName}`,
  });
}

/**
 * Share a PR victory card image captured via react-native-view-shot.
 * Cleans up the temp file after the share sheet is dismissed.
 */
export async function sharePrVictoryImage(uri: string, exerciseName?: string): Promise<void> {
  const available = await Sharing.isAvailableAsync();
  if (!available) {
    // Fallback: share as text with download link
    await Share.share({
      message: `${exerciseName ? `New ${exerciseName} PR! 🏆` : 'New PR! 🏆'} Track your lifts with BarbellBeats: ${appDownloadUrl()}`,
      url: appDownloadUrl(),
    });
    return;
  }
  await Sharing.shareAsync(uri, {
    mimeType: 'image/png',
    dialogTitle: exerciseName ? `Share your ${exerciseName} PR` : 'Share your PR',
    UTI: 'public.png',
  });
  await FileSystem.deleteAsync(uri, { idempotent: true });
}
