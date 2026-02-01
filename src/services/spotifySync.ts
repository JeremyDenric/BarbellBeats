import AsyncStorage from '@react-native-async-storage/async-storage';
import { spotifyApi } from './spotifyApi';

const GYM_HITS_ID_KEY = '@spotify_gym_hits_playlist_id';

export async function ensureGymHitsPlaylist(userId: string) {
  const cachedId = await AsyncStorage.getItem(GYM_HITS_ID_KEY);
  if (cachedId) {
    return cachedId;
  }

  const playlists = await spotifyApi.getUserPlaylists(50);
  const existing = playlists.find((playlist) => playlist.name.toLowerCase() === 'gym hits');
  if (existing) {
    await AsyncStorage.setItem(GYM_HITS_ID_KEY, existing.id);
    return existing.id;
  }

  const created = await spotifyApi.createPlaylist(userId, {
    name: 'Gym Hits',
    description: 'Tracks you saved from BarbellBeats.',
    isPublic: false,
  });
  await AsyncStorage.setItem(GYM_HITS_ID_KEY, created.id);
  return created.id;
}

export async function addToGymHits(userId: string, uri: string) {
  const playlistId = await ensureGymHitsPlaylist(userId);
  await spotifyApi.addTracksToPlaylist(playlistId, [uri]);
}
