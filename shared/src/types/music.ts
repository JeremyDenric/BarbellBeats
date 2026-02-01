// ============================================================================
// Music Personalization Types
// ============================================================================

export interface UserMusicPreferences {
  id: string;
  userId: string;

  // Workout type mapping
  strengthBpm: number;
  strengthEnergy: number;

  hypertrophyBpm: number;
  hypertrophyEnergy: number;

  cardioBpm: number;
  cardioEnergy: number;

  // Preferred genres
  favoriteGenres: string[];
  blockedGenres: string[];

  createdAt: string;
  updatedAt: string;
}

export interface AutoSetlist {
  id: string;
  userId: string;
  workoutType: 'strength' | 'hypertrophy' | 'cardio' | 'custom';

  // Generated playlist
  name: string;
  trackUris: string[];
  tracks: SpotifyTrack[];
  duration: number; // seconds
  avgBpm: number;
  avgEnergy: number;

  generatedAt: string;
}

export interface SpotifyTrack {
  uri: string;
  id: string;
  name: string;
  artist: string;
  album?: string;
  albumArt: string;
  bpm: number;
  energy: number;
  duration: number; // seconds
  previewUrl?: string;
}

export interface IntensityMapping {
  workoutType: 'strength' | 'hypertrophy' | 'cardio' | 'custom';
  targetBpm: number;
  targetEnergy: number;
  label: string;
  description: string;
}

export interface DJSettings {
  gymId: string;
  vetoEnabled: boolean;
  priorityAddEnabled: boolean;
  autoSkipThreshold: number; // Negative votes to auto-skip
  genreBiasEnabled: boolean;
  preferredGenres: string[];
}

// ============================================================================
// Request/Response Types
// ============================================================================

export interface UpdateMusicPreferencesRequest {
  strengthBpm?: number;
  strengthEnergy?: number;
  hypertrophyBpm?: number;
  hypertrophyEnergy?: number;
  cardioBpm?: number;
  cardioEnergy?: number;
  favoriteGenres?: string[];
  blockedGenres?: string[];
}

export interface GenerateSetlistRequest {
  workoutType: 'strength' | 'hypertrophy' | 'cardio' | 'custom';
  customBpm?: number; // For custom type
  customEnergy?: number; // For custom type
  duration?: number; // Target duration in minutes
  seedArtists?: string[]; // Spotify artist IDs
  seedGenres?: string[]; // Genre strings
  name?: string; // Custom playlist name
}

export interface GenerateSetlistResponse {
  setlist: AutoSetlist;
  spotifyPlaylistUrl?: string; // If saved to Spotify
}

export interface DJVetoRequest {
  songId: string;
  reason?: string;
}

export interface DJPriorityAddRequest {
  songUri: string;
  position?: number; // Position in queue (0 = next)
}

export interface UpdateDJSettingsRequest {
  vetoEnabled?: boolean;
  priorityAddEnabled?: boolean;
  autoSkipThreshold?: number;
  genreBiasEnabled?: boolean;
  preferredGenres?: string[];
}

// ============================================================================
// Utility Types
// ============================================================================

export const INTENSITY_PRESETS: IntensityMapping[] = [
  {
    workoutType: 'strength',
    targetBpm: 130,
    targetEnergy: 0.8,
    label: 'Strength',
    description: 'Power lifting, heavy compounds (130 BPM, High energy)',
  },
  {
    workoutType: 'hypertrophy',
    targetBpm: 140,
    targetEnergy: 0.85,
    label: 'Hypertrophy',
    description: 'Muscle building, volume training (140 BPM, Very high energy)',
  },
  {
    workoutType: 'cardio',
    targetBpm: 160,
    targetEnergy: 0.9,
    label: 'Cardio',
    description: 'Running, HIIT, intense cardio (160 BPM, Peak energy)',
  },
];

export interface BPMRange {
  min: number;
  max: number;
  label: string;
}

export const BPM_RANGES: BPMRange[] = [
  { min: 60, max: 100, label: 'Warm-up / Cool-down' },
  { min: 100, max: 120, label: 'Light Cardio' },
  { min: 120, max: 140, label: 'Strength Training' },
  { min: 140, max: 160, label: 'Moderate Cardio / Hypertrophy' },
  { min: 160, max: 180, label: 'Intense Cardio / HIIT' },
  { min: 180, max: 200, label: 'Peak Intensity' },
];

export interface AudioFeatures {
  bpm: number;
  energy: number;
  danceability: number;
  valence: number;
  loudness: number;
  acousticness: number;
  instrumentalness: number;
  speechiness: number;
}
