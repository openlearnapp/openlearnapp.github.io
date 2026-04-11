import { ref, computed } from 'vue'
import { useLessons } from './useLessons'
import { useProgress } from './useProgress'
import { useGun } from './useGun'
import { recordAudioEvent } from './useAudioDebug'

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
// Workshop context for continuous-mode resolution. The view layer calls
// setWorkshopLessons(lang, workshop, sortedLessons) once per workshop and
// never again — the composable then resolves "next lesson" from this
// shared state, eliminating the provider-closure churn that used to race
// with each LessonDetail remount (fix C for #240).
const workshopContext = ref({ learning: null, workshop: null, lessons: [] })
// Legacy provider-callback path — kept for backwards compatibility for tests
// and callers that don't yet use setWorkshopLessons. Prefer the context model.
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
      // Playing mode is for listening & repeating — skip assessment items
      // (input / multiple-choice / select) entirely. The user can come back
      // to the lesson in read mode to answer them.
      if (example.type && example.type !== 'qa') {
        return false
      }

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

// Single-flight lock for initializeAudio. Prevents concurrent calls from
// clobbering each other's state. If a second call arrives while the first
// is still in-flight, it waits for the first to finish and then decides
// whether it still needs to run.
let _initInFlight = null

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
// effect the next time the user pauses and resumes.
async function initializeAudio(lesson, learning, workshop, settings, { force = false } = {}) {
  // Serialize concurrent calls. If another init is already in-flight, wait
  // for it, then re-evaluate whether we still need to run.
  if (_initInFlight) {
    recordAudioEvent({ kind: 'init-wait-in-flight', lesson: lesson.title, force })
    try { await _initInFlight } catch {}
  }

  _initInFlight = (async () => {
    latestAudioSettingsRef.value = settings

    const meta = lessonMetadata.value
    const isSameLesson =
      meta.learning === learning &&
      meta.workshop === workshop &&
      meta.number === lesson.number

    recordAudioEvent({
      kind: 'init-start',
      lesson: lesson.title, lessonNumber: lesson.number,
      learning, workshop, force, isSameLesson,
      hasAudio: hasAudio.value, isLoading: isLoadingAudio.value,
      isPlaying: isPlaying.value, isPaused: isPaused.value,
    })

    // During a continuous-mode transition, the composable has already loaded
    // the new lesson in-place. Skip re-initialization so we don't destroy
    // the active audio element and iOS media session.
    if (isSameLesson && hasAudio.value && !isLoadingAudio.value && !force) {
      recordAudioEvent({ kind: 'init-skip-idempotent', lesson: lesson.title })
      return
    }

    // Defensive: never tear down the queue of an actively playing lesson.
    // The caller can re-trigger a rebuild after the user pauses.
    if (isSameLesson && force && (isPlaying.value || isPaused.value)) {
      recordAudioEvent({ kind: 'init-skip-force-during-playback', lesson: lesson.title })
      console.log(`🎧 Skipping force rebuild of "${lesson.title}" — playback is active`)
      return
    }

    lessonTitle.value = lesson.title
    lessonMetadata.value = { learning, workshop, number: lesson.number }

    playbackFinished.value = false
    isLoadingAudio.value = true
    readingQueue.value = buildReadingQueue(lesson, learning, workshop, settings)
    recordAudioEvent({
      kind: 'init-queue-built',
      lesson: lesson.title, queueLength: readingQueue.value.length,
    })

    // Fetch manifest to know which audio files exist (if missing, load all)
    const audioBase = getAudioBase(lesson, learning, workshop)
    const manifest = await fetchAudioManifest(audioBase)

    // Post-await guard: if playback started during our await (e.g. the caller
    // fired play() as soon as we yielded), do NOT clobber the running state.
    // The queue will be rebuilt on the next pause/resume or explicit call.
    if (isPlaying.value || isPaused.value) {
      recordAudioEvent({ kind: 'init-abort-playback-started', lesson: lesson.title })
      console.log(`🎧 Playback started during init — aborting rebuild of "${lesson.title}"`)
      isLoadingAudio.value = false
      return
    }

    // Release old audio elements (if any) before creating new ones
    releaseAudioElements(audioElements.value)

    // Pre-load audio files (filtered by manifest if available) — fire-and-forget
    audioElements.value = preloadAudioFiles(readingQueue.value, manifest)

    hasAudio.value = Object.keys(audioElements.value).length > 0
    const loadedCount = Object.keys(audioElements.value).length
    console.log(`🔊 Audio: ${loadedCount} files ready for "${lesson.title}"`)
    recordAudioEvent({
      kind: 'init-preloaded',
      lesson: lesson.title, fileCount: loadedCount,
      queueLength: readingQueue.value.length,
      manifestHit: !!manifest,
    })

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

    recordAudioEvent({ kind: 'init-done', lesson: lesson.title })
  })()

  try {
    await _initInFlight
  } finally {
    _initInFlight = null
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
// Reads settings freshly from `latestAudioSettingsRef` on every callback
// invocation so mid-playback setting changes take effect on the next clip.
function attachPlaybackHandlers(audio, item) {
  audio.onended = () => {
    if (!isPlaying.value) return
    const currentSettings = latestAudioSettingsRef.value || { readAnswers: true, audioSpeed: 1.0 }

    // Determine pause duration based on item type
    let pauseDuration = 0

    if (item.type === 'section-title') {
      pauseDuration = 1200
    } else if (item.type === 'lesson-title') {
      pauseDuration = 1000
    } else {
      const isEndOfExample = item.type === 'answer' ||
        (item.type === 'question' && !currentSettings.readAnswers)

      if (isEndOfExample) {
        const nextItem = readingQueue.value[currentItemIndex.value + 1]
        const isSectionChange = nextItem && nextItem.sectionIdx !== item.sectionIdx
        pauseDuration = isSectionChange ? 1800 : 800
      }
    }

    if (pauseDuration > 0) {
      setTimeout(() => {
        if (isPlaying.value) playNextItem(latestAudioSettingsRef.value || currentSettings)
      }, pauseDuration)
    } else {
      playNextItem(latestAudioSettingsRef.value || currentSettings)
    }
  }

  audio.onerror = () => {
    console.warn('⚠️ Audio error, retrying:', item.audioUrl)
    retryPlay(item, latestAudioSettingsRef.value || { readAnswers: true, audioSpeed: 1.0 })
  }
}

// Play next item in queue
async function playNextItem(settings) {
  latestAudioSettingsRef.value = settings

  if (currentItemIndex.value >= readingQueue.value.length - 1) {
    // End of current lesson
    recordAudioEvent({
      kind: 'queue-end-reached',
      lesson: lessonTitle.value,
      continuousMode: continuousMode.value,
    })
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
    recordAudioEvent({ kind: 'playback-finished', lesson: lessonTitle.value })
    stop()
    return
  }

  currentItemIndex.value++
  const item = readingQueue.value[currentItemIndex.value]

  // Skip if no audio URL
  if (!item.audioUrl) {
    recordAudioEvent({ kind: 'skip-no-url', type: item.type, index: currentItemIndex.value })
    playNextItem(settings)
    return
  }

  try {
    // Get pre-loaded audio element
    let audio = audioElements.value[item.audioUrl]

    if (!audio) {
      // Late-bind is a bug surface — on iOS, a freshly-created <audio>
      // element played outside a user gesture chain may be rejected by
      // the browser, which silently stops the chain. Record it so the
      // debug overlay can show the reason and the late-bound fallback
      // gives us a chance to recover for the common case.
      recordAudioEvent({
        kind: 'late-bind',
        url: item.audioUrl,
        type: item.type,
        index: currentItemIndex.value,
        queueLength: readingQueue.value.length,
        mapSize: Object.keys(audioElements.value).length,
      })
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

    attachPlaybackHandlers(audio, item)

    recordAudioEvent({
      kind: 'play-item',
      index: currentItemIndex.value,
      type: item.type,
      text: item.text ? item.text.slice(0, 40) : '',
    })
    // Play
    await audio.play()
  } catch (error) {
    recordAudioEvent({
      kind: 'play-failed',
      url: item.audioUrl,
      type: item.type,
      error: error && error.message ? error.message : String(error),
    })
    console.warn('⚠️ play() failed, retrying:', item.audioUrl, error.message)
    retryPlay(item, settings)
  }
}

// Retry playing by creating a fresh audio element
async function retryPlay(item, settings) {
  if (!isPlaying.value) return
  recordAudioEvent({ kind: 'retry-attempt', url: item.audioUrl, type: item.type })
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
      recordAudioEvent({ kind: 'retry-failed-onerror', url: item.audioUrl, type: item.type })
      console.error('🛑 AUDIO STOP: retry also failed for', item.audioUrl)
      stop()
    }
    currentAudio.value = fresh
    audioElements.value[item.audioUrl] = fresh
    await fresh.play()
  } catch (e) {
    recordAudioEvent({
      kind: 'retry-failed-exception',
      url: item.audioUrl, type: item.type,
      error: e && e.message ? e.message : String(e),
    })
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

    attachPlaybackHandlers(audio, item)

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
    recordAudioEvent({ kind: 'play-skip-empty-queue' })
    console.warn('⚠️ No items in reading queue')
    return
  }

  latestAudioSettingsRef.value = settings

  // Guard: if the chain is already running (isPlaying=true and not paused),
  // don't re-enter. We check isPlaying+isPaused instead of currentAudio.paused
  // because the native `audio.paused` flag flips to true between clips (after
  // onended fires), and that false-negative used to let re-entrant play()
  // calls double-advance the queue.
  if (isPlaying.value && !isPaused.value) {
    recordAudioEvent({ kind: 'play-skip-already-running' })
    return
  }

  const wasResuming = isPaused.value && currentItemIndex.value >= 0

  playbackFinished.value = false
  isPlaying.value = true
  isPaused.value = false

  recordAudioEvent({
    kind: 'play-called',
    wasResuming,
    lesson: lessonTitle.value,
    queueLength: readingQueue.value.length,
    currentItemIndex: currentItemIndex.value,
  })

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

  recordAudioEvent({
    kind: 'pause-called',
    currentItemIndex: currentItemIndex.value,
    lesson: lessonTitle.value,
  })

  // Allow deferred remote sync pulls to flush now that playback is paused.
  try { resumeSyncPulls() } catch {}
}

// Resume playback (alias for play)
function resume(settings) {
  play(settings)
}

// Stop playback completely
function stop() {
  recordAudioEvent({
    kind: 'stop-called',
    wasPlaying: isPlaying.value,
    currentItemIndex: currentItemIndex.value,
    lesson: lessonTitle.value,
  })
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
 * Tell the composable which workshop + lessons we're playing. Called once
 * per workshop by the view layer. The composable then resolves the "next
 * lesson" itself via its own built-in resolver, without a provider closure
 * that has to be re-registered on every LessonDetail remount.
 *
 * This is fix C for #240 — the provider-closure churn used to race with
 * the preload scheduled by transitionToNextLesson.
 *
 * @param {string} learning
 * @param {string} workshop
 * @param {Array<object>} lessons - full list of lessons in the workshop,
 *   typically the result of loadAllLessonsForWorkshop (already sorted).
 */
function setWorkshopLessons(learning, workshop, lessons) {
  const sorted = Array.isArray(lessons)
    ? [...lessons].sort((a, b) => a.number - b.number)
    : []
  workshopContext.value = { learning, workshop, lessons: sorted }
  recordAudioEvent({
    kind: 'workshop-context-set',
    learning, workshop, lessonCount: sorted.length,
  })
}

// Built-in resolver: "give me the lesson after the one currently loaded".
// Used when the view layer has called setWorkshopLessons instead of passing
// a provider closure. Pure function of workshopContext + lessonMetadata.
function resolveNextLessonFromContext() {
  const ctx = workshopContext.value
  if (!ctx || !ctx.lessons || ctx.lessons.length === 0) return null
  if (ctx.learning !== lessonMetadata.value.learning ||
      ctx.workshop !== lessonMetadata.value.workshop) {
    // Context is for a different workshop than what's currently playing —
    // don't guess.
    return null
  }
  const currentNumber = lessonMetadata.value.number
  const idx = ctx.lessons.findIndex(l => l.number === currentNumber)
  if (idx < 0) return null
  const next = ctx.lessons[idx + 1]
  if (!next) return null
  return { lesson: next, learning: ctx.learning, workshop: ctx.workshop }
}

/**
 * Enable continuous playback across lessons.
 *
 * Two calling conventions, in order of preference:
 *
 *   1. `enableContinuousMode()` — use the composable's built-in resolver,
 *      which draws from workshopContext set via setWorkshopLessons().
 *
 *   2. `enableContinuousMode(provider)` — legacy path, `provider` is an
 *      async callback returning `{ lesson, learning, workshop }` or null.
 *      Only use this if the caller can't populate workshopContext.
 */
function enableContinuousMode(provider) {
  continuousMode.value = true
  nextLessonProvider.value = provider || null
  recordAudioEvent({
    kind: 'continuous-mode-enabled',
    mode: provider ? 'legacy-provider' : 'context',
  })
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
  recordAudioEvent({ kind: 'continuous-mode-disabled' })
}

// Resolve the next lesson, preferring the built-in context-based resolver
// and falling back to the legacy provider callback.
async function resolveNextLesson() {
  // 1. Context-based (new path — no closure churn)
  const fromContext = resolveNextLessonFromContext()
  if (fromContext) return fromContext
  // 2. Legacy provider callback
  if (nextLessonProvider.value) {
    try {
      return await nextLessonProvider.value()
    } catch {
      return null
    }
  }
  return null
}

// Preload the next lesson's audio in the background while the current one plays.
// Called after initializeAudio and after each transition.
async function preloadNextLesson() {
  if (!continuousMode.value) {
    recordAudioEvent({ kind: 'preload-skip', reason: 'not-continuous' })
    return
  }
  if (preloadedNextLesson.value) {
    recordAudioEvent({ kind: 'preload-skip', reason: 'already-preloaded' })
    return
  }

  try {
    const next = await resolveNextLesson()
    if (!next || !next.lesson) {
      recordAudioEvent({ kind: 'preload-skip', reason: 'resolver-returned-null' })
      return
    }

    const { lesson, learning, workshop } = next
    const settings = latestAudioSettingsRef.value || { readAnswers: true, audioSpeed: 1.0 }
    const queue = buildReadingQueue(lesson, learning, workshop, settings)
    const audioBase = getAudioBase(lesson, learning, workshop)
    const manifest = await fetchAudioManifest(audioBase)
    const audioMap = preloadAudioFiles(queue, manifest)

    preloadedNextLesson.value = { lesson, learning, workshop, queue, audioMap }
    console.log(`🔄 Preloaded next lesson: "${lesson.title}"`)
    recordAudioEvent({
      kind: 'preload-built',
      lesson: lesson.title, lessonNumber: lesson.number,
      queueLength: queue.length, fileCount: Object.keys(audioMap).length,
    })
  } catch (e) {
    recordAudioEvent({ kind: 'preload-error', error: e && e.message ? e.message : String(e) })
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
  if (!continuousMode.value) {
    recordAudioEvent({ kind: 'transition-skip', reason: 'not-continuous' })
    return false
  }

  // Use the preloaded lesson if available; otherwise resolve one now
  let next = preloadedNextLesson.value
  if (!next) {
    recordAudioEvent({ kind: 'transition-build-inline', reason: 'no-preload' })
    try {
      const resolved = await resolveNextLesson()
      if (!resolved || !resolved.lesson) {
        recordAudioEvent({ kind: 'transition-end-of-workshop' })
        return false
      }
      const { lesson, learning, workshop } = resolved
      const queue = buildReadingQueue(lesson, learning, workshop, settings)
      const audioBase = getAudioBase(lesson, learning, workshop)
      const manifest = await fetchAudioManifest(audioBase)
      const audioMap = preloadAudioFiles(queue, manifest)
      next = { lesson, learning, workshop, queue, audioMap }
    } catch (e) {
      recordAudioEvent({
        kind: 'transition-build-error',
        error: e && e.message ? e.message : String(e),
      })
      console.warn('⚠️ Could not load next lesson for transition:', e)
      return false
    }
  } else {
    recordAudioEvent({ kind: 'transition-use-preload', lesson: next.lesson.title })
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
    recordAudioEvent({ kind: 'transition-released-old-map', count: Object.keys(toRelease).length })
  }, 200)

  // Start preloading the lesson AFTER this one
  setTimeout(() => preloadNextLesson(), 0)

  recordAudioEvent({
    kind: 'transition-done',
    lesson: lesson.title, lessonNumber: lesson.number,
    queueLength: queue.length, fileCount: Object.keys(audioMap).length,
  })
  return true
}

// Get current reading position
const currentItem = computed(() => {
  if (currentItemIndex.value >= 0 && currentItemIndex.value < readingQueue.value.length) {
    return readingQueue.value[currentItemIndex.value]
  }
  return null
})

// Focus mode: true whenever the audio chain is actively playing (not paused,
// not stopped). The UI uses this to disable all state-mutating interactions
// while a lesson is being played — learn toggles, assessment inputs, settings
// switches, label clicks, etc. This collapses the test matrix: instead of
// guarding every individual mutation path against "is the audio chain
// running?", the view layer hides or disables those controls entirely.
const isInFocusMode = computed(() => isPlaying.value && !isPaused.value)

// Cleanup
function cleanup() {
  // During a continuous-mode transition, skip teardown so the new lesson can
  // take over without losing the iOS media session.
  if (isTransitioning.value) {
    recordAudioEvent({ kind: 'cleanup-skipped', reason: 'transitioning' })
    return
  }

  recordAudioEvent({
    kind: 'cleanup-start',
    wasPlaying: isPlaying.value,
    lesson: lessonTitle.value,
    mapSize: Object.keys(audioElements.value).length,
  })

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

  // Clear workshopContext too so the next init starts from a clean slate.
  workshopContext.value = { learning: null, workshop: null, lessons: [] }

  recordAudioEvent({ kind: 'cleanup-done' })
}

export function useAudio() {
  return {
    isLoadingAudio,
    isPlaying,
    isPaused,
    isInFocusMode,
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
    setWorkshopLessons,
    isTransitioning,
    lessonTransitionTick,
  }
}
