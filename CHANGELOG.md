# Changelog

## 2026-04-13

### Fixes

#### Story Mode: Links/Rechts-Tippen springt zum nächsten Absatz (#254)

Tippen links oder rechts (egal wo auf dem Bildschirm) springt jetzt zum nächsten bzw. vorherigen Absatz innerhalb der aktuellen Section — ohne die Section zu wechseln. Audio spielt sofort den neuen Absatz ab. Die Section wechselt erst automatisch nach dem letzten Absatz.

## 2026-04-12

### Fixes

#### Resume von Example-Klick spielt jetzt die ganze Lektion weiter

Play → Pause → Klick auf ein Example → Play: spielte vorher nur das eine Example ab und stoppte. Jetzt setzt die Wiedergabe ab dem geklickten Example fort und läuft die restliche Lektion durch.

**Ursache:** `jumpToExample` rief bei Pause `playSingleItem` auf, was den `onended`-Handler des Blessed Players mit einem No-Op überschrieb und `planIdx` nicht repositionierte. Beim Resume versuchte `play()` den Blessed Player fortzusetzen, dessen Audio aber bereits beendet war.

**Fix:** Neuer Paused-Branch in `jumpToExample` — repositioniert `planIdx` im Playback-Plan und setzt ein `_planRepositioned`-Flag. `play()` erkennt das Flag und startet `advancePlan()` statt den stale Blessed Player zu resumen.

### Cleanup

#### Always-Continuous Cleanup (Follow-up zu #250)

- Entfernt `toggleContinuousPlay` aus `useLessonAudioSync.js` (dead code seit Play immer continuous ist)
- Entfernt `continuousPlayActive` i18n-Strings (DE, EN, AR, FA) — referenzierten Double-Click der nicht mehr existiert
- Entfernt veraltete Double-Click-Kommentare aus `App.vue` und `useAudio.js`
- 2 Tests entfernt die `toggleContinuousPlay` testeten

#### Workshops und Lektionen springen nicht mehr beim Favorisieren oder Abhaken (#248)
- Workshop-Liste behält die ursprüngliche Reihenfolge aus der Quelle
- Lektionen bleiben an ihrer Stelle wenn sie als erledigt markiert oder favorisiert werden
- Kein automatisches Umsortieren nach aktiv/favorit/erledigt mehr

## 2026-04-11

### Fixes

#### Autoplay continuity across lessons — #240

Large architectural fix for "play lesson 1 via double click, lesson finishes, opens lesson 2, but after playing lesson 2 title the audio stops" (and the related "hard reload + click play = audio stops after lesson/section title"). Seven coordinated changes, each in its own commit under a single PR:

- **Fix A — memoize `loadAllLessonsForWorkshop` (`useLessons.js`)**: added a per-(lang, workshop) Map<Promise> cache so re-entering the same workshop no longer re-fetches all lesson content. Invalidated by `addContentSource` / `removeContentSource` and the gun-sync content-sources listener. Exported `clearLessonCache()`.

- **Fix B — stop remounting `LessonDetail.vue` on in-workshop lesson navigation (`App.vue`, `LessonDetail.vue`)**: the `<RouterView :key>` now returns `lesson-detail:<lang>/<workshop>` instead of `currentRoute.path`, so lesson-to-lesson navigation keeps the same component instance. `LessonDetail.vue` watches `(route.params.learning, workshop, number)` and calls a new `loadCurrentLesson()` function on changes. This is the structural root fix — the old remount was what forced the audio handoff to happen across a mount/unmount pair, which widened all the race windows.

- **Fix C — move the next-lesson resolver into `useAudio.js`**: new `setWorkshopLessons(learning, workshop, lessons)` API on the composable. The composable now resolves "next lesson" itself from its own `workshopContext`, instead of each `LessonDetail` remount passing a fresh closure through `enableContinuousMode`. Eliminates provider-closure churn. Legacy provider callback still accepted for backwards compatibility.

- **Fix D — debug overlay + event log (`useAudioDebug.js`, `AudioDebugOverlay.vue`)**: new ring-buffer event log (200 events, zero overhead when disabled) with `recordAudioEvent` instrumentation at every interesting point in `useAudio.js` (init / play / pause / stop / transition / preload / cleanup / late-bind / retry). A new `AudioDebugOverlay.vue` component renders the queue, state snapshot, and event log when `settings.showDebugOverlay` is on or `?audioDebug=1` is in the URL. Copy-to-clipboard exports the log as JSON for bug reports. Addresses comment 1 of #240.

- **Fix E — preload the whole remaining workshop (`useAudio.js`)**: continuous mode now uses a queue (`preloadedLessons`) instead of a single `preloadedNextLesson` slot. When the user enables continuous mode inside their double-click gesture, `preloadAllUpcomingLessons()` fills the queue with every remaining lesson up to a **1-hour playtime budget**. Each transition shifts the head and schedules a background top-up. This is what makes iOS lock-screen continuous play robust: every `<audio>` element exists before the chain advances, so there's no opportunity for iOS to reject a late-created element. The playtime budget uses `audio.duration` once `loadedmetadata` has fired; before that it falls back to a rough 5-seconds-per-clip estimate.

- **Fix F — state-preserving post-await rebuild in `initializeAudio`**: the old post-await guard aborted silently when it saw `isPlaying`, leaving `audioElements` in a half-built state. Now it rebuilds the queue + audio map, but releases old elements with the currently playing one as an exception and re-stitches that element into the new map. `isPlaying` / `isPaused` / `currentItemIndex` / `currentAudio` are preserved. This closes the "hard reload + click play too early" race that leaked into late-binding.

- **Fix G — kill late-binding, make `play()` async**: `playNextItem` / `playCurrentItem` / `playSingleItem` no longer fall back to `new Audio()` if a queue item is missing from the preload map. If we ever hit that path, we record a `late-bind-stop` event and call `stop()` loudly. `play()` is now `async` and awaits any in-flight `initializeAudio`, so by the time it starts advancing the chain the preload map is guaranteed to be fully populated.

### Tests

- `tests/audio.test.js`: **3 new regression tests** pinning the #240 symptoms (T1: continuous play crosses a transition and finishes the next lesson; T2: click play during in-flight init; T3: two concurrent inits race). Plus 4 more new tests for `setWorkshopLessons`, the new preload queue, and the kill-late-bind hard stop. 59 audio tests total.
- `tests/audio-debug.test.js`: 6 new tests for the event log infrastructure (recording, no-op when disabled, ring buffer cap, clear, serialize, reactive toggle).
- `tests/lessons.test.js`: 2 new tests for the memoized `loadAllLessonsForWorkshop`.
- `tests/lesson-detail.test.js`: 1 new test for in-workshop navigation without remount.

Full suite: **17 files, 234 tests, all passing.** Build clean.

## 2026-04-10

### Features

#### Lock-screen / Media Session test coverage
- New describe block `lock-screen / Media Session requirements` in `tests/audio.test.js` with 8 tests pinning the iOS lock-screen contract: MediaMetadata (title, artist, album, artwork) is populated, all four action handlers (`play`, `pause`, `previoustrack`, `nexttrack`) are registered and actually control the composable, lock-screen "pause" then "play" resumes at the current position, `nexttrack` / `previoustrack` step through the queue, and MediaMetadata updates when continuous mode transitions to the next lesson.
- The tests mock `navigator.mediaSession` with a handler registry so the assertions invoke each action exactly like the OS would.

#### Extracted `useLessonAudioSync` composable + unit tests
- Watcher and lifecycle logic that used to live inline in `LessonDetail.vue`'s `<script setup>` is now a standalone composable at `src/composables/useLessonAudioSync.js`. It exposes pure functions (`onSettingsChanged`, `onProgressChanged`, `onLessonMount`, `onLessonUnmount`, `toggleContinuousPlay`) that the view binds to Vue watchers and lifecycle hooks but that are directly unit-testable without mounting the component.
- New `tests/lesson-audio-sync.test.js` with 17 tests covering every handler. The composable answers "should I rebuild the queue?" / "should I tear down audio on unmount?" as a deterministic function of arguments, not as inline SFC logic.

#### `@vue/test-utils` component mount tests for `LessonDetail.vue`
- Added `@vue/test-utils` as a dev dependency and created `tests/lesson-detail.test.js` with 7 tests that actually `mount()` `LessonDetail` with a mock router, i18n, and stubbed composables. Covers: render, audio initialization from route params, autoplay via `?autoplay=true` query, the full regression for "deep progress mutation during playback" (fires the real Vue watcher through `useProgress`), and both unmount paths (clean teardown vs. skipped teardown during a continuous-mode transition).
- This is the first component-level test coverage in the project. Caught a real bug during authoring: route-param-based computed refs (`learning.value`, `workshop.value`, `lessonNumber.value`) become `undefined` during `onBeforeUnmount`, which would make the "composable moved on" check falsely trigger and skip cleanup. Fixed by capturing stable `mountedLearning` / `mountedWorkshop` / `mountedLessonNumber` values at mount time.

### Fixes

#### Route-param refs become stale during unmount
- `LessonDetail.vue` now captures `mountedLearning`, `mountedWorkshop`, `mountedLessonNumber` at mount time and uses them in `onBeforeUnmount` instead of the route-based computed refs. Without this, `onLessonUnmount` saw `undefined` route params and falsely concluded the composable had moved on, skipping the audio teardown on a normal lesson-to-lessons-overview navigation.

#### GunDB sync pulls paused during playback (belt & braces)
- `useGun` now exposes `pauseSyncPulls()` / `resumeSyncPulls()` plus a `syncPullPaused` ref. The `.on()` listener on `lastSync` defers any incoming pull while the flag is set, and flushes the pending pull the moment playback ends.
- `useAudio.play()` freezes remote pulls, `pause()` and `stop()` release them. A sync tick from another device that arrives mid-playback no longer mutates `progress` / `settings` while audio is running.

#### Audio chain stops after the first clip (follow-up to #234)
- `initializeAudio({ force: true })` no longer tears down a lesson's audio while it is actively playing or paused. Previously, any GunDB sync tick, remote settings update, or `toggleItemLearned` click would mutate `progress` / `settings` deeply, fire the `LessonDetail.vue` watchers, and call `initializeAudio` with `force: true` — which released all audio elements (including the one currently playing) and set `isPlaying.value = false`. The `onended` → `playNextItem` chain then saw `isPlaying` false and silently stopped, so the lesson only played a single clip and never advanced (and continuous mode never reached the end-of-queue transition).
- The composable now detects this case (`isSameLesson && force && (isPlaying || isPaused)`) and skips the rebuild. The new queue gets picked up the next time the user pauses and resumes.
- **Belt-and-braces**: `useAudio.play()` now calls `useGun.pauseSyncPulls()`, which freezes `lastSync` → `pullFromRemote()` dispatches until the user pauses or stops. A sync tick that arrives mid-playback is queued and flushed when playback ends. This way even if a watcher in a future view layer forgets the `isPlaying` guard, the trigger never arrives during active playback.
- Added two regression tests for the force-rebuild guard AND two full-integration tests in `tests/audio.test.js` that wire up the same deep watcher pattern as `LessonDetail.vue` (with the real Vue `watch` function) and verify that a `progress` or `settings` mutation during playback does not break the chain.

#### Autoplay stops on iOS lock screen at end of each lesson
- Continuous playback now keeps the audio context alive across lesson boundaries. When a lesson ends, the composable swaps the queue for the next lesson in-place instead of tearing down audio elements on component remount — so iOS holds the Media Session open and the lock-screen controls stay responsive.
- `LessonDetail.vue` cleanup is now skipped during a continuous-mode transition.
- `initializeAudio` is idempotent for the same lesson: re-mounting the view after an in-place transition is a no-op.

#### Long audio loading delay even for downloaded / offline workshops
- `preloadAudioFiles()` no longer blocks on `canplaythrough` for every file. Audio elements are created, `load()` is kicked off, and playback starts as soon as the browser has enough data. Cached files (from the `workshop-content` service-worker cache) play instantly.
- The "loading audio…" spinner now only appears for the short queue-build phase.

### Features

#### Continuous play mode (double-click play button)
- **Single click** on the play button: start / pause the current lesson (unchanged).
- **Double click**: start continuous play — auto-advance through the whole workshop, including from the iOS lock screen.
- A small repeat badge and yellow ring on the play button indicate continuous mode is active.
- The next lesson's audio is preloaded in the background while the current one plays, so transitions are seamless.
- When online and a workshop is not downloaded, continuous play still auto-advances; the next lesson loads in the background.
- A second double click turns continuous play off without stopping playback.

### Docs & CI

- Updated `specs/audio-system.md` and `docs/audio-system.md` with continuous play, lock-screen behaviour, and the new instant-load semantics.

## 2026-04-03

### Features

#### Burger Menu für Navigation (#130)
- Hamburger-Icon ersetzt einzelne Settings-, Profile- und Coach-Buttons oben rechts
- Dropdown mit Settings, Profile und Coach (nur wenn Coach verfügbar)
- Aktuelle Seite wird im Menü hervorgehoben
- i18n in allen 4 Sprachen (DE, EN, AR, FA)

### Fixes

#### Workshop-Übersicht fehlt nach Reload (#134)
- `useLessons()` auf Singleton-Pattern umgestellt — verhindert Race Conditions beim parallelen Laden
- Cache-Invalidierung (`loadedSourceLangs.clear()`) beim Content-Rebuild
- Parallele `loadDefaultSources()`-Aufrufe werden dedupliziert

## 2026-03-30

### Features

#### Section-Bilder für Workshops (#144)
- Section-level SVG images (640×160, Terminal-Card-Stil) in LessonDetail
- Workshop-linux-grundlagen: 192 SVGs für 12 Lektionen × 4 Sprachen

### Fixes

#### Workshops laden nicht bei direktem URL-Zugriff (#145, #146)
- `loadDefaultSources()` wurde nicht aufgerufen bei direkter Navigation zu `/#/deutsch`

#### Lesson-Bilder Pfad-Auflösung (#153, #154)
- `_filename` auf Lesson-Objekt setzen statt Fallback auf `XX-lesson`
- Doppel-Slash bei lokalen Workshop-Pfaden (`/__local/...`) verhindern

#### Nav-Titel abgeschnitten auf Mobile (#149)
- Kleinere Schriftgröße auf kleinen Screens (text-lg statt text-xl)
- Story-Button auf sehr kleinen Screens ausgeblendet für mehr Titelplatz

#### Show loading state instead of "no workshops" while loading (#150)
- Add local loading indicator in WorkshopOverview while workshops are being fetched
- Prevents "Keine Workshops verfügbar" from flashing before content loads

## 2026-03-27

### Features

#### Offline Workshop Downloads (#111)
- Add PWA service worker via vite-plugin-pwa for app shell caching
- Workshop metadata (titles, thumbnails, lesson lists) cached automatically
- Download button on lessons overview to save full workshop for offline use
- Progress indicator during download, offline badge on completed workshops
- Offline indicator in navigation bar when disconnected
- Storage management in Settings to view/remove cached workshops
- Network-first strategy: fresh content when online, cached when offline

### Fixes

#### Workshop Lesson Discovery (#108, #109)
- Fix lesson path resolution for built-in workshop-* sources
- Fix image, video, and audio path resolution for workshop-* sources
- Add E2E test verifying images load from correct paths

## 2026-03-25

### Features

#### Lesson Overview — Learning Path (#93)
- Replace 3-column grid with vertical learning path visualization
- Add progress bar showing completed/total lessons
- Add lesson status tracking (open/visited/completed) with manual marking
- Add favorites system to customize learning order
- Add next lesson highlighting with "Continue" badge
- Completed lessons appear at bottom, visually dimmed
- Path nodes with status indicators (empty/dot/checkmark)
- Desktop: cards alternate left/right of path line
- Mobile: path line left, cards right
- i18n: all new strings in DE, EN, FA, AR
- 7 new E2E tests for learning path functionality

## 2026-03-24

### Fixes

- Remove SSL from local dev server — dev now runs HTTP, matching Playwright and CI expectations
- Remove unused `@vitejs/plugin-basic-ssl` dependency

### Fixes

- Fix 6 failing E2E tests: update selectors and URLs to match current UI (home page language buttons, settings button, workshop URLs, footer links)

## 2026-03-19

### Features

#### Story Mode — interactive narrated workshops (Issue #6)
- Add story mode as a frontend view toggle — any workshop can be viewed in fullscreen immersive narration
- Add story mode button (book icon) in top navigation on lesson/overview pages
- Add `StoryView.vue` — fullscreen view with section images, narration text overlay, and branching choices
- Add `voice` field on examples for character/narrator labels
- Add `goto` and `image` fields on select options for branching navigation and visual choice cards
- Add story route (`/:learning/:workshop/story/:number`) with header/footer hidden
- Add press-and-hold exit button (3 seconds) with ring animation to return to normal mode
- Add sample workshop "Milas Abenteuer" — a 3-chapter branching story with SVG illustrations
- Add `specs/story-mode.md` product spec

## 2026-03-17

### Features

#### User Profile — Phase 2: personal info, streak, navigation (PR #60, Issue #48)
- Add editable profile fields: display name, email, native language, learning goal (stored in localStorage)
- Add 4-stat grid: items learned, assessments answered, learning streak (days in a row 🔥), workshops started
- Add color gradient banner in profile hero section (generated from username hash)
- Add "Go to Workshops" button directly on profile page
- Add workshops grid-icon button in App.vue header when on profile page — no more footer scrolling to navigate back

### Docs & CI

#### Spec-driven development process (PR #52)
- Add `docs/development-process.md` describing the 5-step workflow: Issue → Spec → Review → Implement → Code Review
- Move ADRs from `docs/adr/` to `specs/adr/`
- Add product specs in `specs/` for all major features

### Fixes

#### External workshop language routing (Issue #59)
- Fix external workshops showing wrong language (e.g. Farsi showing English content when German interface selected)
- `workshopSlugMap` is now scoped by language — each language keeps its own `slug → URL` mapping so same-named workshops in different language variants no longer overwrite each other
- Audio path resolution also fixed: `resolveWorkshopKey` now receives the interface language

## 2026-03-16

### Features

#### User Profile — Phase 1 (PR #58, Issue #48)
- Add `/profile` route with a dedicated login/register page and profile view
- Profile shows identicon avatar (generated from username), display name, join date, and total items learned
- Active workshops listed with progress bars and "Continue" button that resumes the last visited lesson
- Track last visited lesson per workshop in localStorage via `useProgress`
- Avatar button appears in the navigation bar when logged in — taps to open the profile
- Moved login/register from Settings to the new Profile page; Settings now shows a link to the Profile page

## 2026-03-15

### Features

#### Spanish Workshop (Issue #53)
- Add bundled Spanish workshop for German interface (`deutsch/spanisch`, 10 lessons)
- Add bundled Spanish workshop for English interface (`english/spanish`, 10 lessons)
- Full audio for all lessons: Spanish questions (Mónica), German/English answers (Anna/Samantha)
- SVG thumbnails for both language versions

### Fixes

#### Audio button hidden when no audio available (Issue #45)
- Play button no longer shows for workshops without audio files (Farsi, Arabic)
- `hasAudio` ref exposed from `useAudio()` — true only when at least one file loaded

#### Progress hash scoped per lesson (Issue #4)
- Assessment sent-status no longer marks all lessons as "changed" when any item is learned
- Hash now only includes progress items belonging to that specific lesson

## 2026-03-10

### Features

#### Image Support (PR #14)
- Add image support for sections, examples, and workshop cards
- Side-by-side layout for example images (text left, image right)
- Images added to feedback/guide workshops and lesson-level image support
- Remove image cropping in lesson detail, use 16:9 ratio for cards

#### UX Improvements (PR #23)
- Toggle answer visibility on click when answers are hidden
- Table of contents for lesson sections
- Auto-advance to next lesson when audio playback finishes
- Move mobile play button higher to avoid overlapping footer
- Simplify routes and left-align header title
- Shorten footer link labels across all languages

#### Workshop Sorting & Favorites (PR #24)
- Workshop sorting by favorites and images with favorite toggle
- Active workshop status with sorting and dismissal

#### Example Click Behavior (PR #33, #34)
- Separate click behaviors for question text and example card
- Filter audio playback by active label

#### Audio Manifest (PR #41)
- Audio manifest to skip loading non-existent files
- Show loading spinner on play button while audio preloads

### Fixes

#### Label & Navigation Fixes (PR #25–#31)
- Hide section titles, descriptions, images and videos when filtering by label
- Preserve label filter when navigating to next lesson
- Back button shows lesson number on results/coach/items pages
- Mark unvalidated assessments as correct when answered
- Lesson number button on right side, scroll to top, items on results
- Resolve audio 404 for remote workshops by sharing workshopSlugMap
- Nav buttons toggle between page and lesson number

#### Audio & Media Fixes (PR #32, #36, #38, #40)
- Stop auto play when audio fails instead of skipping
- Use favicon.svg for Media Session artwork instead of missing file
- Use workshop image for Media Session artwork with favicon fallback
- Clicking example during autoplay moves playback without overlap

#### Assessment Fix (PR #37)
- Multiple-choice without validation shows green on first click

#### Navigation Fix (PR #35)
- Carry lesson number when navigating between results and items

### Docs & CI

- Media concept for builtin workshops (PR #17)
- Restore app build+deploy, remove redirect loop (PR #15)
- Update audio system, features, and ADR for recent changes (PR #39)

## 2026-03-09

### Features

- Add workshop thumbnail images on workshop cards

### CI

- Deploy redirect to open-learn.app

## 2026-02-19

### Features

#### Video Support for Sections (PR #13)
- Sections can now include an optional embedded video
- Videos are rendered inline within the lesson detail view

#### Assessment Types with Local Storage (PR #14)
- New assessment types: free-text input, multiple-choice, and single-select
- Answers are stored locally in `localStorage` and persist across sessions
- Validation logic for each type (exact match, correct options)

#### Coach Answer Forwarding (PR #15)
- Assessment answers can be forwarded to a workshop coach's server
- Requires explicit user consent via a toggle in Settings
- Optional user identification (name or email)

#### Showcase Workshop (PR #16)
- Added a showcase workshop with fun facts and feedback examples
- Demonstrates the platform's features for new users

#### Batch Coach Forwarding & Reference Server (PR #17)
- Answers are queued and sent as a single batch request instead of one-by-one
- Includes `sendBeacon` fallback for page/tab close
- Reference coach server implementation for workshop hosts

#### Per-Topic Export/Import of User Data (PR #18)
- Export and import learning progress and assessment answers from the Settings page
- Scoped per topic — users select which workshop to export
- Import merges additively into existing data (no data is lost)
- Download as JSON file: `open-learn-{topic}-{date}.json`
