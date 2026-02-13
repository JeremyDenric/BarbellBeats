/**
 * Centralized Icon System
 *
 * Uses Phosphor Icons for consistent, modern iconography throughout the app.
 * Provides theme-aware colors and standardized sizing.
 */

import React from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import {
  // Navigation
  House,
  HouseSimple,
  MapPin,
  MapPinLine,
  Barbell,
  MusicNotes,
  MusicNotesSimple,
  User,
  UserCircle,

  // Training
  ClipboardText,
  PersonSimpleRun,
  ChartLineUp,
  Trophy,
  Toolbox,
  Timer,

  // Cardio
  Bicycle,
  PersonSimpleWalk,
  // Boat - not available, use custom
  Lightning,
  Stairs,

  // Gym Experience
  Headphones,
  MapTrifold,

  // Settings
  UsersThree,
  Star,
  PaintBrush,
  Bell,
  Info,
  Sparkle,

  // Workout
  Flame,
  ArrowDown,
  Pause,
  ArrowsClockwise,
  Target,
  Person,
  GearSix,

  // Reactions
  Fire,
  HandFist,
  MusicNote,

  // Theme
  Sun,
  Moon,
  CircleHalf,

  // Music Player
  SkipBack,
  Play,
  SkipForward,
  SpeakerSlash,
  SpeakerHigh,

  // Map
  NavigationArrow,

  // Features
  Brain,
  Crosshair,
  Broadcast,
  Flag,
  SlidersHorizontal,
  Bed,
  Chalkboard,
  Microphone,
  FilmSlate,

  // Auth
  Fingerprint,
  Scan,

  // General
  MagnifyingGlass,
  Heart,
  HeartStraight,
  Plus,
  X,
  Check,
  CaretRight,
  CaretLeft,
  CaretDown,
  CaretUp,
  DotsThree,
  Gear,
  SignOut,
  Trash,
  PencilSimple,
  Eye,
  EyeSlash,
  Warning,
  CheckCircle,
  XCircle,
  Question,
  Calendar,
  Clock,
  Share,
  Link,
  Copy,
  Download,
  Upload,
  Repeat,
  Shuffle,
  Queue,
  ListBullets,
  FunnelSimple,
  SortAscending,
  SortDescending,
  WaveSine,
  Pulse,
  TrendUp,
  TrendDown,
  Minus,
  Equals,

  // Workout extras
  ArrowsLeftRight,
  List,
  Stack,

  // Documents
  FileText,
  PlusCircle,

  // Form
  CheckSquare,
  Square,

  // Spotify
  SpotifyLogo,

  IconWeight,
} from 'phosphor-react-native';
import { useThemeMode } from '../contexts/ThemeContext';
import { COLORS } from '../theme/tokens';
import devLog from '../utils/devLog';

// ============================================================================
// Types
// ============================================================================

export type IconSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl';
export type IconVariant = 'regular' | 'bold' | 'fill' | 'duotone' | 'thin' | 'light';

export interface IconProps {
  name: IconName;
  size?: IconSize | number;
  color?: string;
  variant?: IconVariant;
  style?: StyleProp<ViewStyle>;
}

// Map size names to pixel values
const SIZE_MAP: Record<IconSize, number> = {
  xs: 16,
  sm: 20,
  md: 24,
  lg: 32,
  xl: 40,
  xxl: 48,
};

// Map variant names to Phosphor weights
const VARIANT_MAP: Record<IconVariant, IconWeight> = {
  regular: 'regular',
  bold: 'bold',
  fill: 'fill',
  duotone: 'duotone',
  thin: 'thin',
  light: 'light',
};

// ============================================================================
// Icon Registry
// ============================================================================

export type IconName =
  // Navigation
  | 'home'
  | 'home-simple'
  | 'map-pin'
  | 'map-pin-line'
  | 'barbell'
  | 'music-notes'
  | 'music-notes-simple'
  | 'user'
  | 'user-circle'

  // Training
  | 'clipboard-text'
  | 'person-run'
  | 'chart-line-up'
  | 'trophy'
  | 'toolbox'
  | 'timer'

  // Cardio
  | 'bicycle'
  | 'person-walk'
  | 'rowing'
  | 'lightning'
  | 'stairs'

  // Gym Experience
  | 'headphones'
  | 'map-trifold'

  // Settings
  | 'users-three'
  | 'star'
  | 'paint-brush'
  | 'bell'
  | 'info'
  | 'sparkle'

  // Workout
  | 'flame'
  | 'arrow-down'
  | 'pause'
  | 'arrows-clockwise'
  | 'target'
  | 'person'
  | 'gear-six'

  // Reactions
  | 'fire'
  | 'hand-fist'
  | 'music-note'

  // Theme
  | 'sun'
  | 'moon'
  | 'circle-half'

  // Music Player
  | 'skip-back'
  | 'play'
  | 'skip-forward'
  | 'speaker-slash'
  | 'speaker-high'

  // Map
  | 'navigation-arrow'

  // Features
  | 'brain'
  | 'crosshair'
  | 'broadcast'
  | 'flag'
  | 'sliders-horizontal'
  | 'bed'
  | 'chalkboard'
  | 'microphone'
  | 'film-slate'

  // Auth
  | 'fingerprint'
  | 'scan'

  // General
  | 'search'
  | 'heart'
  | 'heart-straight'
  | 'plus'
  | 'x'
  | 'check'
  | 'caret-right'
  | 'caret-left'
  | 'caret-down'
  | 'caret-up'
  | 'dots-three'
  | 'gear'
  | 'sign-out'
  | 'trash'
  | 'pencil'
  | 'eye'
  | 'eye-slash'
  | 'warning'
  | 'check-circle'
  | 'x-circle'
  | 'question'
  | 'calendar'
  | 'clock'
  | 'share'
  | 'link'
  | 'copy'
  | 'download'
  | 'upload'
  | 'repeat'
  | 'shuffle'
  | 'queue'
  | 'list-bullets'
  | 'funnel'
  | 'sort-ascending'
  | 'sort-descending'
  | 'wave-sine'
  | 'activity'
  | 'trend-up'
  | 'trend-down'
  | 'minus'
  | 'equals'
  | 'arrows-left-right'
  | 'list'
  | 'stack'
  | 'file-text'
  | 'plus-circle'
  | 'magnifying-glass'
  | 'check-square'
  | 'square'
  | 'spotify';

// Icon component mapping
const ICON_COMPONENTS: Record<IconName, React.ComponentType<any>> = {
  // Navigation
  'home': House,
  'home-simple': HouseSimple,
  'map-pin': MapPin,
  'map-pin-line': MapPinLine,
  'barbell': Barbell,
  'music-notes': MusicNotes,
  'music-notes-simple': MusicNotesSimple,
  'user': User,
  'user-circle': UserCircle,

  // Training
  'clipboard-text': ClipboardText,
  'person-run': PersonSimpleRun,
  'chart-line-up': ChartLineUp,
  'trophy': Trophy,
  'toolbox': Toolbox,
  'timer': Timer,

  // Cardio
  'bicycle': Bicycle,
  'person-walk': PersonSimpleWalk,
  'rowing': WaveSine, // Using wave as rowing substitute
  'lightning': Lightning,
  'stairs': Stairs,

  // Gym Experience
  'headphones': Headphones,
  'map-trifold': MapTrifold,

  // Settings
  'users-three': UsersThree,
  'star': Star,
  'paint-brush': PaintBrush,
  'bell': Bell,
  'info': Info,
  'sparkle': Sparkle,

  // Workout
  'flame': Flame,
  'arrow-down': ArrowDown,
  'pause': Pause,
  'arrows-clockwise': ArrowsClockwise,
  'target': Target,
  'person': Person,
  'gear-six': GearSix,

  // Reactions
  'fire': Fire,
  'hand-fist': HandFist,
  'music-note': MusicNote,

  // Theme
  'sun': Sun,
  'moon': Moon,
  'circle-half': CircleHalf,

  // Music Player
  'skip-back': SkipBack,
  'play': Play,
  'skip-forward': SkipForward,
  'speaker-slash': SpeakerSlash,
  'speaker-high': SpeakerHigh,

  // Map
  'navigation-arrow': NavigationArrow,

  // Features
  'brain': Brain,
  'crosshair': Crosshair,
  'broadcast': Broadcast,
  'flag': Flag,
  'sliders-horizontal': SlidersHorizontal,
  'bed': Bed,
  'chalkboard': Chalkboard,
  'microphone': Microphone,
  'film-slate': FilmSlate,

  // Auth
  'fingerprint': Fingerprint,
  'scan': Scan,

  // General
  'search': MagnifyingGlass,
  'heart': Heart,
  'heart-straight': HeartStraight,
  'plus': Plus,
  'x': X,
  'check': Check,
  'caret-right': CaretRight,
  'caret-left': CaretLeft,
  'caret-down': CaretDown,
  'caret-up': CaretUp,
  'dots-three': DotsThree,
  'gear': Gear,
  'sign-out': SignOut,
  'trash': Trash,
  'pencil': PencilSimple,
  'eye': Eye,
  'eye-slash': EyeSlash,
  'warning': Warning,
  'check-circle': CheckCircle,
  'x-circle': XCircle,
  'question': Question,
  'calendar': Calendar,
  'clock': Clock,
  'share': Share,
  'link': Link,
  'copy': Copy,
  'download': Download,
  'upload': Upload,
  'repeat': Repeat,
  'shuffle': Shuffle,
  'queue': Queue,
  'list-bullets': ListBullets,
  'funnel': FunnelSimple,
  'sort-ascending': SortAscending,
  'sort-descending': SortDescending,
  'wave-sine': WaveSine,
  'activity': Pulse,
  'trend-up': TrendUp,
  'trend-down': TrendDown,
  'minus': Minus,
  'equals': Equals,
  'arrows-left-right': ArrowsLeftRight,
  'list': List,
  'stack': Stack,
  'file-text': FileText,
  'plus-circle': PlusCircle,
  'magnifying-glass': MagnifyingGlass,
  'check-square': CheckSquare,
  'square': Square,
  'spotify': SpotifyLogo,
};

// ============================================================================
// Component
// ============================================================================

export function Icon({
  name,
  size = 'md',
  color,
  variant = 'regular',
  style,
}: IconProps) {
  const { isDark } = useThemeMode();

  const IconComponent = ICON_COMPONENTS[name];

  if (!IconComponent) {
    devLog.warn(`Icon "${name}" not found in registry`);
    return null;
  }

  const pixelSize = typeof size === 'number' ? size : SIZE_MAP[size];
  const weight = VARIANT_MAP[variant];
  const iconColor = color ?? (isDark ? COLORS.dark.textPrimary : COLORS.light.textPrimary);

  return (
    <IconComponent
      size={pixelSize}
      color={iconColor}
      weight={weight}
      style={style}
    />
  );
}

// ============================================================================
// Convenience Components for Tab Bar
// ============================================================================

interface TabIconProps {
  focused: boolean;
  color: string;
  size: number;
}

export const TabIcons = {
  Home: ({ focused, color, size }: TabIconProps) => (
    <Icon
      name={focused ? 'home' : 'home-simple'}
      size={size}
      color={color}
      variant={focused ? 'fill' : 'regular'}
    />
  ),

  Discover: ({ focused, color, size }: TabIconProps) => (
    <Icon
      name={focused ? 'map-pin' : 'map-pin-line'}
      size={size}
      color={color}
      variant={focused ? 'fill' : 'regular'}
    />
  ),

  Training: ({ focused, color, size }: TabIconProps) => (
    <Icon
      name="barbell"
      size={size}
      color={color}
      variant={focused ? 'fill' : 'regular'}
    />
  ),

  Music: ({ focused, color, size }: TabIconProps) => (
    <Icon
      name={focused ? 'music-notes' : 'music-notes-simple'}
      size={size}
      color={color}
      variant={focused ? 'fill' : 'regular'}
    />
  ),

  Profile: ({ focused, color, size }: TabIconProps) => (
    <Icon
      name={focused ? 'user-circle' : 'user'}
      size={size}
      color={color}
      variant={focused ? 'fill' : 'regular'}
    />
  ),
};

export default Icon;
