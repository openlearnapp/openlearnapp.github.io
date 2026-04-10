import { ref, computed } from 'vue'
import { useLessons } from './useLessons'
import { useProgress } from './useProgress'
import { useGun } from './useGun'

// Get lesson composable for language codes
const { getLanguageCode, getWorkshopCode, resolveWorkshopKey, getWorkshopMeta } = useLessons()

// Get progress composable for learned items
const { areAllItemsLearned } = useProgress()

// Gun sync pause controls — we freeze remote data pulls during active
// playback so a remote sync tick doesn't mutate progress/settings and
// trigger the LessonDetail watchers that rebuild the audio queue.
const { pauseSyncPulls, resumeSyncPulls } = useGun()

// Shared audio state (singleton pattern)
const isLoadingAudio = ref(false)
const isPlaying = ref(false)
const isPaused = ref(false)
const currentItemIndex = ref(-1)
const readingQueue = ref([])
const audioElements = ref({}) // Pre-loaded audio elements
const currentAudio = ref(null) // Currently playing audio element
const playbackFinished = ref(false)
const hasAudio = ref(false) // True when at least one audio file loaded successfully
const lessonTitle = ref('')
const lessonMetadata = ref({ learning: '', workshop: '', number: null })

// Continuous play mode: auto-advance across lessons (including iOS lock screen).
// When enabled, the composable transitions to the next lesson in-place without
// tearing down the audio context, so the iOS media session stays alive.
const continuousMode = ref(false)
const nextLessonProvider = ref(null) // () => Promise<{ lesson, learning, workshop } | null>
const isTransitioning = ref(false)   // true while we swap queues between lessons
const preloadedNextLesson = ref(null) // { lesson, learning, workshop, queue, audioMap }
// Monotonic counter: incremented each time we swap to a new lesson in-place.
// The view layer watches this to sync the URL without tearing down the audio.
const lessonTransitionTick = ref(0)

// Determine audio base path for a lesson
function getAudioBase(lesson, learning, workshop) {
  const baseUrl = import.meta.env.BASE_URL
  const lessonFilename = lesson._filename || `${String(lesson.number).padStart(2, '0')}-lesson`
  const resolvedWorkshop = resolveWorkshopKey(learning, workshop)

  if (lesson._source && lesson._source.type === 'url') {
    return `${lesson._source.path}/audio`
  } else if (resolvedWorkshop && resolvedWorkshop !== workshop) {
    // resolvedWorkshop may be an absolute URL (external) or relative path (built-in)
    const prefix = resolvedWorkshop.startsWith('http') ? '' : baseUrl
    return `${prefix}${resolvedWorkshop}/${lessonFilename}/audio`
  } else if (learning && (learning.startsWith('http://') || learning.startsWith('https://'))) {
    return `${learning}/${workshop}/${lessonFilename}/audio`
  } else {
    return `${baseUrl}lessons/${learning}/${workshop}/${lessonFilename}/audio`
  }
}

// Build reading queue from lesson data
function buildReadingQueue(lesson, learning, workshop, settings) {
  const queue = []

  if (!lesson || !lesson.sections) {
    return queue
  }

  const audioBase = getAudioBase(lesson, learning, workshop)

  // Add lesson title at the beginning (if available)
  if (lesson.title) {
    queue.push({
      type: 'lesson-title',
      text: lesson.title,
      audioUrl: `${audioBase}/title.mp3`,
      sectionIdx: -1,
      exampleIdx: -1
    })
  }

  lesson.sections.forEach((section, sectionIdx) => {
    // Filter examples based on active label and hideLearnedExamples setting
    const visibleExamples = section.examples.filter((example) => {
      // Filter by active label
      if (settings.activeLabel) {
        if (!example.labels || !example.labels.includes(settings.activeLabel)) {
          return false
        }
      }

      // If hideLearnedExamples is disabled, show all examples
      if (!settings.hideLearnedExamples) {
        return true
      }

      // If example has no related items, always show it
      if (!example.rel || example.rel.length === 0) {
        return true
      }

      // Hide example only if ALL items are learned
      return !areAllItemsLearned(learning, workshop, example.rel)
    })

    // Only add section title and examples if there are visible examples
    if (visibleExamples.length > 0) {
      // Add section title first
      queue.push({
        type: 'section-title',
        text: section.title,
        audioUrl: `${audioBase}/${sectionIdx}-title.mp3`,
        sectionIdx,
        exampleIdx: -1
      })

      // Then add examples from this section
      visibleExamples.forEach((example) => {
        const exampleIdx = section.examples.indexOf(example)

        // Add question
        queue.push({
          type: 'question',
          text: example.q,
          audioUrl: `${audioBase}/${sectionIdx}-${exampleIdx}-q.mp3`,
          sectionIdx,
          exampleIdx
        })

        // Add answer if setting is enabled
        if (settings.readAnswers && example.a) {
          queue.push({
            type: 'answer',
            text: example.a,
            audioUrl: `${audioBase}/${sectionIdx}-${exampleIdx}-a.mp3`,
            sectionIdx,
            exampleIdx
          })
        }
      })
    }
  })

  return queue
}

// Fetch audio manifest to know which files exist
async function fetchAudioManifest(audioBase) {
  try {
    const response = await fetch(`${audioBase}/manifest.yaml`)
    if (!response.ok) return null
    const text = await response.text()
    // Parse simple YAML: "files:\n  - filename.mp3\n  - ..."
    const files = text.split('\n')
      .map(line => line.trim())
      .filter(line => line.startsWith('- '))
      .map(line => line.slice(2))

    return new Set(files)
  } catch {
    return null
  }
}

// Pre-load all audio files (filtered by manifest if available).
// Fast path: we create Audio elements and kick off load() but do NOT wait
// for canplaythrough. Cached files (from the workshop-content Cache) are
// then ready instantly; uncached files buffer in the background and the
// browser handles the first play() naturally.
function preloadAudioFiles(queue, manifest) {
  const audioMap = {}

  queue.forEach(item => {
    if (!item.audioUrl) return
    if (manifest) {
      const filename = item.audioUrl.split('/').pop()
      if (!manifest.has(filename)) return
    }
    const audio = new Audio()
    audio.preload = 'auto'
    audio.src = item.audioUrl
    // Kick off load — browser uses the service-worker cache when available.
    try { audio.load() } catch {}
    audioMap[item.audioUrl] = audio
  })

  return audioMap
}

// Setup Media Session API for lock screen controls
function setupMediaSession(title, learning, workshop, settingsRef) {
  if (!('mediaSession' in navigator)) {
    return
  }

  const baseUrl = import.meta.env.BASE_URL
  const meta = getWorkshopMeta(learning, workshop)
  const artworkUrl = meta.image || `${baseUrl}favicon.svg`

  navigator.mediaSession.metadata = new MediaMetadata({
    title: title,
    artist: `Learning ${workshop}`,
    album: `Open Learn - ${learning}`,
    artwork: [
      { src: artworkUrl, sizes: '512x512', type: 'image/svg+xml' }
    ]
  })

  // Use the latest audioSettings from the ref so lock-screen resume uses current settings
  const getSettings = () => (settingsRef && settingsRef.value) || { readAnswers: true }

  navigator.mediaSession.setActionHandler('play', () => {
    play(getSettings())
  })

  navigator.mediaSession.setActionHandler('pause', () => {
    pause()
  })

  navigator.mediaSession.setActionHandler('previoustrack', () => {
    skipToPrevious(getSettings())
  })

  navigator.mediaSession.setActionHandler('nexttrack', () => {
    skipToNext(getSettings())
  })
}

// Keep a reference to the latest audio settings ref so continuous-mode
// transitions and Media Session handlers always have fresh settings.
const latestAudioSettingsRef = ref({ readAnswers: true, audioSpeed: 1.0 })

// Initialize audio queue for a lesson.
// Idempotent by default: if the composable is already playing this exact lesson
// (e.g. during a continuous-mode transition), it returns immediately. Pass
// `{ force: true }` to force a rebuild even when the lesson identity matches —
// used by the settings watcher when readAnswers / hideLearnedExamples change.
//
// CRITICAL: Rebuilding the audio elements mid-playback tears down the currently
// playing `<audio>` element (via audio.pause() + audio.src=''), which silently
// breaks the `onended` → `playNextItem` chain. So even a force-rebuild is
// skipped while the same lesson is actively playing — the new settings take
// effect the next time the user pauses and resumes. This fixes the bug where a
// GunDB sync tick, a remote settings update, or an item being marked learned
// during playback caused the audio chain to stop after the currently playing
// clip.
async function initializeAudio(lesson, learning, workshop, settings, { force = false } = {}) {
  latestAudioSettingsRef.value = settings

  const meta = lessonMetadata.value
  const isSameLesson =
    meta.learning === learning &&
    meta.workshop === workshop &&
    meta.number === lesson.number

  // During a continuous-mode transition, the composable has already loaded
  // the new lesson in-place. Skip re-initialization so we don't destroy
  // the active audio element and iOS media session.
  if (isSameLesson && hasAudio.value && !isLoadingAudio.value && !force) {
    return
  }

  // Defensive: never tear down the queue of an actively playing lesson.
  // The caller can re-trigger a rebuild after the user pauses.
  if (isSameLesson && force && (isPlaying.value || isPaused.value)) {
    console.log(`🎧 Skipping force rebuild of "${lesson.title}" — playback is active`)
    return
  }

  lessonTitle.value = lesson.title
  lessonMetadata.value = { learning, workshop, number: lesson.number }

  playbackFinished.value = false
  isLoadingAudio.value = true
  readingQueue.value = buildReadingQueue(lesson, learning, workshop, settings)

  // Fetch manifest to know which audio files exist (if missing, load all)
  const audioBase = getAudioBase(lesson, learning, workshop)
  const manifest = await fetchAudioManifest(audioBase)

  // Release old audio elements (if any) before creating new ones
  releaseAudioElements(audioElements.value)

  // Pre-load audio files (filtered by manifest if available) — fire-and-forget
  audioElements.value = preloadAudioFiles(readingQueue.value, manifest)

  hasAudio.value = Object.keys(audioElements.value).length > 0
  console.log(`🔊 Audio: ${Object.keys(audioElements.value).length} files ready for "${lesson.title}"`)

  isLoadingAudio.value = false
  currentItemIndex.value = -1
  isPlaying.value = false
  isPaused.value = false
  currentAudio.value = null

  // Drop any preloaded next-lesson from a previous workshop/session
  preloadedNextLesson.value = null

  // Setup Media Session API
  setupMediaSession(lesson.title, learning, workshop, latestAudioSettingsRef)

  // If continuous mode is on, start preloading the next lesson's audio now
  // so the transition at the end is instant.
  if (continuousMode.value && nextLessonProvider.value) {
    setTimeout(() => preloadNextLesson(), 0)
  }
}

// Release a map of audio elements (pause + clear src to free memory)
function releaseAudioElements(map, except = null) {
  Object.values(map || {}).forEach(audio => {
    if (audio && audio !== except) {
      try {
        audio.pause()
        audio.src = ''
      } catch {}
    }
  })
}

// Attach the standard onended / onerror handlers to an audio element.
// Extracted so playNextItem and playCurrentItem can share the same logic.
function attachPlaybackHandlers(audio, item, settings) {
  audio.onended = () => {
    if (!isPlaying.value) return
    // Determine pause duration based on item type
    let pauseDuration = 0

    if (item.type === 'section-title') {
      pauseDuration = 1200
    } else if (item.type === 'lesson-title') {
      pauseDuration = 1000
    } else {
      const isEndOfExample = item.type === 'answer' ||
        (item.type === 'question' && !settings.readAnswers)

      if (isEndOfExample) {
        const nextItem = readingQueue.value[currentItemIndex.value + 1]
        const isSectionChange = nextItem && nextItem.sectionIdx !== item.sectionIdx
        pauseDuration = isSectionChange ? 1800 : 800
      }
    }

    if (pauseDuration > 0) {
      setTimeout(() => {
        if (isPlaying.value) playNextItem(settings)
      }, pauseDuration)
    } else {
      playNextItem(settings)
    }
  }

  audio.onerror = (e) => {
    console.warn('⚠️ Audio error, retrying:', item.audioUrl)
    retryPlay(item, settings)
  }
}

// Play next item in queue
async function playNextItem(settings) {
  latestAudioSettingsRef.value = settings

  if (currentItemIndex.value >= readingQueue.value.length - 1) {
    // End of current lesson
    if (continuousMode.value) {
      // Try to transition to the next lesson in-place
      const transitioned = await transitionToNextLesson(settings)
      if (transitioned) {
        // Continue playing from the beginning of the new queue
        playNextItem(settings)
        return
      }
      // No more lessons — fall through to stop
    }
    playbackFinished.value = true
    stop()
    return
  }

  currentItemIndex.value++
  const item = readingQueue.value[currentItemIndex.value]

  // Skip if no audio URL
  if (!item.audioUrl) {
    playNextItem(settings)
    return
  }

  try {
    // Get pre-loaded audio element
    let audio = audioElements.value[item.audioUrl]

    if (!audio) {
      // Late-bind: create a fresh element on the fly (e.g. when the map was
      // built without a manifest and an item slipped through).
      audio = new Audio(item.audioUrl)
      audio.preload = 'auto'
      audioElements.value[item.audioUrl] = audio
    }

    currentAudio.value = audio

    // Reset to beginning
    audio.currentTime = 0

    // Apply playback speed from settings
    // Section titles are read slower (70% of normal speed) for clarity
    if (item.type === 'section-title') {
      audio.playbackRate = (settings.audioSpeed || 1.0) * 0.7
    } else {
      audio.playbackRate = settings.audioSpeed || 1.0
    }

    attachPlaybackHandlers(audio, item, settings)

    // Play
    await audio.play()
  } catch (error) {
    console.warn('⚠️ play() failed, retrying:', item.audioUrl, error.message)
    retryPlay(item, settings)
  }
}

// Retry playing by creating a fresh audio element
async function retryPlay(item, settings) {
  if (!isPlaying.value) return
  try {
    const fresh = new Audio(item.audioUrl)
    fresh.playbackRate = item.type === 'section-title'
      ? (settings.audioSpeed || 1.0) * 0.7
      : (settings.audioSpeed || 1.0)
    fresh.onended = () => {
      if (isPlaying.value) {
        const pauseDuration = item.type === 'section-title' ? 1200
          : item.type === 'lesson-title' ? 1000 : 800
        setTimeout(() => { if (isPlaying.value) playNextItem(settings) }, pauseDuration)
      }
    }
    fresh.onerror = () => {
      console.error('🛑 AUDIO STOP: retry also failed for', item.audioUrl)
      stop()
    }
    currentAudio.value = fresh
    audioElements.value[item.audioUrl] = fresh
    await fresh.play()
  } catch (e) {
    console.error('🛑 AUDIO STOP: retry failed', item.audioUrl, e.message)
    stop()
  }
}

// Play current item (used when resuming from pause)
async function playCurrentItem(settings) {
  latestAudioSettingsRef.value = settings

  if (currentItemIndex.value < 0 || currentItemIndex.value >= readingQueue.value.length) {
    console.warn('⚠️ Invalid currentItemIndex, stopping')
    stop()
    return
  }

  const item = readingQueue.value[currentItemIndex.value]

  // Skip if no audio URL
  if (!item.audioUrl) {
    playNextItem(settings)
    return
  }

  try {
    let audio = audioElements.value[item.audioUrl]

    if (!audio) {
      audio = new Audio(item.audioUrl)
      audio.preload = 'auto'
      audioElements.value[item.audioUrl] = audio
    }

    currentAudio.value = audio

    if (item.type === 'section-title') {
      audio.playbackRate = (settings.audioSpeed || 1.0) * 0.7
    } else {
      audio.playbackRate = settings.audioSpeed || 1.0
    }

    attachPlaybackHandlers(audio, item, settings)

    // Play from current position (resume)
    await audio.play()
  } catch (error) {
    console.error('❌ Error playing audio (resumed):', error, '- stopping')
    stop()
  }
}

// Start playing from beginning or continue
function play(settings) {
  if (readingQueue.value.length === 0) {
    console.warn('⚠️ No items in reading queue')
    return
  }

  latestAudioSettingsRef.value = settings

  // Guard: if already playing, don't restart (avoids lock-screen "play" handler
  // from re-starting in the middle of an item).
  if (isPlaying.value && currentAudio.value && !currentAudio.value.paused) {
    return
  }

  const wasResuming = isPaused.value && currentItemIndex.value >= 0

  playbackFinished.value = false
  isPlaying.value = true
  isPaused.value = false

  // Freeze remote Gun pulls so an incoming sync tick doesn't mutate state
  // and trigger watchers that rebuild the queue mid-playback.
  try { pauseSyncPulls() } catch {}

  if (wasResuming) {
    playCurrentItem(settings)
  } else {
    playNextItem(settings)
  }
}

// Pause playback
function pause() {
  isPlaying.value = false
  isPaused.value = true

  if (currentAudio.value) {
    currentAudio.value.pause()
  }

  // Allow deferred remote sync pulls to flush now that playback is paused.
  try { resumeSyncPulls() } catch {}
}

// Resume playback (alias for play)
function resume(settings) {
  play(settings)
}

// Stop playback completely
function stop() {
  isPlaying.value = false
  isPaused.value = false
  currentItemIndex.value = -1

  if (currentAudio.value) {
    try {
      currentAudio.value.pause()
      currentAudio.value.currentTime = 0
    } catch {}
  }

  currentAudio.value = null

  // Playback is fully stopped — let deferred remote syncs run.
  try { resumeSyncPulls() } catch {}

  console.log('🛑 Stopped')
}

// Skip to next item
function skipToNext(settings) {
  if (currentItemIndex.value >= readingQueue.value.length - 1) {
    // Let playNextItem handle end-of-queue (which may transition in continuous mode)
    if (continuousMode.value) {
      playNextItem(settings)
    }
    return
  }

  if (currentAudio.value) {
    currentAudio.value.pause()
  }

  playNextItem(settings)
}

// Skip to previous item
function skipToPrevious(settings) {
  if (currentItemIndex.value <= 0) {
    return
  }

  if (currentAudio.value) {
    currentAudio.value.pause()
  }

  currentItemIndex.value--
  playCurrentItem(settings)
}

// Play a single item (for clicking on examples)
// Optional onEnded callback for when audio finishes
async function playSingleItem(index, settings, onEnded) {
  const item = readingQueue.value[index]
  if (!item || !item.audioUrl) {
    console.warn('⚠️ No audio found for item at index:', index)
    return
  }

  try {
    let audio = audioElements.value[item.audioUrl]

    if (!audio) {
      audio = new Audio(item.audioUrl)
      audio.preload = 'auto'
      audioElements.value[item.audioUrl] = audio
    }

    // Stop any current audio
    if (currentAudio.value && currentAudio.value !== audio) {
      currentAudio.value.pause()
    }

    currentAudio.value = audio
    audio.currentTime = 0
    audio.playbackRate = settings.audioSpeed || 1.0

    audio.onended = () => {
      if (onEnded) onEnded()
    }

    audio.onerror = (e) => {
      console.error('❌ Single item audio error:', e)
    }

    await audio.play()
  } catch (error) {
    console.error('❌ Error playing single item:', error)
    throw error
  }
}

// Jump to specific example
function jumpToExample(sectionIdx, exampleIdx, settings) {
  const index = readingQueue.value.findIndex(
    item => item.sectionIdx === sectionIdx &&
            item.exampleIdx === exampleIdx &&
            item.type === 'question'
  )

  if (index !== -1) {
    if (isPlaying.value) {
      if (currentAudio.value) {
        currentAudio.value.pause()
      }
      currentItemIndex.value = index - 1
      playNextItem(settings)
    } else {
      currentItemIndex.value = index
      playSingleItem(index, settings)
    }
  }
}

// -----------------------------------------------------------------------------
// Continuous play mode
// -----------------------------------------------------------------------------

/**
 * Enable continuous playback across lessons.
 *
 * @param {Function} provider - async function returning the next lesson, or null
 *   at the end of the workshop. Shape: `() => Promise<{ lesson, learning, workshop } | null>`
 */
function enableContinuousMode(provider) {
  continuousMode.value = true
  nextLessonProvider.value = provider
  // Kick off a background preload of the next lesson so the transition is seamless
  preloadNextLesson().catch(() => { /* best effort */ })
}

function disableContinuousMode() {
  continuousMode.value = false
  nextLessonProvider.value = null
  // Release any preloaded next-lesson audio
  if (preloadedNextLesson.value) {
    releaseAudioElements(preloadedNextLesson.value.audioMap)
    preloadedNextLesson.value = null
  }
}

// Preload the next lesson's audio in the background while the current one plays.
// Called after initializeAudio and after each transition.
async function preloadNextLesson() {
  if (!continuousMode.value || !nextLessonProvider.value) return
  if (preloadedNextLesson.value) return // already preloaded

  try {
    const next = await nextLessonProvider.value()
    if (!next || !next.lesson) return

    const { lesson, learning, workshop } = next
    const settings = latestAudioSettingsRef.value || { readAnswers: true, audioSpeed: 1.0 }
    const queue = buildReadingQueue(lesson, learning, workshop, settings)
    const audioBase = getAudioBase(lesson, learning, workshop)
    const manifest = await fetchAudioManifest(audioBase)
    const audioMap = preloadAudioFiles(queue, manifest)

    preloadedNextLesson.value = { lesson, learning, workshop, queue, audioMap }
    console.log(`🔄 Preloaded next lesson: "${lesson.title}"`)
  } catch (e) {
    console.warn('⚠️ Could not preload next lesson:', e)
  }
}

/**
 * Swap the current queue with the next lesson in-place. The existing audio
 * element that just finished remains available (the onended chain continues
 * without a fresh user gesture), preserving the iOS Media Session.
 *
 * Returns true if the transition succeeded and playback should continue,
 * false if there is no next lesson (end of workshop).
 */
async function transitionToNextLesson(settings) {
  if (!continuousMode.value || !nextLessonProvider.value) return false

  // Use the preloaded lesson if available; otherwise resolve one now
  let next = preloadedNextLesson.value
  if (!next) {
    try {
      const resolved = await nextLessonProvider.value()
      if (!resolved || !resolved.lesson) return false
      const { lesson, learning, workshop } = resolved
      const queue = buildReadingQueue(lesson, learning, workshop, settings)
      const audioBase = getAudioBase(lesson, learning, workshop)
      const manifest = await fetchAudioManifest(audioBase)
      const audioMap = preloadAudioFiles(queue, manifest)
      next = { lesson, learning, workshop, queue, audioMap }
    } catch (e) {
      console.warn('⚠️ Could not load next lesson for transition:', e)
      return false
    }
  }

  const { lesson, learning, workshop, queue, audioMap } = next

  isTransitioning.value = true

  // Release old audio elements (except the one that just ended — it's harmless
  // but keeping it alive briefly helps iOS hold the media session open).
  const prevAudio = currentAudio.value
  const oldMap = audioElements.value
  // Defer releasing old elements until the new playback starts
  const toRelease = { ...oldMap }

  // Swap composable state
  lessonTitle.value = lesson.title
  lessonMetadata.value = { learning, workshop, number: lesson.number }
  readingQueue.value = queue
  audioElements.value = audioMap
  hasAudio.value = Object.keys(audioMap).length > 0
  currentItemIndex.value = -1
  preloadedNextLesson.value = null

  // Bump the transition tick so the view layer updates the URL (router.replace)
  // WITHOUT going through playbackFinished (which is reserved for "the whole
  // lesson is done and we are not continuing"). In continuous mode, playback
  // never truly "finishes" until we reach the end of the last lesson.
  lessonTransitionTick.value++

  // Update media session metadata to the new lesson
  setupMediaSession(lesson.title, learning, workshop, latestAudioSettingsRef)

  // Release old audio elements shortly after the transition
  setTimeout(() => {
    releaseAudioElements(toRelease, prevAudio)
    isTransitioning.value = false
  }, 200)

  // Start preloading the lesson AFTER this one
  setTimeout(() => preloadNextLesson(), 0)

  return true
}

// Get current reading position
const currentItem = computed(() => {
  if (currentItemIndex.value >= 0 && currentItemIndex.value < readingQueue.value.length) {
    return readingQueue.value[currentItemIndex.value]
  }
  return null
})

// Cleanup
function cleanup() {
  // During a continuous-mode transition, skip teardown so the new lesson can
  // take over without losing the iOS media session.
  if (isTransitioning.value) {
    return
  }

  stop()

  releaseAudioElements(audioElements.value)

  audioElements.value = {}
  readingQueue.value = []
  currentAudio.value = null
  hasAudio.value = false
  // Clear lesson metadata so the next initializeAudio does not think
  // it's the "same lesson" and skip initialization.
  lessonMetadata.value = { learning: '', workshop: '', number: null }

  if (preloadedNextLesson.value) {
    releaseAudioElements(preloadedNextLesson.value.audioMap)
    preloadedNextLesson.value = null
  }
}

export function useAudio() {
  return {
    isLoadingAudio,
    isPlaying,
    isPaused,
    playbackFinished,
    hasAudio,
    currentItem,
    currentItemIndex,
    readingQueue,
    lessonMetadata,
    initializeAudio,
    play,
    pause,
    resume,
    stop,
    jumpToExample,
    skipToNext,
    skipToPrevious,
    playSingleItem,
    currentAudio,
    cleanup,
    // Continuous play mode
    continuousMode,
    enableContinuousMode,
    disableContinuousMode,
    isTransitioning,
    lessonTransitionTick,
  }
}
