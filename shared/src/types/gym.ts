/**
 * Gym-related TypeScript types
 */

export interface Gym {
  gymId: string;
  name: string;
  address: GymAddress;
  location: GeoLocation;
  geohash: string;
  photoUrl?: string;
  memberCount: number;
  activeMemberCount: number;
  createdAt: string;
  musicIdentity: MusicIdentity;
  features: GymFeatures;
  currentPlaylist: CurrentPlaylistInfo;
}

export interface GymAddress {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface GeoLocation {
  latitude: number;
  longitude: number;
}

export interface MusicIdentity {
  topGenres: GenreDistribution[];
  topArtists: string[];
  averageEnergy: number;
  averageTempo: number;
}

export interface GenreDistribution {
  genre: string;
  percentage: number;
  trend?: 'up' | 'down' | 'stable';
}

export interface GymFeatures {
  broadcastEnabled: boolean;
  crowdDJEnabled: boolean;
  headphoneModeSupported: boolean;
}

export interface CurrentPlaylistInfo {
  currentSongId?: string;
  currentSongStartedAt?: string;
  queueLength: number;
  energyLevel: 'low' | 'medium' | 'high' | 'extreme';
}

export interface GymListItem {
  gymId: string;
  name: string;
  distance?: number;
  address: {
    street: string;
    city: string;
  };
  memberCount: number;
  activeMemberCount: number;
  currentSong?: {
    title: string;
    artist: string;
  };
  energyLevel: 'low' | 'medium' | 'high' | 'extreme';
  topGenres: string[];
}

export interface NearbyGymsQuery {
  latitude: number;
  longitude: number;
  radius: number; // in meters
  limit?: number;
}

export interface GymAnalytics {
  liveVibes: LiveVibes;
  musicIdentity: DetailedMusicIdentity;
}

export interface LiveVibes {
  currentSong?: {
    title: string;
    artist: string;
    energy: number;
    tempo: number;
  };
  energyLevel: 'low' | 'medium' | 'high' | 'extreme';
  activeUsers: number;
  voteActivity: {
    votesLastHour: number;
    trendingUp: boolean;
    voteSpikes: Array<{ time: string; votes: number }>;
  };
  peakHours: string[];
}

export interface DetailedMusicIdentity {
  topGenres: GenreDistribution[];
  topArtists: Array<{
    artist: string;
    songCount: number;
    totalVotes: number;
  }>;
  weeklyTopSongs: Array<{
    title: string;
    artist: string;
    plays: number;
    avgVotes: number;
  }>;
  energyProfile: {
    average: number;
    distribution: {
      low: number;
      medium: number;
      high: number;
    };
  };
  tempoProfile: {
    average: number;
    range: [number, number];
  };
}
