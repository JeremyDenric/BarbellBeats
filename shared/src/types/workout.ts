// ============================================================================
// Workout Types
// ============================================================================

export interface Exercise {
  id: string;
  name: string;
  category: 'compound' | 'isolation' | 'cardio';
  muscleGroups: string[];
  equipment: string;
  description?: string;
  videoUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Workout {
  id: string;
  userId: string;
  gymId?: string;
  title?: string;
  notes?: string;
  startedAt: string;
  completedAt?: string;
  duration?: number; // seconds

  // Program tracking
  programId?: string;
  sessionId?: string;
  sessionCompleted?: boolean;

  // Metrics
  totalVolume: number;
  totalSets: number;
  totalReps: number;

  // Relations
  sets: WorkoutSet[];

  createdAt: string;
  updatedAt: string;
}

export interface WorkoutSet {
  id: string;
  workoutId: string;
  exerciseId: string;
  exercise: Exercise;
  setNumber: number;

  // Performance
  reps: number;
  weight: number;
  unit: 'lbs' | 'kg';
  rpe?: number; // 1-10
  repQuality?: number; // 1-5

  // Set type
  setType: 'warmup' | 'working' | 'drop' | 'rest-pause' | 'amrap';
  restSeconds?: number;
  tempo?: string;

  // Notes
  notes?: string;
  videoUrl?: string;

  createdAt: string;
}

export interface PersonalRecord {
  id: string;
  userId: string;
  exerciseId: string;
  exercise: Exercise;
  workoutId?: string;

  // Record details
  weight: number;
  reps: number;
  unit: 'lbs' | 'kg';
  oneRepMax: number;

  // Context
  notes?: string;
  videoUrl?: string;
  gymId?: string;

  // Auto-detection
  autoDetected: boolean;
  previousBest?: number;

  achievedAt: string;
  createdAt: string;
}

export interface WorkoutAnalytics {
  totalWorkouts: number;
  totalVolume: number;
  totalSets: number;
  totalReps: number;
  avgWorkoutDuration: number;
  volumeByWeek: VolumeDataPoint[];
  volumeByExercise: ExerciseVolume[];
  oneRMProgression: OneRMDataPoint[];
}

export interface VolumeDataPoint {
  week: string;
  volume: number;
  sets: number;
  workouts: number;
}

export interface ExerciseVolume {
  exerciseId: string;
  exerciseName: string;
  volume: number;
  sets: number;
  avgWeight: number;
}

export interface OneRMDataPoint {
  date: string;
  exerciseId: string;
  exerciseName: string;
  oneRepMax: number;
  isActual: boolean; // true if actual PR, false if estimated
}

export interface WeeklySummary {
  weekStart: string;
  weekEnd: string;
  workoutCount: number;
  totalVolume: number;
  totalSets: number;
  totalReps: number;
  prsAchieved: number;
  topExercises: string[];
  avgWorkoutDuration: number;
  comparisonToPrevious: {
    workouts: number; // +2 or -1
    volume: number;   // +5000 or -1000
    prs: number;      // +1 or 0
  };
}

// ============================================================================
// Request/Response Types
// ============================================================================

export interface CreateWorkoutRequest {
  gymId?: string;
  title?: string;
  notes?: string;
  programId?: string;
  sessionId?: string;
}

export interface UpdateWorkoutRequest {
  title?: string;
  notes?: string;
  completedAt?: string;
  duration?: number;
}

export interface CreateSetRequest {
  exerciseId: string;
  reps: number;
  weight: number;
  unit: 'lbs' | 'kg';
  rpe?: number;
  repQuality?: number;
  setType?: 'warmup' | 'working' | 'drop' | 'rest-pause' | 'amrap';
  restSeconds?: number;
  tempo?: string;
  notes?: string;
}

export interface UpdateSetRequest {
  reps?: number;
  weight?: number;
  unit?: 'lbs' | 'kg';
  rpe?: number;
  repQuality?: number;
  setType?: 'warmup' | 'working' | 'drop' | 'rest-pause' | 'amrap';
  restSeconds?: number;
  tempo?: string;
  notes?: string;
}

export interface CreatePRRequest {
  exerciseId: string;
  weight: number;
  reps: number;
  unit: 'lbs' | 'kg';
  notes?: string;
  gymId?: string;
}

export interface ExerciseHistoryResponse {
  exerciseId: string;
  exercise: Exercise;
  totalSets: number;
  totalVolume: number;
  personalBest: PersonalRecord | null;
  recentSets: WorkoutSet[];
  volumeProgression: VolumeDataPoint[];
}

// ============================================================================
// Utility Types
// ============================================================================

export type WorkoutStatus = 'active' | 'completed' | 'abandoned';

export interface PlateCalculation {
  barWeight: number;
  targetWeight: number;
  plates: { weight: number; count: number }[];
  remainder: number;
}

// ============================================================================
// Program & Template Types
// ============================================================================

export interface WorkoutProgram {
  id: string;
  userId: string;
  name: string;
  description?: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  durationWeeks: number;
  goal: 'strength' | 'hypertrophy' | 'endurance' | 'powerlifting' | 'general';
  tags: string[];
  isPublic: boolean;
  isOfficial: boolean;

  weeks: ProgramWeek[];

  createdBy?: string;
  totalWorkouts: number;
  estimatedTimePerWorkout: number;
  equipmentRequired: string[];

  likes: number;
  saves: number;
  completions: number;

  createdAt: string;
  updatedAt: string;
}

export interface ProgramWeek {
  weekNumber: number;
  description?: string;
  workouts: ProgramWorkout[];
}

export interface ProgramWorkout {
  dayNumber: number;
  name: string;
  description?: string;
  exercises: ProgramExercise[];
  estimatedDuration: number;
}

export interface ProgramExercise {
  exerciseId: string;
  exercise?: Exercise;
  order: number;

  sets: number;
  repsMin?: number;
  repsMax?: number;
  reps?: number;

  restSeconds: number;
  tempo?: string;
  rpe?: number;
  setType: 'straight' | 'superset' | 'circuit' | 'pyramid' | 'dropset';
  supersetWith?: number;

  weightProgression?: 'linear' | 'percentage' | 'rpe-based';
  progressionRate?: number;

  notes?: string;
}

export interface WorkoutTemplate {
  id: string;
  userId: string;
  name: string;
  description?: string;
  category?: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  tags: string[];

  exercises: TemplateExercise[];

  estimatedDuration: number;
  muscleGroups: string[];
  equipmentRequired: string[];

  timesUsed: number;
  lastUsedAt?: string;

  isPublic: boolean;
  likes: number;
  saves: number;

  createdAt: string;
  updatedAt: string;
}

export interface TemplateExercise {
  exerciseId: string;
  exercise?: Exercise;
  order: number;
  sets: number;
  repsMin?: number;
  repsMax?: number;
  reps?: number;
  restSeconds: number;
  tempo?: string;
  rpe?: number;
  setType: 'straight' | 'superset' | 'circuit' | 'pyramid' | 'dropset';
  supersetWith?: number;
  notes?: string;
}

// ============================================================================
// Enhanced Exercise Types
// ============================================================================

export interface ExerciseCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
}

export interface MuscleGroup {
  id: string;
  name: string;
  category: 'primary' | 'secondary';
}

export interface Equipment {
  id: string;
  name: string;
  type: 'barbell' | 'dumbbell' | 'machine' | 'cable' | 'bodyweight' | 'other';
}

export interface EnhancedExercise extends Exercise {
  aliases: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  instructions: string[];
  tips: string[];
  videoUrls: string[];
  imageUrls: string[];
  variations: string[];
  alternatives: string[];
  primaryMuscles: string[];
  secondaryMuscles: string[];
  equipmentRequired: string[];
  forceType: 'push' | 'pull' | 'static';
  mechanicsType: 'compound' | 'isolation';
  isCustom: boolean;
  createdByUserId?: string;
}

// ============================================================================
// Workout Set Types (Enhanced)
// ============================================================================

export interface SupersetGroup {
  id: string;
  workoutId: string;
  exercises: string[];
  order: number;
  type: 'superset' | 'triset' | 'giant-set' | 'circuit';
}

export interface EnhancedWorkoutSet extends WorkoutSet {
  isWarmup: boolean;
  targetReps?: number;
  targetWeight?: number;
  targetRPE?: number;
  formRating?: number;
  failureRep?: number;
  assistedReps?: number;
  partialReps?: number;
  supersetGroupId?: string;
  restActual?: number;
  videoUrl?: string;
}

// ============================================================================
// Progress Tracking Types
// ============================================================================

export interface BodyMeasurement {
  id: string;
  userId: string;
  date: string;

  weight?: number;
  weightUnit: 'lbs' | 'kg';
  bodyFatPercentage?: number;
  muscleMass?: number;

  neck?: number;
  shoulders?: number;
  chest?: number;
  leftArm?: number;
  rightArm?: number;
  waist?: number;
  hips?: number;
  leftThigh?: number;
  rightThigh?: number;
  leftCalf?: number;
  rightCalf?: number;

  unit: 'in' | 'cm';
  notes?: string;

  createdAt: string;
}

export interface ProgressPhoto {
  id: string;
  userId: string;
  date: string;
  angle: 'front' | 'side' | 'back' | 'other';
  imageUrl: string;
  weight?: number;
  notes?: string;
  isPublic: boolean;
  createdAt: string;
}

export interface ExerciseHistoryData {
  exerciseId: string;
  exercise: Exercise;
  totalWorkouts: number;
  totalSets: number;
  totalVolume: number;
  currentPR: PersonalRecord | null;
  allTimePR: PersonalRecord | null;
  recentSets: WorkoutSet[];
  volumeProgression: VolumeDataPoint[];
  oneRMProgression: OneRMDataPoint[];
  lastPerformed?: string;
}

// ============================================================================
// Social & Sharing Types
// ============================================================================

export interface WorkoutShare {
  id: string;
  workoutId: string;
  userId: string;
  caption?: string;
  highlightedSets?: string[];
  highlightedPRs?: string[];
  visibility: 'public' | 'friends' | 'private';
  likes: number;
  comments: number;
  createdAt: string;
}

export interface WorkoutComment {
  id: string;
  workoutShareId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  text: string;
  createdAt: string;
}

export interface FriendActivity {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  type: 'workout_completed' | 'pr_achieved' | 'program_started';
  data: any;
  timestamp: string;
}

// ============================================================================
// Active Workout Types (In-Progress)
// ============================================================================

export interface ActiveWorkout {
  id: string;
  userId: string;

  templateId?: string;
  programId?: string;
  sessionId?: string;
  weekNumber?: number;
  dayNumber?: number;

  name: string;
  startedAt: string;

  exercises: ActiveExercise[];

  currentExerciseIndex: number;
  restTimerActive: boolean;
  restTimerSeconds: number;
  restTimerEnd?: string;
}

export interface ActiveExercise {
  exerciseId: string;
  exercise: Exercise;
  order: number;
  plannedSets: number;
  completedSets: WorkoutSet[];
  supersetGroupId?: string;
  notes?: string;
  // Template targets for pre-filling set input
  targetReps?: number;
  targetRepsMax?: number;
  targetWeight?: number;
  targetRir?: number;
  restSeconds?: number;
  setType?: 'straight' | 'superset' | 'dropset';
}

// ============================================================================
// Request Types for New Features
// ============================================================================

export interface CreateProgramRequest {
  name: string;
  description?: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  durationWeeks: number;
  goal: 'strength' | 'hypertrophy' | 'endurance' | 'powerlifting' | 'general';
  tags?: string[];
  weeks: ProgramWeek[];
}

export interface CreateTemplateRequest {
  name: string;
  description?: string;
  category?: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  tags?: string[];
  exercises: TemplateExercise[];
}

export interface CreateExerciseRequest {
  name: string;
  category: 'compound' | 'isolation' | 'cardio';
  muscleGroups: string[];
  equipment: string;
  description?: string;
  instructions?: string[];
  tips?: string[];
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  tags?: string[];
}

export interface ExerciseFilters {
  category?: string;
  muscleGroup?: string;
  equipment?: string;
  difficulty?: string;
  isCustom?: boolean;
  searchQuery?: string;
}

export interface ProgramFilters {
  difficulty?: string;
  goal?: string;
  durationWeeks?: number;
  isOfficial?: boolean;
}

export interface TemplateFilters {
  category?: string;
  difficulty?: string;
  userId?: string;
  isPublic?: boolean;
}
