# Feature List

Complete inventory of all features in Open Learn.

---

## Content System

### YAML-Based Lessons
Lessons are authored in YAML files with a hierarchical structure: Language → Workshop → Lesson → Section → Example.

- **Lesson content**: `public/lessons/{language}/{workshop}/{lesson-folder}/content.yaml`
- **Schema docs**: `docs/lesson-schema.md`, `docs/yaml-schemas.md`
- **Composable**: `src/composables/useLessons.js`

### Three-Level Content Hierarchy
```
Language (e.g. deutsch)
  └── Workshop (e.g. portugiesisch)
       └── Lesson (e.g. 01-essential-verbs)
            └── Section (e.g. "Ser and Estar")
                 └── Example (q/a pair with optional metadata)
```

### Section Explanations (Markdown)
Each section can include a markdown-formatted `explanation` field, rendered with the `marked` library.

- **Location**: `src/views/LessonDetail.vue` — `v-html="marked(section.explanation)"`

### Section Videos
Sections support an optional `video` field for embedded videos (YouTube or local).

- YouTube URLs are auto-converted to embed format via `normalizeVideoUrl()`
- **Location**: `src/views/LessonDetail.vue`
- **GitHub Issue**: #31 (improve support for local video files)

### Labels (Grammar Tags)
Examples can have optional `labels` (e.g. "Futur", "Passiv") shown as colored badges.

- Toggle via Settings: `showLabels`
- **Location**: `src/views/LessonDetail.vue`

---

## Assessment System

### Assessment Types
Four types of examples, controlled by the `type` field in YAML:

| Type | Interaction | Validation |
|------|------------|------------|
| `qa` (default) | Show/hide answer | None |
| `input` | Text field | Case-insensitive match, supports multiple accepted answers |
| `multiple-choice` | Checkboxes | Compare selected indices with correct indices |
| `select` | Radio buttons | Single correct index match |

- **Composable**: `src/composables/useAssessments.js`
- **View**: `src/views/LessonDetail.vue`
- **Schema**: `docs/lesson-schema.md` (Assessment Types v2 section)

### Click-to-Save (Auto-Submit)
No explicit submit buttons. Answers are validated and saved automatically:

| Type | Trigger |
|------|---------|
| `input` | Enter key or blur (focus leaves field) |
| `select` | Immediately on radio button click |
| `multiple-choice` | Live per-option feedback, saves when all correct. Without validation: saves on first click |

### Live Visual Feedback
- **Correct assessment**: Green background + green left border + ✓ checkmark on question title
- **Input incorrect**: Shows correct answer below input
- **Select/MC per-option**: Green border on correct selected option, red border on wrong selected option
- **MC live validation**: Each checkbox toggle immediately shows correctness of that option

### Answer Persistence
Answers are stored in localStorage and restored on page load.

- **Key**: `assessments` → `{ "learning:workshop:lessonNumber": { "sectionIdx-exampleIdx": { type, answer, correct, submittedAt } } }`
- Answers are always re-submittable (no locked state, no reset needed)

---

## Learning Items (Vocabulary Tracking)

### Related Items (`rel` field)
Examples can have vocabulary/concept tags:
```yaml
rel:
  - ["sei", "weiß", "saber - ich weiß"]
  - ["estar", "sein (Zustand)"]
```
First element is the unique ID, remaining elements are translations/context.

### Progress Tracking
Each item can be toggled as "learned" per language:workshop combination.

- **Composable**: `src/composables/useProgress.js`
- **Storage**: localStorage key `progress` → `{ "learning:workshop": { "itemId": true } }`
- Click on item button to toggle learned status

### Learning Items Browser
Dedicated page to browse and manage all vocabulary across lessons.

- **View**: `src/views/LearningItems.vue`
- **Route**: `#/:learning/:workshop/items/:number?`
- Features: filter by lesson, group by status (learned/unlearned), group by lesson

### Hide Learned Examples
Setting to filter out examples where all related items are already learned.

- Toggle via Settings: `hideLearnedExamples`
- Affects both display and audio queue

---

## Audio System

### Text-to-Speech Audio
Pre-generated MP3 files for questions and answers, played in sequence.

- **Composable**: `src/composables/useAudio.js` (727 lines)
- **Generation**: `generate-audio.sh` (uses macOS `say` + `ffmpeg`)
- **Docs**: `docs/audio-system.md`

### Playback Features
- Sequential playback through lesson (title → sections → examples)
- Variable speed: 0.6×, 0.8×, 1.0×
- Smart pausing: 800ms between examples, 1200ms after section titles, 1000ms after lesson title, 1800ms between sections
- Section titles played at 70% of selected speed
- Option to include/exclude answers in playback (`readAnswers` setting)
- Label filtering: when a label filter is active, only filtered examples are played
- Stops on error instead of skipping
- Click question text to toggle answer, click example card to play audio

### Lock Screen Controls
Media Session API integration for mobile lock screen play/pause/skip controls.

### Audio File Convention
```
audio/
  title.mp3                 # Lesson title
  {sectionIdx}-title.mp3    # Section title
  {sectionIdx}-{exampleIdx}-q.mp3  # Question
  {sectionIdx}-{exampleIdx}-a.mp3  # Answer
```

---

## Coach System (Answer Forwarding)

### Coach Configuration
Workshops can optionally define a coach endpoint in their lesson YAML:
```yaml
coach:
  api: "https://coach-server.example.com/submit"
  name: "Workshop Coach"
```

### Batch Submission
Assessment answers are queued in-memory and sent as a batch:
- Manual "Send Answers to Coach" button at end of lesson
- Automatic flush on page/tab close (via `navigator.sendBeacon`)
- Automatic flush on lesson navigation

### Payload Format
```json
{
  "lesson": { "learning": "...", "workshop": "...", "number": 1, "title": "..." },
  "answers": [
    {
      "section": { "index": 0, "title": "..." },
      "example": { "index": 0, "type": "input", "question": "..." },
      "answer": { "value": "...", "correct": true }
    }
  ],
  "timestamp": "2026-02-21T...",
  "user": "optional-identifier"
}
```

### Consent & Privacy
- User must opt-in via Settings: `coachConsent` toggle
- Optional identifier (name/email): `coachIdentifier`
- If consent is off, answers never leave the browser
- 401 response handling with optional enrollment URL

---

## External Workshops (Remote Content)

### Content Sources
External workshops can be hosted anywhere (GitHub Pages, IPFS, CDN) and added to the app.

- **View**: `src/views/AddSource.vue`
- **Route**: `#/add?source=URL`
- **Docs**: `docs/external-workshop-guide.md`

### Adding External Content
1. Via URL: `https://your-app.com/open-learn/#/add?source=https://example.com/workshop/`
2. App validates the source (fetches index.yaml, discovers languages/workshops)
3. Source stored in localStorage key `contentSources`
4. Content merged seamlessly with local lessons

### Share Links
Workshops can be shared via URL that includes the content source query parameter. Copy button available on workshop cards and lessons overview.

### IPFS Support
IPFS URLs (`ipfs://...`) are resolved to HTTP gateway URLs automatically.

---

## Data Management

### Export / Import
Per-workshop export and import of user data (progress + assessments).

- **Location**: `src/views/Settings.vue`
- **Format**: JSON file `open-learn-{workshop}-{date}.json`
- **Import behavior**: Additive merge (no data loss, existing data preserved)

### Export Format
```json
{
  "version": 1,
  "exportedAt": "2026-02-21T...",
  "workshop": "learning:workshop",
  "progress": { "learning:workshop": { "itemId": true } },
  "assessments": { "learning:workshop:1": { "0-0": { ... } } }
}
```

---

## User Interface

### Dark Mode
Class-based dark mode toggle (`<html class="dark">`), persisted in localStorage.

- Toggle in Settings
- Tailwind `dark:` prefix classes throughout

### Navigation
Sticky top bar with:
- Back button (context-aware)
- Dynamic page title
- Play/Pause toggle (desktop, on lesson pages)
- Learning Items button (on lesson/overview pages)
- Settings button

### Mobile Support
- Responsive grid layouts (1 col mobile → 2-3 cols desktop)
- Floating play/pause button (mobile only, bottom-right)
- Touch-friendly assessment inputs

### Settings Page
Centralized settings management:

| Setting | Default | Description |
|---------|---------|-------------|
| `darkMode` | false | Dark theme |
| `showAnswers` | true | Show/hide answer text in qa examples |
| `showLearningItems` | true | Show vocabulary items below examples |
| `showLabels` | true | Show grammar label badges |
| `hideLearnedExamples` | true | Filter out fully learned examples |
| `audioSpeed` | 1.0 | Playback speed (0.6, 0.8, 1.0) |
| `readAnswers` | true | Include answers in audio playback |
| `showDebugOverlay` | false | Debug info overlay |
| `coachConsent` | false | Allow forwarding answers to coach |
| `coachIdentifier` | '' | Name/email for coach identification |

---

## Routing

Hash-based routing for GitHub Pages compatibility (`createWebHashHistory`).

| Route | View | Description |
|-------|------|-------------|
| `#/` | Home | Language and workshop selection |
| `#/:learning/:workshop/lessons` | LessonsOverview | Lesson grid for workshop |
| `#/:learning/:workshop/lesson/:number` | LessonDetail | Individual lesson with assessments |
| `#/:learning/:workshop/items/:number?` | LearningItems | Vocabulary browser |
| `#/settings` | Settings | All settings + data export/import |
| `#/add?source=URL` | AddSource | Add external workshop |

---

## Persistence (localStorage)

| Key | Purpose |
|-----|---------|
| `settings` | User preferences (JSON) |
| `progress` | Learned items per workshop (JSON) |
| `assessments` | Assessment answers per lesson (JSON) |
| `contentSources` | External workshop URLs (JSON array) |
| `lastLearningLanguage` | Last selected language (string) |
| `lastTeachingWorkshop` | Last selected workshop (string) |

---

## Testing

### Unit Tests (Vitest)
| File | What it tests |
|------|---------------|
| `tests/basic.test.js` | Basic sanity checks |
| `tests/dark-mode.test.js` | Dark mode toggle + persistence |
| `tests/assessments.test.js` | Answer validation, save/load, clear |
| `tests/coach-forwarding.test.js` | Coach queue, batch sending, consent |

### E2E Tests (Playwright)
| File | What it tests |
|------|---------------|
| `tests/e2e/app.spec.js` | Page load, HTML structure, dark mode toggle + persistence |

### CI/CD
- PR checks: Unit tests + build + E2E tests (`.github/workflows/pr-checks.yml`)
- Deploy: Build + deploy to GitHub Pages on push to main (`.github/workflows/static.yml`)

---

## Terminology

| Term | Meaning |
|------|---------|
| **Language** (`learning`) | Interface/base language the user knows (e.g. `deutsch`, `english`) |
| **Workshop** (`workshop`) | Subject being learned (e.g. `portugiesisch`, `open-learn-showcase`) |
| **Lesson** | Single learning unit within a workshop, numbered (e.g. `01-essential-verbs`) |
| **Section** | Group of examples within a lesson, with optional video/explanation |
| **Example** | Single q/a pair, optionally with assessment type and related items |
| **Learning Item** | Vocabulary/concept extracted from `rel` field, tracked independently |
| **Coach** | Optional external service that receives assessment answers |
