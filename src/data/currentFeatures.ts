import { SIGNAL } from '../theme/tokens';

export type LiveFeatureNavTarget =
  | { stack: 'Training'; screen: 'ForgeMain' }
  | { stack: 'Training'; screen: 'WorkoutTemplates' }
  | { stack: 'Training'; screen: 'CardioTypeSelection' }
  | { stack: 'Music'; screen: 'MusicMain' }
  | { stack: 'Discover'; screen: 'GymListMain' }
  | { stack: 'Profile'; screen: 'Friends' }
  | { stack: 'Profile'; screen: 'Progress' };

export interface LiveFeature {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  icon: string;
  accentColor: string;
  category: 'Training' | 'Music' | 'Social' | 'Discovery';
  bullets: string[];
  navTarget: LiveFeatureNavTarget;
}

export const LIVE_FEATURES: LiveFeature[] = [
  {
    id: 'forge_mode',
    title: 'Forge Mode',
    subtitle: 'Adaptive training with RPE-based progression',
    description:
      'Six periodized programs that automatically adjust your weights based on how hard your last session felt. Auto-progression, deload weeks every 4th cycle, and Spotify playlist generation matched to session intensity.',
    icon: '🔥',
    accentColor: SIGNAL.forge,
    category: 'Training',
    bullets: [
      '6 programs: 5/3/1, PPL, Full Body Recomp, Athletic, Beginner, Maintenance',
      'RPE-based weight auto-progression after every session',
      'Automatic 40% volume deload every 4th week',
      'Spotify playlist generated per session type (push/pull/legs/deload)',
    ],
    navTarget: { stack: 'Training', screen: 'ForgeMain' },
  },
  {
    id: 'active_workout',
    title: 'Active Workout',
    subtitle: 'Execute workouts with set tracking and rest timers',
    description:
      'Start any workout template and track every set in real time. Rest timers count down with haptic alerts, weights pre-fill from previous sessions, and PRs are detected automatically using the Epley 1RM formula.',
    icon: '🏋️',
    accentColor: SIGNAL.resonance,
    category: 'Training',
    bullets: [
      'Set-by-set tracking: weight, reps, RIR',
      'Rest timer with haptic alerts at 3-2-1-0 seconds',
      'Pre-fill from last session, auto-detect PRs',
      'Workout state persists across app restarts',
    ],
    navTarget: { stack: 'Training', screen: 'WorkoutTemplates' },
  },
  {
    id: 'spotify_playlists',
    title: 'Session Playlists',
    subtitle: 'Spotify-generated playlists for every workout',
    description:
      'Connect Spotify and BarbellBeats generates a playlist matched to your session\'s intensity profile — push day gets trap, leg day gets EDM, deload week gets lo-fi. Saved directly to your Spotify library.',
    icon: '🎵',
    accentColor: '#1ED760',
    category: 'Music',
    bullets: [
      'Spotify PKCE OAuth — no client secret on device',
      'Session type → seed genres + target energy + BPM range',
      'Playlist created and saved to your Spotify account',
      'Forge Mode Pro: auto-generated before every session',
    ],
    navTarget: { stack: 'Music', screen: 'MusicMain' },
  },
  {
    id: 'gym_voting',
    title: 'Gym Music Voting',
    subtitle: 'Democratic playlist control for your gym',
    description:
      'Every gym member votes on what plays. Songs rise and fall in real time based on collective votes. Earn influence ranks (Bronze → Legend) and get weighted vote multipliers the more you contribute.',
    icon: '🎤',
    accentColor: SIGNAL.gold,
    category: 'Music',
    bullets: [
      'Live playlist voting: songs rise/fall in real time',
      'Influence ranks: Bronze, Silver, Gold, Platinum, Diamond, Legend',
      'Vote weight multipliers: Bronze 1× → Legend 5×',
      'Crowd DJ sessions for Platinum+ members',
    ],
    navTarget: { stack: 'Music', screen: 'MusicMain' },
  },
  {
    id: 'cardio_log',
    title: 'Cardio Log',
    subtitle: 'Notebook-style entries with photo attachments',
    description:
      'Log any cardio session — running, cycling, rowing, stairs, and more. Add photos from your camera roll, track distance and duration, and browse your full entry history.',
    icon: '🏃',
    accentColor: SIGNAL.resonance,
    category: 'Training',
    bullets: [
      'Types: running, cycling, walking, rowing, elliptical, stairs, other',
      'Duration, distance, notes, and photo attachments',
      'Photos stored locally — works offline, no upload needed',
      'Entry history with filtering and detail view',
    ],
    navTarget: { stack: 'Training', screen: 'CardioTypeSelection' },
  },
  {
    id: 'gym_maps',
    title: 'Gym Discovery',
    subtitle: 'Find and favorite gyms near you',
    description:
      'Browse gyms on a map or list view using your live location. Star your favorites for quick access, and tap any gym to see its details and music activity.',
    icon: '📍',
    accentColor: SIGNAL.forge,
    category: 'Discovery',
    bullets: [
      'Live location with react-native-maps integration',
      'List and map view modes',
      'Favorite gyms with instant local persistence',
      'Tap any gym to view details and music activity',
    ],
    navTarget: { stack: 'Discover', screen: 'GymListMain' },
  },
  {
    id: 'social_friends',
    title: 'Friends & Leaderboard',
    subtitle: 'Connect, follow, and compete',
    description:
      'Add friends, follow their activity, and see where you rank on the leaderboard. Your influence rank is built from the quality of music you add, votes you cast, and community reception.',
    icon: '👥',
    accentColor: SIGNAL.gold,
    category: 'Social',
    bullets: [
      'Send and receive follow requests',
      'Activity feed showing friends\' workouts and music',
      'Global leaderboard with rank badges',
      'Progress charts and PR history',
    ],
    navTarget: { stack: 'Profile', screen: 'Friends' },
  },
];
