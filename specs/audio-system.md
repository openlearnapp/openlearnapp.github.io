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

## Auto-Advance

When playback reaches the end of a lesson, the system can automatically advance to the next lesson in the workshop, enabling continuous listening across multiple lessons.

## Play Button Behaviour

The play/pause button cycles through two modes depending on how the learner interacts with it:

- **Single click** — start, pause, and resume playback of the _current lesson only_. When the lesson ends, playback stops at the end of the queue.
- **Double click** — start **continuous play** across the entire workshop. Playback auto-advances from one lesson to the next without interruption. A second double click turns continuous play off again while keeping playback running for the current lesson.

When continuous play is active, the play button shows a small repeat badge so the learner can tell the two modes apart at a glance. The keyboard spacebar always toggles play/pause without changing the continuous-play setting.

## Continuous Play Across Lessons (Lock Screen Friendly)

Continuous play is designed to work seamlessly on a locked mobile device:

- The audio context is kept alive across lesson boundaries. When lesson N finishes, the system immediately starts lesson N+1 without tearing down and recreating the audio element, so iOS keeps the Media Session open and the lock-screen controls stay active.
- While lesson N plays, the next lesson's audio is preloaded in the background. By the time the current lesson ends, lesson N+1 is ready to start instantly.
- Continuous play works regardless of whether the workshop is downloaded for offline use. When the workshop is offline, the next lesson's audio is served instantly from the local cache. When online, the preloaded audio avoids a perceptible gap at the transition.
- The lock-screen metadata (title, artwork) updates automatically when the system advances to the next lesson.
- If the learner manually pauses during continuous play, the mode stays active — resuming continues to auto-advance. Continuous play turns off automatically when the last lesson in the workshop ends or when the learner leaves the workshop.

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
