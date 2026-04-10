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
    isLoadingAudio, isPlaying, isPaused, playbackFinished, hasAudio,
    currentItem, lessonMetadata, isTransitioning, continuousMode,
    lessonTransitionTick,
    initializeAudio, play, pause, cleanup,
    enableContinuousMode, disableContinuousMode,
  } = useAudio()

  /**
   * Called from the settings-changed deep watcher. Rebuilds the audio queue
   * to reflect new `readAnswers` / `hideLearnedExamples` / active label
   * settings, but only when playback is NOT active. The composable's own
   * defensive guard would also skip the rebuild, but making the intent
   * explicit here keeps the view-layer contract obvious.
   */
  async function onSettingsChanged({ lesson, learning, workshop, audioSettings }) {
    if (!lesson) return false
    await initializeAudio(lesson, learning, workshop, audioSettings, { force: true })
    return true
  }

  /**
   * Called from the progress deep watcher. Same contract as onSettingsChanged,
   * but gated on hideLearnedExamples — there is no reason to rebuild when
   * learned items are visible anyway.
   */
  async function onProgressChanged({ lesson, learning, workshop, audioSettings }) {
    if (!lesson) return false
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
   */
  async function onLessonMount({
    lesson, learning, workshop, audioSettings,
    autoplay = false,
    continuousNextLessonProvider = null,
  }) {
    if (!lesson) return { started: false }

    await initializeAudio(lesson, learning, workshop, audioSettings)

    // If continuous mode is already active (user turned it on before
    // navigating or we just came from an in-place transition), re-register
    // the next-lesson provider so the composable knows how to advance.
    if (continuousMode.value && continuousNextLessonProvider) {
      enableContinuousMode(continuousNextLessonProvider)
    }

    if (autoplay && !isPlaying.value) {
      play(audioSettings)
      return { started: true }
    }
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
   * Toggles continuous play mode. Wrapping here so the view doesn't have to
   * know about the resolver contract — it just passes a next-lesson callback.
   */
  function toggleContinuousPlay({ nextLessonProvider, audioSettings }) {
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
    // Pure, testable handlers extracted from LessonDetail.vue
    onSettingsChanged,
    onProgressChanged,
    onLessonMount,
    onLessonUnmount,
    toggleContinuousPlay,
  }
}
