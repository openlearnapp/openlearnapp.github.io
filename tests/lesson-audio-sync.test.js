import { describe, it, expect, beforeEach, vi } from 'vitest'

// Reuse the same mocks as audio.test.js so the composable sees a quiet
// useLessons / useProgress / useGun.
vi.mock('../src/composables/useLessons', () => ({
  useLessons: () => ({
    getLanguageCode: () => null,
    getWorkshopCode: () => null,
    resolveWorkshopKey: (key) => key,
    getWorkshopMeta: () => ({}),
  })
}))
vi.mock('../src/composables/useProgress', () => ({
  useProgress: () => ({ areAllItemsLearned: () => false })
}))
vi.mock('../src/composables/useGun', () => ({
  useGun: () => ({ pauseSyncPulls: () => {}, resumeSyncPulls: () => {} })
}))

// Minimal Audio mock — just enough for initializeAudio to succeed.
class MockAudio {
  constructor(src) {
    this.preload = ''
    this.src = src || ''
    this.currentTime = 0
    this.playbackRate = 1
    this.paused = true
    this.onended = null
    this.onerror = null
  }
  addEventListener() {}
  load() {}
  play() { this.paused = false; return Promise.resolve() }
  pause() { this.paused = true }
}
globalThis.Audio = MockAudio
if (typeof globalThis.MediaMetadata === 'undefined') {
  globalThis.MediaMetadata = class { constructor(init) { Object.assign(this, init) } }
}
if (!navigator.mediaSession) {
  Object.defineProperty(navigator, 'mediaSession', {
    configurable: true,
    value: { metadata: null, setActionHandler() {} },
  })
}
if (!globalThis.fetch) {
  globalThis.fetch = () => Promise.resolve({ ok: false, text: () => Promise.resolve('') })
}

const { useLessonAudioSync } = await import('../src/composables/useLessonAudioSync')
const { useAudio } = await import('../src/composables/useAudio')

describe('useLessonAudioSync', () => {
  let sync
  let audio

  beforeEach(() => {
    audio = useAudio()
    // Force clean state — cleanup() no-ops when isTransitioning is true,
    // so clear that explicitly first.
    audio.isTransitioning.value = false
    audio.disableContinuousMode()
    audio.cleanup()
    sync = useLessonAudioSync()
  })

  const settings = { readAnswers: true, hideLearnedExamples: true, audioSpeed: 1.0 }
  const lesson1 = {
    title: 'L1',
    number: 1,
    _filename: '01-l1',
    sections: [{ title: 'S1', examples: [{ q: 'Q1', a: 'A1' }] }]
  }
  const lesson2 = {
    title: 'L2',
    number: 2,
    _filename: '02-l2',
    sections: [{ title: 'S1', examples: [{ q: 'Q2', a: 'A2' }] }]
  }

  // --- onLessonMount ---

  describe('onLessonMount', () => {
    it('initializes audio without autoplay (autoplay removed for iOS)', async () => {
      const result = await sync.onLessonMount({
        lesson: lesson1, learning: 'de', workshop: 'pt',
        audioSettings: settings,
      })
      expect(result.started).toBe(false)
      expect(audio.isPlaying.value).toBe(false)
      expect(audio.hasAudio.value).toBe(true)
      expect(audio.lessonMetadata.value.number).toBe(1)
    })

    it('no-ops when the composable already shows the same lesson', async () => {
      await sync.onLessonMount({
        lesson: lesson1, learning: 'de', workshop: 'pt', audioSettings: settings,
      })
      const firstQueue = audio.readingQueue.value

      // Same lesson, same params — initializeAudio should be idempotent,
      // so the queue reference must be preserved.
      await sync.onLessonMount({
        lesson: lesson1, learning: 'de', workshop: 'pt', audioSettings: settings,
      })
      expect(audio.readingQueue.value).toBe(firstQueue)
    })

    it('does not restart audio when the lesson is already playing (transition remount)', async () => {
      await sync.onLessonMount({
        lesson: lesson1, learning: 'de', workshop: 'pt', audioSettings: settings,
      })
      // Simulate that playback is active from a continuous-mode transition
      audio.isPlaying.value = true
      audio.currentItemIndex.value = 2

      await sync.onLessonMount({
        lesson: lesson1, learning: 'de', workshop: 'pt',
        audioSettings: settings,
      })

      // Position and isPlaying must be preserved (no restart, no index reset)
      expect(audio.isPlaying.value).toBe(true)
      expect(audio.currentItemIndex.value).toBe(2)
    })

    it('re-registers the next-lesson provider when continuous mode is active', async () => {
      const provider = vi.fn(async () => ({ lesson: lesson2, learning: 'de', workshop: 'pt' }))
      audio.enableContinuousMode(provider)

      await sync.onLessonMount({
        lesson: lesson1, learning: 'de', workshop: 'pt',
        audioSettings: settings,
        continuousNextLessonProvider: provider,
      })

      expect(audio.continuousMode.value).toBe(true)
    })

    it('returns { started: false } when no lesson is provided', async () => {
      const result = await sync.onLessonMount({
        lesson: null, learning: 'de', workshop: 'pt', audioSettings: settings,
      })
      expect(result.started).toBe(false)
    })
  })

  // --- onSettingsChanged ---

  describe('onSettingsChanged', () => {
    it('rebuilds the queue when not playing', async () => {
      await sync.onLessonMount({
        lesson: lesson1, learning: 'de', workshop: 'pt', audioSettings: settings,
      })
      const oldQueue = audio.readingQueue.value

      // Change readAnswers and trigger the handler
      const changed = await sync.onSettingsChanged({
        lesson: lesson1, learning: 'de', workshop: 'pt',
        audioSettings: { ...settings, readAnswers: false },
      })
      expect(changed).toBe(true)
      // Queue must have been rebuilt (different reference, different length)
      expect(audio.readingQueue.value).not.toBe(oldQueue)
    })

    it('does NOT rebuild during active playback (preserves the chain)', async () => {
      await sync.onLessonMount({
        lesson: lesson1, learning: 'de', workshop: 'pt', audioSettings: settings,
      })
      audio.isPlaying.value = true
      audio.currentItemIndex.value = 1
      const oldQueue = audio.readingQueue.value

      await sync.onSettingsChanged({
        lesson: lesson1, learning: 'de', workshop: 'pt',
        audioSettings: { ...settings, readAnswers: false },
      })

      // Queue reference + position + isPlaying must be intact
      expect(audio.readingQueue.value).toBe(oldQueue)
      expect(audio.isPlaying.value).toBe(true)
      expect(audio.currentItemIndex.value).toBe(1)
    })

    it('returns false when no lesson is set', async () => {
      const changed = await sync.onSettingsChanged({
        lesson: null, learning: 'de', workshop: 'pt', audioSettings: settings,
      })
      expect(changed).toBe(false)
    })
  })

  // --- onProgressChanged ---

  describe('onProgressChanged', () => {
    it('rebuilds when hideLearnedExamples is on and not playing', async () => {
      await sync.onLessonMount({
        lesson: lesson1, learning: 'de', workshop: 'pt', audioSettings: settings,
      })
      const oldQueue = audio.readingQueue.value

      const changed = await sync.onProgressChanged({
        lesson: lesson1, learning: 'de', workshop: 'pt',
        audioSettings: settings,
      })
      expect(changed).toBe(true)
    })

    it('skips rebuild when hideLearnedExamples is off', async () => {
      await sync.onLessonMount({
        lesson: lesson1, learning: 'de', workshop: 'pt',
        audioSettings: { ...settings, hideLearnedExamples: false },
      })

      const changed = await sync.onProgressChanged({
        lesson: lesson1, learning: 'de', workshop: 'pt',
        audioSettings: { ...settings, hideLearnedExamples: false },
      })
      expect(changed).toBe(false)
    })

    it('does NOT tear down the audio chain during playback', async () => {
      await sync.onLessonMount({
        lesson: lesson1, learning: 'de', workshop: 'pt', audioSettings: settings,
      })
      audio.isPlaying.value = true
      audio.currentItemIndex.value = 1
      const oldQueue = audio.readingQueue.value

      await sync.onProgressChanged({
        lesson: lesson1, learning: 'de', workshop: 'pt', audioSettings: settings,
      })

      expect(audio.isPlaying.value).toBe(true)
      expect(audio.currentItemIndex.value).toBe(1)
      expect(audio.readingQueue.value).toBe(oldQueue)
    })
  })

  // --- onLessonUnmount ---

  describe('onLessonUnmount', () => {
    it('tears down audio when leaving the lesson for good', async () => {
      await sync.onLessonMount({
        lesson: lesson1, learning: 'de', workshop: 'pt', audioSettings: settings,
      })

      const cleaned = sync.onLessonUnmount({
        learning: 'de', workshop: 'pt', lessonNumber: 1,
      })
      expect(cleaned).toBe(true)
      expect(audio.readingQueue.value.length).toBe(0)
    })

    it('skips teardown when the composable already moved to a different lesson', async () => {
      await sync.onLessonMount({
        lesson: lesson1, learning: 'de', workshop: 'pt', audioSettings: settings,
      })
      // Simulate an in-place continuous transition: the composable is now on
      // lesson2 while the unmounting component instance is still lesson1.
      audio.lessonMetadata.value = { learning: 'de', workshop: 'pt', number: 2 }

      const cleaned = sync.onLessonUnmount({
        learning: 'de', workshop: 'pt', lessonNumber: 1,
      })
      expect(cleaned).toBe(false)
      expect(audio.readingQueue.value.length).toBeGreaterThan(0)
    })

    it('skips teardown while isTransitioning is true', async () => {
      await sync.onLessonMount({
        lesson: lesson1, learning: 'de', workshop: 'pt', audioSettings: settings,
      })
      audio.isTransitioning.value = true

      const cleaned = sync.onLessonUnmount({
        learning: 'de', workshop: 'pt', lessonNumber: 1,
      })
      expect(cleaned).toBe(false)

      // Reset for subsequent tests
      audio.isTransitioning.value = false
    })
  })

  // --- toggleContinuousPlay ---

  describe('toggleContinuousPlay', () => {
    it('enables continuous mode and starts playback on first call', async () => {
      await sync.onLessonMount({
        lesson: lesson1, learning: 'de', workshop: 'pt', audioSettings: settings,
      })

      const enabled = sync.toggleContinuousPlay({
        nextLessonProvider: async () => null,
        audioSettings: settings,
      })
      expect(enabled).toBe(true)
      expect(audio.continuousMode.value).toBe(true)
      expect(audio.isPlaying.value).toBe(true)
    })

    it('disables continuous mode on second call', async () => {
      await sync.onLessonMount({
        lesson: lesson1, learning: 'de', workshop: 'pt', audioSettings: settings,
      })
      sync.toggleContinuousPlay({
        nextLessonProvider: async () => null, audioSettings: settings,
      })
      const stillOn = sync.toggleContinuousPlay({
        nextLessonProvider: async () => null, audioSettings: settings,
      })
      expect(stillOn).toBe(false)
      expect(audio.continuousMode.value).toBe(false)
    })
  })
})
