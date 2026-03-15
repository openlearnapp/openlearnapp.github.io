import { ref, computed } from 'vue'
import { useLessons } from './useLessons'
import { useProgress } from './useProgress'

// Get lesson composable for language codes
const { getLanguageCode, getWorkshopCode, resolveWorkshopKey, getWorkshopMeta } = useLessons()

// Get progress composable for learned items
const { areAllItemsLearned } = useProgress()

// Shared audio state (singleton pattern)
const isLoadingAudio = ref(false)
const isPlaying = ref(false)
const isPaused = ref(false)
const currentItemIndex = ref(-1)
const readingQueue = ref([])
const audioElements = ref([]) // Pre-loaded audio elements
const currentAudio = ref(null) // Currently playing audio element
const playbackFinished = ref(false)
const hasAudio = ref(false) // True when at least one audio file loaded successfully
const lessonTitle = ref('')
const lessonMetadata = ref({ learning: '', workshop: '', number: '' })

// Determine audio base path for a lesson
function getAudioBase(lesson, learning, workshop) {
  const baseUrl = import.meta.env.BASE_URL
  const lessonFilename = lesson._filename || `${String(lesson.number).padStart(2, '0')}-lesson`
  const resolvedWorkshop = resolveWorkshopKey(workshop)

  if (lesson._source && lesson._source.type === 'url') {
    return `${lesson._source.path}/audio`
  } else if (resolvedWorkshop && (resolvedWorkshop.startsWith('http://') || resolvedWorkshop.startsWith('https://'))) {
    return `${resolvedWorkshop}/${lessonFilename}/audio`
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

  console.log(`🎵 Building audio queue from: ${audioBase}`)
  console.log(`🔍 Hide learned examples: ${settings.hideLearnedExamples}`)

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
    } else {
      console.log(`⏭️  Skipping section ${sectionIdx} (${section.title}) - no visible examples`)
    }
  })

  console.log(`📋 Built queue with ${queue.length} items (filtered by learned status)`)

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
    console.log(`📋 Audio manifest: ${files.length} files`)
    return new Set(files)
  } catch {
    return null
  }
}

// Pre-load all audio files (filtered by manifest if available)
async function preloadAudioFiles(queue, manifest) {
  console.log('📥 Pre-loading audio files...')

  const audioLoadPromises = queue
    .filter(item => {
      if (!item.audioUrl) return false
      if (manifest) {
        const filename = item.audioUrl.split('/').pop()
        if (!manifest.has(filename)) {
          console.log(`⏭️ Skipping (not in manifest): ${filename}`)
          return false
        }
      }
      return true
    })
    .map(async (item) => {
      const audio = new Audio()
      audio.preload = 'auto'
      audio.src = item.audioUrl

      // Don't set playback rate here - it will be set dynamically when playing

      // Wait for audio to be loadable
      return new Promise((resolve) => {
        audio.addEventListener('canplaythrough', () => {
          console.log(`✅ Loaded: ${item.audioUrl}`)
          resolve({ item, audio })
        }, { once: true })

        audio.addEventListener('error', (e) => {
          console.warn(`⚠️ Failed to load: ${item.audioUrl}`, e)
          resolve({ item, audio: null })
        }, { once: true })

        // Start loading
        audio.load()
      })
    })

  const results = await Promise.all(audioLoadPromises)

  // Create map of audioUrl -> audio element
  const audioMap = {}
  results.forEach(({ item, audio }) => {
    if (audio) {
      audioMap[item.audioUrl] = audio
    }
  })

  console.log(`✅ Pre-loaded ${Object.keys(audioMap).length} audio files`)
  return audioMap
}

// Setup Media Session API for lock screen controls
function setupMediaSession(lessonTitle, learning, workshop) {
  if (!('mediaSession' in navigator)) {
    console.log('⚠️ Media Session API not supported')
    return
  }

  const baseUrl = import.meta.env.BASE_URL
  const meta = getWorkshopMeta(learning, workshop)
  const artworkUrl = meta.image || `${baseUrl}favicon.svg`

  navigator.mediaSession.metadata = new MediaMetadata({
    title: lessonTitle,
    artist: `Learning ${workshop}`,
    album: `Open Learn - ${learning}`,
    artwork: [
      { src: artworkUrl, sizes: '512x512', type: 'image/svg+xml' }
    ]
  })

  navigator.mediaSession.setActionHandler('play', () => {
    console.log('🎵 Media Session: play')
    play({ readAnswers: true }) // Resume playback
  })

  navigator.mediaSession.setActionHandler('pause', () => {
    console.log('⏸️ Media Session: pause')
    pause()
  })

  navigator.mediaSession.setActionHandler('previoustrack', () => {
    console.log('⏮️ Media Session: previous')
    skipToPrevious({ readAnswers: true })
  })

  navigator.mediaSession.setActionHandler('nexttrack', () => {
    console.log('⏭️ Media Session: next')
    skipToNext({ readAnswers: true })
  })

  console.log('✅ Media Session API configured')
}

// Initialize audio queue for a lesson
async function initializeAudio(lesson, learning, workshop, settings) {
  console.log('🎼 Initializing audio for lesson:', lesson.title)
  console.log('🌍 Languages:', { learning, workshop })
  console.log('📖 Lesson number:', lesson.number)
  console.log('📁 Lesson filename:', lesson._filename)
  console.log('🎵 Audio speed:', settings.audioSpeed)

  lessonTitle.value = lesson.title
  lessonMetadata.value = { learning, workshop, number: lesson.number }

  playbackFinished.value = false
  isLoadingAudio.value = true
  readingQueue.value = buildReadingQueue(lesson, learning, workshop, settings)

  console.log('📋 Built reading queue with', readingQueue.value.length, 'items')
  console.log('📋 First 5 items:', readingQueue.value.slice(0, 5).map(item => ({
    type: item.type,
    text: item.text?.substring(0, 40) + '...',
    audioUrl: item.audioUrl
  })))

  // Fetch manifest to know which audio files exist (if missing, load all)
  const audioBase = getAudioBase(lesson, learning, workshop)
  const manifest = await fetchAudioManifest(audioBase)

  // Pre-load audio files (filtered by manifest if available)
  audioElements.value = await preloadAudioFiles(readingQueue.value, manifest)

  hasAudio.value = Object.keys(audioElements.value).length > 0
  console.log(`🔊 Has audio: ${hasAudio.value} (${Object.keys(audioElements.value).length} files loaded)`)

  isLoadingAudio.value = false
  currentItemIndex.value = -1
  isPlaying.value = false
  isPaused.value = false
  currentAudio.value = null

  // Setup Media Session API
  setupMediaSession(lesson.title, learning, workshop)

  console.log('✅ Audio initialized')
}

// Play next item in queue
async function playNextItem(settings) {
  console.log('🎵 playNextItem called', {
    currentIndex: currentItemIndex.value,
    queueLength: readingQueue.value.length,
    isPlaying: isPlaying.value
  })

  if (currentItemIndex.value >= readingQueue.value.length - 1) {
    // Reached end of queue
    console.log('✅ Reached end of queue, stopping')
    playbackFinished.value = true
    stop()
    return
  }

  currentItemIndex.value++
  const item = readingQueue.value[currentItemIndex.value]

  console.log('🎤 Playing item:', {
    index: currentItemIndex.value,
    type: item.type,
    text: item.text
  })

  // Skip if no audio URL
  if (!item.audioUrl) {
    console.log('⏭️ No audio URL, skipping to next item')
    playNextItem(settings)
    return
  }

  try {
    // Get pre-loaded audio element
    const audio = audioElements.value[item.audioUrl]

    if (!audio) {
      console.warn('⚠️ Audio not found for:', item.audioUrl, '- stopping')
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
      console.log(`📚 Section title - setting slower playback speed to ${audio.playbackRate}x`)
    } else {
      audio.playbackRate = settings.audioSpeed || 1.0
      console.log(`🎵 Setting playback speed to ${audio.playbackRate}x`)
    }

    // Set up event handlers
    audio.onended = () => {
      console.log('⏹️ Audio ended for:', item.text?.substring(0, 50))
      if (isPlaying.value) {
        // Determine pause duration based on item type
        let pauseDuration = 0

        if (item.type === 'section-title') {
          // Section title just ended - add 1200ms pause before first example
          pauseDuration = 1200
          console.log(`⏸️ Section title ended - adding ${pauseDuration}ms pause`)
        } else if (item.type === 'lesson-title') {
          // Lesson title just ended - add 1000ms pause
          pauseDuration = 1000
          console.log(`⏸️ Lesson title ended - adding ${pauseDuration}ms pause`)
        } else {
          // Check if this is the end of an example (question or answer)
          const isEndOfExample = item.type === 'answer' ||
            (item.type === 'question' && !settings.readAnswers)

          if (isEndOfExample) {
            // Check if next item is in a different section
            const nextItem = readingQueue.value[currentItemIndex.value + 1]
            const isSectionChange = nextItem && nextItem.sectionIdx !== item.sectionIdx
            pauseDuration = isSectionChange ? 1800 : 800 // 1800ms between sections, 800ms between examples

            console.log(`⏸️ Adding ${pauseDuration}ms pause ${isSectionChange ? 'between sections' : 'between examples'}`)
          }
        }

        if (pauseDuration > 0) {
          setTimeout(() => {
            if (isPlaying.value) {
              playNextItem(settings)
            }
          }, pauseDuration)
        } else {
          playNextItem(settings)
        }
      }
    }

    audio.onerror = (e) => {
      console.error('❌ Audio playback error:', e, '- stopping')
      stop()
    }

    // Play
    await audio.play()
    console.log('▶️ Playing audio:', item.audioUrl)

  } catch (error) {
    console.error('❌ Error playing audio:', error, '- stopping')
    stop()
  }
}

// Play current item (used when resuming from pause)
async function playCurrentItem(settings) {
  console.log('🔁 playCurrentItem called (resuming from pause)', {
    currentIndex: currentItemIndex.value,
    queueLength: readingQueue.value.length,
    isPlaying: isPlaying.value
  })

  if (currentItemIndex.value < 0 || currentItemIndex.value >= readingQueue.value.length) {
    console.warn('⚠️ Invalid currentItemIndex, stopping')
    stop()
    return
  }

  const item = readingQueue.value[currentItemIndex.value]

  console.log('🎤 Playing item (resumed):', {
    index: currentItemIndex.value,
    type: item.type,
    text: item.text
  })

  // Skip if no audio URL
  if (!item.audioUrl) {
    console.log('⏭️ No audio URL, skipping to next item')
    playNextItem(settings)
    return
  }

  try {
    // Get pre-loaded audio element
    const audio = audioElements.value[item.audioUrl]

    if (!audio) {
      console.warn('⚠️ Audio not found for:', item.audioUrl, '- stopping')
      stop()
      return
    }

    currentAudio.value = audio

    // Apply playback speed from settings
    // Section titles are read slower (70% of normal speed) for clarity
    if (item.type === 'section-title') {
      audio.playbackRate = (settings.audioSpeed || 1.0) * 0.7
      console.log(`📚 Section title (resumed) - setting slower playback speed to ${audio.playbackRate}x`)
    } else {
      audio.playbackRate = settings.audioSpeed || 1.0
      console.log(`🎵 Setting playback speed to ${audio.playbackRate}x`)
    }

    // Set up event handlers
    audio.onended = () => {
      console.log('⏹️ Audio ended (resumed) for:', item.text?.substring(0, 50))
      if (isPlaying.value) {
        // Determine pause duration based on item type
        let pauseDuration = 0

        if (item.type === 'section-title') {
          // Section title just ended - add 1200ms pause before first example
          pauseDuration = 1200
          console.log(`⏸️ Section title ended - adding ${pauseDuration}ms pause`)
        } else if (item.type === 'lesson-title') {
          // Lesson title just ended - add 1000ms pause
          pauseDuration = 1000
          console.log(`⏸️ Lesson title ended - adding ${pauseDuration}ms pause`)
        } else {
          // Check if this is the end of an example (question or answer)
          const isEndOfExample = item.type === 'answer' ||
            (item.type === 'question' && !settings.readAnswers)

          if (isEndOfExample) {
            // Check if next item is in a different section
            const nextItem = readingQueue.value[currentItemIndex.value + 1]
            const isSectionChange = nextItem && nextItem.sectionIdx !== item.sectionIdx
            pauseDuration = isSectionChange ? 1800 : 800 // 1800ms between sections, 800ms between examples

            console.log(`⏸️ Adding ${pauseDuration}ms pause ${isSectionChange ? 'between sections' : 'between examples'}`)
          }
        }

        if (pauseDuration > 0) {
          setTimeout(() => {
            if (isPlaying.value) {
              playNextItem(settings)
            }
          }, pauseDuration)
        } else {
          playNextItem(settings)
        }
      }
    }

    audio.onerror = (e) => {
      console.error('❌ Audio playback error (resumed):', e, '- stopping')
      stop()
    }

    // Play from current position (resume)
    await audio.play()
    console.log('▶️ Resumed audio:', item.audioUrl)

  } catch (error) {
    console.error('❌ Error playing audio (resumed):', error, '- stopping')
    stop()
  }
}

// Start playing from beginning or continue
function play(settings) {
  console.log('🎬 Play button pressed')

  if (readingQueue.value.length === 0) {
    console.warn('⚠️ No items in reading queue')
    return
  }

  const wasResuming = isPaused.value && currentItemIndex.value >= 0

  playbackFinished.value = false
  console.log('▶️ Setting isPlaying to true')
  isPlaying.value = true
  isPaused.value = false

  console.log('🎯 Current position:', currentItemIndex.value)
  console.log('🎯 Resuming from pause:', wasResuming)

  if (wasResuming) {
    // Resume from where we paused
    console.log('✅ RESUMING - calling playCurrentItem')
    playCurrentItem(settings)
  } else {
    // Start from beginning or continue normally
    console.log('▶️ STARTING - calling playNextItem')
    playNextItem(settings)
  }
}

// Pause playback
function pause() {
  console.log('⏸️ Pausing at index:', currentItemIndex.value)
  isPlaying.value = false
  isPaused.value = true

  // Pause current audio
  if (currentAudio.value) {
    currentAudio.value.pause()
  }

  console.log('⏸️ Paused - position saved at:', currentItemIndex.value)
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

  // Stop current audio
  if (currentAudio.value) {
    currentAudio.value.pause()
    currentAudio.value.currentTime = 0
  }

  currentAudio.value = null
  console.log('🛑 Stopped')
}

// Skip to next item
function skipToNext(settings) {
  console.log('⏭️ Skip to next')

  if (currentItemIndex.value >= readingQueue.value.length - 1) {
    console.log('⚠️ Already at end of queue')
    return
  }

  // Stop current audio
  if (currentAudio.value) {
    currentAudio.value.pause()
  }

  // Play next item
  playNextItem(settings)
}

// Skip to previous item
function skipToPrevious(settings) {
  console.log('⏮️ Skip to previous')

  if (currentItemIndex.value <= 0) {
    console.log('⚠️ Already at start of queue')
    return
  }

  // Stop current audio
  if (currentAudio.value) {
    currentAudio.value.pause()
  }

  // Go back one item
  currentItemIndex.value--

  // Play current item
  playCurrentItem(settings)
}

// Play a single item (for clicking on examples)
async function playSingleItem(index, settings) {
  console.log('👆 Clicked on example, playing single item at index:', index)

  const item = readingQueue.value[index]
  if (!item || !item.audioUrl) {
    console.warn('⚠️ No audio found for item at index:', index)
    return
  }

  console.log('🎤 Single item:', {
    type: item.type,
    text: item.text
  })

  try {
    // Get pre-loaded audio element
    const audio = audioElements.value[item.audioUrl]

    if (!audio) {
      console.warn('⚠️ Audio not found for:', item.audioUrl)
      return
    }

    // Stop any current audio
    if (currentAudio.value && currentAudio.value !== audio) {
      currentAudio.value.pause()
    }

    currentAudio.value = audio
    audio.currentTime = 0

    // Apply playback speed from settings
    audio.playbackRate = settings.audioSpeed || 1.0

    // Set up event handlers
    audio.onended = () => {
      console.log('⏹️ Single item audio ended')
    }

    audio.onerror = (e) => {
      console.error('❌ Single item audio error:', e)
    }

    // Play
    await audio.play()
    console.log('▶️ Playing single item:', item.audioUrl)

  } catch (error) {
    console.error('❌ Error playing single item:', error)
  }
}

// Jump to specific example
function jumpToExample(sectionIdx, exampleIdx, settings) {
  // Find the index in the queue for this example
  const index = readingQueue.value.findIndex(
    item => item.sectionIdx === sectionIdx &&
            item.exampleIdx === exampleIdx &&
            item.type === 'question'
  )

  if (index !== -1) {
    console.log('👆 Jumping to example:', { sectionIdx, exampleIdx, index, isPlaying: isPlaying.value, isPaused: isPaused.value })

    if (isPlaying.value) {
      // Continue playing from this point
      // Stop current audio
      if (currentAudio.value) {
        currentAudio.value.pause()
      }

      currentItemIndex.value = index - 1 // Set to one before so playNextItem picks it up
      console.log('▶️ Jumping to index', index, 'while playing')
      playNextItem(settings)
    } else {
      // Paused or stopped - play this example once and update position
      console.log('⏸️ Playing single item and updating position to', index)
      currentItemIndex.value = index
      playSingleItem(index, settings)
    }
  }
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
  stop()

  // Clean up all audio elements
  Object.values(audioElements.value).forEach(audio => {
    if (audio) {
      audio.pause()
      audio.src = ''
    }
  })

  audioElements.value = []
  readingQueue.value = []
  currentAudio.value = null

  console.log('🧹 Cleaned up audio')
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
    initializeAudio,
    play,
    pause,
    resume,
    stop,
    jumpToExample,
    skipToNext,
    skipToPrevious,
    cleanup
  }
}
