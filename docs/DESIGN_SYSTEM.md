# Eagle's Eye View Design System

## Overview

The BarbellBeats frontend features a **modern eagle's eye view** design aesthetic - a spatial, top-down perspective with depth, elevation, and isometric elements that create an immersive, map-like experience.

---

## Design Philosophy

### Core Principles

1. **Spatial Awareness** - Every element has a position and elevation in 3D space
2. **Depth Through Layers** - Multiple elevation levels create visual hierarchy
3. **Modern Minimalism** - Clean, focused design with purposeful elements
4. **Energetic Color** - Vibrant gradients reflect gym energy and music vibes
5. **Smooth Motion** - Fluid animations enhance the spatial experience

### Visual Metaphor

Think of the app as viewing a gym from above - you see the space, the people, the music flowing through it. Cards float at different heights, elements stack with depth, and everything feels connected in a shared physical space.

---

## Color System

### Primary Palette

**Electric Blue** - Energy, movement, technology
```typescript
primary: {
  500: '#2196F3',  // Main brand color
  400: '#42A5F5',  // Lighter accent
  600: '#1E88E5',  // Deeper shade
}
```

**Neon Purple** - Nightlife, gym vibes, premium
```typescript
secondary: {
  500: '#9C27B0',  // Main secondary
  400: '#AB47BC',  // Lighter
  700: '#7B1FA2',  // Deeper
}
```

**Vibrant Green** - Success, upvotes, positive energy
```typescript
accent: {
  500: '#4CAF50',  // Success green
  400: '#66BB6A',  // Lighter
}
```

**Neon Orange** - Warning, downvotes, alerts
```typescript
warning: {
  500: '#FF9800',  // Warning orange
}
```

### Background System

**Dark Mode Foundation** - Deep space aesthetic
```typescript
background: {
  primary: '#0A0E27',     // Deep space blue
  secondary: '#141B3D',   // Elevated surface
  tertiary: '#1E2749',    // Highest elevation
}
```

### Surface Colors

Cards and containers use elevated surfaces:
```typescript
surface: {
  base: '#1E2749',        // Base card
  elevated: '#252D54',    // Raised card
  highest: '#2D3660',     // Floating card
  glass: 'rgba(30, 39, 73, 0.6)',  // Glass morphism
}
```

### Rank Colors

User ranks have distinct colors:
```typescript
Bronze: '#CD7F32'
Silver: '#C0C0C0'
Gold: '#FFD700'
Platinum: '#E5E4E2'
Diamond: '#B9F2FF'
Legend: '#FF6B9D'
```

---

## Typography

### Font Families

- **Display**: Poppins - Bold headers, hero text
- **Primary**: Inter - Body text, UI elements
- **Mono**: JetBrains Mono - Numbers, stats, code-like elements

### Type Scale

```typescript
sizes: {
  xs: 12,      // Captions, labels
  sm: 14,      // Secondary text
  base: 16,    // Body text
  lg: 18,      // Emphasized text
  xl: 20,      // Small headers
  '2xl': 24,   // Section headers
  '3xl': 30,   // Large headers
  '4xl': 36,   // Hero text
  '5xl': 48,   // Display text
}
```

### Weights

- **Regular** (400): Body text
- **Medium** (500): Emphasized text
- **Semibold** (600): Subheaders
- **Bold** (700): Headers
- **Extrabold** (800): Hero text

---

## Spacing System

Based on **8px grid** for consistency:

```typescript
xs: 4px
sm: 8px
md: 16px
lg: 24px
xl: 32px
xxl: 48px
xxxl: 64px
```

---

## Elevation & Depth

### Elevation Levels

The eagle's eye perspective uses 5 elevation levels:

```typescript
elevation: {
  ground: 0,      // Base layer (background)
  low: 4,         // Slightly raised (stat cells)
  medium: 8,      // Standard cards
  high: 16,       // Important cards (gym cards)
  floating: 24,   // Now playing, modals
}
```

### Shadow System

Shadows create depth perception:

```typescript
shadows: {
  sm: '0 2px 8px rgba(0, 0, 0, 0.12)',    // Subtle
  md: '0 4px 16px rgba(0, 0, 0, 0.16)',   // Standard
  lg: '0 8px 24px rgba(0, 0, 0, 0.20)',   // Elevated
  xl: '0 12px 32px rgba(0, 0, 0, 0.24)',  // High
  xxl: '0 24px 48px rgba(0, 0, 0, 0.32)', // Floating
  glow: '0 0 24px rgba(33, 150, 243, 0.3)', // Glowing effect
}
```

---

## Border Radius

Rounded corners with varying degrees:

```typescript
sm: 8px    // Small elements, icons
md: 12px   // Buttons, inputs
lg: 16px   // Cards
xl: 20px   // Large cards
xxl: 24px  // Hero elements
round: 9999px // Fully rounded (avatars, pills)
```

---

## Gradients

Linear gradients add depth and energy:

### Primary Gradient
```typescript
'linear-gradient(135deg, #2196F3 0%, #1976D2 100%)'
```

### Secondary Gradient
```typescript
'linear-gradient(135deg, #9C27B0 0%, #7B1FA2 100%)'
```

### Success Gradient
```typescript
'linear-gradient(135deg, #4CAF50 0%, #388E3C 100%)'
```

### Depth Gradient (overlays)
```typescript
'linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0) 100%)'
```

---

## Components

### UserAvatar

**Purpose**: Display user profile with rank indicator

**Variants**:
- `xs`: 24px (inline text)
- `sm`: 32px (stats)
- `md`: 48px (cards)
- `lg`: 64px (profiles)
- `xl`: 96px (headers)

**Features**:
- Rank-colored border
- Glowing ring effect for high ranks
- Elevation shadow

### VoteButton

**Purpose**: Upvote/downvote with tactile feedback

**States**:
- Default (inactive)
- Active (voted)
- Disabled

**Animations**:
- Scale on press (0.9x → 1x spring)
- Glow on active state
- Color transition

### SongCard

**Purpose**: Display song in playlist with voting

**Layout**:
```
[Position] [Album Art] [Song Info]           [Votes]
   #1        [Image]    Title                 +12
                        Artist                [↑][↓]
                        Added by User
```

**Features**:
- Gradient top border (energy level)
- Isometric stacking (translateY per index)
- Pulsing animation when playing
- Vote count with color coding
- Rank-colored user avatars

### GymCard

**Purpose**: Display gym in discovery list

**Layout**:
```
[Icon] [Gym Name]              [Distance]
       [Address]               2.3 km

[Active Members] [Energy] [Top Genre]
      42          HIGH      Hip Hop

[NOW PLAYING]
Song Title - Artist
```

**Features**:
- Energy-based color coding
- 3-cell stats grid with icons
- Stacked depth effect (-2px per card)
- Live pulse indicator for now playing

---

## Animations

### Timing

```typescript
animation: {
  fast: 150ms,      // Quick feedback
  normal: 300ms,    // Standard transitions
  slow: 500ms,      // Deliberate motion
  verySlow: 800ms,  // Dramatic effects
}
```

### Easing Curves

- **Material**: `cubic-bezier(0.4, 0, 0.2, 1)` - Standard transitions
- **Ease Out**: `cubic-bezier(0.0, 0, 0.2, 1)` - Decelerate
- **Ease In**: `cubic-bezier(0.4, 0, 1, 1)` - Accelerate

### Common Animations

**Spring** - Natural, bouncy
```typescript
tension: 40
friction: 7
```

**Pulse** - Looping scale
```typescript
1.0 → 1.05 → 1.0 (1000ms)
```

**Fade In** - Opacity
```typescript
0 → 1 (300ms)
```

**Slide In Bottom**
```typescript
translateY: 100 → 0 (300ms)
```

**Button Press**
```typescript
scale: 1 → 0.95 → 1 (spring)
```

---

## Layout Patterns

### Grid System

**Perspective Grid** - Spatial layout
```typescript
grid: {
  cellSize: 80px,    // Base cell
  gap: 16px,         // Between cells
  columns: 4,        // Default columns
  padding: 24px,     // Container padding
}
```

### Isometric Angle

For true isometric perspective:
```typescript
iso: {
  angle: 30°,           // Tilt angle
  scale: 0.866,         // cos(30°)
  skew: 30°,            // Depth skew
}
```

### Stacking

Cards stack with depth:
```typescript
transform: [{
  translateY: index * -2  // Each card slightly higher
}]
```

---

## Screen Layouts

### HomeScreen - Gym Discovery

**Structure**:
1. Header (fixed) - App title, location
2. Scrollable list - Gym cards with stats
3. Empty state - Search icon, message

**Key Features**:
- Animated header opacity on scroll
- Energy-based card borders
- Spatial stats grid per gym
- Live now playing indicators

### GymScreen - Playlist View

**Structure**:
1. Header - Back button, gym name, add song
2. Now Playing - Large hero card (floating elevation)
3. Queue Header - Song count
4. Song List - Stacked cards with voting

**Key Features**:
- Scaling now playing card on scroll
- Equalizer visualization
- Live vote updates (5s polling)
- Isometric card stack

---

## Accessibility

### Color Contrast

All text meets WCAG AA standards:
- Primary text on dark: 15:1 ratio
- Secondary text on dark: 7:1 ratio
- Buttons: 4.5:1 minimum

### Touch Targets

Minimum 44x44px for all interactive elements:
- Buttons: 44px height
- Vote buttons: 44x44px
- Back button: 44x44px

### Visual Feedback

- Pressed state for all buttons
- Loading states with spinners
- Error states with shake animation
- Success states with color change

---

## Responsive Design

### Breakpoints

```typescript
sm: 320px    // Small phones
md: 375px    // iPhone SE/8
lg: 414px    // iPhone Pro Max
xl: 768px    // Tablets
xxl: 1024px  // Large tablets
```

### Adaptive Layout

- Cards adjust width to container
- Stats grid wraps on small screens
- Typography scales on larger screens
- Spacing increases on tablets

---

## Best Practices

### Do's ✅

- Use elevation to show importance
- Apply gradients to create energy
- Animate state changes smoothly
- Maintain 8px spacing grid
- Use rank colors for user identity
- Apply shadows consistently per elevation
- Use mono font for numbers/stats
- Keep animations under 500ms

### Don'ts ❌

- Don't mix elevation levels randomly
- Don't use flat colors without gradients
- Don't skip loading states
- Don't ignore touch target sizes
- Don't use more than 3 animations simultaneously
- Don't forget to handle empty states
- Don't use custom spacing (stick to scale)
- Don't animate without purpose

---

## Component Guidelines

### Cards

**Structure**:
```tsx
<Card elevation="medium">
  <LinearGradient>
    <TopBorder color={energyColor} />
    <Content>
      {children}
    </Content>
  </LinearGradient>
</Card>
```

**Best Practices**:
- Always include gradient background
- Add colored top border for categorization
- Use appropriate elevation level
- Include shadow for depth
- Animate on press

### Buttons

**Structure**:
```tsx
<Button>
  <LinearGradient colors={theme.colors.gradients.primary}>
    <Icon />
    <Text>Label</Text>
  </LinearGradient>
</Button>
```

**States**:
- Default: Full opacity, elevation medium
- Pressed: Scale 0.95, elevation low
- Disabled: 50% opacity, no shadow
- Loading: Spinner, disabled state

### Lists

**Best Practices**:
- Use FlatList for performance
- Add pull-to-refresh
- Show loading skeletons
- Include empty states
- Optimize re-renders with memo
- Add stagger animations on mount

---

## Design Tokens Reference

Complete design tokens are defined in:
```
frontend/src/design/theme.ts
```

Import and use:
```typescript
import { theme, getElevationStyle, getRankColor } from '@/design/theme';
```

Utility functions:
- `getElevationStyle(level)` - Shadow style for elevation
- `getRankColor(rank)` - Color for rank tier
- `getGradient(type)` - Gradient string

---

## Implementation Examples

### Creating a Spatial Card

```tsx
import { theme, getElevationStyle } from '@/design/theme';

<View style={[
  styles.card,
  getElevationStyle('high'),
  {
    transform: [{ translateY: index * -2 }]
  }
]}>
  <LinearGradient
    colors={['rgba(255,255,255,0.05)', theme.colors.surface.base]}
    style={styles.gradient}
  >
    {children}
  </LinearGradient>
</View>
```

### Animated Button Press

```tsx
import { buttonPress } from '@/utils/animations';

const scale = useRef(new Animated.Value(1)).current;

const handlePress = () => {
  buttonPress(scale).start();
  onPress();
};

<Animated.View style={{ transform: [{ scale }] }}>
  <TouchableOpacity onPress={handlePress}>
    ...
  </TouchableOpacity>
</Animated.View>
```

### Rank-Colored Avatar

```tsx
import { getRankColor } from '@/design/theme';

<UserAvatar
  photoUrl={user.photoUrl}
  rank={user.rank}
  size="md"
  showRankBorder
  style={{
    borderColor: getRankColor(user.rank)
  }}
/>
```

---

## Future Enhancements

### Planned Features

1. **True Isometric Mode** - Optional 30° perspective for all cards
2. **Parallax Scrolling** - Different elevation layers scroll at different speeds
3. **3D Transforms** - Rotate cards on tilt (using device gyroscope)
4. **Haptic Feedback** - Tactile response on interactions
5. **Dark/Light Mode Toggle** - Light theme variant
6. **Color Blindness Support** - Alternative color schemes

### Experimental Ideas

- AR view mode (camera with overlay)
- Spatial audio visualization
- Gesture-based navigation
- Dynamic theme based on gym energy
- Collaborative canvas (draw on map)

---

## Resources

### Figma Design Files
*(To be created)*

### Color Palette Tool
Use [Coolors.co](https://coolors.co) for exploring variations

### Icon Library
- Ionicons (already included via @expo/vector-icons)
- Material Design Icons for consistency

### Inspiration
- Apple Music spatial interface
- Google Maps material design
- Spotify's gradient cards
- Discord's modern dark UI

---

**Last Updated**: 2025-01-22
**Design System Version**: 1.0.0
**Maintained By**: BarbellBeats Team
