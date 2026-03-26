# Workshop Guide

How to create a workshop for Open Learn.

## Repository Structure

Every workshop is a repository (or folder) with this structure:

```
workshop-my-topic/
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

### Generating Audio

```bash
# From the Open Learn repo
./generate-audio.sh /path/to/workshop/deutsch/my-topic/01-lesson/

# Generate all lessons
./generate-audio.sh

# Force regenerate
./generate-audio.sh -f
```

Requires macOS with `say`, `yq` (`brew install yq`), and `ffmpeg` (`brew install ffmpeg`).

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

```
https://open-learn.app/#/add?source=https://YOUR-USER.github.io/workshop-my-topic/index.yaml
```

### Making it a Default Source

Add to `default-sources.yaml` in the platform repo:

```yaml
sources:
  - https://open-learn.app/workshop-my-topic/index.yaml
```

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
