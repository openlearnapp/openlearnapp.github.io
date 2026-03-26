# Changelog

## 2026-03-26

### Fixes

- Learning path: move path line to left side on all screen sizes — cards use full width instead of alternating left/right (#93)

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
- Path line always on left, cards always right — consistent on all screen sizes
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
