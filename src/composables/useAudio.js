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

// Preload queue: lessons ahead of the currently playing one, with their
// Audio elements already created. Filled by preloadAllUpcomingLessons when
// the user enables continuous mode (fix E for #240). transitionToNextLesson
// shifts from the head; background top-ups refill the tail until the
// playtime budget is spent.
const preloadedLessons = ref([]) // [{ lesson, learning, workshop, queue, audioMap, estimatedSeconds }]

// Legacy alias for the single-next-lesson preload (kept for backwards compat
// with tests that still check preloadedNextLesson.value directly). Mirrors
// the head of preloadedLessons.
const preloadedNextLesson = ref(null)

// Playtime budget for the upfront preload, in seconds. Set to 1 hour per
// #240 discussion: "no cap, or summarize playtime and cap at 1 hour".
// Large workshops are capped; typical workshops fit entirely.
const CONTINUOUS_PRELOAD_PLAYTIME_BUDGET_SECONDS = 60 * 60

// Rough estimate of seconds per audio clip before loadedmetadata fires.
// Used as a placeholder so we can bound the preload before the real
// audio.duration values come in.
const ESTIMATED_SECONDS_PER_CLIP = 5

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

    // Capture playback state to decide whether we're rebuilding on top of
    // a running chain (fix F for #240). Previously we'd abort the rebuild
    // here and leave audioElements half-built — forcing every subsequent
    // clip to late-bind, which iOS doesn't like.
    //
    // New behaviour: rebuild the queue + map as normal, BUT:
    //   1. Release old audio elements EXCEPT the currently playing one,
    //   2. After building the new map, re-register the playing element
    //      under its URL key so the chain can keep reading it,
    //   3. Preserve isPlaying / isPaused / currentItemIndex / currentAudio
    //      so the chain is not interrupted.
    const wasPlaying = isPlaying.value
    const wasPaused = isPaused.value
    const savedCurrentAudio = currentAudio.value
    const savedIndex = currentItemIndex.value

    if (wasPlaying || wasPaused) {
      recordAudioEvent({
        kind: 'init-rebuild-preserving-playback',
        lesson: lesson.title,
        wasPlaying, wasPaused, savedIndex,
      })
    }

    // Release old audio elements, protecting the currently playing one
    // so the chain can keep reading it across the rebuild.
    releaseAudioElements(audioElements.value, savedCurrentAudio)

    // Pre-load audio files (filtered by manifest if available) — fire-and-forget
    audioElements.value = preloadAudioFiles(readingQueue.value, manifest)

    // If we were playing mid-chain, re-stitch the currently playing audio
    // into the new map under its URL key. Without this the onended handler's
    // subsequent `playNextItem` call would see a new map that doesn't
    // include the element it's currently using.
    if (savedCurrentAudio && savedCurrentAudio.src) {
      // Find the item's URL in the new queue; fall back to savedCurrentAudio.src
      const matchedItem = readingQueue.value.find(i => i.audioUrl === savedCurrentAudio.src)
      if (matchedItem) {
        audioElements.value[matchedItem.audioUrl] = savedCurrentAudio
      } else {
        audioElements.value[savedCurrentAudio.src] = savedCurrentAudio
      }
    }

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

    // Preserve playback state if we were mid-chain. Otherwise this is a
    // fresh init and we reset everything to the initial state.
    if (!wasPlaying && !wasPaused) {
      currentItemIndex.value = -1
      isPlaying.value = false
      isPaused.value = false
      currentAudio.value = null
    } else {
      // Rebuild preserved — keep isPlaying / isPaused / currentItemIndex /
      // currentAudio as they were before the rebuild. The new readingQueue
      // may have a different length, so clamp currentItemIndex defensively.
      if (currentItemIndex.value >= readingQueue.value.length) {
        currentItemIndex.value = readingQueue.value.length - 1
      }
    }

    // Drop any preload queue from a previous workshop/session. We don't
    // release the audio elements here because the continuous-mode flow is
    // expected to rebuild them via preloadAllUpcomingLessons on next start.
    preloadedLessons.value = []
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
    // Get pre-loaded audio element. After fix G for #240, late-binding is
    // a hard error — every item in the queue MUST have an entry in the
    // audioElements map by the time the chain reaches it. iOS Safari
    // rejects `new Audio().play()` calls made outside the original user
    // gesture chain, which silently killed the chain whenever the map
    // had been partially built. Now we stop loudly and record the reason
    // so the debug overlay surfaces it.
    const audio = audioElements.value[item.audioUrl]

    if (!audio) {
      recordAudioEvent({
        kind: 'late-bind-stop',
        url: item.audioUrl,
        type: item.type,
        index: currentItemIndex.value,
        queueLength: readingQueue.value.length,
        mapSize: Object.keys(audioElements.value).length,
      })
      console.error(`🛑 AUDIO STOP: missing preloaded audio for ${item.audioUrl}`)
      stop()
      return
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
    const audio = audioElements.value[item.audioUrl]

    if (!audio) {
      // See comment in playNextItem — no late-binding (fix G for #240).
      recordAudioEvent({
        kind: 'late-bind-stop',
        url: item.audioUrl,
        type: item.type,
        index: currentItemIndex.value,
        source: 'playCurrentItem',
      })
      console.error(`🛑 AUDIO STOP: resumed item missing from preload map: ${item.audioUrl}`)
      stop()
      return
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

// Start playing from beginning or continue.
//
// play() is async so it can await an in-flight initializeAudio call (fix G
// for #240). This is what gives us the invariant "by the time playNextItem
// looks up an audio element in audioElements.value, the map is fully built".
// Modern browsers (Chrome, Safari, Firefox) keep the user gesture valid
// across an await as long as no setTimeout intervenes — awaiting the
// manifest fetch + preloadAudioFiles synchronous work is safe.
async function play(settings) {
  if (readingQueue.value.length === 0 && !_initInFlight) {
    recordAudioEvent({ kind: 'play-skip-empty-queue' })
    console.warn('⚠️ No items in reading queue')
    return
  }

  latestAudioSettingsRef.value = settings

  // If an init is mid-flight, wait for it to finish. The audioElements
  // map will be fully populated by the time it returns.
  if (_initInFlight) {
    recordAudioEvent({ kind: 'play-await-init' })
    try { await _initInFlight } catch {}
  }

  // Re-check queue after awaiting init (the init may have built it)
  if (readingQueue.value.length === 0) {
    recordAudioEvent({ kind: 'play-skip-empty-queue-after-init' })
    console.warn('⚠️ No items in reading queue')
    return
  }

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
    const audio = audioElements.value[item.audioUrl]

    if (!audio) {
      recordAudioEvent({
        kind: 'late-bind-stop',
        url: item.audioUrl,
        type: item.type,
        source: 'playSingleItem',
      })
      console.warn(`🛑 Single-item play skipped — missing from preload map: ${item.audioUrl}`)
      return
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
  // Fix E for #240: when we have a workshop context (set via
  // setWorkshopLessons), fill the preload queue with the whole remaining
  // workshop up to the playtime budget. This runs inside the user's gesture
  // so all <audio> elements exist before the chain advances, which is what
  // iOS Safari needs for reliable auto-advance on the lock screen.
  //
  // Fall back to the single-lesson preload when no context is set (legacy
  // provider path).
  const ctx = workshopContext.value
  if (ctx && ctx.lessons && ctx.lessons.length > 0 && !provider) {
    preloadAllUpcomingLessons().catch(() => { /* best effort */ })
  } else {
    preloadNextLesson().catch(() => { /* best effort */ })
  }
}

function disableContinuousMode() {
  continuousMode.value = false
  nextLessonProvider.value = null
  // Release the whole preload queue. Each entry holds an audioMap with
  // pre-created <audio> elements that we need to pause/clear.
  for (const entry of preloadedLessons.value) {
    releaseAudioElements(entry.audioMap)
  }
  preloadedLessons.value = []
  preloadedNextLesson.value = null
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

// Build a preloaded lesson record (queue + audioMap + estimated playtime).
async function buildPreloadedLesson(lesson, learning, workshop) {
  const settings = latestAudioSettingsRef.value || { readAnswers: true, audioSpeed: 1.0 }
  const queue = buildReadingQueue(lesson, learning, workshop, settings)
  const audioBase = getAudioBase(lesson, learning, workshop)
  const manifest = await fetchAudioManifest(audioBase)
  const audioMap = preloadAudioFiles(queue, manifest)

  // Estimate playtime. Use audio.duration if loadedmetadata already fired,
  // otherwise fall back to ESTIMATED_SECONDS_PER_CLIP per queue item.
  // The estimate is rough and used only to bound the preload — accurate
  // timing is unnecessary.
  let estimatedSeconds = 0
  for (const item of queue) {
    const audio = audioMap[item.audioUrl]
    if (audio && !Number.isNaN(audio.duration) && audio.duration > 0) {
      estimatedSeconds += audio.duration
    } else {
      estimatedSeconds += ESTIMATED_SECONDS_PER_CLIP
    }
  }

  return { lesson, learning, workshop, queue, audioMap, estimatedSeconds }
}

// Sum of estimated playtime of all lessons currently in the preload queue.
function sumPreloadedPlaytime() {
  return preloadedLessons.value.reduce((s, l) => s + l.estimatedSeconds, 0)
}

/**
 * Preload every remaining lesson in the workshop, up to a 1-hour playtime
 * budget. Called from inside the user's double-click gesture handler so all
 * Audio elements exist before the chain advances — this is what keeps iOS
 * happy across continuous-mode transitions (fix E for #240).
 */
async function preloadAllUpcomingLessons() {
  if (!continuousMode.value) {
    recordAudioEvent({ kind: 'preload-all-skip', reason: 'not-continuous' })
    return
  }

  const ctx = workshopContext.value
  if (!ctx || !ctx.lessons || ctx.lessons.length === 0) {
    recordAudioEvent({ kind: 'preload-all-skip', reason: 'no-workshop-context' })
    return
  }

  // Find the current lesson's index in the workshop context
  const currentNumber = lessonMetadata.value.number
  const currentIdx = ctx.lessons.findIndex(l => l.number === currentNumber)
  if (currentIdx < 0) {
    recordAudioEvent({ kind: 'preload-all-skip', reason: 'current-lesson-not-in-context' })
    return
  }

  // Release any existing preload queue so we start fresh
  for (const entry of preloadedLessons.value) {
    releaseAudioElements(entry.audioMap)
  }
  preloadedLessons.value = []
  preloadedNextLesson.value = null

  recordAudioEvent({
    kind: 'preload-all-start',
    budgetSeconds: CONTINUOUS_PRELOAD_PLAYTIME_BUDGET_SECONDS,
    upcomingCount: ctx.lessons.length - currentIdx - 1,
  })

  let lessonsAdded = 0
  for (let i = currentIdx + 1; i < ctx.lessons.length; i++) {
    // Budget check: stop adding lessons once we exceed the playtime cap
    if (sumPreloadedPlaytime() >= CONTINUOUS_PRELOAD_PLAYTIME_BUDGET_SECONDS) {
      recordAudioEvent({
        kind: 'preload-all-budget-exceeded',
        added: lessonsAdded,
        remaining: ctx.lessons.length - i,
        playtimeSeconds: sumPreloadedPlaytime(),
      })
      break
    }

    try {
      const entry = await buildPreloadedLesson(ctx.lessons[i], ctx.learning, ctx.workshop)
      preloadedLessons.value.push(entry)
      lessonsAdded++
    } catch (e) {
      recordAudioEvent({
        kind: 'preload-all-error',
        lesson: ctx.lessons[i].title,
        error: e && e.message ? e.message : String(e),
      })
    }
  }

  // Mirror the head into the legacy single-preload slot for backwards compat
  preloadedNextLesson.value = preloadedLessons.value[0] || null

  recordAudioEvent({
    kind: 'preload-all-done',
    added: lessonsAdded,
    playtimeSeconds: Math.round(sumPreloadedPlaytime()),
  })
}

// Preload the single next lesson's audio in the background. Called as a
// best-effort fallback when continuous mode is enabled without
// preloadAllUpcomingLessons (e.g. legacy callers).
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
    const entry = await buildPreloadedLesson(lesson, learning, workshop)

    // Push to the queue too, so the transition path sees it
    preloadedLessons.value.push(entry)
    preloadedNextLesson.value = entry
    console.log(`🔄 Preloaded next lesson: "${lesson.title}"`)
    recordAudioEvent({
      kind: 'preload-built',
      lesson: lesson.title, lessonNumber: lesson.number,
      queueLength: entry.queue.length,
      fileCount: Object.keys(entry.audioMap).length,
      estimatedSeconds: Math.round(entry.estimatedSeconds),
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

  // Shift the head of the preload queue. This is the happy path after fix E
  // for #240 — preloadAllUpcomingLessons filled the queue inside the user's
  // gesture, so every transition pops an already-loaded record.
  let next = preloadedLessons.value.shift()

  if (!next) {
    recordAudioEvent({ kind: 'transition-build-inline', reason: 'no-preload-queue' })
    try {
      const resolved = await resolveNextLesson()
      if (!resolved || !resolved.lesson) {
        recordAudioEvent({ kind: 'transition-end-of-workshop' })
        return false
      }
      next = await buildPreloadedLesson(resolved.lesson, resolved.learning, resolved.workshop)
    } catch (e) {
      recordAudioEvent({
        kind: 'transition-build-error',
        error: e && e.message ? e.message : String(e),
      })
      console.warn('⚠️ Could not load next lesson for transition:', e)
      return false
    }
  } else {
    recordAudioEvent({
      kind: 'transition-use-preload',
      lesson: next.lesson.title,
      remainingPreloads: preloadedLessons.value.length,
    })
  }

  // Update the legacy single-slot mirror to the new head
  preloadedNextLesson.value = preloadedLessons.value[0] || null

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
  // The preload queue was shifted at the top of transitionToNextLesson;
  // update the legacy mirror to the new head.
  preloadedNextLesson.value = preloadedLessons.value[0] || null

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

  // Top up the preload queue — we just consumed an entry, so check whether
  // there's budget and more lessons to add. If we're using the workshop
  // context path, try to add one more lesson to the tail; otherwise fall
  // back to the legacy single-lesson preload.
  setTimeout(async () => {
    if (!continuousMode.value) return
    const ctx = workshopContext.value
    if (ctx && ctx.lessons && ctx.lessons.length > 0 && !nextLessonProvider.value) {
      // Find the lesson number AFTER the last one currently preloaded
      const last = preloadedLessons.value[preloadedLessons.value.length - 1]
      const pivotNumber = last ? last.lesson.number : lessonMetadata.value.number
      const pivotIdx = ctx.lessons.findIndex(l => l.number === pivotNumber)
      if (pivotIdx < 0 || pivotIdx >= ctx.lessons.length - 1) return
      if (sumPreloadedPlaytime() >= CONTINUOUS_PRELOAD_PLAYTIME_BUDGET_SECONDS) return
      try {
        const entry = await buildPreloadedLesson(
          ctx.lessons[pivotIdx + 1], ctx.learning, ctx.workshop
        )
        preloadedLessons.value.push(entry)
        preloadedNextLesson.value = preloadedLessons.value[0] || null
        recordAudioEvent({
          kind: 'preload-topup-added',
          lesson: entry.lesson.title,
          queueSize: preloadedLessons.value.length,
          playtimeSeconds: Math.round(sumPreloadedPlaytime()),
        })
      } catch (e) {
        recordAudioEvent({ kind: 'preload-topup-error', error: e && e.message ? e.message : String(e) })
      }
    } else {
      preloadNextLesson()
    }
  }, 0)

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

  // Drain the preload queue — every entry holds pre-created audio elements.
  for (const entry of preloadedLessons.value) {
    releaseAudioElements(entry.audioMap)
  }
  preloadedLessons.value = []
  preloadedNextLesson.value = null

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
    audioElements,
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
