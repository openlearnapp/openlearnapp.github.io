# Kids Mode Concept

> Concept for making Open Learn accessible to children, including pre-readers.
> Related: [Issue #6](https://github.com/openlearnapp/openlearnapp.github.io/issues/6)

---

## Vision

Every child can learn with Open Learn — even if they can't read yet. A "Kids Mode" adapts the interface and content delivery to match a child's age and abilities, without changing the underlying platform architecture.

---

## 1. Core Challenges

| Challenge | Impact |
|-----------|--------|
| Children can't read instructions | Can't navigate the UI |
| Short attention spans | Long lessons are overwhelming |
| No keyboard skills | Text input assessments don't work |
| Need immediate positive feedback | Frustration kills motivation |
| Small motor skills | Tiny tap targets are hard |

---

## 2. Kids Mode — Interface Changes

### 2.1 Navigation Simplification

- **Remove**: labels, assessment results page, learning items browser, settings page
- **Keep**: lesson cards, examples, audio playback, progress indicators
- **Add**: large "next" / "back" buttons, visual progress bar per lesson

### 2.2 Visual Design

- Larger text (minimum 18px body, 24px headings)
- High-contrast colors, no grey-on-grey
- Large tap targets (minimum 56px buttons)
- Fewer elements per screen — one thing at a time

### 2.3 Audio-First Mode

For pre-readers: audio plays **automatically** when a lesson opens.
- Every Q&A pair is read aloud without the user pressing play
- Images shown alongside audio
- Child just listens and taps ✓ when ready for the next item

### 2.4 Assessment Types for Kids

| Standard Type | Kids Alternative |
|---------------|-----------------|
| `input` (typing) | Not suitable — replace with `select` |
| `select` (radio) | ✅ Works — use big image buttons instead of text |
| `multiple-choice` | Simplified: max 2 options (yes/no, true/false) |

---

## 3. Workshop Design for Kids

Workshop creators opt into Kids Mode via `workshops.yaml`:

```yaml
- folder: mathe-grundschule
  code: de-DE
  title: "Mathe für die 1. Klasse"
  kids_mode: true          # NEW — enables kids interface
  auto_audio: true         # NEW — audio plays automatically
  max_examples_per_screen: 1  # NEW — one example at a time
```

### 3.1 Content Guidelines for Kid-Friendly Workshops

- **Short lessons**: max 5–8 examples per lesson
- **Images required**: every example should have a picture
- **Simple language**: short sentences, no jargon
- **Positive framing**: questions like "Which animal is this?" not "Identify the species"
- **Audio for everything**: question, answer, and section titles recorded

### 3.2 Example: Learning to Count (Math, Age 5–7)

```yaml
number: 1
title: "Zahlen 1 bis 5"
sections:
  - title: "Zählen"
    examples:
      - q: "Wie viele Äpfel siehst du? 🍎🍎🍎"
        a: "3"
        image: "3-apples.png"
        type: select
        options:
          - text: "2"
          - text: "3"
            correct: true
          - text: "4"
```

---

## 4. Reward System

Kids need encouragement. After completing a lesson:

- Big ✅ animation with a positive sound
- Star/badge shown on the lesson card
- Simple progress: "You learned X lessons today! ⭐"

Implementation: stored in `localStorage` alongside existing progress, no new infrastructure needed.

---

## 5. Implementation Plan

### Phase 1 — Content (no code changes)
- Create a sample kids workshop (e.g. counting 1–10, shapes, colors)
- Validate the existing platform works well enough with image-heavy, audio-first content

### Phase 2 — Kids Mode Toggle (small code change)
- Add `kids_mode` flag to workshop metadata
- When active: larger fonts, bigger buttons, hide advanced UI elements
- Implemented via a CSS class on `<body>` (same pattern as `dark` mode)

### Phase 3 — Auto-Audio
- Add `auto_audio` workshop setting
- `useAudio.js`: start playing automatically when lesson loads (if setting active)

### Phase 4 — Visual Assessment Buttons
- New assessment sub-type: `select` with `display: image`
- Shows answer options as large image cards instead of text radio buttons

---

## 6. What Does NOT Need to Change

- YAML schema stays the same (kids workshops just use a subset of features)
- No separate codebase — Kids Mode is a display layer on top of the existing platform
- Audio system stays the same
- Progress tracking stays the same

---

## 7. Open Questions for Felix

1. Should Kids Mode be a global setting (in Settings page) or per-workshop (in `workshops.yaml`)?
2. Is a reward/badge system in scope, or should we keep progress tracking minimal?
3. Should pre-reader mode (full auto-audio) be a separate flag from Kids Mode?
4. Age ranges to design for? (3–5 pre-reader, 6–10 early reader, 10+ standard mode)
