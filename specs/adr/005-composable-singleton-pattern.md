# ADR 005: Composable Singleton Pattern for State

## Status
Accepted

## Context
Vue 3 Composition API composables create new instances by default on each call. For shared state (settings, progress, assessments), all components need to access the same reactive data. Options: Vuex/Pinia store, provide/inject, module-level singletons.

## Decision
Use **module-level reactive state** in composables (singleton pattern).

```javascript
// State defined at module level (shared across all components)
const settings = ref({ ... })
let isInitialized = false

export function useSettings() {
  if (!isInitialized) {
    initializeWatchers()
    isInitialized = true
  }
  return { settings, loadSettings, saveSettings }
}
```

Each composable:
- Declares reactive state at module scope (outside the function)
- Initializes watchers once via a guard flag
- Returns the shared state and functions

## Consequences

**Benefits:**
- No additional dependency (no Pinia/Vuex needed)
- Simple and explicit — state is just Vue refs
- All components share the same reactive instance automatically
- Watchers set up once, persist for app lifetime
- Easy to test in isolation

**Trade-offs:**
- No DevTools integration (unlike Pinia)
- Manual initialization ordering (settings must load before progress)
- State persists across hot-reload in development (can cause stale data)
- No built-in action/mutation pattern (direct state manipulation)

## Composables Using This Pattern
- `useSettings()` — user preferences
- `useProgress()` — learned items
- `useAssessments()` — assessment answers + coach queue
- `useAudio()` — playback state (not persisted)
- `useLessons()` — content cache (`workshopSlugMap` is module-level for cross-composable access)

## Related
- ADR 002: localStorage for persistence (composables handle save/load)
