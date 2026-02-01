/**
 * Song and playlist-related TypeScript types
 * Updated for tier-based ranking system
 */

// Song tier types
export type SongTier = 'bronze' | 'silver' | 'gold' | 'platinum';

export interface Song {
  gymId: string;
  songId: string;
  addedBy: string;
  addedAt: string;
  spotifyUri: string;
  appleMusicId?: string;
  metadata: SongMetadata;

  // NEW: Tier system
  tier: SongTier;
  netVotes: number;              // upvotes - downvotes
  upvotes: number;
  downvotes: number;

  // NEW: Rankings
  rankInTier: number;            // Position within tier (1 = top)
  rankOverall: number;           // Position in entire gym

  // Stats
  stats: SongStats;

  // Status
  status: 'active' | 'cooldown' | 'banned';
  cooldownUntil?: string;

  // Historical tracking
  tierHistory?: TierChange[];
}

export interface SongMetadata {
  title: string;
  artist: string;
  album: string;
  duration: number; // seconds
  albumArtUrl: string;
  previewUrl?: string;
  energy: number; // 0-1
  tempo: number; // BPM
  genres: string[];
}

export interface SongStats {
  totalVotes: number;            // Total votes received (up + down)
  voteHistory: VoteSnapshot[];   // Historical vote tracking

  // Optional: Live playback stats
  playCount?: number;
  lastPlayedAt?: string;
  skipCount?: number;
}

export interface VoteSnapshot {
  date: string;
  netVotes: number;
  tier: SongTier;
}

export interface TierChange {
  changedAt: string;
  previousTier: SongTier;
  newTier: SongTier;
  netVotesAtChange: number;
  triggeredBy?: string;          // userId of voter who pushed it over
}

// Tier thresholds
export const SONG_TIER_THRESHOLDS = {
  platinum: 50,
  gold: 25,
  silver: 10,
  bronze: 0,
} as const;

// Tier multipliers for influence points
export const TIER_MULTIPLIERS = {
  bronze: 1,
  silver: 2,
  gold: 3,
  platinum: 5,
} as const;

// Tier bonus points when reaching new tier
export const TIER_BONUS_POINTS = {
  silver: 50,
  gold: 100,
  platinum: 250,
} as const;

// Display song in playlist
export interface PlaylistSong {
  songId: string;
  title: string;
  artist: string;
  albumArt: string;

  // NEW: Tier system
  tier: SongTier;
  netVotes: number;
  upvotes: number;
  downvotes: number;
  rankInTier: number;
  rankOverall: number;

  // User info
  addedBy: {
    userId: string;
    displayName: string;
    photoUrl?: string;
    rank: UserRank;
  };
  addedAt: string;

  // Vote state
  userVote?: 1 | -1 | 0;         // Current user's vote

  // Optional: Live playback
  isCurrentlyPlaying?: boolean;
  playedCount?: number;
}

// API request/response types
export interface AddSongInput {
  gymId: string;
  spotifyId: string;
  title: string;
  artist: string;
  albumArt: string;
  album?: string;
  duration?: number;
}

export interface AddSongResponse {
  songId: string;
  tier: SongTier;
  netVotes: number;
  addedBy: string;
  songsRemainingThisWeek: number;
}

export interface VoteInput {
  gymId: string;
  songId: string;
  voteType: 1 | -1 | 0;         // 1 = upvote, -1 = downvote, 0 = remove vote
}

export interface VoteResponse {
  song: {
    netVotes: number;
    tier: SongTier;
    rankInTier: number;
    tierChanged: boolean;
    previousTier?: SongTier;
  };
  user: {
    influenceGained: number;
    newInfluencePoints: number;
    rankChanged: boolean;
    newRank?: UserRank;
    previousRank?: UserRank;
  };
  songOwner: {
    influenceGained: number;
    newInfluencePoints: number;
  };
}

export interface Vote {
  voteId: string;
  userId: string;
  gymId: string;
  songId: string;
  voteType: 1 | -1;
  votedAt: string;
  voterRank: UserRank;
  voteWeight: number;
  previousVote?: 1 | -1;

  // NEW: Influence tracking
  influenceGranted: number;      // To song owner
}

// User rank types (updated from old RankTier)
export type UserRank = 'bronze' | 'silver' | 'gold' | 'platinum';

// User rank thresholds
export const USER_RANK_THRESHOLDS = {
  platinum: 5000,
  gold: 1500,
  silver: 500,
  bronze: 0,
} as const;

// Vote weights by user rank
export const VOTE_WEIGHTS = {
  bronze: 1.0,
  silver: 2.0,
  gold: 3.0,
  platinum: 4.0,
} as const;

// Weekly song add limits by rank
export const WEEKLY_SONG_LIMITS = {
  bronze: 5,
  silver: 10,
  gold: 20,
  platinum: 9999,                // Unlimited
} as const;

// Get ranked playlist
export interface GetPlaylistInput {
  gymId: string;
  tier?: 'all' | SongTier;
  sort?: 'rank' | 'votes' | 'recent';
  offset?: number;
  limit?: number;
}

export interface GetPlaylistResponse {
  songs: PlaylistSong[];
  stats: {
    totalSongs: number;
    platinumCount: number;
    goldCount: number;
    silverCount: number;
    bronzeCount: number;
  };
  currentPage: number;
  totalPages: number;
}

// Current playing song (optional live mode)
export interface CurrentSong {
  songId: string;
  metadata: SongMetadata;
  tier: SongTier;
  startedAt: string;
  progress: number;              // seconds into song
  duration: number;
}

// Trending songs across gyms
export interface TrendingSong {
  songId: string;
  title: string;
  artist: string;
  albumArtUrl: string;
  averageTier: number;           // Average tier across gyms (1-4)
  totalVotes: number;
  gymsCount: number;             // How many gyms have this song
  trendScore: number;
}

// Tier display info
export interface TierInfo {
  tier: SongTier;
  color: string;
  gradient: [string, string];
  badge: string;
  label: string;
  minVotes: number;
  maxVotes: number | null;
  glow: string;
}

export const TIER_INFO: Record<SongTier, TierInfo> = {
  bronze: {
    tier: 'bronze',
    color: '#CD7F32',
    gradient: ['#CD7F32', '#A0522D'],
    badge: '🥉',
    label: 'Rising',
    minVotes: 0,
    maxVotes: 9,
    glow: 'rgba(205, 127, 50, 0.3)',
  },
  silver: {
    tier: 'silver',
    color: '#C0C0C0',
    gradient: ['#C0C0C0', '#A8A8A8'],
    badge: '🥈',
    label: 'Approved',
    minVotes: 10,
    maxVotes: 24,
    glow: 'rgba(192, 192, 192, 0.3)',
  },
  gold: {
    tier: 'gold',
    color: '#FFD700',
    gradient: ['#FFD700', '#FFA500'],
    badge: '🥇',
    label: 'Hall of Fame',
    minVotes: 25,
    maxVotes: 49,
    glow: 'rgba(255, 215, 0, 0.5)',
  },
  platinum: {
    tier: 'platinum',
    color: '#E5E4E2',
    gradient: ['#E5E4E2', '#B9F2FF'],
    badge: '💎',
    label: 'Legendary',
    minVotes: 50,
    maxVotes: null,
    glow: 'rgba(185, 242, 255, 0.5)',
  },
};

// Helper functions
export function calculateSongTier(netVotes: number): SongTier {
  if (netVotes >= SONG_TIER_THRESHOLDS.platinum) return 'platinum';
  if (netVotes >= SONG_TIER_THRESHOLDS.gold) return 'gold';
  if (netVotes >= SONG_TIER_THRESHOLDS.silver) return 'silver';
  return 'bronze';
}

export function getTierInfo(tier: SongTier): TierInfo {
  return TIER_INFO[tier];
}

export function getNextTier(currentTier: SongTier): SongTier | null {
  const tiers: SongTier[] = ['bronze', 'silver', 'gold', 'platinum'];
  const currentIndex = tiers.indexOf(currentTier);
  return currentIndex < tiers.length - 1 ? tiers[currentIndex + 1] : null;
}

export function getVotesNeededForNextTier(currentNetVotes: number, currentTier: SongTier): number {
  const nextTier = getNextTier(currentTier);
  if (!nextTier) return 0; // Already at max tier

  const nextTierThreshold = SONG_TIER_THRESHOLDS[nextTier];
  return Math.max(0, nextTierThreshold - currentNetVotes);
}
