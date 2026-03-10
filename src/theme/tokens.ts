import { Platform } from 'react-native';

/**
 * Design Tokens — BarbellBeats
 *
 * Visual Identity: "CARBON RESONANCE"
 *
 * Philosophy: The app doesn't look like a fitness app or a music app.
 * It looks like specialized equipment. Think high-end audio gear crossed
 * with precision athletic instruments — clean, industrial, purposeful.
 *
 * Three signal colors define the visual language:
 *   FORGE (#FF4D00)     — heated iron, deadlift PR, max effort
 *   RESONANCE (#00E5C8) — oscilloscope cyan, frequency, music
 *   GOLD (#FFB800)      — achievement, records, personal bests
 *
 * Backgrounds use ink-black with a faint purple undertone — distinct
 * from the generic charcoal found everywhere else.
 */

// ============================================================================
// Signal Colors — The Brand's Emotional Core
// ============================================================================

export const SIGNAL = {
  forge: '#FF4D00',          // Heated iron — primary training color
  forgeDim: 'rgba(255, 77, 0, 0.18)',
  forgeGlow: 'rgba(255, 77, 0, 0.35)',
  resonance: '#00E5C8',      // Oscilloscope cyan — music / audio
  resonanceDim: 'rgba(0, 229, 200, 0.15)',
  resonanceGlow: 'rgba(0, 229, 200, 0.30)',
  gold: '#FFB800',           // Achievement amber — PRs, records
  goldDim: 'rgba(255, 184, 0, 0.15)',
};

// ============================================================================
// Color System
// ============================================================================

export const COLORS = {
  /**
   * Light Mode — Warm parchment + forge orange
   * Think: precision instrument documentation, Leica camera manuals
   */
  light: {
    // Primary — Dark forge orange (WCAG AA accessible on warm white)
    primary: '#CC3D00',
    primaryLight: '#FF4D00',
    primaryDark: '#A03000',
    primaryBg: '#FFF3EE',
    primaryMuted: 'rgba(204, 61, 0, 0.45)',

    // Accent — Teal (music in light mode), violet (achievements)
    accent: '#0099A8',
    accentGreen: '#00897B',
    accentPurple: '#6D28D9',
    accentDark: '#00788A',
    accentLight: '#EEF9FA',

    // Glass — Warm parchment glass
    glass: 'rgba(252, 249, 244, 0.90)',
    glassBorder: 'rgba(204, 61, 0, 0.10)',
    glassOverlay: 'rgba(204, 61, 0, 0.04)',

    // Backgrounds — Warm cream (not grey, not blue — distinctly warm)
    background: '#FAF8F2',
    backgroundAlt: '#F2EDE0',
    surface: '#FFFFFF',
    surfaceElevated: '#FEFAF5',
    surfaceAlt: '#F5EFE2',

    // Text — Warm near-black with slight sepia undertone
    textPrimary: '#0D0B07',
    textSecondary: '#4A4438',
    textTertiary: '#8A8070',
    textDisabled: '#C0B8A8',

    // Borders — Warm tones
    border: '#E8DEC8',
    borderLight: '#F0E8D4',
    borderStrong: '#D0C4A8',
    divider: '#EDE3CC',

    // Status
    success: '#009688',
    warning: '#E67E00',
    error: '#D93B2B',
    info: '#CC3D00',
  },

  /**
   * Dark Mode — Ink black with purple undertone + forge orange
   * Think: carbon fiber, precision electronics, Garmin Fenix display
   */
  dark: {
    // Primary — Forge orange (signal hot)
    primary: '#FF4D00',
    primaryLight: '#FF7340',
    primaryDark: '#CC3D00',
    primaryBg: '#0F0800',
    primaryMuted: 'rgba(255, 77, 0, 0.40)',

    // Accent — Resonance cyan (cold, audio/music) + deep violet (achievements)
    accent: '#00E5C8',
    accentGreen: '#00E5C8',
    accentPurple: '#8B5CF6',
    accentDark: '#00B8A0',
    accentLight: '#030E0C',

    // Glass — Ink glass (no blur needed, just dark with border)
    glass: 'rgba(12, 12, 22, 0.94)',
    glassBorder: 'rgba(255, 77, 0, 0.12)',
    glassOverlay: 'rgba(255, 77, 0, 0.04)',

    // Backgrounds — Ink black with faint purple undertone
    // Each layer adds ~6 luminance points
    background: '#06060C',     // ink — deepest
    backgroundAlt: '#0C0C18',  // void — slight elevation
    surface: '#121220',        // slate — card surfaces
    surfaceElevated: '#18182A', // stone — elevated cards
    surfaceAlt: '#1E1E30',     // cloud — tertiary surfaces

    // Text — Warm white (ivory, not blue-white)
    textPrimary: '#F2EEE6',
    textSecondary: '#8C88A0',
    textTertiary: '#504C64',
    textDisabled: '#2C2A3C',

    // Borders — Dark with purple undertone
    border: '#1C1C2E',
    borderLight: '#141428',
    borderStrong: '#28283E',
    divider: '#0E0E1C',

    // Status
    success: '#00E5C8',
    warning: '#FFB800',
    error: '#FF3B30',
    info: '#FF4D00',
  },

  // Overlays
  overlay: 'rgba(6, 6, 12, 0.6)',
  overlayLight: 'rgba(6, 6, 12, 0.35)',
};

// ============================================================================
// iOS System Colors — Mapped to Carbon Resonance palette
// ============================================================================

export const IOS_COLORS = {
  light: {
    systemBackground: '#FAF8F2',
    secondarySystemBackground: '#F2EDE0',
    tertiarySystemBackground: '#FFFFFF',
    systemGroupedBackground: '#FAF8F2',
    secondarySystemGroupedBackground: '#F5EFE2',
    tertiarySystemGroupedBackground: '#FEFAF5',

    label: '#0D0B07',
    secondaryLabel: 'rgba(74, 68, 56, 0.75)',
    tertiaryLabel: 'rgba(138, 128, 112, 0.55)',
    quaternaryLabel: 'rgba(138, 128, 112, 0.32)',
    placeholderText: 'rgba(138, 128, 112, 0.50)',

    separator: 'rgba(74, 68, 56, 0.18)',
    opaqueSeparator: '#D0C4A8',

    systemFill: 'rgba(13, 11, 7, 0.06)',
    secondarySystemFill: 'rgba(13, 11, 7, 0.10)',
    tertiarySystemFill: 'rgba(13, 11, 7, 0.04)',
    quaternarySystemFill: 'rgba(13, 11, 7, 0.03)',

    tint: '#CC3D00',

    systemGray: '#8A8070',
    systemGray2: '#706860',
    systemGray3: '#5A5248',
    systemGray4: '#444038',
    systemGray5: '#2E2C28',
    systemGray6: '#1C1A18',
  },

  dark: {
    systemBackground: '#06060C',
    secondarySystemBackground: '#0C0C18',
    tertiarySystemBackground: '#121220',
    systemGroupedBackground: '#06060C',
    secondarySystemGroupedBackground: '#18182A',
    tertiarySystemGroupedBackground: '#1E1E30',

    label: '#F2EEE6',
    secondaryLabel: 'rgba(140, 136, 160, 0.75)',
    tertiaryLabel: 'rgba(80, 76, 100, 0.55)',
    quaternaryLabel: 'rgba(80, 76, 100, 0.32)',
    placeholderText: 'rgba(80, 76, 100, 0.50)',

    separator: 'rgba(140, 136, 160, 0.16)',
    opaqueSeparator: '#28283E',

    systemFill: 'rgba(255, 255, 255, 0.07)',
    secondarySystemFill: 'rgba(255, 255, 255, 0.11)',
    tertiarySystemFill: 'rgba(255, 255, 255, 0.05)',
    quaternarySystemFill: 'rgba(255, 255, 255, 0.03)',

    tint: '#FF4D00',

    systemGray: '#8C88A0',
    systemGray2: '#6C6880',
    systemGray3: '#504C64',
    systemGray4: '#3C384E',
    systemGray5: '#28263A',
    systemGray6: '#1C1A28',
  },
};

// ============================================================================
// Gradients — Deliberate, expressive, not decorative
// ============================================================================

export const GRADIENTS = {
  // Training / energy
  primary: ['#FF4D00', '#CC2800'] as const,
  primarySoft: ['rgba(255,77,0,0.20)', 'rgba(255,77,0,0.04)'] as const,
  forge: ['#FF6B20', '#FF2D00'] as const,

  // Music / audio
  accent: ['#00E5C8', '#00B8A0'] as const,
  resonance: ['rgba(0,229,200,0.20)', 'rgba(0,229,200,0.04)'] as const,

  // Achievement
  gold: ['#FFB800', '#FF8C00'] as const,
  goldSoft: ['rgba(255,184,0,0.20)', 'rgba(255,184,0,0.04)'] as const,

  // Backgrounds — deep, atmospheric
  darkBase: ['#06060C', '#0C0C18', '#12121E'] as const,
  darkWarm: ['#0A0806', '#0E0C12', '#141020'] as const,

  // Success
  success: ['#00E5C8', '#009688'] as const,

  // Glass card tint (replaces generic glass gradient)
  card: ['rgba(255,77,0,0.06)', 'rgba(255,77,0,0.02)'] as const,
  cardCyan: ['rgba(0,229,200,0.06)', 'rgba(0,229,200,0.02)'] as const,
};

// ============================================================================
// Typography
// ============================================================================

export const FONTS = {
  /**
   * Helvetica Neue on iOS — tighter tracking, more industrial than Avenir.
   * High-weight variants create the "specialized equipment" aesthetic.
   */
  display: Platform.select({
    ios: 'Helvetica Neue',
    android: 'sans-serif-condensed',
    default: 'sans-serif',
  }),
  body: Platform.select({
    ios: 'Helvetica Neue',
    android: 'sans-serif',
    default: 'sans-serif',
  }),
  emphasis: Platform.select({
    ios: 'Helvetica Neue',
    android: 'sans-serif-medium',
    default: 'sans-serif',
  }),
  mono: Platform.select({
    ios: 'Menlo',
    android: 'monospace',
    default: 'monospace',
  }),
};

export const TYPOGRAPHY = {
  sizes: {
    xs: 10,
    sm: 12,
    base: 15,
    lg: 17,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 38,
    '5xl': 48,
    '6xl': 64,    // Large metric displays (weight, reps)
  },

  lineHeights: {
    tight: 1.1,
    snug: 1.25,
    normal: 1.4,
    relaxed: 1.6,
  },

  weights: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    heavy: '800' as const,
    black: '900' as const,
  },

  letterSpacing: {
    ultraTight: -2.0,    // Display headlines — extreme compression
    tight: -0.8,
    snug: -0.4,
    normal: 0,
    wide: 0.8,           // Uppercase labels
    ultraWide: 1.6,      // Uppercase small caps / category labels
    mono: 0,             // Tabular numbers — no tracking
  },

  presets: {
    /**
     * DISPLAY — Hero numbers, screen titles.
     * Ultra-compressed, black weight. Feels forged.
     */
    displayLarge: {
      fontFamily: FONTS.display,
      fontSize: 48,
      fontWeight: '900' as const,
      lineHeight: 52,
      letterSpacing: -2.0,
    },
    displayMedium: {
      fontFamily: FONTS.display,
      fontSize: 38,
      fontWeight: '900' as const,
      lineHeight: 42,
      letterSpacing: -1.5,
    },

    /**
     * METRIC — Large tabular numbers (weight, reps, duration).
     * Mono font, no letter-spacing, precise alignment.
     */
    metric: {
      fontFamily: FONTS.mono,
      fontSize: 40,
      fontWeight: '700' as const,
      lineHeight: 44,
      letterSpacing: 0,
    },
    metricSmall: {
      fontFamily: FONTS.mono,
      fontSize: 24,
      fontWeight: '700' as const,
      lineHeight: 28,
      letterSpacing: 0,
    },
    metricLabel: {
      fontFamily: FONTS.body,
      fontSize: 10,
      fontWeight: '500' as const,
      lineHeight: 14,
      letterSpacing: 1.6,     // Uppercase wide — label-gun aesthetic
    },

    /**
     * HEADING — Section and card titles
     */
    heading1: {
      fontFamily: FONTS.display,
      fontSize: 30,
      fontWeight: '800' as const,
      lineHeight: 34,
      letterSpacing: -0.8,
    },
    heading2: {
      fontFamily: FONTS.display,
      fontSize: 24,
      fontWeight: '700' as const,
      lineHeight: 28,
      letterSpacing: -0.4,
    },
    heading3: {
      fontFamily: FONTS.emphasis,
      fontSize: 19,
      fontWeight: '700' as const,
      lineHeight: 24,
      letterSpacing: -0.3,
    },

    /**
     * BODY — Content and descriptions
     */
    body: {
      fontFamily: FONTS.body,
      fontSize: 15,
      fontWeight: '400' as const,
      lineHeight: 22,
      letterSpacing: 0,
    },
    bodyBold: {
      fontFamily: FONTS.emphasis,
      fontSize: 15,
      fontWeight: '600' as const,
      lineHeight: 22,
      letterSpacing: -0.1,
    },

    /**
     * LABEL — Uppercase category labels. Wide tracking, precise.
     */
    label: {
      fontFamily: FONTS.body,
      fontSize: 11,
      fontWeight: '600' as const,
      lineHeight: 14,
      letterSpacing: 1.2,
    },
    labelSmall: {
      fontFamily: FONTS.body,
      fontSize: 9,
      fontWeight: '700' as const,
      lineHeight: 12,
      letterSpacing: 1.6,
    },

    /**
     * CAPTION — Secondary supporting text
     */
    caption: {
      fontFamily: FONTS.body,
      fontSize: 12,
      fontWeight: '400' as const,
      lineHeight: 17,
      letterSpacing: 0,
    },
    caption2: {
      fontFamily: FONTS.body,
      fontSize: 10,
      fontWeight: '400' as const,
      lineHeight: 14,
      letterSpacing: 0.2,
    },
  },
};

// ============================================================================
// Spacing — 4px base grid (unchanged — no reason to break it)
// ============================================================================

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
  '4xl': 48,
  '5xl': 64,
  '6xl': 80,
};

export const LAYOUT = {
  screenPadding: 18,
  sectionSpacing: 32,
  cardPadding: 16,
  cardSpacing: 10,
  headerHeight: 52,
  tabBarHeight: 56,       // Slightly taller — signal line on top
  signalLineHeight: 2,    // The frequency bar above active tabs
};

// ============================================================================
// Border Radius — Deliberate asymmetry, not uniform
// ============================================================================

export const RADIUS = {
  none: 0,      // Sharp edge — for metric blocks, data elements
  xs: 4,        // Minimal — tags, chips
  sm: 8,        // Small cards, input fields
  md: 12,       // Standard cards
  lg: 16,       // Large cards, sheets
  xl: 22,       // Featured cards, hero sections
  '2xl': 32,    // Floating elements, overlays
  full: 9999,   // Pills, badges, circular elements
};

// ============================================================================
// Shadows — Minimal, purposeful. No decorative drop shadows.
// ============================================================================

export const SHADOWS = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  // Subtle card lift — barely perceptible
  xs: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  // Standard card depth
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  // Elevated modal / sheet
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 20,
    elevation: 6,
  },
  // Signal glow — forge orange inner glow (use as border-based shadow)
  glass: {
    shadowColor: '#FF4D00',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 3,
  },
  // Resonance glow — cyan for music elements
  resonance: {
    shadowColor: '#00E5C8',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 3,
  },
};

// ============================================================================
// Touch Targets — Accessibility minimums
// ============================================================================

export const TOUCH_TARGET = {
  min: 48,
  comfortable: 54,
  large: 64,
};

// ============================================================================
// Animation — Mass & Momentum
//
// Philosophy: elements animate like objects with physical mass.
// Heavy items settle slowly with high damping. Quick interactions
// snap with precision. No generic iOS bounce everywhere.
// ============================================================================

export const ANIMATION = {
  instant: 80,     // Sub-perceptual — haptic feedback, immediate response
  fast: 160,       // Quick UI: button state, tab switch
  normal: 280,     // Standard: card entrance, screen transition
  slow: 420,       // Deliberate: overlay appear, sheet present
  ambient: 800,    // Background/atmospheric

  spring: {
    // Heavy elements (large cards, bottom sheets)
    heavy: {
      damping: 35,
      stiffness: 80,
    },
    // Standard UI elements (navigation, cards)
    precise: {
      damping: 28,
      stiffness: 120,
    },
    // Small, quick interactions (toggles, badges)
    snap: {
      damping: 20,
      stiffness: 260,
    },
    // Ambient/background animations
    flow: {
      damping: 45,
      stiffness: 55,
    },

    // Keep legacy aliases for existing code compatibility
    gentle: {
      damping: 35,
      stiffness: 80,
    },
    bouncy: {
      damping: 20,
      stiffness: 260,
    },
    snappy: {
      damping: 28,
      stiffness: 120,
    },
  },

  easing: {
    easeOut: [0.16, 1, 0.3, 1] as const,        // Expo out — snappy deceleration
    easeIn: [0.4, 0, 1, 0.6] as const,          // Ease in — smooth acceleration
    easeInOut: [0.65, 0, 0.35, 1] as const,     // Smooth both ways
    spring: [0.34, 1.56, 0.64, 1] as const,     // Slight overshoot
  },
};

// ============================================================================
// Music Feature Theme (Spotify-adjacent screens)
// ============================================================================

export const SPOTIFY_THEME = {
  background: '#06060C',
  backgroundAlt: '#0C0C18',
  surface: '#121220',
  surfaceAlt: '#18182A',
  border: 'rgba(0, 229, 200, 0.10)',       // Cyan border for music context
  textPrimary: '#F2EEE6',
  textSecondary: '#8C88A0',
  textTertiary: '#504C64',
  primary: '#00E5C8',                       // Resonance cyan for music primary
  accent: '#FF4D00',                        // Forge orange for energy/beats
  accentSoft: 'rgba(0, 229, 200, 0.18)',
  accentStrong: '#33EDD4',
  success: '#00E5C8',
  warning: '#FFB800',
  error: '#FF3B30',
  shadow: '#000000',
  backgroundGradient: ['#06060C', '#0A0A16', '#10101E'] as const,
  cardGradient: ['rgba(0,229,200,0.06)', 'rgba(0,229,200,0.02)'] as const,
};
