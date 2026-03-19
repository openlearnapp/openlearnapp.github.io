# Story Mode

**Issue: [#6](https://github.com/openlearnapp/openlearnapp.github.io/issues/6)**

## Purpose

Story Mode transforms Open Learn workshops into interactive, narrated stories. Lessons become chapters, narrated with images and audio, and assessments become story choices that branch the narrative. This is designed for kids but works for any immersive, audio-first content.

## How It Works

Story Mode is a frontend view toggle -- any workshop can be viewed in story mode by pressing the story button in the top navigation. No schema changes are required at the workshop level. The user chooses the layout; the content stays the same.

Entering story mode opens a fullscreen, immersive view. The child sees a chapter image filling the screen, hears narration, and makes choices by tapping illustrated cards that branch to different chapters. Exiting requires a long press (3 seconds) on the exit button to prevent accidental exits.

### Content Extensions

The following optional fields on examples and options enhance the story experience but are ignored in normal mode:

**Example level** (`content.yaml`):
```yaml
examples:
  - q: "Es war einmal ein kleines Maedchen."
    voice: narrator          # optional character/voice label
  - q: "Wohin soll Mila gehen?"
    type: select
    options:
      - text: "Zum Fluss"
        image: "images/river.png"    # visual choice card
        goto: { lesson: 2, section: 0 }  # branching target
      - text: "Zum Haus"
        image: "images/house.png"
        goto: { lesson: 3, section: 0 }
```

All new fields (`voice`, `goto`, `goto_correct`, `goto_wrong`, `answers`, `image` on options) are ignored by the existing `LessonDetail.vue`. Any workshop opened in normal mode renders as regular Q&A regardless of these fields.

### Assessment Branching

All assessment types support `goto_correct` and `goto_wrong` for branching based on correctness:

**Select/multiple-choice with correct/wrong branching:**
```yaml
- q: "Wie heisst der Frosch?"
  type: select
  goto_correct: { lesson: 2, section: 1 }
  goto_wrong: { lesson: 2, section: 0 }
  options:
    - text: "Fridolin"
      correct: true
    - text: "Ferdinand"
```

**Input with multiple accepted answers:**
```yaml
- q: "Was hatte die alte Frau?"
  type: input
  answers:
    - text: "ein Buch"
      goto: { lesson: 3, section: 1 }
    - text: "Buch"
      goto: { lesson: 3, section: 1 }
  goto_wrong: { lesson: 3, section: 0 }
```

**Priority for select options:** per-option `goto` > `goto_correct`/`goto_wrong` > advance.

### Assessment Mapping in Story Mode

| Type | Story behavior |
|------|---------------|
| `qa` (default) | Narration -- play q audio, auto-advance |
| `select` | Image choice cards with branching via `goto` or `goto_correct`/`goto_wrong` |
| `multiple-choice` | Same as select in story mode |
| `input` | Text input with `answers` matching and `goto_wrong` fallback |

## User Flow

1. User opens any workshop from `LessonsOverview`
2. User presses the story mode button (book icon) in the top navigation
3. Fullscreen view appears: black background, chapter image, narration text overlay
4. Audio plays automatically, narration text updates with each example
5. When an assessment is reached, choices or text input appear
6. Correct/wrong answers branch to different story paths
7. Press-and-hold exit button (2 seconds) returns to lessons overview

## View Design

- **Layout**: Fixed fullscreen (`fixed inset-0 z-[100]`), black background
- **Image**: Section image fills the screen (`object-cover`)
- **Narration**: Text overlay at bottom with gradient (`from-black/80`)
- **Choices**: 2-3 large image buttons centered on screen
- **Exit**: Top-left button with press-and-hold (3s) ring animation
- **Mobile**: Uses `100dvh` for iOS Safari address bar handling

## State Machine

```
LOADING -> NARRATING -> CHOOSING | AUTO_ADVANCING
                           |            |
                           v            v
                       (branch)   (next section/lesson)
```

## Audio Integration

Reuses the existing `useAudio()` singleton with `readAnswers: false` (narrate only `q` fields). When switching lessons via branching, cleanup and re-initialize audio.

## Normal Mode Compatibility

- Any workshop can be viewed in story mode or normal mode -- user's choice
- Content fields (`voice`, `goto`, `image` on options) are optional and ignored in normal mode
- Story mode is entered via navigation button, exited via long-press (3s)

## Phased Approach

1. **Spec** -- this document
2. **Routing + nav toggle** -- story route, App.vue story button + chrome hiding
3. **StoryView core** -- fullscreen narration with auto-play audio
4. **Choices + branching** -- image-based select cards, `goto` navigation
5. **Exit + polish** -- press-and-hold exit, transitions, mobile handling
6. **Sample workshop** -- YAML content with placeholder images and audio
