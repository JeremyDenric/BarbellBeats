export type ExtraFeature = {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  category: string;
  bullets: string[];
};

export const EXTRA_FEATURES: ExtraFeature[] = [
  {
    id: 'program-builder',
    title: 'Smart Program Builder',
    subtitle: 'Goal-based plans with progressive overload',
    icon: '🧠',
    category: 'Training Intelligence',
    bullets: [
      'Goal, schedule, and equipment intake',
      'Auto progression with deload weeks',
      'Templates for strength, hypertrophy, and HIIT',
    ],
  },
  {
    id: 'ai-coach',
    title: 'AI Session Coach',
    subtitle: 'Set suggestions, rest timing, and form cues',
    icon: '🎯',
    category: 'Training Intelligence',
    bullets: [
      'Adaptive set/reps based on RPE',
      'Smart rest timer prompts',
      'Form cue reminders between sets',
    ],
  },
  {
    id: 'gym-pulse',
    title: 'Gym Pulse Dashboard',
    subtitle: 'Crowd meter, peak hours, and vibe intensity',
    icon: '📡',
    category: 'Gym Experience',
    bullets: [
      'Live crowd level by hour',
      'Energy trend from playlist votes',
      'Top stations and busy zones',
    ],
  },
  {
    id: 'community-challenges',
    title: 'Community Challenges',
    subtitle: 'Weekly goals, streaks, and rewards',
    icon: '🏁',
    category: 'Community & Challenges',
    bullets: [
      'Weekly themed challenges',
      'Team vs team leaderboards',
      'Reward badges and streak boosts',
    ],
  },
  {
    id: 'workout-music-sync',
    title: 'Workout & Music Sync',
    subtitle: 'Auto-BPM matching to workout intensity',
    icon: '🎚️',
    category: 'Music & Energy',
    bullets: [
      'Match BPM to workout phases',
      'Auto switch playlists by intensity',
      'Personal energy slider control',
    ],
  },
  {
    id: 'recovery-hub',
    title: 'Recovery Hub',
    subtitle: 'Sleep, soreness, and recovery scores',
    icon: '🛌',
    category: 'Recovery & Wellness',
    bullets: [
      'Sleep, HRV, and soreness check-ins',
      'Recovery score with recommendations',
      'Mobility routines and cooldown plans',
    ],
  },
  {
    id: 'pr-analytics',
    title: 'PR Analytics Lab',
    subtitle: '1RM trends, milestones, and charts',
    icon: '📈',
    category: 'Training Intelligence',
    bullets: [
      '1RM estimates and velocity trends',
      'Milestone timeline for major lifts',
      'Exercise heatmaps by month',
    ],
  },
  {
    id: 'coach-mode',
    title: 'Coach Mode',
    subtitle: 'Assign workouts and track clients',
    icon: '🧑‍🏫',
    category: 'Coaching & Creator',
    bullets: [
      'Assign programs and check-ins',
      'Coach-client feedback thread',
      'Progress dashboards by athlete',
    ],
  },
  {
    id: 'event-nights',
    title: 'Event Nights',
    subtitle: 'DJ sessions and live voting takeovers',
    icon: '🎤',
    category: 'Gym Experience',
    bullets: [
      'Scheduled DJ takeovers',
      'Real-time voting spotlight',
      'Event calendar and reminders',
    ],
  },
  {
    id: 'creator-studio',
    title: 'Creator Studio',
    subtitle: 'Share setlists, routines, and challenges',
    icon: '🎬',
    category: 'Coaching & Creator',
    bullets: [
      'Shareable workout templates',
      'Community remixes and likes',
      'Creator profile and stats',
    ],
  },
];
