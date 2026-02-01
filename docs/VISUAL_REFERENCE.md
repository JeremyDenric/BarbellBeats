# Visual Reference Guide

## Quick Color Reference

### Brand Colors

```
PRIMARY (Electric Blue)
███████ #2196F3

SECONDARY (Neon Purple)
███████ #9C27B0

ACCENT (Vibrant Green)
███████ #4CAF50

WARNING (Neon Orange)
███████ #FF9800
```

### Background Colors

```
BACKGROUND PRIMARY (Deep Space)
███████ #0A0E27

BACKGROUND SECONDARY
███████ #141B3D

SURFACE BASE
███████ #1E2749

SURFACE ELEVATED
███████ #252D54
```

### Rank Colors

```
BRONZE   ███████ #CD7F32
SILVER   ███████ #C0C0C0
GOLD     ███████ #FFD700
PLATINUM ███████ #E5E4E2
DIAMOND  ███████ #B9F2FF
LEGEND   ███████ #FF6B9D
```

---

## Component Mockups (ASCII)

### SongCard Layout

```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ [Energy Color Top Border - 4px]                              ┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃  ┌────┐  ┌────────┐  ┌─────────────────────┐    ┌────────┐ ┃
┃  │ #1 │  │ [IMG]  │  │ SICKO MODE          │    │  +12   │ ┃
┃  └────┘  │ 56x56  │  │ Travis Scott        │    │        │ ┃
┃    🎵    │        │  │ ◉ JohnDoe (Gold)    │    │   ▲    │ ┃
┃          └────────┘  └─────────────────────┘    │   ▼    │ ┃
┃                                                  └────────┘ ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
     Position   Album    Song Info                 Voting
     Badge      Art      (with user)                Section
```

### GymCard Layout

```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ [High Energy Top Border - Orange/Red]                        ┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃                                                               ┃
┃  ┌──────┐  Gold's Gym Venice              📍 2.3            ┃
┃  │  🏋️  │  123 Muscle Beach               km                ┃
┃  │ 48x48│  Venice, CA                                        ┃
┃  └──────┘                                                    ┃
┃                                                               ┃
┃  ┌────────────┐ ┌────────────┐ ┌────────────┐              ┃
┃  │  👥 42     │ │  ⚡ HIGH   │ │  🎵 HipHop │              ┃
┃  │  Active    │ │  Energy    │ │  Genre     │              ┃
┃  └────────────┘ └────────────┘ └────────────┘              ┃
┃                                                               ┃
┃  ┌─────────────────────────────────────────────────┐        ┃
┃  │ 🔴 NOW PLAYING                                  │        ┃
┃  │ SICKO MODE - Travis Scott                       │        ┃
┃  └─────────────────────────────────────────────────┘        ┃
┃                                                               ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
     Gym Icon    Info         Distance   Stats Grid    Now Playing
```

### Now Playing Hero Card

```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃                                                               ┃
┃  🔴 NOW PLAYING                                              ┃
┃                                                               ┃
┃  SICKO MODE                                                  ┃
┃  Travis Scott                                                ┃
┃                                                               ┃
┃  ▲ +24  |  ◉ JohnDoe                                        ┃
┃                                                               ┃
┃  ▂▄▂▆▄  (Equalizer)                                         ┃
┃                                                               ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
  [Gradient Background: Primary Blue]
  [Floating Elevation: 24px]
  [Pulsing Glow Effect]
```

---

## Elevation Visual Guide

```
Floating (24px)
    ┏━━━━━━━━━━━━━━━┓
    ┃ Now Playing   ┃
    ┃ Modal         ┃
    ┗━━━━━━━━━━━━━━━┛
      ▲ Large shadow, highest priority

High (16px)
  ┏━━━━━━━━━━━━━━━┓
  ┃ Gym Cards     ┃
  ┗━━━━━━━━━━━━━━━┛
    ▲ Medium-large shadow, important content

Medium (8px)
┏━━━━━━━━━━━━━━━┓
┃ Song Cards    ┃
┗━━━━━━━━━━━━━━━┛
  ▲ Medium shadow, standard cards

Low (4px)
┏━━━━━━━━━━━━━━━┓
┃ Stat Cells    ┃
┗━━━━━━━━━━━━━━━┛
  ▲ Subtle shadow, nested elements

Ground (0px)
━━━━━━━━━━━━━━━
Background
━━━━━━━━━━━━━━━
  ▲ No shadow, base layer
```

---

## Gradient Examples

### Primary Gradient (Buttons, CTA)
```
#2196F3 ──────────────────► #1976D2
(Light Blue)            (Dark Blue)
```

### Secondary Gradient (Special Actions)
```
#9C27B0 ──────────────────► #7B1FA2
(Light Purple)          (Dark Purple)
```

### Success Gradient (Upvote Active)
```
#4CAF50 ──────────────────► #388E3C
(Light Green)           (Dark Green)
```

### Card Background Gradient (Depth)
```
rgba(255,255,255,0.05) ───► rgba(30,39,73,0.95)
(Subtle White Tint)        (Surface Color)
```

---

## Spacing Grid (8px base)

```
xs   ──┤  4px
sm   ────┤  8px
md   ────────┤  16px
lg   ────────────────┤  24px
xl   ────────────────────────┤  32px
xxl  ────────────────────────────────────────┤  48px
xxxl ────────────────────────────────────────────────────────┤  64px
```

---

## Typography Scale

```
5xl  ████████████████████████  48px  (Hero)
4xl  ████████████████████      36px  (Page Title)
3xl  ██████████████            30px  (Section Header)
2xl  ████████████              24px  (Card Title)
xl   ██████████                20px  (Subheader)
lg   ████████                  18px  (Emphasis)
base ██████                    16px  (Body)
sm   ████                      14px  (Secondary)
xs   ██                        12px  (Caption)
```

---

## Icon Sizes

```
Tiny    ▪  12px  (Inline indicators)
Small   ●  16px  (List items)
Medium  ◉  20px  (Buttons, stats)
Large   ⬤  24px  (Primary actions)
XLarge  ⬤  32px  (Hero icons)
Huge    ⬤  48px  (Empty states)
```

---

## State Colors

### Vote States
```
UPVOTE ACTIVE    ███ #4CAF50 (Green)
DOWNVOTE ACTIVE  ███ #FF9800 (Orange)
NEUTRAL          ███ #8793A8 (Gray)
```

### Energy Levels
```
HIGH    ███ #FF9800 (Orange/Red)
MEDIUM  ███ #4CAF50 (Green)
LOW     ███ #2196F3 (Blue)
```

### Status Indicators
```
PLAYING  🔴 #FF5252 (Red, pulsing)
ONLINE   🟢 #4CAF50 (Green)
OFFLINE  ⚫ #5A6478 (Gray)
```

---

## Animation Timing

```
FAST      ──┤ 150ms  (Quick feedback)
NORMAL    ────┤ 300ms  (Standard transitions)
SLOW      ────────┤ 500ms  (Deliberate motion)
VERY SLOW ──────────┤ 800ms  (Dramatic effects)
```

### Easing Curves

```
Material (Standard)
  ╱───────
 ╱
────       cubic-bezier(0.4, 0, 0.2, 1)

Ease Out (Decelerate)
  ╱──────
 ╱
────       cubic-bezier(0.0, 0, 0.2, 1)

Ease In (Accelerate)
       ╱─
      ╱
────╱      cubic-bezier(0.4, 0, 1, 1)
```

---

## Button States

### Default
```
┏━━━━━━━━━━━━┓
┃   Button   ┃  Elevation: medium
┗━━━━━━━━━━━━┛  Opacity: 100%
   [Gradient]   Shadow: medium
```

### Pressed
```
┏━━━━━━━━━━━━┓
┃   Button   ┃  Scale: 0.95
┗━━━━━━━━━━━━┛  Elevation: low
   [Gradient]   Shadow: small
```

### Disabled
```
┏━━━━━━━━━━━━┓
┃   Button   ┃  Opacity: 50%
┗━━━━━━━━━━━━┛  Elevation: none
   [No Shadow]  No interaction
```

---

## Rank Badge Visual

```
BRONZE                SILVER                GOLD
  ┌─────────┐          ┌─────────┐          ┌─────────┐
  │  ┌───┐  │          │  ┌───┐  │          │  ┌───┐  │
  │  │ ◉ │  │          │  │ ◉ │  │          │  │ ◉ │  │
  │  └───┘  │          │  └───┘  │          │  └───┘  │
  └─────────┘          └─────────┘          └─────────┘
   #CD7F32               #C0C0C0               #FFD700
   1x weight             2x weight             3x weight

PLATINUM              DIAMOND               LEGEND
  ┌─────────┐          ┌─────────┐          ┌─────────┐
  │  ┌───┐  │          │  ┌───┐  │          │  ┌───┐  │
  │  │ ◉ │  │          │  │ ◉ │  │          │  │ ⬢ │  │
  │  └───┘  │          │  └───┘  │          │  └───┘  │
  └─────────┘          └─────────┘          └─────────┘
   #E5E4E2               #B9F2FF               #FF6B9D
   4x weight             5x weight             5x weight
    + Glow                + Glow                + Glow
```

---

## Screen Layout Flow

### HomeScreen Structure
```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ [Fixed Header]                          ┃
┃ BarbellBeats                            ┃
┃ 📍 Nearby Gyms                          ┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃ [Scrollable Content]                    ┃
┃                                          ┃
┃ 3 gyms in your area                     ┃
┃                                          ┃
┃ ┌──────────────────────────────────┐   ┃
┃ │ Gym Card #1                      │   ┃  ← Elevation: high
┃ └──────────────────────────────────┘   ┃
┃  ┌──────────────────────────────────┐  ┃
┃  │ Gym Card #2                      │  ┃  ← Stacked -2px
┃  └──────────────────────────────────┘  ┃
┃   ┌──────────────────────────────────┐ ┃
┃   │ Gym Card #3                      │ ┃  ← Stacked -4px
┃   └──────────────────────────────────┘ ┃
┃                                          ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
```

### GymScreen Structure
```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ [Header]                                 ┃
┃ ← Back   Gold's Gym Venice        [+]   ┃
┃          42 active members               ┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃ [Now Playing - Floating]                 ┃
┃ ┌────────────────────────────────────┐  ┃
┃ │ 🔴 NOW PLAYING                     │  ┃  ← Elevation: floating
┃ │ SICKO MODE                         │  ┃     Scales on scroll
┃ │ Travis Scott                       │  ┃
┃ │ ▲ +24  |  ◉ JohnDoe               │  ┃
┃ │ ▂▄▂▆▄                              │  ┃
┃ └────────────────────────────────────┘  ┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃ QUEUE                          12 songs  ┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃ [Scrollable Song List]                   ┃
┃                                          ┃
┃ ┌──────────────────────────────────┐   ┃
┃ │ Song #2                          │   ┃  ← Elevation: medium
┃ └──────────────────────────────────┘   ┃
┃ ┌──────────────────────────────────┐   ┃
┃ │ Song #3                          │   ┃
┃ └──────────────────────────────────┘   ┃
┃ ┌──────────────────────────────────┐   ┃
┃ │ Song #4                          │   ┃
┃ └──────────────────────────────────┘   ┃
┃                                          ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
```

---

## Isometric Stacking Example

Side view showing depth:
```
Card #1  ┃
Card #2   ┃  ← translateY: -2px
Card #3    ┃  ← translateY: -4px
Card #4     ┃  ← translateY: -6px
Card #5      ┃  ← translateY: -8px
━━━━━━━━━━━━━━  Background
```

Front view showing overlap:
```
┏━━━━━━┓
┃ #1   ┃
┗━━━━━━┛
 ┏━━━━━━┓
 ┃ #2   ┃
 ┗━━━━━━┛
  ┏━━━━━━┓
  ┃ #3   ┃
  ┗━━━━━━┛
```

---

## Touch Target Sizes

Minimum 44x44px for accessibility:

```
✅ GOOD                ❌ BAD
┏━━━━━━━━━┓           ┏━━━┓
┃  Icon   ┃           ┃ I ┃
┃ 44x44px ┃           ┃20 ┃
┗━━━━━━━━━┛           ┗━━━┛
```

---

## Loading States

### Spinner
```
  ⭕
 Loading...
```

### Skeleton (Planned)
```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ ████░░░░░░░░░░░░░░░░░░░░░    ┃  ← Shimmer effect
┃ ██░░░░░░░░░░░░░░░░░░         ┃     Moving →
┃ ████████░░░░░░░░░░           ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
```

---

## Empty States

```
    ┏━━━━━━━━┓
    ┃        ┃
    ┃   🔍  ┃  ← Icon (48px)
    ┃        ┃
    ┗━━━━━━━━┛

  No gyms found

 Try expanding radius

  ┏━━━━━━━━━━┓
  ┃  Refresh  ┃  ← CTA Button
  ┗━━━━━━━━━━┛
```

---

## Quick Component Checklist

When creating a new component, ensure:

- [ ] Uses `theme.*` constants (no hardcoded values)
- [ ] Has appropriate elevation via `getElevationStyle()`
- [ ] Includes gradient background (if card/button)
- [ ] Follows 8px spacing grid
- [ ] Has animations on state changes
- [ ] Meets 44x44px touch targets
- [ ] Uses rank colors via `getRankColor()` where applicable
- [ ] Has loading and empty states
- [ ] Includes TypeScript types
- [ ] Documented with inline comments

---

**Quick Reference Guide**
**Version**: 1.0.0
**Last Updated**: 2025-01-22
