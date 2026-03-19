# Story Mode

**Issue: [#6](https://github.com/openlearnapp/openlearnapp.github.io/issues/6)**

## Purpose

Story Mode transforms Open Learn workshops into interactive, narrated stories. Lessons become chapters, narrated with images and audio, and assessments become story choices that branch the narrative. This is designed for kids but works for any immersive, audio-first content.

## How It Works

A workshop with `mode: story` in its metadata triggers a fullscreen, immersive view instead of the standard lesson detail. The child sees a chapter image filling the screen, hears narration, and makes choices by tapping illustrated cards that branch to different chapters.

### Schema Extensions

**Workshop level** (`workshops.yaml`):
```yaml
- folder: milas-abenteuer
  code: de-DE
  title: "Milas Abenteuer"
  mode: story              # triggers story view
```

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

All new fields (`mode`, `voice`, `goto`, `image` on options) are ignored by the existing `LessonDetail.vue`. A story workshop opened without story mode renders as regular Q&A.

### Assessment Mapping in Story Mode

| Type | Story behavior |
|------|---------------|
| `qa` (default) | Narration -- play q audio, auto-advance |
| `select` | Image choice cards with branching via `goto` |
| `multiple-choice` | Same as select in story mode |
| `input` | Skipped (not rendered) |

## User Flow

1. User opens a story workshop from `LessonsOverview`
2. If `mode === 'story'`, navigation redirects to the story route
3. Fullscreen view appears: black background, chapter image, narration text overlay
4. Audio plays automatically, narration text updates with each example
5. When a `select` example is reached, choices appear as image cards
6. Tapping a choice branches to the target lesson/section
7. Press-and-hold exit button (3 seconds) returns to lessons overview

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

- Story workshops opened via `lesson/:number` route render as standard Q&A
- Non-story workshops are completely unaffected
- All new schema fields are optional and ignored by existing views

## Phased Approach

1. **Spec** -- this document
2. **Schema + routing** -- `mode` field in useLessons, story route, App.vue chrome hiding
3. **StoryView core** -- fullscreen narration with auto-play audio
4. **Choices + branching** -- image-based select cards, `goto` navigation
5. **Exit + polish** -- press-and-hold exit, transitions, mobile handling
6. **Sample workshop** -- YAML content with placeholder images and audio
