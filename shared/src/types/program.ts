// ============================================================================
// Program Types
// ============================================================================

import type { Exercise } from './workout';

export interface Program {
  id: string;
  name: string;
  description?: string;
  category: 'strength' | 'hypertrophy' | 'endurance' | 'hybrid';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  durationWeeks: number;
  sessionsPerWeek: number;

  // Requirements
  equipmentNeeded: string[];
  timePerSession: number; // minutes

  // Program details
  isPublic: boolean;
  creatorId?: string;
  imageUrl?: string;

  // Relations
  sessions: ProgramSession[];

  createdAt: string;
  updatedAt: string;
}

export interface ProgramSession {
  id: string;
  programId: string;
  weekNumber: number;
  dayNumber: number;
  name: string;
  notes?: string;

  // Relations
  exercises: ProgramSessionExercise[];

  createdAt: string;
  updatedAt: string;
}

export interface ProgramSessionExercise {
  id: string;
  sessionId: string;
  exerciseId: string;
  exercise: Exercise;
  orderIndex: number;

  // Prescription
  sets: string; // "3-4", "3", "AMRAP"
  reps: string; // "8-12", "5", "AMRAP"
  restSeconds: number;
  rpe?: string; // "8", "7-9"
  notes?: string;

  // Progression rules
  progressionType?: 'linear' | 'double-progression' | 'percentage';
  progressionRate?: number; // e.g., 5 lbs per week
}

export interface UserProgramProgress {
  id: string;
  userId: string;
  programId: string;
  program: Program;

  // Progress tracking
  currentWeek: number;
  currentDay: number;
  completedSessions: number;
  totalSessions: number;

  // Status
  status: 'active' | 'paused' | 'completed' | 'abandoned';

  // Dates
  startedAt: string;
  lastSessionAt?: string;
  completedAt?: string;
}

export interface UserOnboarding {
  id: string;
  userId: string;

  // Goals
  primaryGoal: 'strength' | 'hypertrophy' | 'endurance' | 'weight-loss';
  experience: 'beginner' | 'intermediate' | 'advanced';

  // Availability
  daysPerWeek: number;
  minutesPerSession: number;

  // Equipment
  equipment: string[];

  // Preferences
  preferredSplit?: string; // ppl, upper-lower, full-body, etc.

  createdAt: string;
  updatedAt: string;
}

export interface ProgramRecommendation {
  program: Program;
  matchScore: number; // 0-100
  reasons: string[];
}

// ============================================================================
// Request/Response Types
// ============================================================================

export interface CreateOnboardingRequest {
  primaryGoal: 'strength' | 'hypertrophy' | 'endurance' | 'weight-loss';
  experience: 'beginner' | 'intermediate' | 'advanced';
  daysPerWeek: number;
  minutesPerSession: number;
  equipment: string[];
  preferredSplit?: string;
}

export interface UpdateOnboardingRequest {
  primaryGoal?: 'strength' | 'hypertrophy' | 'endurance' | 'weight-loss';
  experience?: 'beginner' | 'intermediate' | 'advanced';
  daysPerWeek?: number;
  minutesPerSession?: number;
  equipment?: string[];
  preferredSplit?: string;
}

export interface StartProgramRequest {
  programId: string;
}

export interface UpdateProgramProgressRequest {
  currentWeek?: number;
  currentDay?: number;
  status?: 'active' | 'paused' | 'completed' | 'abandoned';
}

export interface CompleteSessionRequest {
  sessionId: string;
  workoutId?: string;
}

export interface ProgramListFilters {
  category?: 'strength' | 'hypertrophy' | 'endurance' | 'hybrid';
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  durationWeeks?: number;
  sessionsPerWeek?: number;
  equipmentNeeded?: string[];
}

// ============================================================================
// Utility Types
// ============================================================================

export interface ProgressiveOverloadSuggestion {
  exerciseId: string;
  exerciseName: string;
  lastWeight: number;
  lastReps: number;
  suggestedWeight: number;
  suggestedReps: number;
  reasoning: string;
}
