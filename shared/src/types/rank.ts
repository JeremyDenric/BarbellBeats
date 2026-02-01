/**
 * Ranking and leaderboard-related TypeScript types
 * Updated for tier-based ranking system
 */

import { UserRank, SongTier } from './song';

export interface UserGymRank {
  userGymId: string;
  userId: string;
  gymId: string;

  // NEW: Simplified rank system
  rank: UserRank;                // 'bronze' | 'silver' | 'gold' | 'platinum'
  influencePoints: number;

  // NEW: Contribution tracking
  songsAdded: number;
  goldSongs: number;             // Songs that reached Gold tier
  silverSongs: number;
  bronzeSongs: number;
  platinumSongs: number;

  // NEW: Vote statistics
  totalUpvotesReceived: number;  // From community on user's songs
  totalDownvotesReceived: number;
  votesCast: number;             // User's voting activity

  // Timestamps
  joinedAt: string;
  lastActiveAt: string;

  // NEW: Weekly limits
  songsAddedThisWeek: number;
  weekResetAt: string;

  // Historical tracking
  rankHistory: RankHistoryEntry[];

  // Progress to next rank
  nextRank?: UserRank;
  pointsToNextRank?: number;
}

export interface UserGymStats {
  // Contribution stats
  songsAdded: number;
  goldSongs: number;
  silverSongs: number;
  platinumSongs: number;

  // Vote stats
  upvotesReceived: number;
  downvotesReceived: number;
  votesCast: number;

  // Engagement
  daysActive?: number;
  daysSinceLastActivity?: number;

  // Achievements
  achievementsUnlocked: number;

  // Optional: Live mode stats
  crowdDJSessionsHosted?: number;
}

export interface RankHistoryEntry {
  rank: UserRank;
  achievedAt: string;
  influencePointsAtTime: number;
}

export interface RankInfo {
  tier: UserRank;
  minPoints: number;
  maxPoints: number | null;
  voteWeight: number;
  songsPerWeek: number;
  privileges: string[];
  color: string;
  badge: string;
}

export const RANK_INFO: Record<UserRank, RankInfo> = {
  bronze: {
    tier: 'bronze',
    minPoints: 0,
    maxPoints: 499,
    voteWeight: 1.0,
    songsPerWeek: 5,
    privileges: ['Vote', 'Add Songs (5/week)'],
    color: '#CD7F32',
    badge: '🥉',
  },
  silver: {
    tier: 'silver',
    minPoints: 500,
    maxPoints: 1499,
    voteWeight: 2.0,
    songsPerWeek: 10,
    privileges: ['Vote (2x weight)', 'Add Songs (10/week)', 'View Analytics'],
    color: '#C0C0C0',
    badge: '🥈',
  },
  gold: {
    tier: 'gold',
    minPoints: 1500,
    maxPoints: 4999,
    voteWeight: 3.0,
    songsPerWeek: 20,
    privileges: ['Vote (3x weight)', 'Add Songs (20/week)', 'View Analytics', 'Nominate Platinum Songs'],
    color: '#FFD700',
    badge: '🥇',
  },
  platinum: {
    tier: 'platinum',
    minPoints: 5000,
    maxPoints: null,
    voteWeight: 4.0,
    songsPerWeek: 9999,
    privileges: ['Vote (4x weight)', 'Add Unlimited Songs', 'View Analytics', 'Create Special Playlists', 'Gym Moderator'],
    color: '#E5E4E2',
    badge: '💎',
  },
};

// Leaderboard
export interface LeaderboardEntry {
  position: number;
  userId: string;
  username: string;
  displayName: string;
  profilePhotoUrl?: string;

  // Rank info
  rank: UserRank;
  influencePoints: number;

  // Contribution stats
  goldSongs: number;
  silverSongs: number;
  totalSongsAdded: number;

  // Vote stats
  totalUpvotesReceived: number;
  averageVotesPerSong: number;
}

export interface LeaderboardResponse {
  leaderboard: LeaderboardEntry[];
  userPosition?: {
    position: number;
    percentile: number;
  };
  period: 'all-time' | 'month' | 'week';
  totalUsers: number;
}

export interface GetLeaderboardInput {
  gymId: string;
  type: 'users' | 'songs';
  period?: 'all-time' | 'month' | 'week';
  offset?: number;
  limit?: number;
}

// User stats response
export interface UserStatsResponse {
  rank: UserRank;
  influencePoints: number;
  nextRankAt: number;
  progressPercent: number;

  contributions: {
    songsAdded: number;
    platinumSongs: number;
    goldSongs: number;
    silverSongs: number;
    bronzeSongs: number;
  };

  voting: {
    upvotesCast: number;
    downvotesCast: number;
    voteWeight: number;
  };

  recognition: {
    totalUpvotesReceived: number;
    totalDownvotesReceived: number;
    averageVotesPerSong: number;
  };

  limits: {
    songsPerWeek: number;
    songsAddedThisWeek: number;
    songsRemaining: number;
    weekResetAt: string;
  };

  achievements: RankAchievement[];
}

// Achievements
export interface RankAchievement {
  achievementId: string;
  name: string;
  description: string;
  icon: string;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  unlockedAt?: string;
  progress?: number;          // 0-100 percent
  requirement?: number;       // Total needed
}

export const ACHIEVEMENTS: Record<
  string,
  Omit<RankAchievement, 'achievementId' | 'unlockedAt' | 'progress'>
> = {
  first_song: {
    name: 'First Song',
    description: 'Add your first song to the gym',
    icon: '🎵',
    tier: 'bronze',
  },
  silver_standard: {
    name: 'Silver Standard',
    description: 'Get a song to Silver tier',
    icon: '🥈',
    tier: 'silver',
  },
  golden_touch: {
    name: 'Golden Touch',
    description: 'Get a song to Gold tier',
    icon: '🥇',
    tier: 'gold',
  },
  platinum_producer: {
    name: 'Platinum Producer',
    description: 'Get a song to Platinum tier',
    icon: '💎',
    tier: 'platinum',
  },
  perfect_10: {
    name: 'Perfect 10',
    description: 'Get a song with 50+ upvotes and 0 downvotes',
    icon: '⭐',
    tier: 'gold',
  },
  trendsetter: {
    name: 'Trendsetter',
    description: 'Have 5 Gold tier songs',
    icon: '🔥',
    tier: 'gold',
    requirement: 5,
  },
  legend: {
    name: 'Legend',
    description: 'Have 10 Gold tier songs',
    icon: '👑',
    tier: 'platinum',
    requirement: 10,
  },
  curator: {
    name: 'Curator',
    description: 'Add 10 songs',
    icon: '📝',
    tier: 'bronze',
    requirement: 10,
  },
  influencer: {
    name: 'Influencer',
    description: 'Reach 500 influence points',
    icon: '⚡',
    tier: 'silver',
    requirement: 500,
  },
  taste_maker: {
    name: 'Taste-Maker',
    description: 'Reach Gold rank',
    icon: '🎯',
    tier: 'gold',
  },
  dj_elite: {
    name: 'DJ Elite',
    description: 'Reach Platinum rank',
    icon: '🎧',
    tier: 'platinum',
  },
  community_hero: {
    name: 'Community Hero',
    description: 'Cast 100 votes',
    icon: '🦸',
    tier: 'silver',
    requirement: 100,
  },
  generous: {
    name: 'Generous',
    description: 'Give 50 upvotes',
    icon: '❤️',
    tier: 'silver',
    requirement: 50,
  },
};

// Helper functions
export function calculateUserRank(influencePoints: number): UserRank {
  if (influencePoints >= 5000) return 'platinum';
  if (influencePoints >= 1500) return 'gold';
  if (influencePoints >= 500) return 'silver';
  return 'bronze';
}

export function getRankInfo(rank: UserRank): RankInfo {
  return RANK_INFO[rank];
}

export function getNextRank(currentRank: UserRank): UserRank | null {
  const ranks: UserRank[] = ['bronze', 'silver', 'gold', 'platinum'];
  const currentIndex = ranks.indexOf(currentRank);
  return currentIndex < ranks.length - 1 ? ranks[currentIndex + 1] : null;
}

export function getPointsToNextRank(currentPoints: number, currentRank: UserRank): number {
  const nextRank = getNextRank(currentRank);
  if (!nextRank) return 0; // Already at max rank

  const nextRankInfo = getRankInfo(nextRank);
  return Math.max(0, nextRankInfo.minPoints - currentPoints);
}

export function getProgressToNextRank(currentPoints: number, currentRank: UserRank): number {
  const nextRank = getNextRank(currentRank);
  if (!nextRank) return 100; // Already at max rank

  const currentRankInfo = getRankInfo(currentRank);
  const nextRankInfo = getRankInfo(nextRank);

  const pointsInCurrentTier = currentPoints - currentRankInfo.minPoints;
  const pointsNeededForNextTier = nextRankInfo.minPoints - currentRankInfo.minPoints;

  return Math.min(100, (pointsInCurrentTier / pointsNeededForNextTier) * 100);
}

// Calculate influence points gained
export function calculateInfluenceGain(
  voterRank: UserRank,
  songTier: SongTier,
  voteType: 1 | -1
): number {
  if (voteType !== 1) return 0; // Only upvotes grant influence

  const voteWeights = {
    bronze: 1.0,
    silver: 2.0,
    gold: 3.0,
    platinum: 4.0,
  };

  const tierMultipliers = {
    bronze: 1,
    silver: 2,
    gold: 3,
    platinum: 5,
  };

  return voteWeights[voterRank] * tierMultipliers[songTier];
}
