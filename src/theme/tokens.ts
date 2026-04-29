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
 * Backgrounds use true neutral zinc greys — no hue in the dark stack.
 * Brand colors carry all the personality; neutrals disappear.
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
   * Light Mode — iOS system colors + forge orange
   * Conventional, legible, familiar — lets brand colors pop.
   */
  light: {
    // Primary — Dark forge orange (WCAG AA accessible on white)
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

    // Glass — Clean white glass
    glass: 'rgba(255, 255, 255, 0.90)',
    glassBorder: 'rgba(204, 61, 0, 0.10)',
    glassOverlay: 'rgba(204, 61, 0, 0.04)',

    // Backgrounds — iOS system palette
    background: '#F2F2F7',
    backgroundAlt: '#E5E5EA',
    surface: '#FFFFFF',
    surfaceElevated: '#F8F8FA',
    surfaceAlt: '#EFEFF4',

    // Text — iOS system labels
    textPrimary: '#000000',
    textSecondary: '#3C3C43',
    textTertiary: '#636366',
    textDisabled: '#AEAEB2',

    // Borders — iOS system separators
    border: '#D1D1D6',
    borderLight: '#E5E5EA',
    borderStrong: '#C7C7CC',
    divider: '#E0E0E5',

    // Status
    success: '#009688',
    warning: '#E67E00',
    error: '#D93B2B',
    info: '#CC3D00',
  },

  /**
   * Dark Mode — Carbon black + forge orange
   * Think: carbon fiber, precision electronics, Garmin Fenix display.
   * True neutral zinc greys — no hue — brand colors carry all personality.
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

    // Glass — Carbon glass (no hue)
    glass: 'rgba(10, 10, 10, 0.94)',
    glassBorder: 'rgba(255, 77, 0, 0.12)',
    glassOverlay: 'rgba(255, 77, 0, 0.04)',

    // Backgrounds — True neutral zinc, no purple
    background: '#0A0A0A',     // deepest carbon
    backgroundAlt: '#111113',  // slight elevation
    surface: '#1A1A1D',        // card surfaces
    surfaceElevated: '#222226', // elevated cards
    surfaceAlt: '#2A2A2E',     // tertiary surfaces

    // Text — Apple white system palette
    textPrimary: '#F5F5F7',
    textSecondary: '#A0A0A8',
    textTertiary: '#636368',
    textDisabled: '#3A3A3C',

    // Borders — Neutral zinc
    border: '#2C2C2E',
    borderLight: '#1C1C1E',
    borderStrong: '#3A3A3C',
    divider: '#111112',

    // Status
    success: '#00E5C8',
    warning: '#FFB800',
    error: '#FF3B30',
    info: '#FF4D00',
  },

  // Overlays
  overlay: 'rgba(0, 0, 0, 0.65)',
  overlayLight: 'rgba(0, 0, 0, 0.40)',
};

// ============================================================================
// iOS System Colors — Mapped to Carbon Resonance palette
// ============================================================================

export const IOS_COLORS = {
  light: {
    systemBackground: '#F2F2F7',
    secondarySystemBackground: '#E5E5EA',
    tertiarySystemBackground: '#FFFFFF',
    systemGroupedBackground: '#F2F2F7',
    secondarySystemGroupedBackground: '#EFEFF4',
    tertiarySystemGroupedBackground: '#F8F8FA',

    label: '#000000',
    secondaryLabel: 'rgba(60, 60, 67, 0.75)',
    tertiaryLabel: 'rgba(60, 60, 67, 0.45)',
    quaternaryLabel: 'rgba(60, 60, 67, 0.28)',
    placeholderText: 'rgba(60, 60, 67, 0.50)',

    separator: 'rgba(60, 60, 67, 0.18)',
    opaqueSeparator: '#C8C8CA',

    systemFill: 'rgba(0, 0, 0, 0.05)',
    secondarySystemFill: 'rgba(0, 0, 0, 0.08)',
    tertiarySystemFill: 'rgba(0, 0, 0, 0.04)',
    quaternarySystemFill: 'rgba(0, 0, 0, 0.03)',

    tint: '#CC3D00',

    systemGray: '#8E8E93',
    systemGray2: '#AEAEB2',
    systemGray3: '#C7C7CC',
    systemGray4: '#D1D1D6',
    systemGray5: '#E5E5EA',
    systemGray6: '#F2F2F7',
  },

  dark: {
    systemBackground: '#0A0A0A',
    secondarySystemBackground: '#111113',
    tertiarySystemBackground: '#1A1A1D',
    systemGroupedBackground: '#0A0A0A',
    secondarySystemGroupedBackground: '#222226',
    tertiarySystemGroupedBackground: '#2A2A2E',

    label: '#F5F5F7',
    secondaryLabel: 'rgba(160, 160, 168, 0.75)',
    tertiaryLabel: 'rgba(99, 99, 104, 0.55)',
    quaternaryLabel: 'rgba(99, 99, 104, 0.32)',
    placeholderText: 'rgba(99, 99, 104, 0.50)',

    separator: 'rgba(160, 160, 168, 0.16)',
    opaqueSeparator: '#3A3A3C',

    systemFill: 'rgba(255, 255, 255, 0.07)',
    secondarySystemFill: 'rgba(255, 255, 255, 0.11)',
    tertiarySystemFill: 'rgba(255, 255, 255, 0.05)',
    quaternarySystemFill: 'rgba(255, 255, 255, 0.03)',

    tint: '#FF4D00',

    systemGray: '#A0A0A8',
    systemGray2: '#7C7C80',
    systemGray3: '#636368',
    systemGray4: '#4A4A4E',
    systemGray5: '#333336',
    systemGray6: '#1C1C1E',
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
  darkBase: ['#0A0A0A', '#111113', '#1A1A1D'] as const,
  darkWarm: ['#0D0A08', '#12100E', '#1A1614'] as const,

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
  background: '#0A0A0A',
  backgroundAlt: '#111113',
  surface: '#1A1A1D',
  surfaceAlt: '#222226',
  border: 'rgba(0, 229, 200, 0.10)',       // Cyan border for music context
  textPrimary: '#F5F5F7',
  textSecondary: '#A0A0A8',
  textTertiary: '#636368',
  primary: '#00E5C8',                       // Resonance cyan for music primary
  accent: '#FF4D00',                        // Forge orange for energy/beats
  accentSoft: 'rgba(0, 229, 200, 0.18)',
  accentStrong: '#33EDD4',
  success: '#00E5C8',
  warning: '#FFB800',
  error: '#FF3B30',
  shadow: '#000000',
  backgroundGradient: ['#0A0A0A', '#0F0F12', '#171719'] as const,
  cardGradient: ['rgba(0,229,200,0.06)', 'rgba(0,229,200,0.02)'] as const,
};
