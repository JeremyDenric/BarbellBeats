# BarbellBeats — Portfolio Reference

This document is for resume writing and technical interview preparation.
For a product overview, see [README.md](./README.md).

---

## Resume Bullets

Pick 4–6 of these depending on the role. Adjust numbers/technologies to match what you most want to highlight.

---

Built a full-stack React Native fitness app across 41 screens and a TypeScript monorepo (React Native 0.81 + Expo SDK 54 frontend, Hono v4 + Prisma + PostgreSQL + Redis backend); implemented offline-first data patterns using TanStack Query v5 with AsyncStorage persistence.

---

Designed 4-layer authentication system: email/password with PBKDF2-equivalent SHA-256 offline fallback using device-signed tokens (10,000-round iterative hash, 16-byte per-user salt, keychain-backed device secret), biometric via `expo-local-authentication` (Face ID/Touch ID), Apple Sign-In, and Google OAuth.

---

Integrated Spotify PKCE OAuth for auto-generated workout playlists — maps session type (push/pull/legs/deload) to Spotify seed genres, target energy (0.5–0.9), and target tempo (90–148 BPM) via the Recommendations API; playlist created and saved to user's Spotify account per session.

---

Built "Forge Mode" adaptive training feature: 6 periodized programs with RPE-based weight auto-progression (holds at RPE ≤9, adds load at RPE ≤5, reduces 5% at RPE 10), automatic deload weeks every 4th cycle at 40% volume, and per-exercise weight tracking persisted to AsyncStorage.

---

Hardened API client with 429/Retry-After rate limit parsing, in-flight request deduplication via `Map<string, Promise<T>>` (prevents duplicate login/register network calls), and client-side lockout countdown synchronized to server-sourced Retry-After values.

---

Secured all credential storage using `expo-secure-store` with a production-build guard that throws at startup if SecureStore is unavailable (no silent AsyncStorage fallback); implemented one-time migration from legacy plaintext storage to SecureStore on upgrade.

---

## Technical Interview Prep

### Why Hono over Express?

Hono has a smaller runtime footprint, first-class TypeScript support without extra setup, and built-in Zod middleware for typed request validation. It runs on Node.js but also targets edge runtimes (Cloudflare Workers, Deno) without changes — useful if the backend ever needs to move to an edge deployment.

### Why Zustand + TanStack Query instead of Redux?

Redux adds a lot of boilerplate for state that doesn't need to be global. The app uses Zustand for ephemeral UI state (which modal is open, current active workout, playback controls) because it's simple and co-located with the feature. TanStack Query handles all server-originated data — it gives cache invalidation, background refetch, retry logic, and offline persistence via AsyncStorage persister for free, without writing reducers or thunks.

### Why a local auth fallback?

The app targets gym environments where connectivity can be poor. Having a real local auth path (not mock) means the dev/demo experience is identical to production behavior — wrong passwords correctly fail, new users must register first. The tradeoff is that user accounts are device-local in offline mode, which is acceptable for a fitness-tracking use case where the device is personal.

### Why expo-secure-store instead of AsyncStorage for tokens?

AsyncStorage is unencrypted plaintext on disk. On a jailbroken device, any app can read it. `expo-secure-store` uses the iOS Keychain and Android Keystore — hardware-backed encryption where available. The production build guard (throws on fallback) enforces this as a hard requirement rather than a best-effort.

### Why a monorepo with shared/ types?

Without shared types, the client's `WorkoutProgram` type and the server's Prisma-generated type can drift. Any time the database schema changes, you'd need to manually update the client types too. The `shared/` package is a single source of truth — both the Hono API response serialization and the React Native components import from the same type definitions.

### How does the Spotify integration work without exposing a client secret?

Spotify's PKCE (Proof Key for Code Exchange) flow was designed exactly for public clients — mobile apps where you can't securely store a secret. The app generates a random code verifier, hashes it to a code challenge, sends the challenge to Spotify's auth endpoint, and later exchanges the authorization code plus the original verifier for tokens. Spotify verifies the hash server-side. No secret is stored on the device.

### What's the ranking algorithm?

Users earn influence points from four components: song quality (40% — avg net score of added songs), voting engagement (30% — total votes cast), community reception (25% — upvotes received on your songs), and special activities (5% — Crowd DJ sessions, achievements). Each rank tier multiplies your vote weight: Bronze 1×, Silver 1.5×, Gold 2×, Platinum 3×, Diamond 4×, Legend 5×. This creates a positive feedback loop where contributing good music gives you more power to shape the playlist.

---

## GitHub Repo Setup (Manual Steps)

These can't be done from code — do them in the GitHub web UI:

**Repository description:**
Full-stack React Native fitness app with Spotify integration, adaptive training programs, and 4-layer authentication. Built with Expo SDK 54, Hono, Prisma, and PostgreSQL.

**Topics to add:**
`react-native` `expo` `typescript` `hono` `postgresql` `spotify-api` `fitness` `react-query` `zustand` `expo-sdk`

**Screenshots:** Add 3–5 screenshots to `assets/screenshots/` and embed them in the README under a "Screenshots" section. Good candidates: Login screen, Home screen with Forge dashboard, Active Workout execution, Music Hub, Forge paywall.
