# ADR 002: localStorage for Persistence

## Status
Accepted

## Context
User data (settings, progress, assessment answers) needs to persist between sessions. Without a backend, the options are: localStorage, IndexedDB, cookies, or no persistence at all.

## Decision
Use **localStorage** for all user data persistence.

Four keys are used:
- `settings` — user preferences (dark mode, audio speed, etc.)
- `progress` — learned items per workshop
- `assessments` — assessment answers per lesson
- `contentSources` — external workshop URLs

Plus two convenience keys:
- `lastLearningLanguage` — restore previous selection
- `lastTeachingWorkshop` — restore previous selection

## Consequences

**Benefits:**
- Simple API (`getItem`/`setItem` with JSON)
- Synchronous reads (no async complexity for initial load)
- Supported in all browsers
- Data survives page reloads and browser restarts

**Trade-offs:**
- ~5MB limit per origin (sufficient for text data, not for large datasets)
- No cross-tab synchronization (last write wins)
- Cleared when user clears browser data
- No encryption (data visible in DevTools)

**Mitigations:**
- Export/Import feature allows manual backup (Settings page)
- Future: GunDB/SEA for encrypted distributed sync (Issue #27)

## Related
- ADR 001: Frontend-only architecture
- ADR 005: Composable singleton pattern (manages localStorage access)
