# External Workshop Guide

How to create a standalone repository with learning content that Open Learn can consume as a remote content source.

## Overview

Open Learn supports loading lessons from external repositories hosted on GitHub Pages (or any static file server). This allows workshop creators to maintain their own content independently and share it with learners via a simple link.

**The flow:**
1. You create a repository with lessons in the Open Learn format
2. You deploy it to GitHub Pages
3. You share a link like `https://felixboehm.github.io/open-learn/#/add?source=https://YOUR-USER.github.io/YOUR-REPO/index.yaml`
4. The learner clicks the link, confirms, and your content appears alongside the built-in content

## Repository Structure

Your repository must follow this exact directory structure. The root of your deployed site serves as the content source URL.

```
your-workshop-repo/
├── index.yaml              # Required: declares available interface languages
├── deutsch/                    # One folder per interface language
│   ├── workshops.yaml          # Required: declares available workshops
│   └── your-workshop/          # One folder per workshop
│       ├── lessons.yaml        # Required: lists lesson folders
│       ├── 01-first-lesson/    # Lesson folders
│       │   ├── content.yaml    # Required: lesson content
│       │   └── audio/          # Optional: audio files
│       │       ├── title.mp3
│       │       ├── 0-title.mp3
│       │       ├── 0-0-q.mp3
│       │       ├── 0-0-a.mp3
│       │       └── ...
│       └── 02-second-lesson/
│           ├── content.yaml
│           └── audio/
└── english/                    # Optional: same content in English interface
    ├── workshops.yaml
    └── your-workshop-en/
        ├── lessons.yaml
        └── ...
```

## File-by-File Reference

### 1. `index.yaml` (Root)

Declares which interface languages your workshop supports. The folder names must match actual folders in your repository.

```yaml
languages:
  - folder: deutsch
    code: de-DE
  - folder: english
    code: en-US
```

**Fields:**
- `folder` (string, required): Directory name — must match a folder in your repo
- `code` (string, required): BCP 47 language code — used for audio generation (text-to-speech voice selection)

**Supported language codes:**

| Code | Language | macOS TTS Voice |
|------|----------|-----------------|
| `de-DE` | German | Anna |
| `en-US` | English (US) | Samantha |
| `pt-PT` | Portuguese (EU) | Joana |
| `es-ES` | Spanish | Mónica |

> You can support a single language or multiple languages. Each language provides its own set of workshops.

### 2. `<language>/workshops.yaml`

Lists the workshops available for a given interface language.

```yaml
workshops:
  - folder: portugiesisch
    code: pt-PT
    title: "Portugiesisch"
    description: "Die wichtigsten portugiesischen Verben."
    labels: ["Sprache"]
    color: "30 50% 95%"
    primaryColor: "25 80% 50%"
  - folder: first-aid
    code: de-DE
    labels: ["Gesundheit"]
    color: "0 70% 95%"
    primaryColor: "0 65% 45%"
```

**Fields:**
- `folder` (string, required): Directory name of the workshop — must match a folder inside the language directory
- `code` (string, required): BCP 47 code for the **workshop's** language
  - For language-learning workshops: use the target language code (e.g. `pt-PT` for Portuguese)
  - For non-language workshops (math, first aid, etc.): use the same code as the interface language (e.g. `de-DE`)
- `title` (string, optional): Display name shown in the UI (defaults to formatted folder name)
- `description` (string, optional): Short description shown on the workshop card
- `labels` (array of strings, optional): Category tags for filtering on the workshop overview. Supports hierarchy with `/` separator — `"IT"` is a top-level category, `"IT/Linux"` is a sub-label revealed when "IT" is filtered. Example: `["IT", "IT/Linux"]`
- `color` (string, optional): HSL background color without the `hsl()` wrapper (e.g. `"145 45% 92%"`). Displayed as the accent bar on workshop cards and as the page background when inside the workshop. Light values (lightness > 80%) are automatically darkened for better visibility.
- `primaryColor` (string, optional): HSL primary/accent color (e.g. `"220 75% 50%"`). Used for the header bar, links, and interactive elements when inside the workshop. If not set, the default blue is used.

> The `code` determines which text-to-speech voice is used for questions (`q` fields) in audio generation.

### 3. `<language>/<workshop>/lessons.yaml`

Lists all lesson folders for a workshop, in order.

```yaml
lessons:
  - 01-introduction
  - 02-basics
  - 03-advanced-topics
```

Each entry is a **folder name** (not a file name). Each folder must contain a `content.yaml` file.

**Naming convention:** Prefix with zero-padded numbers for ordering: `01-`, `02-`, ... `10-`, `11-`.

### 4. `<language>/<workshop>/<lesson>/content.yaml`

The actual lesson content. This is where the learning material lives.

```yaml
version: 1
number: 1
title: "Lesson Title"
description: "Brief description of what this lesson covers"
sections:
  - title: "Section Title"
    explanation: |
      Markdown-formatted explanation text.
      Supports **bold**, _italic_, lists, tables, etc.
    examples:
      - q: "Question or source text"
        a: "Answer or target text"
        labels: ["Category1", "Category2"]
        rel:
          - ["term", "translation", "context"]
          - ["another-term", "another-translation"]
```

#### Top-Level Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `version` | integer | no | Schema version (default: 1) |
| `number` | integer | yes | Lesson number — used for ordering and display |
| `title` | string | yes | Lesson title |
| `description` | string | no | Brief description shown on lesson cards |
| `sections` | array | yes | Array of sections (see below) |

#### Section Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | string | yes | Section heading |
| `explanation` | string | no | Markdown text displayed before examples |
| `examples` | array | yes | Array of Q&A examples |

#### Example Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `q` | string | yes | Question / source content |
| `a` | string | yes | Answer / target content |
| `labels` | array of strings | no | Tags for categorization (shown as badges) |
| `rel` | array of arrays | no | Related learning items (vocabulary, concepts) |

#### Related Items (`rel`)

Each related item is an array of strings:
- **First element**: unique identifier (used for progress tracking across lessons)
- **Second element**: translation or explanation
- **Third element** (optional): additional context (part of speech, usage note)

```yaml
rel:
  - ["ser", "sein (permanent)", "Verb"]
  - ["casa", "Haus", "Substantiv"]
  - ["2 + 2 = 4", "basic addition"]        # Non-language example
```

> Items with the same first element across different lessons are treated as the same learning item. When a learner marks it as "learned" in one lesson, it's learned everywhere.

### 5. Audio Files (Optional)

Each lesson can include pre-recorded audio files in an `audio/` subfolder.

#### Naming Convention

```
audio/
├── title.mp3              # Lesson title (in interface language)
├── 0-title.mp3            # Section 0 title (in topic language)
├── 0-0-q.mp3              # Section 0, Example 0, Question (topic language)
├── 0-0-a.mp3              # Section 0, Example 0, Answer (interface language)
├── 0-1-q.mp3              # Section 0, Example 1, Question
├── 0-1-a.mp3              # Section 0, Example 1, Answer
├── 1-title.mp3            # Section 1 title
├── 1-0-q.mp3              # Section 1, Example 0, Question
├── 1-0-a.mp3              # Section 1, Example 0, Answer
└── ...
```

**Pattern:** `{sectionIndex}-{exampleIndex}-{q|a}.mp3` and `{sectionIndex}-title.mp3`

**Language mapping:**

| Content | Voice Language | Why |
|---------|---------------|-----|
| Lesson title (`title.mp3`) | Interface language (e.g. German) | It's navigation/metadata |
| Section titles (`N-title.mp3`) | Workshop language (e.g. Portuguese) | Introduces the workshop content |
| Questions (`N-N-q.mp3`) | Workshop language | The content being learned |
| Answers (`N-N-a.mp3`) | Interface language | The translation/explanation |

#### Generating Audio

If you have access to the Open Learn repository, you can use the `generate-audio.sh` script:

```bash
# From the open-learn repo, pointing to your workshop's lesson folder
./generate-audio.sh /path/to/your-workshop/deutsch/your-workshop/01-first-lesson/
```

Requirements: macOS with `say` command, `yq` (`brew install yq`), `ffmpeg` (`brew install ffmpeg`).

Alternatively, you can generate MP3 files with any TTS tool — just follow the naming convention above.

## Complete Example

Here is a minimal but complete workshop repository for a Portuguese language course with German interface:

### `index.yaml`

```yaml
languages:
  - folder: deutsch
    code: de-DE
```

### `deutsch/workshops.yaml`

```yaml
workshops:
  - folder: portugiesisch-basics
    code: pt-PT
```

### `deutsch/portugiesisch-basics/lessons.yaml`

```yaml
lessons:
  - 01-greetings
  - 02-numbers
```

### `deutsch/portugiesisch-basics/01-greetings/content.yaml`

```yaml
version: 1
number: 1
title: "Begrüßungen"
description: "Grundlegende Begrüßungen und Verabschiedungen"
sections:
  - title: "Olá - Hallo"
    explanation: |
      Die wichtigsten Begrüßungen auf Portugiesisch.

      **Formell vs. Informell:**
      - **Olá** ist universell (wie "Hallo")
      - **Bom dia** ist formeller (wie "Guten Tag")
    examples:
      - q: "Olá, como estás?"
        a: "Hallo, wie geht es dir?"
        labels: ["Informell"]
        rel:
          - ["olá", "hallo", "Begrüßung"]
          - ["como estás", "wie geht es dir", "Frage - informell"]

      - q: "Bom dia, como está?"
        a: "Guten Tag, wie geht es Ihnen?"
        labels: ["Formell"]
        rel:
          - ["bom dia", "guten Tag", "Begrüßung - formell"]
          - ["como está", "wie geht es Ihnen", "Frage - formell"]

      - q: "Boa tarde!"
        a: "Guten Nachmittag!"
        rel:
          - ["boa tarde", "guten Nachmittag", "Begrüßung - ab ca. 12 Uhr"]

  - title: "Adeus - Tschüss"
    explanation: |
      Verabschiedungen für verschiedene Situationen.
    examples:
      - q: "Adeus!"
        a: "Auf Wiedersehen!"
        labels: ["Formell"]
        rel:
          - ["adeus", "auf Wiedersehen", "Verabschiedung - formell"]

      - q: "Tchau, até amanhã!"
        a: "Tschüss, bis morgen!"
        labels: ["Informell"]
        rel:
          - ["tchau", "tschüss", "Verabschiedung - informell"]
          - ["até amanhã", "bis morgen", "Zeitangabe"]
```

### `deutsch/portugiesisch-basics/02-numbers/content.yaml`

```yaml
version: 1
number: 2
title: "Zahlen 1-10"
description: "Die Zahlen von eins bis zehn"
sections:
  - title: "Um a cinco"
    explanation: |
      Die Zahlen 1-5 auf Portugiesisch.
    examples:
      - q: "Eu tenho um gato."
        a: "Ich habe eine Katze."
        rel:
          - ["um", "eins/ein", "Zahl"]
          - ["gato", "Katze", "Substantiv - Tier"]

      - q: "Ela tem dois irmãos."
        a: "Sie hat zwei Brüder."
        rel:
          - ["dois", "zwei", "Zahl"]
          - ["irmãos", "Brüder", "Substantiv - Familie"]

      - q: "Nós temos três carros."
        a: "Wir haben drei Autos."
        rel:
          - ["três", "drei", "Zahl"]
          - ["carros", "Autos", "Substantiv"]
```

## Non-Language Workshop Example

The same format works for any subject. Here's a first-aid workshop example:

### `index.yaml`

```yaml
languages:
  - folder: deutsch
    code: de-DE
```

### `deutsch/workshops.yaml`

```yaml
workshops:
  - folder: erste-hilfe
    code: de-DE          # Same as interface language for non-language workshops
```

### `deutsch/erste-hilfe/01-basics/content.yaml`

```yaml
version: 1
number: 1
title: "Grundlagen der Ersten Hilfe"
description: "Die wichtigsten Sofortmaßnahmen"
sections:
  - title: "Rettungskette"
    explanation: |
      Die **Rettungskette** beschreibt die Abfolge der Hilfsmaßnahmen:
      1. Absichern der Unfallstelle
      2. Notruf absetzen (112)
      3. Erste Hilfe leisten
      4. Rettungsdienst übergeben
    examples:
      - q: "Was ist die Notrufnummer in Europa?"
        a: "112"
        labels: ["Notruf"]
        rel:
          - ["112", "Europäische Notrufnummer"]

      - q: "Welche 5 W-Fragen beantwortet man beim Notruf?"
        a: "Wo, Was, Wie viele, Welche Verletzungen, Warten auf Rückfragen"
        labels: ["Notruf", "5 W-Fragen"]
        rel:
          - ["5 W-Fragen", "Wo, Was, Wie viele, Welche, Warten"]
```

## Deploying to GitHub Pages

### Step 1: Create a GitHub Repository

```bash
mkdir my-workshop
cd my-workshop
git init

# Create your content files (index.yaml, workshops.yaml, etc.)

git add -A
git commit -m "Initial workshop content"
gh repo create YOUR-USER/my-workshop --public --source . --push
```

### Step 2: Enable GitHub Pages

Either via GitHub UI (Settings → Pages → Source: GitHub Actions) or via API:

```bash
gh api repos/YOUR-USER/my-workshop/pages -X POST -f build_type=workflow
```

### Step 3: Add a Deployment Workflow

Create `.github/workflows/static.yml`:

```yaml
name: Deploy to Pages

on:
  push:
    branches: ["main"]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Pages
        uses: actions/configure-pages@v5

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: '.'

      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

### Step 4: Push and Wait for Deployment

```bash
git add .github/workflows/static.yml
git commit -m "Add GitHub Pages deployment"
git push
```

Wait for the Action to complete. Your content is now available at `https://YOUR-USER.github.io/my-workshop/`.

### Step 5: Share the Link

The share link for Open Learn is:

```
https://felixboehm.github.io/open-learn/#/add?source=https://YOUR-USER.github.io/my-workshop/index.yaml
```

When a learner clicks this link:
1. Open Learn fetches the `index.yaml` URL to discover content
2. Shows the learner what's available (languages, workshops)
3. Learner confirms → your content is saved in their browser
4. Your workshops appear on the Home page alongside the built-in content

## Checklist

Before sharing your workshop, verify:

- [ ] `index.yaml` exists at the root and lists at least one language
- [ ] Each language folder has a `workshops.yaml`
- [ ] Each workshop folder has a `lessons.yaml`
- [ ] Each lesson folder listed in `lessons.yaml` exists and contains `content.yaml`
- [ ] Every `content.yaml` has `number`, `title`, and at least one section with examples
- [ ] Every example has both `q` and `a` fields
- [ ] Language codes are valid BCP 47 codes
- [ ] GitHub Pages is enabled and deployment succeeded
- [ ] The share link works: `#/add?source=YOUR-URL`

## Troubleshooting

**Content not loading:**
- Check browser console for 404 errors
- Verify your GitHub Pages URL is correct: `https://YOUR-USER.github.io/YOUR-REPO/`
- Ensure `index.yaml` is at the root, not in a subdirectory

**Audio not playing:**
- Verify audio file naming matches the convention exactly
- Check that files are MP3 format
- Ensure section/example indices are zero-based (first section = `0`, first example = `0`)

**Workshops not appearing after adding:**
- Refresh the page (F5) to reload content sources
- Check localStorage in browser DevTools: key `contentSources` should contain your URL

**CORS errors:**
- GitHub Pages serves files with `Access-Control-Allow-Origin: *` by default — no issues
- If self-hosting: ensure your server sends CORS headers

## Automated Workshop Creation with Claude Code

Instead of creating workshops manually, you can use the **Workshop Creator Plugin** for Claude Code to generate complete workshops automatically.

### Installation

```
/install-plugin https://github.com/openlearnapp/plugin-workshop-creator
```

### Workflow

```
/workshop-creator <topic>            Create workshop in one language
        ↓
/translate-workshop <name> --lang en Add more languages
        ↓
/extend-workshop <name> --lessons N  Add more lessons over time
        ↓
/publish-workshop <name>             Deploy to GitHub Pages
```

### Commands

| Command | Description |
|---------|-------------|
| `/workshop-creator <topic>` | Create a workshop in one language with lessons, assessments, and thumbnails |
| `/translate-workshop <name> --lang <code>` | Add a new language translation to an existing workshop |
| `/extend-workshop <name> --lessons 11-20` | Add more lessons to an existing workshop |
| `/publish-workshop [name]` | Publish to GitHub and deploy via GitHub Pages |
| `/check-workshops` | Show status of all workshops (local, online, sources) |

### Features

The plugin generates Schema Version 2 compliant content with:
- Interactive assessments with `correct` markers (input, select, multiple-choice)
- SVG thumbnails and GitHub Pages deployment workflow
- Evidence-based learning methods (Active Recall, Spaced Repetition, Desirable Difficulty)
- `CONTRIBUTING.md` in every workshop for community translations

### Community Translations

Each workshop includes a `CONTRIBUTING.md` that explains how to add a new language. Contributors translate `a`, `explanation`, `title`, and `description` fields — while `q`, `rel` IDs, `labels`, and `type` stay unchanged.

See the [plugin repository](https://github.com/openlearnapp/plugin-workshop-creator) for full documentation.

## See Also

- [Lesson Schema Documentation](lesson-schema.md) — detailed field reference for `content.yaml`
- [YAML Schemas Documentation](yaml-schemas.md) — index file schemas (`index.yaml`, `workshops.yaml`, `lessons.yaml`)
- [Audio System Documentation](audio-system.md) — audio generation and playback details
