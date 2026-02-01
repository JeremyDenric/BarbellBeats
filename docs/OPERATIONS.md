# Operations Runbook

## Startup Diagnostics
- Check the React Query hydration logs in development for cache timing.
- Look for bootstrap breadcrumbs in Sentry in production (`bootstrap` category).
- Confirm migrations completed (see `migrations_completed` analytics event).

## Offline Queue
- When offline, actions are queued in `@gym_offline_queue`.
- Queue size is surfaced in the offline banner when available.
- Sync runs automatically when the app reconnects.
- If sync fails, check Sentry breadcrumbs tagged `offline_queue`.

## Storage Recovery
- `safeStorage` resets corrupted JSON keys to defaults.
- Preferences recover from `@app_preferences_last_known` if the primary key fails.
- If corruption persists, clear storage selectively via `safeStorage.remove(key)`.

## Migrations
- Migrations are transactional with temp keys under `@migration_tmp:*`.
- If migration fails, inspect Sentry message `Data migrations failed` and logs.
- To re-run migrations in dev: use `resetVersion()` and relaunch.

## Backup / Restore
- Auto-backups run every 24 hours (if enabled).
- Export data with `exportData()` or `exportAndShare()`.
- Imports validate via `ExportDataSchema` and reject unsupported versions.

## Feature Flags
- Use `EXPO_PUBLIC_ENABLE_MIGRATIONS` to toggle migrations.
- Use `EXPO_PUBLIC_ENABLE_NOTIFICATIONS` for push setup.
- Use `EXPO_PUBLIC_ENABLE_AUTO_BACKUP` for auto-backups.
- Use `EXPO_PUBLIC_ENABLE_OFFLINE_SYNC` for offline queue syncing.
- Use `EXPO_PUBLIC_ENABLE_TELEMETRY` for breadcrumbs/tags.
