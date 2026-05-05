# BarbellBeats

**My first mobile app.** Built from scratch to solve a real problem I ran into every day at the gym.

[![React Native](https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactnative.dev)
[![Expo](https://img.shields.io/badge/Expo_SDK_54-000020?style=for-the-badge&logo=expo&logoColor=white)](https://expo.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Hono](https://img.shields.io/badge/Hono-E36002?style=for-the-badge&logo=hono&logoColor=white)](https://hono.dev)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org)
[![Redis](https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white)](https://redis.io)
[![Spotify](https://img.shields.io/badge/Spotify-1ED760?style=for-the-badge&logo=spotify&logoColor=white)](https://developer.spotify.com)

---

## Why I Built This

I lift regularly and kept running into two frustrations nobody had solved together:

1. **Gym music is a shared space with no fair system.** One person controls the aux and everyone else just deals with it.
2. **No fitness app connects your training program to the music you're actually lifting to.** They're treated as completely separate problems.

I decided to build the app I wanted — one where gym members vote democratically on the playlist, and your Spotify playlist auto-generates based on what you're training that day (push days get trap, leg days get EDM, deload weeks get lo-fi).

I started this knowing React basics. I had never touched React Native, TypeScript, mobile auth flows, in-app payments, or OAuth. I used building a real product as the forcing function to learn all of it.

---

## What It Does

BarbellBeats is a full-stack iOS app with five interconnected features:

**Forge Mode — Adaptive Strength Training**
Six periodized programs (5/3/1, PPL, Full Body Recomp, Athletic Performance, Beginner Foundation, Maintenance) with RPE-based weight auto-progression, automatic deload weeks every 4th week, and per-session Spotify playlist generation matched to the training day type.

**Active Workout Execution**
Template → live session flow with real-time set tracking, between-set rest timer with haptic countdown, and PR detection using the Epley 1RM formula compared against full workout history. Session state persists to AsyncStorage so you can kill the app mid-workout and resume.

**Gym Music Hub**
Democratic playlist voting where all gym members vote and songs rise or fall in the queue in real time. Influence rank system (Bronze → Legend) with vote weight multipliers for higher-ranked members. Spotify PKCE OAuth integration — no client secret ever leaves the device.

**Social & Progress**
Friends system with follow requests and PR feed, leaderboard with rank badges, progress charts, workout streak tracking with consecutive-day calculation, and an onboarding quiz that seeds a recommended training program on first launch.

**Subscriptions (Forge Pro)**
Monthly and annual tiers managed through RevenueCat. Server-side receipt validation — Pro state is re-verified on every app foreground via `CustomerInfo` from RevenueCat's SDK, not trusted from a local flag. Pro gates: advanced analytics, unlimited setlists, 2× gym vote weight, PR Hall of Fame feed, Forge Coach push notifications.

---

## Technical Decisions Worth Talking About

These are the decisions I made deliberately and can defend in an interview:

**Offline-first workout data**
Completed workouts go into a local `@bb_workout_queue` in AsyncStorage before any network call. `syncOfflineWorkouts()` drains the queue when a connection is available. This means a user can complete a full workout with no signal and lose nothing. The tradeoff is eventual consistency — the server is always slightly behind the device.

**SubscriptionContext as single source of truth for Pro state**
Previously `isPro` was read from SecureStore independently in every screen, which meant 14+ different places could have stale values. I lifted it into a single `SubscriptionContext` that reads RevenueCat's `CustomerInfo` on mount and on every `AppState` foreground event. One check, propagated everywhere via context.

**Spotify PKCE OAuth with no server involvement**
The Spotify auth flow runs entirely on-device using the PKCE code challenge — the client secret never touches the app. Token refresh is handled client-side. This is the correct approach for a mobile Spotify integration and avoids the security hole of embedding a client secret in the app bundle.

**Cold-start Pro flash prevention**
RevenueCat's `getCustomerInfo()` is async. On cold start there's a window where `isPro` is unknown. I solved this with a SecureStore cache that's read synchronously on mount (optimistic display), then overridden by the RevenueCat result when it resolves. Users never see a paywall flicker.

**Epley 1RM for PR detection**
PR detection runs locally by comparing `weight × (1 + reps / 30)` against all previous sets for the same exercise. No backend call required. This formula is standard in powerlifting and gives a comparable number across different rep ranges (a 225×5 and a 185×10 can be fairly compared).

---

## What I Learned

**TypeScript in a real project is different from TypeScript in tutorials.** I had to design shared types across the monorepo (mobile app, server, API client all share `shared/src/types/`) and think about what changes when a type at the boundary changes everywhere downstream. The navigation param types alone (`RootStackParamList`, `ProfileStackParamList`, etc.) taught me more about TypeScript generics than any course.

**State management is an architecture decision, not a library choice.** I ended up using three different systems for three different purposes: Zustand for ephemeral session state, TanStack Query for server-synced data, and React Context for app-wide config. Picking the right tool for the scope of the data was the actual skill.

**Mobile auth is meaningfully harder than web auth.** Four auth methods (email/password, biometric, Apple, Google), each with their own failure modes, each needing to converge on the same session state. The offline password hashing with PBKDF2-equivalent SHA-256 and per-user salts was the part I'm most proud of — it means the app works completely offline without compromising stored credentials.

**RevenueCat solves the hard parts of IAP but you still have to think carefully.** The SDK handles receipt validation and subscription expiry, but designing the state model — when to check, what to cache, how to handle the `userCancelled` error vs. a real failure — required understanding the subscription lifecycle deeply.

**Shipping something complete teaches you things a tutorial never will.** Every feature I thought was "done" revealed edge cases when I actually used it: workout state that didn't restore on app kill, streak calculations that broke at midnight boundaries, share sheets that silently failed on simulator. Working through those is where the real learning happened.

---

## Tech Stack

| Layer | Technology |
| --- | --- |
| Mobile | React Native 0.81, Expo SDK 54, React 19 |
| Language | TypeScript — strict mode, shared types across monorepo |
| State | Zustand + TanStack Query v5 + 14 React Contexts |
| Navigation | React Navigation v7 (native-stack + bottom-tabs) |
| Animation | React Native Reanimated v4 |
| Payments | RevenueCat (`react-native-purchases`) |
| Backend | Hono v4 on Node.js |
| Database | PostgreSQL via Prisma ORM |
| Cache | Redis |
| Auth — server | JWT (jose), bcrypt, Zod validation |
| Auth — client | expo-local-authentication, expo-apple-authentication, expo-crypto |
| Music | Spotify Web API (PKCE OAuth) |
| Maps | react-native-maps |
| Charts | victory-native |
| Error tracking | Sentry |
| Infra | Docker, docker-compose |

---

## Architecture

```text
barbellbeats/
├── src/                    ← React Native app
│   ├── screens/            ← 41 screens across 5 tab stacks
│   ├── components/         ← 56 components (design system + feature)
│   ├── contexts/           ← 14 React context providers
│   ├── hooks/              ← Custom hooks (useForgeMode, useNetworkStatus, etc.)
│   ├── services/           ← API client, Spotify, gym API, offline queue
│   ├── utils/              ← Haptics, streak calculation, share utilities
│   └── navigation/         ← Tab + stack navigators
├── server/                 ← Hono API (PostgreSQL + Redis)
├── shared/                 ← Types shared across mobile, server, and API client
├── api/                    ← Typed fetch-based API client
└── docs/                   ← Architecture, API reference, security, design system
```

---

## Running Locally

```bash
# Install dependencies
git clone https://github.com/JeremyDenric/BarbellBeats.git
cd BarbellBeats && npm install

# Configure environment
cp .env.example .env.local
# Add your Spotify Client ID, Google credentials, RevenueCat API key

# Start Expo dev server
npx expo start
```

For the backend (PostgreSQL + Redis via Docker):

```bash
cd server && cp ../server.env.example .env
docker-compose up -d
npx prisma migrate dev && npm run dev
```

---

## Documentation

| Doc | Contents |
| --- | --- |
| [Architecture](./docs/ARCHITECTURE.md) | System design, data flow, context dependency graph |
| [API Reference](./docs/API_REFERENCE.md) | All endpoints, request/response shapes, auth headers |
| [Security](./docs/SECURITY.md) | Threat model, storage decisions, auth flow |
| [Design System](./docs/DESIGN_SYSTEM.md) | Color tokens, typography, component patterns |
| [Portfolio](./PORTFOLIO.md) | Resume bullets and architectural decision notes |

---

## License

MIT

---

## Author

Jeremy Denric

This is the first app I've ever shipped. I built it to prove to myself — and to any future employer — that I can take a real idea from zero to a complete, architecturally sound product. Every decision in this codebase is one I can explain and defend.

If you're reading this as part of evaluating me as a candidate, I'd genuinely enjoy talking through any part of it.
