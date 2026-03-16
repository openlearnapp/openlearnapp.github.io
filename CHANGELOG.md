# Changelog

## 2026-03-16

### Features

#### User Profile — Phase 1 (PR #58, Issue #48)
- Add `/profile` route with a dedicated login/register page and profile view
- Profile shows identicon avatar (generated from username), display name, join date, and total items learned
- Active workshops listed with progress bars and "Continue" button that resumes the last visited lesson
- Track last visited lesson per workshop in localStorage via `useProgress`
- Avatar button appears in the navigation bar when logged in — taps to open the profile
- Moved login/register from Settings to the new Profile page; Settings now shows a link to the Profile page

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
