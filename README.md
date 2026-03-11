# BarbellBeats

> Full-stack React Native fitness app — adaptive training programs, democratic gym music voting, and Spotify-generated session playlists.

[![React Native](https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactnative.dev)
[![Expo](https://img.shields.io/badge/Expo_SDK_54-000020?style=for-the-badge&logo=expo&logoColor=white)](https://expo.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Hono](https://img.shields.io/badge/Hono-E36002?style=for-the-badge&logo=hono&logoColor=white)](https://hono.dev)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org)
[![Redis](https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white)](https://redis.io)
[![Spotify](https://img.shields.io/badge/Spotify-1ED760?style=for-the-badge&logo=spotify&logoColor=white)](https://developer.spotify.com)

[Architecture](./docs/ARCHITECTURE.md) | [API Reference](./docs/API_REFERENCE.md) | [Security](./docs/SECURITY.md) | [Portfolio](./PORTFOLIO.md)

---

## Overview

BarbellBeats unifies two things no other fitness app combines: **periodized training programs** and **Spotify music curation** in one coherent product. Users follow adaptive workout plans that auto-adjust weights based on RPE feedback, with Spotify playlists automatically generated to match each session's intensity — push day gets trap, leg day gets EDM, deload week gets lo-fi.

On top of that, gyms become social spaces where members vote on the playlist democratically, earning influence ranks (Bronze → Legend) based on their contribution to the community sound.

---

## Features

### Forge Mode (Adaptive Training)

- 6 periodized programs: 5/3/1 Strength, PPL Hypertrophy, Full Body Recomp, Athletic Performance, Beginner Foundation, Maintenance
- RPE-based weight auto-progression after each session (RPE ≤5 adds load, RPE 10 reduces by 5%)
- Automatic deload weeks every 4th week with 40% volume reduction
- Spotify playlist auto-generated per session type: push/pull/legs/upper/full_body/deload each mapped to seed genres, target energy, and BPM range

### Active Workout Execution

- Template → active workout flow with real-time set tracking
- Between-set rest timer with haptic alerts at 3-2-1-0 seconds
- Weight/reps/RIR input with pre-fill from previous sets
- PR detection using Epley 1RM formula against workout history
- Workout state persisted to AsyncStorage — resume after app kill

### Music Hub

- Spotify PKCE OAuth integration (no client secret exposed)
- Democratic gym playlist voting: all members vote, songs rise/fall in real time
- Influence rank system (Bronze/Silver/Gold/Platinum/Diamond/Legend) with weighted vote multipliers
- Crowd DJ sessions for Platinum+ members
- Playlist management, queue browsing, now-playing card

### Cardio Log

- Notebook-style entries: type, title, date, duration, distance, notes
- Photo attachments via `expo-image-picker` — stored locally in app documents directory
- Entry history with filtering and detail view

### Authentication (4 layers)

- Email/password with unified form validation (uppercase + lowercase + number required)
- Biometric login via `expo-local-authentication` (Face ID / Touch ID)
- Apple Sign-In via `expo-apple-authentication`
- Google OAuth via `@react-native-google-signin/google-signin`
- Offline fallback: PBKDF2-equivalent SHA-256 password hashing (10,000 rounds, per-user salt) stored on-device

### Security

- All tokens and PII stored in `expo-secure-store` (refuses AsyncStorage fallback in production)
- Device-signed JWT-like tokens using a keychain-backed device secret
- 429/Retry-After rate limit handling with client-side lockout countdown
- In-flight request deduplication (prevents duplicate login/register calls)
- HTTPS enforcement at startup for production builds

### Maps & Discovery

- Gym discovery with live location via `react-native-maps`
- Favorite gyms with optimistic updates and AsyncStorage persistence
- Map preview cards with interactive pin selection

### Social & Progress

- Friends system with follow requests and activity feed
- Leaderboard with rank badges
- Progress tracking with victory-native charts
- Onboarding quiz (goal + music genre + experience level) with personalized home screen

---

## Tech Stack

| Layer | Technology |
| --- | --- |
| Mobile | React Native 0.81, Expo SDK 54, React 19 |
| Language | TypeScript (strict mode, monorepo-wide shared types) |
| State | Zustand, TanStack Query v5 with AsyncStorage persistence |
| Navigation | React Navigation v7 (native-stack + bottom-tabs) |
| Animation | React Native Reanimated v4, staggered list entries, confetti overlay |
| Backend | Hono v4 on Node.js |
| Database | PostgreSQL via Prisma ORM |
| Cache | Redis |
| Auth (server) | JWT via jose, bcrypt password hashing, Zod request validation |
| Auth (client) | expo-local-authentication, expo-apple-authentication, expo-crypto |
| Music | Spotify Web API (PKCE OAuth, no server secret) |
| Maps | react-native-maps |
| Charts | victory-native |
| Infra | Docker, docker-compose |
| Monitoring | Sentry |

---

## Architecture

```text
barbellbeats/               ← TypeScript monorepo
├── src/                    ← React Native app
│   ├── screens/            ← 41 screens (Auth, Training, Cardio, Music, Maps, Social)
│   ├── components/         ← 56 components (design system + feature-specific)
│   ├── contexts/           ← 14 React context providers
│   ├── hooks/              ← 11 custom hooks
│   ├── services/           ← API client, Spotify, auth services
│   └── navigation/         ← Tab navigator + stack navigators
├── server/                 ← Hono API
│   ├── src/                ← Route handlers, middleware, Prisma client
│   └── prisma/             ← Schema, migrations
├── shared/                 ← Shared TypeScript types (WorkoutProgram, User, etc.)
├── api/                    ← Typed fetch-based API client (used by the mobile app)
└── docs/                   ← Architecture, API reference, security docs
```

State management strategy:

- `Zustand` — ephemeral UI state (modals, active workout, playback)
- `TanStack Query v5` — server-sourced data with offline persistence via AsyncStorage persister
- `React Context` — auth session, preferences, theme, exercise library

---

## Getting Started

### Prerequisites

- Node.js 20+
- Expo CLI: `npm install -g expo-cli`
- Docker (for backend)
- Spotify Developer account (for music features)

### Frontend Setup

```bash
# Clone and install
git clone https://github.com/JeremyDenric/BarbellBeats.git
cd BarbellBeats
npm install

# Configure environment
cp .env.example .env.local
# Edit .env.local with your Spotify and Google credentials

# Start Expo dev server
npx expo start
```

### Backend Setup

```bash
cd server

# Copy environment config
cp ../server.env.example .env
# Edit .env with your database credentials and JWT secrets

# Start PostgreSQL + Redis
docker-compose up -d

# Run migrations and start dev server
npx prisma migrate dev
npm run dev
```

### Generating Secrets

```bash
# Generate JWT secrets for your .env
bash scripts/generate-secrets.sh
```

---

## Security Highlights

| Concern | Approach |
| --- | --- |
| Token storage | `expo-secure-store` (keychain on iOS, Keystore on Android) |
| Production fallback | Build throws if SecureStore unavailable — no plaintext fallback |
| Offline passwords | PBKDF2-equivalent SHA-256, 10,000 rounds, per-user 16-byte salt |
| Token signing | Device secret in SecureStore, SHA-256 signed JWT-like tokens |
| Rate limiting | 429/Retry-After parsed from server; client-side lockout countdown |
| Request dedup | `Map<string, Promise<T>>` in-flight deduplication on login/register |
| API keys | `requireEnv()` guard — warns in dev, throws in production if unset |
| HTTPS | Enforced at API client startup for production builds |

---

## Documentation

| Doc | Contents |
| --- | --- |
| [Architecture](./docs/ARCHITECTURE.md) | System design, data flow, context dependency graph |
| [API Reference](./docs/API_REFERENCE.md) | All endpoints, request/response shapes, auth headers |
| [Security](./docs/SECURITY.md) | Threat model, storage decisions, auth flow |
| [Design System](./docs/DESIGN_SYSTEM.md) | Color tokens, typography, component patterns |
| [Getting Started](./docs/GETTING_STARTED.md) | Detailed setup guide |
| [Portfolio](./PORTFOLIO.md) | Resume bullets and architectural decision notes |

---

## License

MIT — see [LICENSE](./LICENSE)

---

## Author

Jeremy Denric

Built to demonstrate production-quality full-stack mobile architecture: real auth, real security, real feature depth.

If this project is interesting to you, consider starring the repo.
