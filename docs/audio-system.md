# Audio System Documentation

## Overview

The Open Learn platform features a high-quality audio playback system using pre-recorded MP3 files generated with native text-to-speech voices. Audio files are pre-loaded for each lesson and support features like variable playback speed, lock screen controls, and automatic pauses between examples.

## Audio Generation

### Script: `generate-audio.sh`

This Bash script generates MP3 audio files for all lesson content using macOS `say` command and `ffmpeg`.

#### Requirements

- **yq** (YAML parser): `brew install yq`
- **ffmpeg** (audio conversion): `brew install ffmpeg`
- **macOS say command** (built-in TTS)

#### Voice Configuration

The script reads language codes from YAML metadata files and maps them to native voices:

- **German (de-DE)**: Anna
- **Portuguese (pt-PT)**: Joana
- **English (en-US)**: Samantha
- **Spanish (es-ES)**: Mónica

Voices are determined automatically based on the `code` field in `index.yaml` and `workshops.yaml` files.

#### Usage

```bash
# Generate all lessons
./generate-lesson-audio.sh

# Force regenerate all (skip existing files check)
./generate-lesson-audio.sh -f

# Generate single lesson
./generate-lesson-audio.sh public/lessons/deutsch/portugiesisch/01-basic-verbs.yaml

# Force regenerate single lesson
./generate-lesson-audio.sh -f public/lessons/deutsch/portugiesisch/01-basic-verbs.yaml
```

#### Output Structure

Audio files are organized in a flat structure per lesson:

```
public/audio/
├── {language}/
│   └── {workshop}/
│       └── {lesson-filename}/
│           ├── title.mp3           # Lesson title (in BASE language)
│           ├── 0-title.mp3         # Section 0 title (in WORKSHOP language)
│           ├── 1-title.mp3         # Section 1 title (in WORKSHOP language)
│           ├── 0-0-q.mp3          # Section 0, Example 0, Question (in WORKSHOP language)
│           ├── 0-0-a.mp3          # Section 0, Example 0, Answer (in BASE language)
│           ├── 0-1-q.mp3          # Section 0, Example 1, Question (in WORKSHOP language)
│           └── 0-1-a.mp3          # Section 0, Example 1, Answer (in BASE language)
```

**Filename Format:**
- **Lesson title**: `title.mp3`
- **Section titles**: `{sectionIdx}-title.mp3`
- **Questions**: `{sectionIdx}-{exampleIdx}-q.mp3`
- **Answers**: `{sectionIdx}-{exampleIdx}-a.mp3`

**Language Usage by Field:**

| Field | Language | Voice | Example (deutsch/portugiesisch) |
|-------|----------|-------|--------------------------------|
| **Lesson title** (`title`) | **Base** | `learning_voice` | German (Anna) |
| **Section title** (`sections[].title`) | **Workshop** | `workshop_voice` | Portuguese (Joana) |
| **Question** (`sections[].examples[].q`) | **Workshop** | `workshop_voice` | Portuguese (Joana) |
| **Answer** (`sections[].examples[].a`) | **Base** | `learning_voice` | German (Anna) |

**Why this language mapping?**
- **Lesson title** is read in the base language because it's metadata/navigation
- **Section titles** introduce the workshop content, so they use the workshop language
- **Questions** are in the language being taught (workshop language)
- **Answers** are translations in the base/interface language

#### Example

For lesson `deutsch/portugiesisch/01-basic-verbs`:
```bash
./generate-lesson-audio.sh public/lessons/deutsch/portugiesisch/01-basic-verbs.yaml
```

Generates audio files in:
```
public/audio/deutsch/portugiesisch/01-basic-verbs/
```

## Audio Playback

### Features

1. **Instant loading**: Audio elements are created and `load()` is called without blocking on `canplaythrough`. Cached files (from the service worker `workshop-content` cache) are ready immediately; uncached files buffer in the background while the learner starts playing.
2. **Variable Speed**: 3 playback speeds (0.6x, 0.8x, 1.0x) adjustable in settings
3. **Lock Screen Controls**: Media Session API provides play/pause/next/previous on iOS lock screen
4. **Smart Pausing**: 800ms pause between examples, 1800ms pause between sections for better comprehension
5. **Click-to-Play**: Click any example to hear its audio immediately
6. **Resume Support**: Pause and resume maintain position in the queue
7. **Always-continuous playback**: Press play once — audio auto-advances through every remaining lesson in the workshop. No double-click or mode toggle needed. Works on the iOS lock screen.
8. **Next-lesson preload**: While the current lesson plays, the next lesson's audio is preloaded in the background so the transition is seamless

### Implementation: `src/composables/useAudio.js`

#### Key Functions

**`initializeAudio(lesson, learning, workshop, settings)`**
- Idempotent: if the composable is already showing this exact lesson (e.g. during a continuous-mode transition), returns immediately without re-initialization
- Pre-creates Audio elements and kicks off `load()` (no `canplaythrough` wait — fast path for cached files)
- Sets up Media Session API for lock screen
- Builds reading queue from lesson structure
- If continuous mode is on, kicks off a background preload of the next lesson

**`play(settings)`**
- Starts or resumes playback
- Respects pause position
- Safe to call while playback is already in progress (no-op)

**`pause()`**
- Pauses current audio
- Maintains position for resume

**`jumpToExample(sectionIdx, exampleIdx, settings)`**
- Jumps to specific example
- If playing: continues from new position
- If paused: plays example once

**`skipToNext()` / `skipToPrevious()`**
- Navigate between items
- Triggered by lock screen controls
- In continuous mode, `skipToNext()` at end of queue transitions to the next lesson

**`enableContinuousMode(nextLessonProvider)` / `disableContinuousMode()`**
- Continuous mode is enabled automatically by `play()` when a workshop context is available — the learner never needs to opt in
- `nextLessonProvider` is an async callback returning `{ lesson, learning, workshop }` for the next lesson, or `null` at the end of the workshop
- When enabled, the composable:
  - Preloads the next lesson's audio in the background while the current one plays
  - Transitions in-place at the end of each lesson (no audio-element teardown)
  - Bumps `lessonTransitionTick` so the view layer updates the URL via `router.replace`
  - Keeps the iOS Media Session alive across lesson boundaries

**`cleanup()`**
- Called by `LessonDetail.vue` in `onBeforeUnmount`
- Skipped automatically when `isTransitioning` is true or when the composable has already moved on to a different lesson (in-place continuous transition), so the active audio element and iOS media session survive component remount

#### Reading Queue

The queue includes:
1. **Lesson title** (`title.mp3` - in base language)
2. For each section:
   - **Section title** (`{sectionIdx}-title.mp3` - in workshop language)
   - For each example:
     - **Question** (`{sectionIdx}-{exampleIdx}-q.mp3` - in workshop language)
     - **Answer** (`{sectionIdx}-{exampleIdx}-a.mp3` - in base language, if `readAnswers` enabled)

The lesson title is played first to announce the lesson, followed by section content.

#### Pause Logic

Automatic pauses are added between items for better comprehension:

- **Between examples**: 800ms pause
- **Between sections**: 1800ms pause (1 second extra for mental transition)

Pauses are added after the last item of each example (after questions when `readAnswers` is false, or after answers when `readAnswers` is true):

```javascript
const isEndOfExample = item.type === 'answer' ||
  (item.type === 'question' && !settings.readAnswers)

if (isEndOfExample) {
  // Check if next item is in a different section
  const nextItem = readingQueue.value[currentItemIndex.value + 1]
  const isSectionChange = nextItem && nextItem.sectionIdx !== item.sectionIdx
  const pauseDuration = isSectionChange ? 1800 : 800 // 1800ms between sections, 800ms between examples

  setTimeout(() => {
    if (isPlaying.value) {
      playNextItem(settings)
    }
  }, pauseDuration)
}
```

#### Error Handling

When audio fails to load or play, auto playback **stops** immediately instead of skipping to the next item. This prevents silent cascading failures when audio files are unavailable.

#### Label Filtering

When a label filter is active, the audio queue only includes examples matching the active label. The queue is re-initialized when the label changes.

## Settings

Audio settings are managed in `src/composables/useSettings.js`:

### Available Settings

**`audioSpeed`** (Number: 0.6, 0.8, 1.0)
- Playback rate for all audio
- Applied dynamically when each audio plays
- Changes take effect immediately (no reload needed)

**`readAnswers`** (Boolean)
- Include answers in auto-play queue
- Default: `true`
- When `false`, only questions and section titles are read

**`showDebugOverlay`** (Boolean)
- Display playback debug info overlay
- Shows current item, playing state, and position
- For troubleshooting audio issues

## Media Session API

Lock screen controls are configured automatically when a lesson loads:

```javascript
navigator.mediaSession.metadata = new MediaMetadata({
  title: lessonTitle,
  artist: `Learning ${workshop}`,
  album: `Open Learn - ${learning}`,
  artwork: [
    { src: artworkUrl, sizes: '512x512', type: 'image/svg+xml' }
  ]
})
```

**Supported Actions:**
- Play
- Pause
- Next Track
- Previous Track

**Artwork:** Uses the workshop's `image` from metadata if available, falls back to `public/favicon.svg`.

## Audio File Specifications

- **Format**: MP3 (MPEG ADTS, layer III, v2)
- **Bitrate**: ~56 kbps (variable)
- **Sample Rate**: 22.05 kHz
- **Channels**: Mono
- **Generated by**: macOS `say` command + `ffmpeg` conversion

### Quality

Native macOS voices provide high-quality, natural-sounding speech:
- **Portuguese (Joana)**: European Portuguese accent
- **German (Anna)**: Standard German accent
- **English (Samantha)**: American English accent
- **Spanish (Mónica)**: Castilian Spanish accent

## Troubleshooting

### Audio not loading
- Check browser console for 404 errors
- Verify audio files exist: `ls public/audio/{language}/{workshop}/{lesson}/`
- Regenerate with: `./generate-lesson-audio.sh -f {path-to-lesson}`

### Playback speed not changing
- Refresh browser to load updated code
- Speed is applied when each audio plays (not at pre-load)
- Check console for: `🎵 Setting playback speed to Xx`

### Lock screen controls not appearing
- Media Session API requires HTTPS (dev server uses HTTPS)
- Only works on supported browsers (iOS Safari, Chrome, etc.)
- Check console for: `✅ Media Session API configured`

### Section titles not playing
- Ensure audio files exist: `ls public/audio/{language}/{workshop}/{lesson}/*-title.mp3`
- Regenerate: `./generate-lesson-audio.sh -f {path-to-lesson}`

## File Locations

- **Audio Script**: `generate-lesson-audio.sh`
- **Audio Composable**: `src/composables/useAudio.js`
- **Settings Composable**: `src/composables/useSettings.js`
- **Lesson Detail View**: `src/views/LessonDetail.vue`
- **Settings View**: `src/views/Settings.vue`
- **Generated Audio**: `public/audio/`
- **Artwork**: Workshop `image` metadata or `public/favicon.svg` (fallback)

## Performance

### Loading
- Audio elements are created and `load()` is called eagerly but **without waiting** for `canplaythrough`. This removes the previous 1–3 second blocking delay that affected every lesson, even for cached files.
- When a workshop has been downloaded via `useOffline.downloadWorkshop()`, all audio files live in the `workshop-content` cache (managed by Workbox). The browser then serves them instantly — the first play starts with no perceptible delay.
- When the workshop is not downloaded, the browser buffers each file on demand. The `play()` call triggers the same buffering path as any other `<audio>` element; continuous play still auto-advances because `onended` fires when the current item completes.

### Next-lesson preload (continuous mode)
- While lesson N is playing, `preloadNextLesson()` builds the queue and creates Audio elements for lesson N+1 in the background.
- At the end of lesson N, `transitionToNextLesson()` swaps the queue in-place and starts playing lesson N+1's first item — within the same event chain that handled the last item's `onended`. This is what keeps the iOS media session alive across lesson boundaries.

### Memory Usage
- Audio elements persist in memory while the lesson is active.
- Old audio elements are released ~200ms after a continuous-mode transition, once the new lesson has taken over.
- Cleaned up when leaving the lesson page (except during a continuous-mode transition).
- Typical memory: ~10–15 MB per lesson, plus ~10–15 MB for the preloaded next lesson.

## Future Enhancements

Potential improvements:
- [ ] Waveform visualization
- [ ] Speed adjustment UI in lesson view
- [ ] Keyboard shortcuts beyond spacebar
- [ ] "Repeat lesson" mode (loop a single lesson instead of advancing)
