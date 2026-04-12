# Audio System

## Purpose

The audio system enables hands-free learning by playing pre-recorded audio for every example in a lesson. Learners can listen while commuting, exercising, or doing chores -- without looking at the screen.

## Pre-Recorded Audio

Each lesson has a set of MP3 files generated from the lesson content using text-to-speech. Questions are spoken in the target language (e.g. Portuguese) and answers in the interface language (e.g. German). Audio files are stored alongside the lesson content, keeping each lesson self-contained and portable.

## Sequential Playback

Pressing play starts a continuous reading of the entire lesson in order:

1. Lesson title (in the interface language).
2. First section title (in the target language).
3. First example's question, then its answer.
4. Next example, and so on through all examples in the section.
5. Next section title, followed by its examples.
6. Continues until the end of the lesson.

Smart pauses are inserted automatically -- shorter pauses between examples within a section and longer pauses between sections to give the learner time to process.

The learner can also tap any individual example to hear just that example's audio.

## Variable Playback Speed

Three speed settings are available:

- **0.6x** -- Slow, for beginners who need more time to process.
- **0.8x** -- Moderate, a comfortable pace for intermediate learners.
- **1.0x** -- Normal speed.

Speed changes take effect immediately without restarting playback.

## Lock Screen Controls

On mobile devices, the audio system integrates with the operating system's media controls via the Media Session API. Learners can play, pause, skip forward, and skip backward directly from the lock screen or notification shade without opening the app.

The lock screen displays the lesson title, workshop name, and artwork.

## Always-Continuous Playback

Playback is always continuous. Pressing play starts at the current lesson and auto-advances through every remaining lesson in the workshop until the end or the learner pauses. There is no "single lesson only" mode — the simpler mental model ("press play, listen to the whole workshop") proved more natural than a double-click toggle, and it eliminates the iOS gesture-context issues that plagued the earlier double-click approach.

### Play Button

One button, one action:

- **Click** — start playing from the current lesson. If paused, resume from the current position. Audio continues through lesson boundaries automatically.
- **Click while playing** — pause.
- **Spacebar** — same as click (toggle play/pause).

No double-click, no mode badge, no secondary gesture.

### How It Works

- When `play()` is called, it automatically enables continuous mode if a workshop context (lesson list) is available. The learner never needs to opt in.
- The system preloads up to 1 hour of upcoming lessons in the background so transitions are instant.
- A single "blessed" Audio element is used for all clips — it's created and `play()`-ed inside the user's click gesture, then reused by swapping its `src` for each subsequent clip. iOS keeps it "blessed" indefinitely.
- Pauses between clips (800 ms–1800 ms) are silent WAV files played on the same element, keeping the `onended` chain unbroken. No `setTimeout` in the playback path.
- When lesson N finishes, the system transitions to lesson N+1 in-place (swaps the queue, rebuilds the playback plan, updates the Media Session metadata). The `LessonDetail` view rebinds to the new route params without remounting.
- The lock-screen metadata (title, artwork) updates automatically at each transition.
- If the learner pauses and resumes, the chain continues from where it left off — still in continuous mode.
- Playback stops at the end of the last lesson in the workshop, or when the learner navigates away.

## Instant Audio Load for Cached Workshops

Audio files are not blocked on a "fully buffered" check before playback can start. The system kicks off loading for every audio file in a lesson and then considers the lesson ready. When the workshop has been downloaded for offline use, all files are served from the local cache and the first play starts immediately with no loading delay. When the workshop is only available online, the browser buffers the first item naturally on `play()`, just as for any other `<audio>` element.

The loading spinner on the play button now only appears for the brief moment it takes to build the queue and fetch the audio manifest — not for the whole per-file buffering.

## Label-Based Filtering

When a label filter is active (e.g. showing only "Future Tense" examples), the audio queue automatically adjusts to play only the filtered examples. This lets learners do focused listening practice on a specific grammar concept or topic.

## Audio Manifest

Before starting playback, the system pre-loads all audio files for the lesson. If an audio file is missing or fails to load, playback stops rather than silently skipping content. This ensures the learner is aware of any gaps rather than unknowingly missing material.

## Loading Indicator

A spinner is shown on the play button while audio files are being loaded, giving the learner a clear signal that the system is preparing playback.

## Answer Toggle

Learners can choose whether answers are included in audio playback. When disabled, only questions and section titles are read aloud -- useful for self-testing where the learner mentally produces the answer before moving on.
