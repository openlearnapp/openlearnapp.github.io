// useLessonAudioSync — extracts the audio wiring that used to live inline in
// LessonDetail.vue's <script setup> (two deep watchers + initial mount logic)
// so it can be unit-tested without mounting the component.
//
// The returned handlers are pure functions that the view layer binds to Vue
// watchers. They carry no implicit dependency on a component lifecycle — you
// can call them from a test, an onMounted, a manual toggle, anywhere.
//
// ## Why this exists
//
// Before this composable, LessonDetail.vue did:
//
//   watch(progress, async () => {
//     if (lesson.value && settings.value.hideLearnedExamples) {
//       await initializeAudio(lesson.value, ..., { force: true })
//     }
//   }, { deep: true })
//
// That was impossible to unit-test without @vue/test-utils + mount(), and it
// hid a bug: a remote GunDB sync tick mutated `progress` deeply and fired the
// watcher mid-playback, which tore down the audio chain.
//
// Extracting the logic lets us:
//   1. unit-test the decision ("should I rebuild the queue?") without Vue,
//   2. share it between LessonDetail and any future view (kids mode, story
//      mode, etc.),
//   3. keep the SFC thin — just watch bindings, no business logic.

import { useAudio } from './useAudio'

export function useLessonAudioSync() {
  const {
    isLoadingAudio, isPlaying, isPaused, isInFocusMode, playbackFinished, hasAudio,
    currentItem, lessonMetadata, isTransitioning, continuousMode,
    lessonTransitionTick,
    initializeAudio, play, pause, cleanup,
    enableContinuousMode, disableContinuousMode,
    setWorkshopLessons,
  } = useAudio()

  /**
   * Called from the settings-changed deep watcher. Rebuilds the audio queue
   * to reflect new `readAnswers` / `hideLearnedExamples` / active label
   * settings, but only when playback is NOT active. Early-returns during
   * focus mode (active playback) so the chain cannot be interrupted.
   */
  async function onSettingsChanged({ lesson, learning, workshop, audioSettings }) {
    if (!lesson) return false
    // Never touch the audio composable while the chain is running.
    // The view layer disables the mutating controls anyway, but this is a
    // belt-and-braces check in case something else fires the watcher.
    if (isInFocusMode.value) return false
    await initializeAudio(lesson, learning, workshop, audioSettings, { force: true })
    return true
  }

  /**
   * Called from the progress deep watcher. Same contract as onSettingsChanged,
   * but additionally gated on hideLearnedExamples — there is no reason to
   * rebuild when learned items are visible anyway.
   */
  async function onProgressChanged({ lesson, learning, workshop, audioSettings }) {
    if (!lesson) return false
    if (isInFocusMode.value) return false
    if (!audioSettings || !audioSettings.hideLearnedExamples) return false
    await initializeAudio(lesson, learning, workshop, audioSettings, { force: true })
    return true
  }

  /**
   * Called once per lesson mount. Idempotent: if the composable is already
   * showing this lesson (e.g. after a continuous-mode transition), it no-ops.
   *
   * Returns `{ started: true }` if autoplay was triggered, `{ started: false }`
   * otherwise. Tests use this return value to assert behaviour without
   * inspecting composable internals.
   *
   * After fix C for #240 the composable resolves the next lesson from its
   * own workshopContext (set via setWorkshopLessons), so we no longer pass
   * a provider closure through here. The legacy `continuousNextLessonProvider`
   * argument is still accepted for backwards compatibility.
   */
  async function onLessonMount({
    lesson, learning, workshop, audioSettings,
  }) {
    if (!lesson) return { started: false }

    await initializeAudio(lesson, learning, workshop, audioSettings)

    // No autoplay from URL — iOS rejects play() outside a user gesture,
    // and the auto-advance feature that set ?autoplay=true was removed.
    // The user must click the play button to start.
    return { started: false }
  }

  /**
   * Called from onBeforeUnmount. Skips cleanup when the composable has
   * already moved to a different lesson (in-place continuous transition)
   * OR is mid-transition. This keeps the active audio element alive across
   * the component remount so iOS preserves the Media Session.
   *
   * Returns `true` if cleanup was actually performed, `false` if skipped.
   */
  function onLessonUnmount({ learning, workshop, lessonNumber }) {
    const meta = lessonMetadata.value
    const composableMovedOn =
      meta.learning !== learning ||
      meta.workshop !== workshop ||
      meta.number !== lessonNumber

    if (composableMovedOn || isTransitioning.value) {
      return false
    }
    cleanup()
    return true
  }

  /**
   * Toggles continuous play mode. After fix C for #240, the composable has
   * its own built-in resolver based on `setWorkshopLessons`, so the caller
   * no longer needs to pass a closure — we just flip the flag.
   *
   * `nextLessonProvider` is still accepted for backwards compatibility
   * but callers that use setWorkshopLessons should pass nothing.
   */
  function toggleContinuousPlay({ nextLessonProvider, audioSettings } = {}) {
    if (continuousMode.value) {
      disableContinuousMode()
      return false
    }
    enableContinuousMode(nextLessonProvider)
    if (!isPlaying.value) {
      play(audioSettings)
    }
    return true
  }

  return {
    // Reactive state forwarded from useAudio so the view doesn't import both
    isLoadingAudio,
    isPlaying,
    isPaused,
    isInFocusMode,
    playbackFinished,
    hasAudio,
    currentItem,
    lessonMetadata,
    isTransitioning,
    continuousMode,
    lessonTransitionTick,
    // Low-level composable functions the view still needs directly
    initializeAudio,
    play,
    pause,
    enableContinuousMode,
    disableContinuousMode,
    setWorkshopLessons,
    // Pure, testable handlers extracted from LessonDetail.vue
    onSettingsChanged,
    onProgressChanged,
    onLessonMount,
    onLessonUnmount,
    toggleContinuousPlay,
  }
}
