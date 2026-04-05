# Workshop Guide

How to create a workshop for Open Learn.

## Repository Structure

Every workshop is a repository (or folder) with this structure:

```
workshop-my-topic/
├── index.html                     # Landing page (uses open-learn.js components)
├── README.md                      # Workshop description (for GitHub)
├── CHANGELOG.md                   # Version history (rendered on landing page)
├── index.yaml                     # Languages this workshop supports
├── deutsch/                       # German interface
│   ├── workshops.yaml             # Workshop metadata
│   └── my-topic/                  # Workshop content
│       ├── lessons.yaml           # Lesson list
│       ├── thumbnail.svg          # Workshop thumbnail (optional)
│       └── 01-first-lesson/
│           ├── content.yaml       # Lesson content
│           └── audio/             # Pre-recorded audio (optional)
└── english/                       # English interface (optional)
    ├── workshops.yaml
    └── my-topic-en/
        ├── lessons.yaml
        └── 01-first-lesson/
            └── content.yaml
```

## YAML Files

### `index.yaml`

Declares which interface languages the workshop supports.

```yaml
languages:
  - folder: deutsch
    code: de-DE
  - folder: english
    code: en-US
```

### `<language>/workshops.yaml`

Workshop metadata — title, description, colors, labels.

```yaml
workshops:
  - folder: my-topic
    code: de-DE
    title: "Mein Workshop"
    description: "Kurze Beschreibung"
    labels: ["IT", "Beginner"]
    color: "220 45% 93%"
    primaryColor: "220 75% 45%"
    image: "my-topic/thumbnail.svg"
```

| Field | Required | Description |
|-------|----------|-------------|
| `folder` | yes | Directory name of the workshop |
| `code` | yes | BCP 47 language code (for TTS voice). Use target language for language workshops, interface language for others |
| `title` | no | Display name (defaults to folder name) |
| `description` | no | Short description on workshop card |
| `labels` | no | Category tags for filtering (e.g. `["IT", "Linux"]`) |
| `color` | no | HSL background color (e.g. `"145 45% 92%"`) |
| `primaryColor` | no | HSL accent color (e.g. `"220 75% 50%"`) |
| `image` | no | Thumbnail image path (relative to language folder) |
| `coach` | no | Coach config with `email` and optional `name` |

### `<language>/<workshop>/lessons.yaml`

Lists lesson folders in order.

```yaml
lessons:
  - 01-introduction
  - 02-basics
  - 03-advanced
```

### `<language>/<workshop>/<lesson>/content.yaml`

The lesson content.

```yaml
number: 1
title: "Introduction"
description: "Getting started"
image: "images/intro.svg"
sections:
  - title: "Section Title"
    image: "images/section.svg"
    explanation: |
      Markdown explanation text.
    examples:
      - q: "Question text"
        a: "Answer text"
        labels: ["Category"]
        rel:
          - ["term", "translation", "context"]
```

#### Lesson Fields

| Field | Required | Description |
|-------|----------|-------------|
| `number` | yes | Lesson number for ordering |
| `title` | yes | Lesson title |
| `description` | no | Short description |
| `image` | no | Lesson thumbnail image |
| `sections` | yes | Array of sections |

#### Section Fields

| Field | Required | Description |
|-------|----------|-------------|
| `title` | yes | Section heading |
| `image` | no | Section image (shown in story mode) |
| `explanation` | no | Markdown text before examples |
| `examples` | yes | Array of examples |

#### Example Fields

| Field | Required | Description |
|-------|----------|-------------|
| `q` | yes | Question / source text |
| `a` | no | Answer / translation |
| `type` | no | `input`, `select`, or `multiple-choice` (default: `qa`) |
| `labels` | no | Tags shown as badges |
| `rel` | no | Related learning items: `["id", "translation", "context"]` |
| `voice` | no | Voice label (e.g. `narrator` for story mode) |
| `options` | no | Array of options for `select`/`multiple-choice` |
| `answers` | no | Array of accepted answers for `input` type |
| `goto_correct` | no | Navigation on correct answer: `{ lesson: N, section: N }` |
| `goto_wrong` | no | Navigation on wrong answer |

#### Assessment Options

For `select` and `multiple-choice` types:

```yaml
- q: "Where should Mila go?"
  type: select
  options:
    - text: "To the river"
      image: "images/river.svg"
      correct: true
      goto: { lesson: 2, section: 0 }
    - text: "To the house"
      image: "images/house.svg"
      goto: { lesson: 3, section: 0 }
```

For `input` type with multiple accepted answers:

```yaml
- q: "What is the capital of Portugal?"
  type: input
  answers:
    - text: "Lisbon"
      goto: { section: 2 }
    - text: "Lisboa"
      goto: { section: 2 }
  goto_wrong: { section: 1 }
```

## Audio

Each lesson can include pre-recorded audio in an `audio/` subfolder.

### File Naming

| File | Content | Voice |
|------|---------|-------|
| `title.mp3` | Lesson title | Interface language |
| `{s}-title.mp3` | Section title | Workshop language |
| `{s}-{e}-q.mp3` | Question | Workshop language |
| `{s}-{e}-a.mp3` | Answer | Interface language |
| `{s}-{e}-opt{i}.mp3` | Assessment option text | Workshop language |

Indices are zero-based: first section = `0`, first example = `0`.

### Voice Roles (Story Mode)

Examples can specify a `voice` role for character-specific voices in story mode:

```yaml
examples:
  - q: "Es war einmal ein kleines Mädchen namens Mila."
    voice: narrator
  - q: "Komm herein, mein Kind."
    voice: grandma
  - q: "Quak! Ich bin Fridolin!"
    voice: fridolin
```

The audio generator maps roles to TTS voices. Examples without `voice:` use the default voice.

### Generating Audio

Two generators are available — pick based on quality vs setup needs:

**Option 1: Edge TTS (recommended — natural neural voices)**

```bash
./generate-audio-edge.sh /path/to/workshop/deutsch/my-topic
```

Requires `uv` (https://github.com/astral-sh/uv) and `yq` (`brew install yq`). Uses Microsoft Edge TTS Neural voices via `uvx edge-tts`.

Voice mapping via `voices.yaml` in the workshop directory:

```yaml
# voices.yaml
narrator: de-DE-KillianNeural
grandma: de-DE-KatjaNeural
fridolin: de-DE-ConradNeural
default: de-DE-AmalaNeural
```

List available voices: `uvx edge-tts --list-voices | grep de-DE`

**Option 2: macOS `say` (fast, no dependencies)**

```bash
./generate-audio.sh /path/to/workshop/deutsch/my-topic/01-lesson/

# All lessons
./generate-audio.sh

# Force regenerate
./generate-audio.sh -f
```

Requires macOS with `say`, `yq`, and `ffmpeg` (`brew install yq ffmpeg`).

### Fallback

If audio files are missing, the app falls back to browser SpeechSynthesis.

## Publishing

### GitHub Pages

```bash
# Create repo
mkdir workshop-my-topic && cd workshop-my-topic
git init
# ... create content files ...
git add -A
git commit -m "Initial workshop"
gh repo create openlearnapp/workshop-my-topic --public --source . --push
```

Add `.github/workflows/static.yml` for deployment:

```yaml
name: Deploy to Pages
on:
  push:
    branches: ["main"]
permissions:
  contents: read
  pages: write
  id-token: write
jobs:
  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/configure-pages@v5
      - uses: actions/upload-pages-artifact@v3
        with:
          path: '.'
      - uses: actions/deploy-pages@v4
```

### Share Link

Basic share link:

```
https://open-learn.app/#/add?source=https://YOUR-USER.github.io/workshop-my-topic/index.yaml
```

With preferred interface language (platform switches language and goes directly to the workshop):

```
https://open-learn.app/#/add?source=https://YOUR-USER.github.io/workshop-my-topic/index.yaml&lang=deutsch
```

The `lang` parameter tells the platform which interface language to use when loading the workshop. Useful for linking from a workshop landing page where the user already selected a language — the shared `open-learn.js` landing page does this automatically.

### Making it a Default Source

Add to `default-sources.yaml` in the platform repo:

```yaml
sources:
  - https://open-learn.app/workshop-my-topic/index.yaml
```

## Landing Page

Every workshop gets a landing page at its GitHub Pages URL (e.g. `open-learn.app/workshop-my-topic/`). The page is powered by a shared component library — no code to maintain per workshop.

### Minimal setup (default page)

Create `index.html` in your workshop repo:

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body>
  <div id="app">
    <ol-workshop-page />
  </div>
  <script src="https://open-learn.app/shared/open-learn.js"></script>
  <script>OpenLearn.mount()</script>
</body>
</html>
```

This renders the full landing page automatically from your YAML files:
- Title and description from `workshops.yaml` (localized)
- Language picker with flags (switches all content)
- Labels from `workshops.yaml`
- "Add Workshop to Open Learn" button (passes selected language)
- Lesson list with titles from `content.yaml` (localized)
- Changelog from `CHANGELOG.md` (if present)
- Footer with GitHub link

### Custom composition

Use individual components as building blocks:

```html
<div id="app">
  <div style="display:flex;align-items:center;gap:12px">
    <ol-language-picker />
    <h1>{{ store.title }}</h1>
  </div>
  <p>{{ store.description }}</p>
  <ol-labels />
  <ol-add-button text="Start Learning" />
  <ol-lesson-list />
  <ol-changelog />
  <ol-footer />
</div>
<script src="https://open-learn.app/shared/open-learn.js"></script>
<script>OpenLearn.mount()</script>
```

### Available components

| Component | Description |
|-----------|-------------|
| `<ol-workshop-page />` | Full default landing page (composes all below) |
| `<ol-language-picker />` | Dropdown with flags, switches all content |
| `<ol-labels />` | Label badges from workshop metadata |
| `<ol-add-button />` | CTA button (prop `text` to customize label) |
| `<ol-lesson-list />` | Numbered lesson list with titles |
| `<ol-changelog />` | Rendered `CHANGELOG.md` |
| `<ol-footer />` | GitHub + Open Learn links |

All components share state via Vue provide/inject — the `store` object is available in the template with workshop data (`store.title`, `store.description`, `store.lessons`, etc.).

### CHANGELOG.md

Add a `CHANGELOG.md` to your workshop repo. It's rendered on the landing page automatically:

```markdown
# Changelog

## v1.0 — April 2026

- 10 lessons covering basic vocabulary
- Interactive assessments
- English and German interface
```

## Workshop CLAUDE.md

Every workshop repo should have a `CLAUDE.md` at the root. It gives Claude Code (and new contributors) immediate context when working on the workshop, without having to browse the platform docs.

### Template

```markdown
# <Workshop Name>

## Purpose
What does this workshop teach? What problem does it solve?

## Target Audience
Who is this for? Age range, prior knowledge, skill level.

## Structure
- N lessons, ~X minutes total
- Languages: deutsch, english, ...
- Special features: story mode, branching, assessments, ...

## Voice Mapping (if story mode)
| Role | Character | Voice |
|------|-----------|-------|
| narrator | Erzähler | de-DE-KillianNeural |
| grandma | Oma | de-DE-KatjaNeural |

## Specific Conventions
Workshop-specific rules, e.g.:
- All assessments have goto_correct/goto_wrong
- Images live in lesson/images/
- Audio regenerated with edge-tts voice mapping

## Development

Generate audio:
\`\`\`bash
bash generate-audio.sh deutsch/my-topic
\`\`\`

Local preview: place as sibling of openlearnapp.github.io, run \`pnpm dev\`.

## See Also
- [Open Learn Platform](https://github.com/openlearnapp/openlearnapp.github.io)
- [Workshop Guide](https://github.com/openlearnapp/openlearnapp.github.io/blob/main/docs/workshop-guide.md)
- [Lesson Schema](https://github.com/openlearnapp/openlearnapp.github.io/blob/main/docs/lesson-schema.md)
- [Workshop Creator Plugin](https://github.com/openlearnapp/plugin-workshop-creator)
```

### Why per-workshop CLAUDE.md?

- **Context for Claude Code**: when working on the workshop repo, Claude has immediate understanding without reading the platform docs
- **Onboarding**: new contributors learn the workshop's goals and conventions in one file
- **References over duplication**: links to central docs (schema, guide) instead of copying content
- **Workshop-specific conventions**: voice mappings, special features, rules unique to this workshop

## Local Development

Place the workshop repo as a sibling of the platform repo:

```
your-workspace/
├── openlearnapp.github.io/    ← pnpm dev
└── workshop-my-topic/         ← auto-detected, shown with 🔧
```

The Vite dev server auto-detects `workshop-*` directories and serves them with the `local-dev` label. Changes are reflected immediately.

## Workshop Creator Plugin

Generate workshops automatically with Claude Code:

```
/install-plugin https://github.com/openlearnapp/plugin-workshop-creator
```

| Command | Description |
|---------|-------------|
| `/workshop-creator <topic>` | Create a workshop with lessons and assessments |
| `/translate-workshop <name> --lang <code>` | Add a language translation |
| `/extend-workshop <name> --lessons 11-20` | Add more lessons |
| `/publish-workshop [name]` | Deploy to GitHub Pages |

## See Also

- [Lesson Schema](lesson-schema.md) — detailed `content.yaml` reference
- [YAML Schemas](yaml-schemas.md) — index file schemas
- [Audio System](audio-system.md) — audio generation and playback
