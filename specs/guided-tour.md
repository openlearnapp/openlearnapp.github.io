# Guided Tour

**Issue: [#208](https://github.com/openlearnapp/openlearnapp.github.io/issues/208)**

## Purpose

New users don't know what the buttons do, how to navigate, or what the platform offers. The guided tour shows each important UI element step by step on first visit — with an animated spotlight on the element and an explanation card next to it.

## Behaviour

### Trigger
- Automatically on first visit per page (persisted via `localStorage` flag per route)
- Repeatable via burger menu → "Tour starten" (resets the flag for the current page)
- URL param `?tour=1` forces the tour on every load (for testing / demo)

### Per-page tours (independent, each with its own localStorage key)
- **workshop-overview** — language button, filter chips, workshop card, burger menu
- **lessons-overview** — progress bar, first lesson, story mode button
- **lesson-detail** — reveal-answer eye, test filter button, learning-item badge, audio button, results/items nav buttons
- **story-view** — left tap (back), right tap (forward), swipe up (pause), swipe down (play), pause/play button, exit button (hold)

### Element spotlight
- An animated glowing ring (`hsl(--primary)`) surrounds the highlighted element
- A soft radial halo pulses behind it (`cloud-breathe` animation)
- A card appears near the element (above or below, keeping it on-screen)
- The card position tracks the element live via `requestAnimationFrame` — follows during scroll

### Directional gesture steps (no DOM element)
- Steps can have `position: 'left' | 'right' | 'top' | 'bottom'` instead of an element
- A coloured gradient zone covers the relevant screen area
- A large pulsing emoji indicates the direction of the gesture
- The card is placed in the corresponding zone (left card = left side, etc.)

### Card
- Gradient header with emoji, progress dots, and counter (e.g. "2/4")
- Title + description body
- "Weiter →" / "🎉 Los geht's!" next button
- "← " previous button (hidden on step 0)
- "Überspringen" skip link

### Backdrop
- Semi-transparent dim (`rgba(0,0,0,0.28)`) + `backdrop-filter: blur(1.5px)`
- Blocks all clicks through the tour so the user cannot navigate away mid-tour

### Persistence
- Each page tour has its own `localStorage` key (e.g. `tour_workshop_overview_done`)
- `onTourDone` (Next on last step) → marks done
- `onTourSkip` → same: marks done, tour won't repeat
- `?tour=1` → never marks done

### i18n
- All tour strings in all 4 interface languages: DE, EN, FA, AR
- Keys under `tour.overview.*`, `tour.lessonsOverview.*`, `tour.lesson.*`, `tour.story.*`

## Implementation

- `src/components/GuidedTour.vue` — overlay component (Teleport to body, z-index 9988–9999)
- `src/composables/useTour.js` — singleton composable with module-level reactive state
- Tour IDs on elements: `#tour-language-btn`, `#tour-filter-chips`, `#tour-workshop-card`, `#tour-burger-btn`, `#tour-progress-bar`, `#tour-first-lesson`, `#tour-story-btn`, `#tour-answer-reveal`, `#tour-filter-test`, `#tour-learning-item`, `#tour-floating-play`, `#tour-nav-results`, `#tour-nav-items`, `#tour-nav-toggle`, `#tour-story-exit`, `#tour-story-pause`
- `buildVisibleSteps` filters steps whose element is not in DOM or not visible → tour adapts gracefully to different device sizes and workshop content
