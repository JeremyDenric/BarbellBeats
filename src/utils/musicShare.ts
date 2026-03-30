import { Share } from 'react-native';
import type { PRMoment, QueueSong } from '../types';

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
  const url = spotifyUriToWebUrl(song.uri);
  const locationLine = gymName ? ` at ${gymName}` : ' at the gym';
  await Share.share({
    message: `🔥 "${song.title}" by ${song.artist} is playing${locationLine} right now! Listen: ${url}`,
    url,
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
    const url = spotifyUriToWebUrl(moment.song.uri);
    lines.push(`\n🎵 "${moment.song.title}" by ${moment.song.artist} was playing`);
    lines.push(url);
  }
  lines.push('\n#BarbellBeats #PR');

  const message = lines.join('\n');
  await Share.share({
    message,
    title: `New PR — ${moment.exerciseName}`,
  });
}
