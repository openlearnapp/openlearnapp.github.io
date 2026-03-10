# YAML Schema Documentation

This document describes the YAML file schemas used for organizing and structuring learning content in the Open Learn platform.

## Overview

The application uses a hierarchical structure of YAML files to organize content:

**Hierarchy**: Language → Workshop → Lesson

1. **index.yaml** - Root index listing all available languages (interface languages)
2. **workshops.yaml** - Lists available workshops for each language
3. **lessons.yaml** - Lists lesson files for each workshop
4. **Individual lesson files** - Contain the actual lesson content (see [lesson-schema.md](lesson-schema.md))

## Directory Structure

```
lessons/
├── index.yaml                  # Root: lists all available languages
├── deutsch/                        # Language folder
│   ├── workshops.yaml             # Lists workshops for this language
│   ├── portugiesisch/             # Workshop folder
│   │   ├── lessons.yaml           # Lists lesson folder names
│   │   ├── 01-basic-verbs/        # Individual lesson folder
│   │   │   ├── content.yaml       # Lesson content
│   │   │   └── audio/             # Audio files for this lesson
│   │   ├── 02-modal-verbs/
│   │   │   ├── content.yaml
│   │   │   └── audio/
│   │   └── ...
│   └── englisch/
│       ├── lessons.yaml
│       └── 01-greetings/
│           ├── content.yaml
│           └── audio/
└── english/                        # Another language folder
    ├── workshops.yaml
    └── german/
        ├── lessons.yaml
        └── ...
```

## 1. index.yaml

**Location**: `lessons/index.yaml` (root level)

**Purpose**: Defines all available languages (interface/base languages) in the application.

### Schema

```yaml
languages:
  - string                      # Backward compatible: folder name
  - folder: string              # Local folder source
    code: string
  - url: string                 # Remote URL source (HTTP/HTTPS/IPFS)
    code: string
```

### Fields

- **languages** (array, required): List of available languages
  - **String format** (backward compatible): Treated as a local folder name
  - **Object format with `folder`**:
    - **folder** (string, required): Directory name for this language (e.g., "deutsch", "english")
    - **code** (string, optional): Language/locale code in BCP 47 format (e.g., "de-DE", "en-US")
  - **Object format with `url`**:
    - **url** (string, required): Remote URL to the language folder (HTTP, HTTPS, or IPFS)
    - **code** (string, optional): Language/locale code in BCP 47 format

Language codes are used for Web Speech API (text-to-speech) and the interface/base language voice.

### Example

```yaml
# Available languages
# This file lists all available base/interface languages
languages:
  # String format (backward compatible)
  - deutsch

  # Object format with folder
  - folder: english
    code: en-US

  # Object format with URL
  - url: https://example.com/languages/french
    code: fr-FR

  # IPFS URL
  - url: ipfs://QmExample.../spanish
    code: es-ES
```

### Usage in Code

```javascript
// In useLessons.js
const response = await fetch('lessons/index.yaml')
const data = yaml.load(text)

// Iterate through languages
for (const lang of data.languages) {
  const folder = lang.folder    // "deutsch"
  const code = lang.code         // "de-DE"
}
```

## 2. workshops.yaml

**Location**: `lessons/<language>/workshops.yaml` (also supports legacy `topics.yaml`)

**Purpose**: Lists all available workshops for a specific language.

### Schema

```yaml
workshops:
  - string                      # Backward compatible: folder name
  - folder: string              # Local folder source
    code: string
    coach:                      # Optional: workshop coach
      email: string
      name: string
  - url: string                 # Remote URL source (HTTP/HTTPS/IPFS)
    code: string
    coach:                      # Optional: workshop coach
      email: string
      name: string
```

> **Backward compatibility**: The file can also be named `topics.yaml` with a `topics:` key. The app tries `workshops.yaml` first, then falls back to `topics.yaml`.

### Fields

- **workshops** (array, required): List of available workshops
  - **String format** (backward compatible): Treated as a local folder name
  - **Object format with `folder`**:
    - **folder** (string, required): Directory name for this workshop (e.g., "portugiesisch", "math-algebra")
    - **code** (string, optional): Language/locale code for text-to-speech (BCP 47 format)
    - **title** (string, optional): Display name shown in the UI (defaults to formatted folder name)
    - **description** (string, optional): Short description shown on the workshop card
    - **color** (string, optional): HSL background color for the workshop (e.g., `"145 45% 92%"`). Shown as the accent bar on workshop cards. When lightness > 80%, it is automatically darkened by 40% for the page background.
    - **primaryColor** (string, optional): HSL primary/accent color for the workshop (e.g., `"220 75% 50%"`). Used for the header bar, links, and UI accents when inside the workshop.
    - **image** (string, optional): Thumbnail image for the workshop card. Shown below the accent bar. Supports relative paths (resolved from app base URL) or absolute URLs. No fallback image is shown when absent.
    - **coach** (object, optional): Workshop coach configuration
      - **email** (string, required): Coach's email address for `mailto:` results
      - **name** (string, optional): Coach or workshop name displayed in the UI
  - **Object format with `url`**:
    - **url** (string, required): Remote URL to the workshop folder
    - **code** (string, optional): Language/locale code for text-to-speech
    - **title** (string, optional): Display name shown in the UI
    - **description** (string, optional): Short description shown on the workshop card
    - **color** (string, optional): HSL background color (same as above)
    - **primaryColor** (string, optional): HSL primary/accent color (same as above)
    - **image** (string, optional): Thumbnail image (same as above)
    - **coach** (object, optional): Workshop coach configuration (same fields as above)

For language workshops, use the target language code (e.g., "pt-PT" for Portuguese). For non-language workshops, use the base language code.

When `coach` is configured, the Assessment Results page (`/:learning/:workshop/results`) shows a "Send Results via Email" button that opens the user's email client with a plain-text report.

### Example

```yaml
# Available workshops for German language
# This file lists all workshops available in the German interface
workshops:
  # Object format with folder, colors + coach
  - folder: portugiesisch
    code: pt-PT
    title: "Portugiesisch"
    description: "10 Lektionen zu den wichtigsten portugiesischen Verben."
    color: "30 50% 95%"            # Light orange background
    primaryColor: "25 80% 50%"     # Orange accent for header/links
    coach:
      email: "coach@example.com"

  # String format (backward compatible)
  - englisch

  # Workshop with green theme
  - folder: open-learn-guide
    code: de-DE
    color: "145 45% 92%"           # Light green background
    primaryColor: "220 75% 50%"    # Blue accent

  # Object format with URL
  - url: https://example.com/workshops/spanish
    code: es-ES

  # IPFS URL
  - url: ipfs://QmExample.../math-algebra
    code: de-DE    # Non-language workshop uses base language
```

### Usage in Code

```javascript
// In useLessons.js
const response = await fetch(`lessons/${lang}/workshops.yaml`)
const data = yaml.load(text)

for (const workshop of data.workshops) {
  const folder = workshop.folder    // "portugiesisch"
  const code = workshop.code         // "pt-PT"
}
```

## 3. lessons.yaml

**Location**: `lessons/<language>/<workshop>/lessons.yaml`

**Purpose**: Lists all lesson folders available for a specific workshop.

### Schema

```yaml
lessons:
  - string                      # Backward compatible: folder name
  - folder: string              # Local folder source
  - url: string                 # Remote URL source (HTTP/HTTPS/IPFS)
```

### Fields

- **lessons** (array, required): List of lessons
  - **String format** (backward compatible): Treated as a local folder name
  - **Object format with `folder`**: Local lesson folder name (e.g., "01-basic-verbs")
  - **Object format with `url`**: Remote URL to the lesson folder

Each lesson folder must contain a `content.yaml` file. Lessons are sorted by their `number` field in `content.yaml`.

### Example

```yaml
# Portuguese workshop lessons (German language)
lessons:
  # String format (backward compatible)
  - 01-basic-verbs

  # Object format with folder
  - folder: 02-modal-verbs

  # Object format with URL
  - url: https://example.com/lessons/03-daily-activities

  # IPFS URL
  - url: ipfs://QmExample.../04-past-tense
```

### Folder Structure

Each lesson folder contains:
```
01-basic-verbs/
├── content.yaml    # Required: Lesson content (YAML format)
└── audio/          # Optional: Audio files for pronunciation
    ├── title.mp3
    ├── 0-title.mp3
    ├── 0-0-q.mp3
    └── ...
```

### Naming Conventions

- **Prefix with number**: Use zero-padded numbers (01, 02, ..., 10, 11) for easy ordering
- **Descriptive names**: Use kebab-case for multi-word names (e.g., "basic-verbs", "daily-activities")
- **No trailing slash**: Do not include `/` at the end of folder names

### Usage in Code

```javascript
// In useLessons.js
const response = await fetch(`lessons/${lang}/${workshop}/lessons.yaml`)
const data = yaml.load(text)

// data.lessons is an array of strings (folder names)
console.log(data.lessons)  // ["01-basic-verbs", "02-modal-verbs", ...]

// Load each lesson from its folder
for (const folderName of data.lessons) {
  // Loads from: lessons/{lang}/{workshop}/{folderName}/content.yaml
  const lesson = await loadLesson(lang, workshop, folderName)
}
```

## Audio Integration

The language codes specified in `index.yaml` and `workshops.yaml` are used for audio generation and text-to-speech functionality.

### Language Usage by Content Type

| Content Type | YAML Field | Language Used | Code Source |
|--------------|-----------|---------------|-------------|
| **Lesson title** | `title` | **Base** language | `index.yaml` |
| **Section titles** | `sections[].title` | **Workshop** language | `workshops.yaml` |
| **Questions** | `sections[].examples[].q` | **Workshop** language | `workshops.yaml` |
| **Answers** | `sections[].examples[].a` | **Base** language | `index.yaml` |

**Example for `deutsch/portugiesisch/`:**
- Lesson title: German (de-DE)
- Section titles: Portuguese (pt-PT)
- Questions: Portuguese (pt-PT)
- Answers: German (de-DE)

### Audio File Structure

Audio files are stored **inside each lesson folder** for portability and self-containment:

```
lessons/<language>/<workshop>/<lesson-folder>/
├── content.yaml
└── audio/
    ├── title.mp3                  # Lesson title (in base language)
    ├── 0-title.mp3                # Section 0 title (in workshop language)
    ├── 0-0-q.mp3                  # Section 0, Example 0, Question (in workshop language)
    ├── 0-0-a.mp3                  # Section 0, Example 0, Answer (in base language)
    ├── 0-1-q.mp3
    ├── 0-1-a.mp3
    ├── 1-title.mp3                # Section 1 title (in workshop language)
    ├── 1-0-q.mp3
    └── ...
```

**Example**: `lessons/deutsch/portugiesisch/01-basic-verbs/audio/`

**Language Usage:**
- **Lesson title** uses the **base language** (e.g., German in `deutsch/portugiesisch/`)
- **Section titles** and **questions** use the **workshop language** (e.g., Portuguese in `deutsch/portugiesisch/`)
- **Answers** use the **base language** (e.g., German in `deutsch/portugiesisch/`)

**Benefits of this structure:**
- Each lesson folder is self-contained and portable
- Lessons can be distributed independently
- Easy to host on IPFS, CDN, or any file system with just a folder URL
- Audio files stay with their content

## URL Sources and Distribution

### Supported URL Types

The application supports three types of content sources:

1. **Local folders** (`folder: "name"`): Content stored locally in the `public/lessons/` directory
2. **HTTP/HTTPS URLs** (`url: "https://..."`): Content hosted on web servers
3. **IPFS URLs** (`url: "ipfs://..."`): Content hosted on the InterPlanetary File System

### IPFS Support

IPFS URLs are automatically resolved to HTTP gateway URLs:
- Format: `ipfs://QmHash.../path`
- Resolved to: `https://ipfs.io/ipfs/QmHash.../path`

This allows lessons to be hosted on IPFS and accessed through standard HTTP.

### URL Structure

When using URLs, the folder structure is preserved:

```
# Local folder
lessons/deutsch/portugiesisch/01-verbs/content.yaml

# HTTP URL
https://example.com/deutsch/portugiesisch/01-verbs/content.yaml

# IPFS URL (resolved)
https://ipfs.io/ipfs/QmHash.../deutsch/portugiesisch/01-verbs/content.yaml
```

### Mixed Sources

You can mix local folders and remote URLs at any level:

```yaml
languages:
  - folder: deutsch        # Local folder
    code: de-DE
  - url: https://example.com/english  # Remote language
    code: en-US
```

```yaml
workshops:
  - folder: portugiesisch  # Local folder workshop
    code: pt-PT
  - url: https://example.com/spanish  # Remote workshop
    code: es-ES
```

```yaml
lessons:
  - 01-basics              # Local folder lesson
  - url: https://example.com/02-advanced  # Remote lesson
```

### Benefits of URL Sources

1. **Distributed hosting**: Lessons can be hosted anywhere
2. **Content delivery networks**: Use CDNs for better performance
3. **Decentralization**: IPFS support for censorship-resistant content
4. **Collaboration**: Multiple contributors can host their own lessons
5. **Versioning**: Different URLs can point to different versions
6. **Scalability**: Large lesson libraries don't need to be stored locally

## Best Practices

### 1. Language Codes

- Use **BCP 47 format** (e.g., "en-US", "de-DE", "pt-PT", "es-ES")
- Include region variant when relevant (e.g., "pt-PT" for European Portuguese vs "pt-BR" for Brazilian)
- Ensure codes are supported by the Web Speech API in target browsers

### 2. Folder Names

- Use **lowercase** names
- Use **native language names** when possible (e.g., "deutsch" not "german")
- For compound words, use **hyphens** (e.g., "math-algebra", "driver-license")
- Keep names **consistent** and **descriptive**

### 3. File Organization

- Always create all three index files (`index.yaml`, `workshops.yaml`, `lessons.yaml`)
- Keep the directory structure consistent: `lessons/<language>/<workshop>/`
- Update index files immediately when adding new content

### 4. Versioning and Updates

- **When adding a new language**:
  1. Add entry to `index.yaml`
  2. Create `lessons/<language>/workshops.yaml`
  3. Create workshop folders and their `lessons.yaml` files

- **When adding a new workshop**:
  1. Add entry to appropriate `workshops.yaml`
  2. Create workshop folder
  3. Create `lessons.yaml` in workshop folder
  4. Add lesson files

- **When adding a new lesson**:
  1. Create lesson folder (e.g., `03-new-lesson/`)
  2. Create `content.yaml` in the folder with proper schema (see [lesson-schema.md](lesson-schema.md))
  3. Add folder name to `lessons.yaml`
  4. Optionally create `audio/` subfolder and generate audio files

## Validation

### Required Files Checklist

For each new content addition, ensure these files exist:

```
✓ lessons/index.yaml exists
✓ lessons/<language>/workshops.yaml exists
✓ lessons/<language>/<workshop>/lessons.yaml exists
✓ All lesson folders listed in lessons.yaml exist
✓ Each lesson folder contains content.yaml
✓ All YAML files are valid (parseable by js-yaml)
```

### Common Errors

**1. Missing index files**
```
Error: Failed to fetch workshops.yaml for deutsch: 404
→ Create lessons/deutsch/workshops.yaml
```

**2. Invalid YAML syntax**
```
Error: YAMLException: bad indentation
→ Check YAML syntax, ensure proper spacing (2 spaces, not tabs)
```

**3. Incorrect language codes**
```
Warning: Voice not available for language code 'xyz'
→ Use valid BCP 47 codes (en-US, de-DE, etc.)
```

**4. Incorrect folder references**
```
# ❌ Wrong - includes trailing slash or extension
lessons:
  - 01-basic-verbs/
  - 02-modal-verbs.yaml

# ✅ Correct - just folder names
lessons:
  - 01-basic-verbs
  - 02-modal-verbs
```

**5. Missing content.yaml**
```
Error: Failed to fetch lesson .../01-basic-verbs/content.yaml: 404
→ Ensure each lesson folder contains a content.yaml file
```

## Examples

### Full Example: Adding German lessons with English interface

**1. Update or create `lessons/index.yaml`:**
```yaml
languages:
  - folder: english
    code: en-US
```

**2. Create `lessons/english/workshops.yaml`:**
```yaml
workshops:
  - folder: german
    code: de-DE
```

**3. Create `lessons/english/german/lessons.yaml`:**
```yaml
lessons:
  - 01-basic-phrases
  - 02-numbers
```

**4. Create lesson folders and files:**
- `lessons/english/german/01-basic-phrases/content.yaml`
- `lessons/english/german/01-basic-phrases/audio/` (optional)
- `lessons/english/german/02-numbers/content.yaml`
- `lessons/english/german/02-numbers/audio/` (optional)

### Full Example: Adding Math Content

**1. Update `lessons/english/workshops.yaml`:**
```yaml
workshops:
  - folder: german
    code: de-DE
  - folder: math-algebra
    code: en-US    # Use interface language for non-language content
```

**2. Create `lessons/english/math-algebra/lessons.yaml`:**
```yaml
lessons:
  - 01-basic-operations
  - 02-equations
```

**3. Create lesson folders with math content:**
- `lessons/english/math-algebra/01-basic-operations/content.yaml`
- `lessons/english/math-algebra/02-equations/content.yaml`

## See Also

- [Lesson Schema Documentation](lesson-schema.md) - Individual lesson file structure
- [Audio System Documentation](audio-system.md) - Audio playback and TTS integration
