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

## Label-Based Filtering

When a label filter is active (e.g. showing only "Future Tense" examples), the audio queue automatically adjusts to play only the filtered examples. This lets learners do focused listening practice on a specific grammar concept or topic.

## Audio Manifest

Before starting playback, the system pre-loads all audio files for the lesson. If an audio file is missing or fails to load, playback stops rather than silently skipping content. This ensures the learner is aware of any gaps rather than unknowingly missing material.

## Loading Indicator

A spinner is shown on the play button while audio files are being loaded, giving the learner a clear signal that the system is preparing playback.

## Answer Toggle

Learners can choose whether answers are included in audio playback. When disabled, only questions and section titles are read aloud -- useful for self-testing where the learner mentally produces the answer before moving on.
