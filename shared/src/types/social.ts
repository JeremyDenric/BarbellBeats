// ============================================================================
// Social Feed & Challenge Types
// ============================================================================

import type { Workout, PersonalRecord } from './workout';

export interface FeedPost {
  id: string;
  userId: string;
  user: {
    id: string;
    name: string;
    username?: string;
    avatar?: string;
  };
  type: 'workout' | 'pr' | 'vibe-moment' | 'challenge-complete';

  // Content
  caption?: string;
  mediaUrls: string[];

  // Associated data
  workoutId?: string;
  prId?: string;
  momentId?: string;
  challengeId?: string;

  // Workout summary (for type=workout)
  workoutSummary?: {
    totalVolume: number;
    duration: number;
    exercises: string[];
    sets: number;
  };

  // PR details (for type=pr)
  prDetails?: {
    exercise: string;
    weight: number;
    reps: number;
    unit: 'lbs' | 'kg';
  };

  // Challenge details (for type=challenge-complete)
  challengeDetails?: {
    challengeName: string;
    rank?: number;
  };

  // Engagement
  likeCount: number;
  commentCount: number;
  userLiked: boolean;

  // Visibility
  visibility: 'public' | 'friends' | 'private';

  createdAt: string;
  updatedAt: string;
}

export interface FeedComment {
  id: string;
  postId: string;
  userId: string;
  user: {
    id: string;
    name: string;
    username?: string;
    avatar?: string;
  };
  message: string;
  createdAt: string;
  updatedAt: string;
}

export interface FeedLike {
  id: string;
  postId: string;
  userId: string;
  createdAt: string;
}

export interface Follow {
  id: string;
  followerId: string;
  followingId: string;
  followingType: 'user' | 'gym';
  createdAt: string;
}

export interface Challenge {
  id: string;
  name: string;
  description: string;
  type: 'volume' | 'streak' | 'pr-count' | 'specific-exercise';

  // Challenge params
  targetValue?: number; // e.g., 100000 lbs for volume
  duration?: string; // "7d", "30d", "12w"

  // Dates
  startDate: string;
  endDate: string;

  // Participation
  creatorId?: string;
  isPublic: boolean;
  participantCount: number;
  userParticipating: boolean;
  userProgress?: ChallengeProgress;

  createdAt: string;
  updatedAt: string;
}

export interface ChallengeProgress {
  id: string;
  challengeId: string;
  userId: string;
  currentValue: number;
  rank?: number;
  completed: boolean;
  completedAt?: string;
  joinedAt: string;
  updatedAt: string;
}

export interface ChallengeParticipant {
  id: string;
  challengeId: string;
  userId: string;
  user: {
    id: string;
    name: string;
    username?: string;
    avatar?: string;
  };
  currentValue: number;
  rank?: number;
  completed: boolean;
  completedAt?: string;
  joinedAt: string;
}

export interface UserStreak {
  currentStreak: number;
  longestStreak: number;
  lastWorkoutDate?: string;
}

export interface UserProfile {
  id: string;
  username?: string;
  name: string;
  avatar?: string;
  bio?: string;

  // Stats
  stats: {
    followers: number;
    following: number;
    workouts: number;
    totalVolume: number;
    prs: number;
    currentStreak: number;
    longestStreak: number;
  };

  // Recent activity
  recentPRs: PersonalRecord[];
  recentWorkouts: Workout[];

  // Social
  isFollowing: boolean;
  isFollower: boolean;

  createdAt: string;
}

// ============================================================================
// Request/Response Types
// ============================================================================

export interface CreatePostRequest {
  type: 'workout' | 'pr' | 'vibe-moment' | 'challenge-complete';
  caption?: string;
  mediaUrls?: string[];
  workoutId?: string;
  prId?: string;
  momentId?: string;
  challengeId?: string;
  visibility?: 'public' | 'friends' | 'private';
}

export interface UpdatePostRequest {
  caption?: string;
  visibility?: 'public' | 'friends' | 'private';
}

export interface CreateCommentRequest {
  message: string;
}

export interface FollowRequest {
  followingId: string;
  followingType: 'user' | 'gym';
}

export interface CreateChallengeRequest {
  name: string;
  description: string;
  type: 'volume' | 'streak' | 'pr-count' | 'specific-exercise';
  targetValue?: number;
  duration?: string;
  startDate: string;
  endDate: string;
  isPublic?: boolean;
}

export interface UpdateChallengeProgressRequest {
  currentValue: number;
}

export interface FeedFilters {
  type?: 'workout' | 'pr' | 'vibe-moment' | 'challenge-complete' | 'all';
  userId?: string;
  followingOnly?: boolean;
  limit?: number;
  offset?: number;
}

export interface ChallengeFilters {
  type?: 'volume' | 'streak' | 'pr-count' | 'specific-exercise';
  status?: 'active' | 'upcoming' | 'completed';
  participating?: boolean;
}

// ============================================================================
// Utility Types
// ============================================================================

export interface ActivityFeed {
  posts: FeedPost[];
  hasMore: boolean;
  total: number;
}

export interface ChallengeLeaderboard {
  challengeId: string;
  participants: ChallengeParticipant[];
  userRank?: number;
  total: number;
}
