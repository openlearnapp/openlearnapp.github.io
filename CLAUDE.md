# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a static single-page web application for learning any workshops by examples. It's a general-purpose learning platform featuring example-based lessons with audio pronunciation and progress tracking via LocalStorage.

- **static**: easy deploy on github pages
- **open**: learn any workshop, lessons with sections, sections with examples, eg. new language, math, theory for driver / boot / pilot license
- **multi-language**: base language, learn based on your preferred known language
- **learning items**: track progress by marking items as learned
- **audio reading**: learning by just listening to examples

## Tech Stack

- **Framework**: Vue 3.4+ (Composition API with SFCs)
- **Routing**: Vue Router 4.6+ (hash-based routing)
- **Dependency Management**: pnpm
- **Build Tool**: Vite 5.0
- **Styling**: Tailwind CSS 3.4
- **Testing**:
  - Vitest 1.0 (unit tests with happy-dom/jsdom)
  - Playwright 1.40 (E2E tests)
- **Data Format**: YAML for lesson content (parsed with js-yaml 4.1)
- **Markdown**: Marked 17.0 for rendering explanations
- **Deployment**: GitHub Pages (via GitHub Actions)

## Directory Structure

```
openlearnapp.github.io/
├── index.html              # Minimal HTML entry point
├── src/
│   ├── main.js            # App entry point - creates Vue app with router
│   ├── App.vue            # Root component with unified navigation bar
│   ├── style.css          # Custom styles (imports Tailwind)
│   ├── router/
│   │   └── index.js       # Vue Router configuration
│   ├── views/             # Page components
│   │   ├── Home.vue              # Language selection (entry point)
│   │   ├── WorkshopOverview.vue  # Workshop selection for a language
│   │   ├── LessonsOverview.vue   # Lessons grid page
│   │   ├── LessonDetail.vue      # Individual lesson page (assessments, audio, progress)
│   │   ├── LearningItems.vue     # Learning items browser
│   │   ├── AssessmentResults.vue # Assessment results overview with coach option
│   │   ├── Coach.vue             # Coach chat/response view
│   │   ├── Creators.vue          # Workshop creator info page
│   │   ├── Settings.vue          # Settings page (preferences, coach, export/import)
│   │   └── AddSource.vue         # Add external workshop page
│   ├── composables/       # Reusable composition functions (singleton pattern)
│   │   ├── useLessons.js     # Lesson loading logic with js-yaml + remote sources
│   │   ├── useSettings.js    # Settings persistence logic
│   │   ├── useProgress.js    # Progress tracking logic (learning items)
│   │   ├── useAssessments.js # Assessment answers, validation, coach queue
│   │   ├── useAudio.js       # Audio playback system
│   │   ├── useCoach.js       # Coach API integration, batch answer forwarding
│   │   ├── useFooter.js      # Footer visibility state
│   │   ├── useGun.js         # Decentralized identity via GunDB SEA
│   │   └── useLanguage.js    # Language/locale switching
│   ├── components/        # Shared UI components
│   ├── i18n/              # Internationalization strings
│   ├── lib/               # Library utilities
│   └── utils/
│       └── formatters.js  # Display name formatting
├── public/
│   ├── CNAME              # Custom domain: open-learn.app
│   ├── default-sources.yaml # Default workshop sources (loaded at startup)
│   ├── lessons/
│   │   └── index.yaml     # Root index - lists available interface languages
│   ├── workshop-open-learn-guide/   # Built-in: platform tutorial (DE + EN)
│   ├── workshop-open-learn-feedback/ # Built-in: feedback workshop (DE + EN)
│   └── workshop-milas-abenteuer/    # Built-in: interactive story (DE)
├── docs/
│   ├── workshop-guide.md  # How to create workshops
│   ├── features.md        # Complete feature inventory
│   ├── development-plan.md # Current development plan
│   ├── lesson-schema.md   # Individual lesson YAML schema documentation
│   ├── yaml-schemas.md    # Index YAML schemas (languages/topics/lessons)
│   ├── audio-system.md    # Audio playback documentation
│   ├── lesson-plan-template.md     # Lesson planning guide
│   └── adr/               # Architecture Decision Records
├── tests/
│   ├── basic.test.js      # Basic sanity tests
│   ├── dark-mode.test.js  # Dark mode toggle tests
│   ├── assessments.test.js      # Assessment validation + persistence tests
│   ├── coach-forwarding.test.js # Coach batch queue + API tests
│   └── e2e/
│       └── app.spec.js    # Playwright E2E tests
├── vite.config.js         # Vite config (base: '/')
├── tailwind.config.js     # Tailwind customization
├── playwright.config.js   # Playwright E2E test config
└── package.json           # Dependencies and scripts
```

## Development Commands

```bash
# Install dependencies (first time setup)
pnpm install

# Development server (http://localhost:5173)
pnpm dev

# Build for production (outputs to dist/)
pnpm build

# Preview production build locally
pnpm preview

# Run unit tests (Vitest)
pnpm test

# Run unit tests with UI
pnpm test:ui

# Run E2E tests (Playwright)
pnpm test:e2e
```

### Local Workshop Development

Workshop repos placed as sibling directories are automatically detected and served during `pnpm dev`. No configuration needed.

```
your-workspace/
├── openlearnapp.github.io/    ← pnpm dev here
├── workshop-english/          ← auto-detected
├── workshop-portugiesisch/    ← auto-detected
└── workshop-farsi/            ← auto-detected
```

**Requirements:** The workshop directory must start with `workshop-` and contain an `index.yaml`.

**How it works:**
- A Vite plugin scans `../workshop-*` directories on dev server start
- Local workshops appear **alongside** remote versions in the app, marked with 🔧 in the title
- Files are served directly from the local filesystem — changes are visible immediately
- Only active in dev mode; production builds are unaffected

**Endpoints (dev only):**
- `/__local-workshops.json` — lists detected local workshops
- `/__local/workshop-xxx/...` — serves files from the local workshop directory

## Architecture

### Vue Application Structure

**Component-Based Architecture**:
- Uses `.vue` Single File Components (SFCs)
- Vue Router for client-side routing
- Composition API with composables for shared logic
- Unified navigation bar in root App component

**Main Components**:
- `App.vue` - Root component with unified navigation (back button, dynamic title, settings button)
- `Home.vue` - Language selection page (route: `/`)
- `WorkshopOverview.vue` - Workshop selection for a chosen language (route: `/:learning`)
- `LessonsOverview.vue` - Lessons grid page (route: `/:learning/:workshop/lessons`)
- `LessonDetail.vue` - Individual lesson page (route: `/:learning/:workshop/lesson/:number`)
- `LearningItems.vue` - Learning items browser (route: `/:learning/:workshop/items/:number?`)
- `AssessmentResults.vue` - Assessment results with coach forwarding option (route: `/:learning/:workshop/results`)
- `Coach.vue` - Coach chat/response view (route: `/:learning/:workshop/coach`)
- `Creators.vue` - Workshop creator info page (route: `/creators`)
- `Settings.vue` - Settings page (route: `/settings`)
- `AddSource.vue` - Add external workshop (route: `/add?source=URL`)

**Composables** (Reusable logic, all use singleton pattern — see `specs/adr/005`):
- `useLessons()` - Lesson loading with js-yaml parser
  - `loadAvailableContent()` - Load main lesson index + default + user content sources
  - `loadWorkshopsForLanguage(lang)` - Load workshops for a language
  - `loadAllLessonsForWorkshop(lang, workshop)` - Load all lessons for a workshop
  - `default-sources.yaml` - Platform-shipped workshop sources (loaded at startup, non-removable)
  - Content source management (add/remove external workshops)
  - IPFS URL resolution
- `useSettings()` - Settings management
  - Shared reactive state across all components
  - Automatic localStorage persistence via watchers
  - Dark mode toggle with DOM class manipulation
  - Settings loaded on app initialization in `main.js`
- `useProgress()` - Progress tracking
  - Track learned items per language/workshop combination
  - Persisted to localStorage
- `useAssessments()` - Assessment system
  - Answer validation for input, multiple-choice, select types
  - Save/load answers to/from localStorage
  - Coach queue: batch answer forwarding to external coach API
  - `flushCoachQueue()` (async POST) and `flushCoachQueueSync()` (sendBeacon for page close)
- `useAudio()` - Audio playback system
  - Pre-loads MP3 files per lesson
  - Media Session API for lock screen controls
  - Variable playback speed
- `useCoach()` - Coach API integration
  - Batch answer submission to external coach endpoint
  - Consent-gated queue management
- `useFooter()` - Footer visibility state (shared across components)
- `useGun()` - Decentralized identity via GunDB SEA
  - User key pair generation and persistence
  - Experimental feature for future community features
- `useLanguage()` - Language/locale switching

**Routing**:
- `#/` - Home page (language selection)
- `#/:learning` - Workshop overview for a language
- `#/:learning/:workshop/lessons` - Lessons overview grid
- `#/:learning/:workshop/lesson/:number` - Lesson detail view
- `#/:learning/:workshop/items/:number?` - Learning items
- `#/:learning/:workshop/results` - Assessment results
- `#/:learning/:workshop/coach` - Coach view
- `#/settings` - Settings panel
- `#/add?source=URL` - Add external workshop
- `#/creators` - Creator info page

Uses hash-based routing (`createWebHashHistory`) for GitHub Pages compatibility.

**Navigation Pattern**:
- **Dynamic Title**: Changes based on route
  - Home: "🎓 Open Learn"
  - Overview: Workshop name (e.g., "Portugiesisch")
  - Detail: Lesson title (e.g., "Basic Verbs - Ser and Estar")
  - Settings: "⚙️ Settings"
- **Back Button**: Visible on all pages except home
- **Settings Button**: Always visible in top-right corner

**YAML Loading Flow**:
1. Load `lessons/index.yaml` → get available interface languages
2. User selects language → try `lessons/{language}/workshops.yaml` first, fallback to `topics.yaml` → get workshops
3. User selects workshop → navigate to `/:learning/:workshop/lessons`
4. Load `lessons/{language}/{workshop}/lessons.yaml` → get lesson folder names
5. Load all lessons for workshop → fetch `{folder}/content.yaml` for each folder and parse with js-yaml

### YAML Lesson Schema

Lessons follow a hierarchical structure: **Lesson → Sections → Examples → Related Items**

```yaml
number: 1
title: "Lesson Title"
description: "Brief description"
sections:
  - title: "Section Title"
    explanation: |
      Markdown-formatted explanation text
    examples:
      - q: "Question/source sentence"
        a: "Answer/translation"
        labels: ["Futur", "Gerundium"]  # Optional labels
        rel:
          - ["term", "translation", "context"]  # First element is unique ID
          - ["word", "meaning"]
```

**Key Concepts**:
- **Three-level hierarchy**: Language → Workshop → Lesson
  - Bundled: `lessons/<language>/<workshop>/<lesson-folder>/`
  - Remote: loaded from `public/default-sources.yaml` or user-added sources
  - Example: `deutsch/open-learn-guide/01-welcome/` = bundled tutorial
  - Example: `open-learn.app/workshop-portugiesisch/` = remote workshop
- **Self-contained lessons**: Each lesson folder contains its content and audio files
  - `content.yaml` - Lesson content
  - `audio/` - Audio files for pronunciation
  - Makes lessons portable and distributable (can be hosted on IPFS, CDN, etc.)
- **Workshop repos**: Most workshops live in dedicated repos under `openlearnapp` org
  - Deployed to `open-learn.app/<repo-name>/` via GitHub Pages
  - Only `open-learn-guide` and `open-learn-feedback` are bundled in this repo
- **Labels**: Optional categorization (e.g. for grammar, like "Futur", "Passiv")
- **Related items (`rel`)**: Vocabulary/concepts with first element as unique identifier
- **Markdown support**: Section explanations support markdown formatting

See `docs/lesson-schema.md` for individual lesson documentation and `docs/yaml-schemas.md` for index file schemas.

### Third-Party Libraries

**js-yaml** (`import yaml from 'js-yaml'`):
- Full-featured YAML parser for lesson content
- Handles all YAML spec features (comments, multi-line strings, etc.)
- Used in `useLessons()` composable via `yaml.load(text)`

**marked** (`import { marked } from 'marked'`):
- Markdown-to-HTML converter
- Used for rendering section explanations in lesson detail view
- Supports GitHub-flavored markdown

### Settings & Persistence

**Singleton Pattern**: The `useSettings()` composable uses module-level reactive state, ensuring all components share the same settings instance.

**Persistence Flow**:
1. Settings loaded from `localStorage` in `main.js` before app mounts
2. Changes automatically saved via Vue watchers
3. Dark mode applied to `<html>` element via class toggle
4. All components access the same reactive settings object

**Settings**:
- `showAnswers` (boolean): Toggle visibility of answer translations in lessons
- `showLearningItems` (boolean): Show/hide learning items on lesson cards
- `showLabels` (boolean): Show/hide grammar labels
- `darkMode` (boolean): Dark theme toggle
- `audioSpeed` (number): Playback speed (0.6, 0.8, 1.0)
- `readAnswers` (boolean): Include answers in audio playback
- `hideLearnedExamples` (boolean): Filter out learned examples
- `showDebugOverlay` (boolean): Debug info overlay
- `coachConsent` (boolean): Opt-in to forward answers to workshop coach
- `coachIdentifier` (string): Name/email sent with coach submissions

## Adding New Content

### Adding a New Lesson

Every workshop follows the same `workshop-{name}/` structure:

```
workshop-my-topic/
├── index.yaml              # Languages this workshop supports
├── deutsch/
│   ├── workshops.yaml      # Workshop metadata (title, labels, colors)
│   └── my-topic/
│       ├── lessons.yaml    # Lesson list
│       └── 01-lesson/
│           ├── content.yaml
│           └── audio/      # Optional: generated MP3 files
```

Built-in workshops live in `public/workshop-*/`. External workshops are loaded from URLs via `default-sources.yaml`.

See `docs/workshop-guide.md` for the full guide and `docs/yaml-schemas.md` for schema details.

## Terminology

| Term | Code variable | Meaning |
|------|--------------|---------|
| **Language** | `learning` | Interface language the user knows (e.g. `deutsch`) |
| **Workshop** | `workshop` | Subject being learned (e.g. `portugiesisch`) |
| **Lesson** | `lesson` | Single learning unit, numbered (e.g. `01-essential-verbs`) |
| **Learning Item** | `rel` | Vocabulary/concept from examples, tracked as learned/unlearned |
| **Coach** | `lesson.coach` | Optional external service receiving assessment answers |

## Assessment System

Examples can have a `type` field for interactive assessments (default is `qa` which just shows question + answer).

**Types**: `input` (text field), `multiple-choice` (checkboxes), `select` (radio buttons)

**Click-to-Save**: No submit buttons. Answers auto-validate on interaction:
- `input`: validates on Enter key or blur
- `select`: validates immediately on radio click
- `multiple-choice`: live per-option feedback (green/red borders), saves when all correct

**Visual feedback**: Correct assessments show ✓ before the question and a green card background. Answers are always re-editable (no locked state).

**Coach integration**: If `lesson.coach` is defined and user has `coachConsent`, answers are queued and batch-sent to the coach API.

See `docs/features.md` for the complete feature inventory and `specs/adr/` for architectural decisions.

## Testing

### Unit Tests (Vitest)
- `tests/basic.test.js`: Basic sanity checks
- `tests/dark-mode.test.js`: Dark mode toggle + persistence
- `tests/assessments.test.js`: Assessment validation, save/load, clear (15 tests)
- `tests/coach-forwarding.test.js`: Coach queue, batch sending, consent (11 tests)

### E2E Tests (Playwright)
- `tests/e2e/app.spec.js`: Page load, HTML structure, dark mode

## Deployment

**GitHub Actions** (`.github/workflows/static.yml`):
- Triggers on push to `main` branch
- Runs build
- Deploys `dist/` to GitHub Pages

**Important**: Vite is configured with `base: '/'` for custom domain deployment at `open-learn.app`.

## Browser APIs Used

- **LocalStorage**: Settings and progress persistence
- **Fetch API**: Dynamic YAML lesson loading
- **Media Session API**: Lock screen audio controls

## Development Notes

- All components use `.vue` Single File Components (SFCs)
- Vue Router handles client-side routing with hash-based URLs for GitHub Pages compatibility
- Tailwind classes are used directly in component templates
- Lessons are loaded dynamically at runtime - no build-time processing
- Dark mode: Tailwind `dark:` classes + `<html class="dark">` toggle via useSettings composable
- YAML parsing uses js-yaml library for full spec support
- Markdown rendering uses marked library for section explanations
- Composables pattern for shared logic (useLessons, useSettings, useProgress, useAssessments, useAudio)
- Navigation state is managed by Vue Router - no manual view switching
- Dynamic page titles based on route and content

## Spec-Driven Development

This project follows a spec-driven process. See `docs/development-process.md` for the full workflow.

### Folder Separation

| Folder | Purpose | Contents |
|--------|---------|----------|
| `specs/` | **Product truth** — what should be | One Markdown file per feature describing the product behavior, regardless of implementation status |
| `specs/adr/` | **Architecture decisions** — why we chose | Numbered records (`001-`, `002-`, ...) for fundamental technical decisions that constrain the project |
| `docs/` | **Developer documentation** — how to use/develop | Guides, schemas, process docs, development plans |

### Rules

- Every feature PR must include or reference a spec in `specs/`
- Specs describe the **what and why** from a product perspective — no code
- ADRs are for architectural choices that affect the whole project and rarely change
- `docs/` is for practical how-to guides (dev setup, workshop creation, audio generation)
- Small bugfixes don't need a spec, but do need their own PR

## Changelog

Maintain `CHANGELOG.md` in the project root. When creating a PR, add an entry to the changelog under the current date. Group entries by **Features**, **Fixes**, and **Docs & CI**. Include the PR number in parentheses.
