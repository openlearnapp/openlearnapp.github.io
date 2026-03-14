# Kids Mode

**Status: Concept** -- not yet approved for implementation.
**Issue: [#6](https://github.com/openlearnapp/openlearnapp.github.io/issues/6)**

## Purpose

Make Open Learn accessible to children, including pre-readers who cannot yet read text. A dedicated Kids Mode adapts the interface and content delivery to match a child's age and abilities without requiring a separate codebase.

## Simplified Interface

Kids Mode strips the interface down to what a child needs. Advanced UI elements such as labels, the learning items browser, assessment results pages, and the settings page are hidden. What remains: lesson cards, examples, audio playback, and a visual progress indicator.

Navigation uses large "next" and "back" buttons. All tap targets are at least 56px. Text is larger (minimum 18px body, 24px headings). Each screen shows one thing at a time to avoid overwhelming young learners.

## Audio-First Interaction

For pre-readers, audio is the primary interface. When a lesson opens, every question-and-answer pair is read aloud automatically without the child pressing play. Images accompany the audio. The child listens, looks at the picture, and taps a single button when ready to move on.

This reuses the existing audio system -- no new infrastructure. Workshop creators enable auto-audio as a workshop-level setting.

## Assessment Adaptations

Text input is not suitable for young children. In Kids Mode, input-type assessments are replaced with select-type (tap to choose). Answer options are displayed as large visual cards (images or icons) instead of text radio buttons. Multiple-choice questions are simplified to two options (yes/no, true/false) to reduce cognitive load.

## Kid-Friendly Content Guidelines

Workshop creators designing for children follow these principles: short lessons (5 to 8 examples maximum), an image with every example, simple language with short sentences, positive framing ("Which animal is this?" rather than "Identify the species"), and audio recorded for every question, answer, and section title.

## Reward and Encouragement

Children need immediate positive feedback. Completing a lesson triggers a visual celebration (animation and sound). Completed lessons show a star or badge on the lesson card. A simple summary ("You learned 3 lessons today!") replaces detailed statistics. All reward data is stored in localStorage alongside existing progress.

## Phased Approach

**Phase 1 -- Content first.** Create a sample kids workshop (counting, shapes, colors) using the existing platform. Validate that image-heavy, audio-first content works without code changes.

**Phase 2 -- Kids Mode toggle.** Add a kids_mode flag to workshop metadata. When active, apply larger fonts, bigger buttons, and hide advanced UI elements via a CSS class (same pattern as dark mode).

**Phase 3 -- Auto-audio.** Add an auto_audio workshop setting. The audio system starts playback automatically when a lesson loads.

**Phase 4 -- Visual assessments.** Introduce image-based answer options for select-type questions, displayed as large tappable cards.

## Open Questions

- Should Kids Mode be a global user setting or a per-workshop flag set by the creator?
- What age ranges should drive design decisions (pre-reader 3-5, early reader 6-10, standard 10+)?
- Is a reward/badge system in scope for MVP, or should progress tracking stay minimal?
