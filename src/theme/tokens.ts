import { Platform } from 'react-native';

/**
 * Design Tokens - Forge Studio
 * Warm mineral neutrals with copper + sage energy.
 */

export const COLORS = {
  // Light Mode - Warm stone + sage + copper palette
  light: {
    // Primary Colors - Sage
    primary: '#1F7A6E',
    primaryLight: '#2FA89B',
    primaryDark: '#155B52',
    primaryBg: '#E5F3EF',
    primaryMuted: 'rgba(31, 122, 110, 0.6)',

    // Accent Colors - Copper and clay
    accent: '#D9822B',
    accentGreen: '#2E9D75',
    accentPurple: '#B06F5C',
    accentDark: '#8A4E1D',
    accentLight: '#F7E4D1',

    // Glassmorphism Support
    glass: 'rgba(247, 243, 236, 0.78)',
    glassBorder: 'rgba(28, 25, 20, 0.08)',
    glassOverlay: 'rgba(31, 122, 110, 0.08)',

    // Backgrounds - Warm mineral base
    background: '#F7F3EC',
    backgroundAlt: '#EFE7DD',
    surface: '#FFFDFA',
    surfaceElevated: '#FDF7F0',
    surfaceAlt: '#F3ECE2',

    // Text - Charcoal
    textPrimary: '#1C1914',
    textSecondary: '#5F564B',
    textTertiary: '#877C6C',
    textDisabled: '#A29A90',

    // Borders - Soft stone
    border: '#E4DDD2',
    borderLight: '#EFE7DD',
    borderStrong: '#D1C5B4',
    divider: '#EAE2D7',

    // Status colors
    success: '#2E9D75',
    warning: '#E0A22E',
    error: '#D95F5F',
    info: '#1F7A6E',
  },

  // Dark Mode - Charcoal + teal + copper palette
  dark: {
    // Primary Colors - Teal glow
    primary: '#4FD1C5',
    primaryLight: '#74E0D4',
    primaryDark: '#2A9D8F',
    primaryBg: '#10201D',
    primaryMuted: 'rgba(79, 209, 197, 0.6)',

    // Accent Colors - Copper and clay
    accent: '#F4A259',
    accentGreen: '#7CE0B5',
    accentPurple: '#C77D66',
    accentDark: '#A25B34',
    accentLight: '#2D231B',

    // Glassmorphism Support
    glass: 'rgba(13, 11, 9, 0.82)',
    glassBorder: 'rgba(255, 255, 255, 0.08)',
    glassOverlay: 'rgba(244, 162, 89, 0.1)',

    // Backgrounds - Deep mineral base
    background: '#0E0C0A',
    backgroundAlt: '#151311',
    surface: '#1B1815',
    surfaceElevated: '#211E1A',
    surfaceAlt: '#27231F',

    // Text - Warm off-white
    textPrimary: '#F5F0E8',
    textSecondary: '#C9BDAD',
    textTertiary: '#9C8F7F',
    textDisabled: '#6E655A',

    // Borders - Charcoal strokes
    border: '#2B2621',
    borderLight: '#221E19',
    borderStrong: '#3A332C',
    divider: '#191512',

    // Status colors
    success: '#4FD1A3',
    warning: '#F4A259',
    error: '#E26B6B',
    info: '#4FD1C5',
  },

  // Overlays
  overlay: 'rgba(0, 0, 0, 0.5)',
  overlayLight: 'rgba(0, 0, 0, 0.3)',
};

/**
 * iOS System Colors - iOS 17/18 Native Design
 * These match Apple's Human Interface Guidelines for semantic color usage
 * Use these for screens being migrated to iOS-native design patterns
 */
export const IOS_COLORS = {
  light: {
    // System Backgrounds
    systemBackground: '#F7F3EC',
    secondarySystemBackground: '#EFE7DD',
    tertiarySystemBackground: '#FFFDFA',
    systemGroupedBackground: '#F7F3EC',
    secondarySystemGroupedBackground: '#F3ECE2',
    tertiarySystemGroupedBackground: '#FDF7F0',

    // Labels (Text)
    label: '#1C1914',
    secondaryLabel: 'rgba(95, 86, 75, 0.75)',
    tertiaryLabel: 'rgba(135, 124, 108, 0.55)',
    quaternaryLabel: 'rgba(135, 124, 108, 0.32)',
    placeholderText: 'rgba(135, 124, 108, 0.45)',

    // Separators
    separator: 'rgba(95, 86, 75, 0.22)',
    opaqueSeparator: '#D1C5B4',

    // Fills (for UI elements)
    systemFill: 'rgba(31, 25, 20, 0.06)',
    secondarySystemFill: 'rgba(31, 25, 20, 0.1)',
    tertiarySystemFill: 'rgba(31, 25, 20, 0.04)',
    quaternarySystemFill: 'rgba(31, 25, 20, 0.03)',

    // Tint Colors (preserve app branding)
    tint: '#1F7A6E',

    // iOS System Grays
    systemGray: '#877C6C',
    systemGray2: '#6F655A',
    systemGray3: '#5A5148',
    systemGray4: '#4A433B',
    systemGray5: '#342F29',
    systemGray6: '#241F1A',
  },

  dark: {
    // System Backgrounds
    systemBackground: '#0E0C0A',
    secondarySystemBackground: '#151311',
    tertiarySystemBackground: '#1B1815',
    systemGroupedBackground: '#0E0C0A',
    secondarySystemGroupedBackground: '#211E1A',
    tertiarySystemGroupedBackground: '#27231F',

    // Labels (Text)
    label: '#F5F0E8',
    secondaryLabel: 'rgba(201, 189, 173, 0.75)',
    tertiaryLabel: 'rgba(156, 143, 127, 0.55)',
    quaternaryLabel: 'rgba(156, 143, 127, 0.32)',
    placeholderText: 'rgba(156, 143, 127, 0.45)',

    // Separators
    separator: 'rgba(201, 189, 173, 0.18)',
    opaqueSeparator: '#3A332C',

    // Fills (for UI elements)
    systemFill: 'rgba(255, 255, 255, 0.08)',
    secondarySystemFill: 'rgba(255, 255, 255, 0.12)',
    tertiarySystemFill: 'rgba(255, 255, 255, 0.05)',
    quaternarySystemFill: 'rgba(255, 255, 255, 0.04)',

    // Tint Colors (preserve app branding, brighter for dark mode)
    tint: '#4FD1C5',

    // iOS System Grays
    systemGray: '#9C8F7F',
    systemGray2: '#6E655A',
    systemGray3: '#5A5148',
    systemGray4: '#4A433B',
    systemGray5: '#342F29',
    systemGray6: '#241F1A',
  },
};

// Gradient definitions (minimal usage - only for key accents)
export const GRADIENTS = {
  primary: ['#4FD1C5', '#1F7A6E'],
  accent: ['#F4A259', '#F7E4D1'],
  success: ['#4FD1A3', '#2E9D75'],
  glass: ['rgba(255,255,255,0.08)', 'rgba(31,122,110,0.08)'],
};

export const FONTS = {
  display: Platform.select({
    ios: 'Avenir Next Condensed',
    android: 'sans-serif-condensed',
    default: 'sans-serif',
  }),
  body: Platform.select({
    ios: 'Avenir Next',
    android: 'sans-serif-light',
    default: 'sans-serif',
  }),
  emphasis: Platform.select({
    ios: 'Avenir Next',
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
  // Font Sizes - Apple Music scale
  sizes: {
    xs: 11,      // Caption 2
    sm: 13,      // Caption 1
    base: 15,    // Body (Apple Music uses 15)
    lg: 17,      // Callout
    xl: 20,      // Title 3
    '2xl': 22,   // Title 2
    '3xl': 28,   // Title 1
    '4xl': 34,   // Large Title
    '5xl': 40,   // Display
  },

  // Line Heights - Apple Music style (tighter)
  lineHeights: {
    tight: 1.2,    // Headlines
    snug: 1.3,     // Titles
    normal: 1.4,   // Body (Apple uses tighter than 1.5)
    relaxed: 1.6,  // Comfortable reading
  },

  // Font Weights - Including heavy weights for bold headlines
  weights: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    heavy: '800' as const,    // NEW - Apple Music bold
    black: '900' as const,    // NEW - Extra bold
  },

  // Letter Spacing - Tight for Apple aesthetic
  letterSpacing: {
    tight: -0.4,   // Apple uses tight spacing for headlines
    normal: 0,
    wide: 0.3,     // Reduced from 0.5
  },

  // Typography Presets - Apple Music style
  presets: {
    displayLarge: {
      fontFamily: FONTS.display,
      fontSize: 40,
      fontWeight: '900' as const,
      lineHeight: 48,
      letterSpacing: -0.4,
    },
    heading1: {
      fontFamily: FONTS.display,
      fontSize: 34,
      fontWeight: '700' as const,
      lineHeight: 41,
      letterSpacing: -0.4,
    },
    heading2: {
      fontFamily: FONTS.display,
      fontSize: 28,
      fontWeight: '700' as const,
      lineHeight: 34,
      letterSpacing: -0.3,
    },
    heading3: {
      fontFamily: FONTS.emphasis,
      fontSize: 22,
      fontWeight: '600' as const,
      lineHeight: 28,
      letterSpacing: -0.2,
    },
    body: {
      fontFamily: FONTS.body,
      fontSize: 15,
      fontWeight: '400' as const,
      lineHeight: 21,
      letterSpacing: 0,
    },
    bodyBold: {
      fontFamily: FONTS.emphasis,
      fontSize: 15,
      fontWeight: '600' as const,
      lineHeight: 21,
      letterSpacing: 0,
    },
    caption: {
      fontFamily: FONTS.body,
      fontSize: 13,
      fontWeight: '400' as const,
      lineHeight: 18,
      letterSpacing: 0,
    },
    caption2: {
      fontFamily: FONTS.body,
      fontSize: 11,
      fontWeight: '400' as const,
      lineHeight: 13,
      letterSpacing: 0.1,
    },
  },
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,      // NEW - base spacing
  lg: 20,
  xl: 24,        // Apple Music uses generous 24px
  '2xl': 32,     // Section spacing
  '3xl': 40,
  '4xl': 48,
  '5xl': 64,
};

// Layout constants for Apple Music style
export const LAYOUT = {
  screenPadding: 18,        // Horizontal screen padding
  sectionSpacing: 32,       // Space between sections
  cardPadding: 14,          // Inside cards
  cardSpacing: 10,          // Between cards
  headerHeight: 52,         // Navigation header
  tabBarHeight: 49,         // Tab bar (iOS standard)
};

export const RADIUS = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 18,
  xl: 22,
  '2xl': 28,
  full: 9999,
};

// iOS-style subtle shadows (Apple Music aesthetic)
export const SHADOWS = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  xs: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,     // Very subtle
    shadowRadius: 1,
    elevation: 1,
  },
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,      // Still subtle
    shadowRadius: 8,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 4,
  },
  // For glassmorphism cards
  glass: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
};

// Accessibility - Minimum touch target size
export const TOUCH_TARGET = {
  min: 48,
  comfortable: 52,
  large: 60,
};

// Animation durations and spring physics (Apple Music style)
export const ANIMATION = {
  // Durations
  fast: 150,
  normal: 250,
  slow: 350,

  // Spring physics (Apple Music style)
  spring: {
    gentle: {
      damping: 20,
      stiffness: 100,
    },
    bouncy: {
      damping: 15,
      stiffness: 150,
    },
    snappy: {
      damping: 25,
      stiffness: 200,
    },
  },

  // Easing for non-spring animations
  easing: {
    easeOut: [0.25, 0.1, 0.25, 1],
    easeIn: [0.42, 0, 1, 1],
    easeInOut: [0.42, 0, 0.58, 1],
  },
};

// Spotify-style palette with salmon accent for music features
export const SPOTIFY_THEME = {
  background: '#0C0C0D',
  backgroundAlt: '#121213',
  surface: '#151517',
  surfaceAlt: '#1E1F22',
  border: 'rgba(255, 255, 255, 0.08)',
  textPrimary: '#F7F3F0',
  textSecondary: '#C9C2BA',
  textTertiary: '#9E978F',
  primary: '#FA8072',
  accent: '#FA8072',
  accentSoft: 'rgba(250, 128, 114, 0.2)',
  accentStrong: '#FF8F7A',
  success: '#FA8072',
  warning: '#F4A261',
  error: '#F87171',
  shadow: '#000000',
  backgroundGradient: ['#0C0C0D', '#151216', '#201318'] as const,
  cardGradient: ['rgba(255,255,255,0.06)', 'rgba(255,255,255,0.02)'] as const,
};
