import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

// Mock useLessons and useProgress before importing useAudio
vi.mock('../src/composables/useLessons', () => ({
  useLessons: () => ({
    getLanguageCode: () => null,
    getWorkshopCode: () => null,
    resolveWorkshopKey: (key) => key,
    getWorkshopMeta: () => ({})
  })
}))

vi.mock('../src/composables/useProgress', () => ({
  useProgress: () => ({
    areAllItemsLearned: () => false
  })
}))

// Mock useGun so we can observe pauseSyncPulls / resumeSyncPulls calls
// without spinning up the real Gun client.
const gunSyncSpy = { paused: false, pauseCount: 0, resumeCount: 0 }
vi.mock('../src/composables/useGun', () => ({
  useGun: () => ({
    pauseSyncPulls: () => { gunSyncSpy.paused = true; gunSyncSpy.pauseCount++ },
    resumeSyncPulls: () => { gunSyncSpy.paused = false; gunSyncSpy.resumeCount++ },
  })
}))

// Mock Audio constructor to resolve immediately
class MockAudio {
  constructor(src) {
    this.preload = ''
    this.src = src || ''
    this.currentTime = 0
    this.playbackRate = 1
    this.paused = true
    this._handlers = {}
    this.onended = null
    this.onerror = null
  }
  addEventListener(event, handler, opts) {
    this._handlers[event] = handler
    // Auto-fire canplaythrough (legacy code path)
    if (event === 'canplaythrough') {
      setTimeout(() => handler(), 0)
    }
  }
  load() {}
  play() {
    this.paused = false
    return Promise.resolve()
  }
  pause() { this.paused = true }
  // Helper for tests: pretend the clip ended
  _fireEnded() {
    this.paused = true
    if (this.onended) this.onended()
  }
}
globalThis.Audio = MockAudio
// Stub global fetch for manifest requests (always "not found")
if (!globalThis.fetch) {
  globalThis.fetch = () => Promise.resolve({ ok: false, text: () => Promise.resolve('') })
}

// Stub navigator.mediaSession so the lock-screen test can inspect metadata
// and invoke the action handlers that the iOS lock screen would fire.
// happy-dom may not implement MediaMetadata / mediaSession on all versions.
if (typeof globalThis.MediaMetadata === 'undefined') {
  globalThis.MediaMetadata = class MediaMetadata {
    constructor(init) { Object.assign(this, init) }
  }
}
if (!navigator.mediaSession) {
  const handlers = {}
  Object.defineProperty(navigator, 'mediaSession', {
    configurable: true,
    value: {
      metadata: null,
      setActionHandler(name, fn) { handlers[name] = fn },
      // Test helper — not part of the real API
      __handlers: handlers,
      __invoke(name) { return handlers[name] && handlers[name]() },
    }
  })
}

const { useAudio } = await import('../src/composables/useAudio')

describe('useAudio', () => {
  let audio

  beforeEach(() => {
    audio = useAudio()
    audio.cleanup()
  })

  describe('initial state', () => {
    it('starts not playing', () => {
      expect(audio.isPlaying.value).toBe(false)
    })

    it('starts not paused', () => {
      expect(audio.isPaused.value).toBe(false)
    })

    it('has no current item', () => {
      expect(audio.currentItem.value).toBeNull()
    })

    it('has empty reading queue', () => {
      expect(audio.readingQueue.value).toEqual([])
    })

    it('starts at index -1', () => {
      expect(audio.currentItemIndex.value).toBe(-1)
    })
  })

  describe('play', () => {
    it('does nothing with empty queue', () => {
      audio.play({ readAnswers: true })
      expect(audio.isPlaying.value).toBe(false)
    })
  })

  describe('pause', () => {
    it('sets paused state', () => {
      audio.pause()
      expect(audio.isPlaying.value).toBe(false)
      expect(audio.isPaused.value).toBe(true)
    })
  })

  describe('stop', () => {
    it('resets all state', () => {
      audio.stop()
      expect(audio.isPlaying.value).toBe(false)
      expect(audio.isPaused.value).toBe(false)
      expect(audio.currentItemIndex.value).toBe(-1)
    })
  })

  describe('cleanup', () => {
    it('resets queue and state', () => {
      audio.cleanup()
      expect(audio.readingQueue.value).toEqual([])
      expect(audio.isPlaying.value).toBe(false)
      expect(audio.currentItemIndex.value).toBe(-1)
    })
  })

  describe('skipToNext', () => {
    it('does nothing at end of queue', () => {
      audio.skipToNext({ readAnswers: true })
      expect(audio.currentItemIndex.value).toBe(-1)
    })
  })

  describe('skipToPrevious', () => {
    it('does nothing at start of queue', () => {
      audio.skipToPrevious({ readAnswers: true })
      expect(audio.currentItemIndex.value).toBe(-1)
    })
  })
})

describe('initializeAudio and queue building', () => {
  let audio

  beforeEach(() => {
    audio = useAudio()
    audio.cleanup()
  })

  const settings = { readAnswers: true, hideLearnedExamples: false, audioSpeed: 1.0 }

  it('builds queue from lesson with sections and examples', async () => {
    const lesson = {
      title: 'Test Lesson',
      number: 1,
      _filename: '01-test',
      sections: [{
        title: 'Section 1',
        examples: [
          { q: 'Question 1', a: 'Answer 1' },
          { q: 'Question 2', a: 'Answer 2' }
        ]
      }]
    }

    await audio.initializeAudio(lesson, 'de', 'pt', settings)

    const queue = audio.readingQueue.value
    expect(queue.length).toBe(6) // title + section-title + 2*(q+a)

    expect(queue[0].type).toBe('lesson-title')
    expect(queue[0].text).toBe('Test Lesson')
    expect(queue[1].type).toBe('section-title')
    expect(queue[1].text).toBe('Section 1')
    expect(queue[2].type).toBe('question')
    expect(queue[2].text).toBe('Question 1')
    expect(queue[3].type).toBe('answer')
    expect(queue[3].text).toBe('Answer 1')
    expect(queue[4].type).toBe('question')
    expect(queue[4].text).toBe('Question 2')
    expect(queue[5].type).toBe('answer')
    expect(queue[5].text).toBe('Answer 2')
  })

  it('excludes answers when readAnswers is false', async () => {
    const lesson = {
      title: 'Test',
      number: 1,
      _filename: '01-test',
      sections: [{
        title: 'S1',
        examples: [{ q: 'Q1', a: 'A1' }]
      }]
    }

    await audio.initializeAudio(lesson, 'de', 'pt', { ...settings, readAnswers: false })

    const answerItems = audio.readingQueue.value.filter(item => item.type === 'answer')
    expect(answerItems.length).toBe(0)
  })

  it('handles lesson without sections', async () => {
    await audio.initializeAudio(
      { title: 'Empty', number: 1, _filename: '01-empty' },
      'de', 'pt', settings
    )

    const queue = audio.readingQueue.value
    expect(queue.length).toBe(0) // buildReadingQueue returns [] for no sections
  })

  it('sets correct audio URLs', async () => {
    const lesson = {
      title: 'Test',
      number: 1,
      _filename: '01-test',
      sections: [{
        title: 'S1',
        examples: [{ q: 'Q1', a: 'A1' }]
      }]
    }

    await audio.initializeAudio(lesson, 'de', 'pt', settings)

    const queue = audio.readingQueue.value
    expect(queue[0].audioUrl).toContain('title.mp3')
    expect(queue[1].audioUrl).toContain('0-title.mp3')
    expect(queue[2].audioUrl).toContain('0-0-q.mp3')
    expect(queue[3].audioUrl).toContain('0-0-a.mp3')
  })

  it('tracks section and example indices', async () => {
    const lesson = {
      title: 'Test',
      number: 1,
      _filename: '01-test',
      sections: [
        { title: 'S1', examples: [{ q: 'Q1', a: 'A1' }] },
        { title: 'S2', examples: [{ q: 'Q2', a: 'A2' }] }
      ]
    }

    await audio.initializeAudio(lesson, 'de', 'pt', settings)

    const queue = audio.readingQueue.value
    expect(queue[0].sectionIdx).toBe(-1) // lesson title
    expect(queue[1].sectionIdx).toBe(0) // section 1 title
    expect(queue[1].exampleIdx).toBe(-1)
    expect(queue[2].sectionIdx).toBe(0) // Q1
    expect(queue[2].exampleIdx).toBe(0)
    expect(queue[4].sectionIdx).toBe(1) // section 2 title
    expect(queue[5].sectionIdx).toBe(1) // Q2
    expect(queue[5].exampleIdx).toBe(0)
  })

  it('resets playback state after init', async () => {
    const lesson = {
      title: 'Test',
      number: 1,
      _filename: '01-test',
      sections: [{ title: 'S1', examples: [{ q: 'Q1', a: 'A1' }] }]
    }

    await audio.initializeAudio(lesson, 'de', 'pt', settings)

    expect(audio.isPlaying.value).toBe(false)
    expect(audio.isPaused.value).toBe(false)
    expect(audio.currentItemIndex.value).toBe(-1)
  })

  it('handles examples without answers', async () => {
    const lesson = {
      title: 'Test',
      number: 1,
      _filename: '01-test',
      sections: [{
        title: 'S1',
        examples: [{ q: 'Question only' }] // no 'a' field
      }]
    }

    await audio.initializeAudio(lesson, 'de', 'pt', settings)

    const queue = audio.readingQueue.value
    const answerItems = queue.filter(item => item.type === 'answer')
    expect(answerItems.length).toBe(0)
  })

  it('is idempotent for the same lesson (continuous-mode transition)', async () => {
    const lesson = {
      title: 'Test',
      number: 1,
      _filename: '01-test',
      sections: [{ title: 'S1', examples: [{ q: 'Q1', a: 'A1' }] }]
    }

    await audio.initializeAudio(lesson, 'de', 'pt', settings)
    const firstQueue = audio.readingQueue.value
    const firstLength = firstQueue.length

    // Calling again for the same lesson must not rebuild the queue
    await audio.initializeAudio(lesson, 'de', 'pt', settings)
    expect(audio.readingQueue.value).toBe(firstQueue)
    expect(audio.readingQueue.value.length).toBe(firstLength)
  })

  it('preserves playback state when force-rebuilt during active playback', async () => {
    // Regression test: GunDB sync / progress / settings watchers would
    // previously call initializeAudio({ force: true }) mid-playback, which
    // tore down audioElements and set isPlaying=false — breaking the
    // onended → playNextItem chain so the lesson stopped after one clip.
    const lesson = {
      title: 'Long Lesson',
      number: 5,
      _filename: '05-long',
      sections: [{
        title: 'S1',
        examples: [
          { q: 'Q1', a: 'A1' },
          { q: 'Q2', a: 'A2' },
          { q: 'Q3', a: 'A3' },
        ]
      }]
    }

    await audio.initializeAudio(lesson, 'de', 'pt', settings)

    // Simulate active playback
    audio.isPlaying.value = true
    audio.currentItemIndex.value = 2

    const queueRef = audio.readingQueue.value

    // A force rebuild during playback must be a no-op
    await audio.initializeAudio(lesson, 'de', 'pt', settings, { force: true })

    expect(audio.isPlaying.value).toBe(true)
    expect(audio.currentItemIndex.value).toBe(2)
    expect(audio.readingQueue.value).toBe(queueRef)
    expect(audio.hasAudio.value).toBe(true)
  })

  it('preserves playback state when force-rebuilt during pause', async () => {
    // Same guard: if the user paused mid-lesson and then a remote sync
    // mutates progress, we should NOT throw away the queue. The user would
    // otherwise lose their position on resume.
    const lesson = {
      title: 'Paused Lesson',
      number: 6,
      _filename: '06-pause',
      sections: [{ title: 'S1', examples: [{ q: 'Q1', a: 'A1' }] }]
    }

    await audio.initializeAudio(lesson, 'de', 'pt', settings)

    audio.isPlaying.value = false
    audio.isPaused.value = true
    audio.currentItemIndex.value = 1

    const queueRef = audio.readingQueue.value
    await audio.initializeAudio(lesson, 'de', 'pt', settings, { force: true })

    expect(audio.isPaused.value).toBe(true)
    expect(audio.currentItemIndex.value).toBe(1)
    expect(audio.readingQueue.value).toBe(queueRef)
  })

  it('loads audio elements without blocking on canplaythrough', async () => {
    const lesson = {
      title: 'Test',
      number: 1,
      _filename: '01-test',
      sections: [{ title: 'S1', examples: [{ q: 'Q1', a: 'A1' }] }]
    }

    // This should return quickly even without firing canplaythrough
    await audio.initializeAudio(lesson, 'de', 'pt', settings)

    expect(audio.hasAudio.value).toBe(true)
    expect(audio.isLoadingAudio.value).toBe(false)
  })
})

describe('lock-screen / Media Session requirements', () => {
  // These tests pin the guarantees that the iOS lock screen and Android
  // media notification depend on. They are what makes autoplay continue
  // working when the device is locked / the tab is backgrounded.
  let audio

  beforeEach(() => {
    audio = useAudio()
    // Continuous-mode transitions leave isTransitioning=true for 200ms.
    // Clear it explicitly so cleanup() isn't skipped.
    audio.isTransitioning.value = false
    audio.disableContinuousMode()
    audio.cleanup()
    // Reset mediaSession state
    navigator.mediaSession.metadata = null
    for (const k of Object.keys(navigator.mediaSession.__handlers)) {
      delete navigator.mediaSession.__handlers[k]
    }
  })

  const settings = { readAnswers: true, hideLearnedExamples: false, audioSpeed: 1.0 }
  const lesson1 = {
    title: 'Lesson 1',
    number: 1,
    _filename: '01-one',
    sections: [{ title: 'S1', examples: [{ q: 'Q1', a: 'A1' }] }]
  }
  const lesson2 = {
    title: 'Lesson 2',
    number: 2,
    _filename: '02-two',
    sections: [{ title: 'S1', examples: [{ q: 'Q2', a: 'A2' }] }]
  }

  it('populates MediaMetadata with title/artist/album/artwork when a lesson loads', async () => {
    await audio.initializeAudio(lesson1, 'deutsch', 'portugiesisch', settings)

    const meta = navigator.mediaSession.metadata
    expect(meta).not.toBeNull()
    expect(meta.title).toBe('Lesson 1')
    expect(meta.artist).toContain('portugiesisch')
    expect(meta.album).toContain('deutsch')
    expect(Array.isArray(meta.artwork)).toBe(true)
    expect(meta.artwork.length).toBeGreaterThan(0)
  })

  it('registers play/pause/previoustrack/nexttrack action handlers', async () => {
    await audio.initializeAudio(lesson1, 'de', 'pt', settings)

    const h = navigator.mediaSession.__handlers
    expect(typeof h.play).toBe('function')
    expect(typeof h.pause).toBe('function')
    expect(typeof h.previoustrack).toBe('function')
    expect(typeof h.nexttrack).toBe('function')
  })

  it('lock-screen "pause" action actually pauses the composable', async () => {
    await audio.initializeAudio(lesson1, 'de', 'pt', settings)
    audio.play(settings)
    expect(audio.isPlaying.value).toBe(true)

    // Simulate the iOS lock screen firing the pause action
    navigator.mediaSession.__invoke('pause')

    expect(audio.isPlaying.value).toBe(false)
    expect(audio.isPaused.value).toBe(true)
  })

  it('lock-screen "play" action resumes from the paused position', async () => {
    await audio.initializeAudio(lesson1, 'de', 'pt', settings)
    audio.play(settings)
    audio.currentItemIndex.value = 2 // pretend we're mid-queue
    audio.pause()
    expect(audio.isPaused.value).toBe(true)

    navigator.mediaSession.__invoke('play')

    expect(audio.isPlaying.value).toBe(true)
    expect(audio.isPaused.value).toBe(false)
    // Position must not be reset — resume continues where it left off
    expect(audio.currentItemIndex.value).toBe(2)
  })

  it('lock-screen "nexttrack" advances by one item', async () => {
    await audio.initializeAudio(lesson1, 'de', 'pt', settings)
    audio.play(settings)
    audio.currentItemIndex.value = 0

    navigator.mediaSession.__invoke('nexttrack')

    expect(audio.currentItemIndex.value).toBeGreaterThan(0)
  })

  it('lock-screen "previoustrack" steps back by one item', async () => {
    await audio.initializeAudio(lesson1, 'de', 'pt', settings)
    audio.play(settings)
    audio.currentItemIndex.value = 2

    navigator.mediaSession.__invoke('previoustrack')

    expect(audio.currentItemIndex.value).toBe(1)
  })

  it('updates MediaMetadata when continuous mode transitions to the next lesson', async () => {
    await audio.initializeAudio(lesson1, 'deutsch', 'portugiesisch', settings)
    expect(navigator.mediaSession.metadata.title).toBe('Lesson 1')

    audio.enableContinuousMode(async () => ({
      lesson: lesson2, learning: 'deutsch', workshop: 'portugiesisch'
    }))

    // Jump to end and fire end-of-queue to trigger transition
    audio.currentItemIndex.value = audio.readingQueue.value.length - 1
    audio.isPlaying.value = true
    audio.skipToNext(settings)

    await new Promise(r => setTimeout(r, 20))

    // Metadata must reflect the new lesson — otherwise iOS shows the
    // stale title on the lock screen after auto-advance.
    expect(navigator.mediaSession.metadata.title).toBe('Lesson 2')
  })

  it('media session action handlers survive a continuous-mode transition', async () => {
    await audio.initializeAudio(lesson1, 'de', 'pt', settings)
    audio.enableContinuousMode(async () => ({
      lesson: lesson2, learning: 'de', workshop: 'pt'
    }))

    audio.currentItemIndex.value = audio.readingQueue.value.length - 1
    audio.isPlaying.value = true
    audio.skipToNext(settings)

    await new Promise(r => setTimeout(r, 20))

    // After the transition, a locked-screen pause/play must still work
    const h = navigator.mediaSession.__handlers
    expect(typeof h.play).toBe('function')
    expect(typeof h.pause).toBe('function')
    expect(typeof h.previoustrack).toBe('function')
    expect(typeof h.nexttrack).toBe('function')
  })
})

describe('integration: full playback chain vs. deep watchers', () => {
  // These tests recreate the exact wiring from LessonDetail.vue — the
  // `watch(progress, ...)` and `watch([settings.hideLearnedExamples, ...])`
  // pattern that used to call initializeAudio({ force: true }) mid-playback.
  // They verify the whole chain (composable + deep watcher + force-rebuild
  // guard) end-to-end, not just the composable in isolation.
  let audio

  beforeEach(() => {
    audio = useAudio()
    audio.isTransitioning.value = false
    audio.disableContinuousMode()
    audio.cleanup()
  })

  const settings = { readAnswers: true, hideLearnedExamples: true, audioSpeed: 1.0 }
  const lesson = {
    title: 'Integration Lesson',
    number: 3,
    _filename: '03-integration',
    sections: [{
      title: 'S1',
      examples: [
        { q: 'Q1', a: 'A1' },
        { q: 'Q2', a: 'A2' },
      ]
    }]
  }

  it('a deep progress mutation during playback does NOT break the chain', async () => {
    const { ref, watch } = await import('vue')

    // Mimic the LessonDetail reactive state
    const progress = ref({})
    const audioSettings = ref({ ...settings })

    await audio.initializeAudio(lesson, 'de', 'pt', audioSettings.value)

    // Simulate playback in progress (user clicked play, chain is running)
    audio.isPlaying.value = true
    audio.currentItemIndex.value = 1
    const queueRef = audio.readingQueue.value

    // Wire up the same deep watcher LessonDetail uses for `progress`
    watch(
      progress,
      async () => {
        if (audioSettings.value.hideLearnedExamples) {
          await audio.initializeAudio(lesson, 'de', 'pt', audioSettings.value, { force: true })
        }
      },
      { deep: true }
    )

    // Simulate a Gun sync tick that mutates progress deeply
    // (exactly what useProgress.mergeProgress does when gun-sync fires)
    progress.value['de:pt'] = { item1: Date.now() }

    // Let Vue flush the watcher
    await new Promise(r => setTimeout(r, 0))

    // Playback state must survive the rebuild attempt
    expect(audio.isPlaying.value).toBe(true)
    expect(audio.currentItemIndex.value).toBe(1)
    expect(audio.readingQueue.value).toBe(queueRef)
    expect(audio.hasAudio.value).toBe(true)
  })

  it('a settings mutation during playback does NOT break the chain', async () => {
    const { ref, watch } = await import('vue')

    const audioSettings = ref({ ...settings })

    await audio.initializeAudio(lesson, 'de', 'pt', audioSettings.value)
    audio.isPlaying.value = true
    audio.currentItemIndex.value = 0
    const queueRef = audio.readingQueue.value

    // Same pattern as LessonDetail's "settings changed" watcher
    watch(
      () => [audioSettings.value.hideLearnedExamples, audioSettings.value.readAnswers],
      async () => {
        await audio.initializeAudio(lesson, 'de', 'pt', audioSettings.value, { force: true })
      },
      { deep: true }
    )

    // Simulate a remote settings sync flipping readAnswers
    audioSettings.value = { ...audioSettings.value, readAnswers: false }
    await new Promise(r => setTimeout(r, 0))

    expect(audio.isPlaying.value).toBe(true)
    expect(audio.currentItemIndex.value).toBe(0)
    expect(audio.readingQueue.value).toBe(queueRef)
  })
})

describe('Gun sync pause during playback', () => {
  let audio

  beforeEach(() => {
    audio = useAudio()
    audio.isTransitioning.value = false
    audio.disableContinuousMode()
    audio.cleanup()
    gunSyncSpy.paused = false
    gunSyncSpy.pauseCount = 0
    gunSyncSpy.resumeCount = 0
  })

  const settings = { readAnswers: true, hideLearnedExamples: false, audioSpeed: 1.0 }
  const lesson = {
    title: 'Sync Test',
    number: 1,
    _filename: '01-sync',
    sections: [{ title: 'S1', examples: [{ q: 'Q1', a: 'A1' }] }]
  }

  it('freezes remote Gun pulls when play() is called', async () => {
    await audio.initializeAudio(lesson, 'de', 'pt', settings)
    audio.play(settings)
    expect(gunSyncSpy.paused).toBe(true)
    expect(gunSyncSpy.pauseCount).toBe(1)
  })

  it('releases the sync pause when playback is paused', async () => {
    await audio.initializeAudio(lesson, 'de', 'pt', settings)
    audio.play(settings)
    expect(gunSyncSpy.paused).toBe(true)

    audio.pause()
    expect(gunSyncSpy.paused).toBe(false)
    expect(gunSyncSpy.resumeCount).toBe(1)
  })

  it('releases the sync pause when playback is stopped', async () => {
    await audio.initializeAudio(lesson, 'de', 'pt', settings)
    audio.play(settings)

    audio.stop()
    expect(gunSyncSpy.paused).toBe(false)
    expect(gunSyncSpy.resumeCount).toBeGreaterThanOrEqual(1)
  })
})

describe('continuous play mode', () => {
  let audio

  beforeEach(() => {
    audio = useAudio()
    audio.cleanup()
    audio.disableContinuousMode()
  })

  const settings = { readAnswers: true, hideLearnedExamples: false, audioSpeed: 1.0 }

  const lesson1 = {
    title: 'Lesson 1',
    number: 1,
    _filename: '01-one',
    sections: [{ title: 'S1', examples: [{ q: 'Q1', a: 'A1' }] }]
  }
  const lesson2 = {
    title: 'Lesson 2',
    number: 2,
    _filename: '02-two',
    sections: [{ title: 'S1', examples: [{ q: 'Q2', a: 'A2' }] }]
  }

  it('starts disabled by default', () => {
    expect(audio.continuousMode.value).toBe(false)
  })

  it('enableContinuousMode sets the flag and registers a provider', () => {
    const provider = async () => ({ lesson: lesson2, learning: 'de', workshop: 'pt' })
    audio.enableContinuousMode(provider)
    expect(audio.continuousMode.value).toBe(true)
  })

  it('disableContinuousMode clears the flag', () => {
    audio.enableContinuousMode(async () => null)
    expect(audio.continuousMode.value).toBe(true)
    audio.disableContinuousMode()
    expect(audio.continuousMode.value).toBe(false)
  })

  it('transitions to the next lesson in-place at end of current queue', async () => {
    await audio.initializeAudio(lesson1, 'de', 'pt', settings)
    const tickBefore = audio.lessonTransitionTick.value

    audio.enableContinuousMode(async () => ({ lesson: lesson2, learning: 'de', workshop: 'pt' }))

    // Jump to end of current queue so the next playNextItem triggers the transition
    audio.currentItemIndex.value = audio.readingQueue.value.length - 1
    audio.isPlaying.value = true

    // Simulate end-of-lesson: fire the current audio's ended handler indirectly
    // by calling skipToNext which forwards to playNextItem at end-of-queue.
    audio.skipToNext(settings)

    // Wait for the async transition to run
    await new Promise(r => setTimeout(r, 20))

    // After transition, metadata must point to lesson 2
    expect(audio.lessonMetadata.value.number).toBe(2)
    // And the view layer tick must have bumped so the URL can update
    expect(audio.lessonTransitionTick.value).toBe(tickBefore + 1)
    // The new queue is built for lesson 2
    expect(audio.readingQueue.value.some(i => i.text === 'Q2')).toBe(true)
  })

  it('stops cleanly when the next-lesson provider returns null', async () => {
    await audio.initializeAudio(lesson1, 'de', 'pt', settings)

    audio.enableContinuousMode(async () => null)

    audio.currentItemIndex.value = audio.readingQueue.value.length - 1
    audio.isPlaying.value = true
    audio.skipToNext(settings)

    await new Promise(r => setTimeout(r, 20))

    // End of workshop — playback stops
    expect(audio.isPlaying.value).toBe(false)
    expect(audio.playbackFinished.value).toBe(true)
  })

  it('cleanup is skipped during a transition', async () => {
    await audio.initializeAudio(lesson1, 'de', 'pt', settings)
    audio.enableContinuousMode(async () => ({ lesson: lesson2, learning: 'de', workshop: 'pt' }))

    // Force transitioning state to true to simulate mid-transition
    audio.isTransitioning.value = true
    audio.cleanup()

    // Queue must NOT be cleared while transitioning
    expect(audio.readingQueue.value.length).toBeGreaterThan(0)

    // Reset the transition flag and cleanup should now work
    audio.isTransitioning.value = false
    audio.cleanup()
    expect(audio.readingQueue.value.length).toBe(0)
  })
})

// -----------------------------------------------------------------------------
// End-to-end playback chain — these are the tests that would have caught the
// "stops after first section title" bug. They fire the real `onended` handler
// on each clip and advance the setTimeout between clips, exercising the
// composable exactly as the browser would.
// -----------------------------------------------------------------------------
describe('end-to-end playback chain', () => {
  let audio

  beforeEach(() => {
    vi.useFakeTimers()
    audio = useAudio()
    audio.isTransitioning.value = false
    audio.disableContinuousMode()
    audio.cleanup()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  const settings = { readAnswers: true, hideLearnedExamples: false, audioSpeed: 1.0 }

  // Helper: advance through the pause between clips and fire the next ended.
  // Pause durations: 1000ms (lesson-title), 1200ms (section-title), 800/1800 (examples).
  async function advanceToNextClip() {
    // Flush any microtasks
    await vi.advanceTimersByTimeAsync(2000)
  }

  it('plays a multi-clip lesson all the way through via the onended chain', async () => {
    const lesson = {
      title: 'Chain Test',
      number: 1,
      _filename: '01-chain',
      sections: [{
        title: 'Section One',
        examples: [
          { q: 'Q1', a: 'A1' },
          { q: 'Q2', a: 'A2' },
        ]
      }]
    }

    await audio.initializeAudio(lesson, 'de', 'pt', settings)

    // Queue: [lesson-title, section-title, Q1, A1, Q2, A2] = 6 items
    expect(audio.readingQueue.value.length).toBe(6)

    audio.play(settings)
    expect(audio.isPlaying.value).toBe(true)
    expect(audio.currentItemIndex.value).toBe(0)

    // Fire onended for each clip and verify the chain advances
    for (let i = 0; i < 5; i++) {
      const current = audio.currentAudio.value
      expect(current).toBeTruthy()
      current._fireEnded()
      await advanceToNextClip()
      // After firing ended + advancing the setTimeout, index should have moved
      expect(audio.currentItemIndex.value).toBe(i + 1)
    }

    // Fire the last clip's onended — this should trigger end-of-queue handling
    audio.currentAudio.value._fireEnded()
    await advanceToNextClip()

    expect(audio.playbackFinished.value).toBe(true)
    expect(audio.isPlaying.value).toBe(false)
  })

  it('does NOT break the chain when progress is mutated mid-playback', async () => {
    // Regression: a gun-sync event (or any deep mutation on progress) used
    // to trigger initializeAudio({force:true}) → clobber isPlaying → dead chain.
    const { ref, watch } = await import('vue')
    const progress = ref({})
    const audioSettings = ref({ ...settings, hideLearnedExamples: true })

    const lesson = {
      title: 'Progress Chain',
      number: 2,
      _filename: '02-progress',
      sections: [{
        title: 'S',
        examples: [{ q: 'Q1', a: 'A1' }, { q: 'Q2', a: 'A2' }]
      }]
    }

    await audio.initializeAudio(lesson, 'de', 'pt', audioSettings.value)
    audio.play(audioSettings.value)

    // Wire the LessonDetail-style deep watcher (this is what used to break things)
    const { useLessonAudioSync } = await import('../src/composables/useLessonAudioSync')
    const { onProgressChanged } = useLessonAudioSync()
    watch(progress, () => onProgressChanged({
      lesson, learning: 'de', workshop: 'pt', audioSettings: audioSettings.value
    }), { deep: true })

    // Play clip 1 end → advance
    audio.currentAudio.value._fireEnded()
    await advanceToNextClip()
    expect(audio.currentItemIndex.value).toBe(1)

    // Simulate a mutation that would normally trigger initializeAudio
    progress.value['de:pt'] = { hello: Date.now() }
    await vi.advanceTimersByTimeAsync(10)

    // Chain must still be alive
    expect(audio.isPlaying.value).toBe(true)

    // Play clip 2 end → advance — this must still work
    audio.currentAudio.value._fireEnded()
    await advanceToNextClip()
    expect(audio.currentItemIndex.value).toBe(2)
  })

  it('does NOT break the chain when two initializeAudio calls race', async () => {
    // Regression: concurrent initializeAudio calls used to interleave.
    // The single-flight lock now serializes them.
    const lesson = {
      title: 'Race Test',
      number: 3,
      _filename: '03-race',
      sections: [{ title: 'S', examples: [{ q: 'Q', a: 'A' }] }]
    }

    // First call, then immediately a second force call — they must NOT clobber.
    const p1 = audio.initializeAudio(lesson, 'de', 'pt', settings)
    const p2 = audio.initializeAudio(lesson, 'de', 'pt', settings, { force: true })
    await Promise.all([p1, p2])

    audio.play(settings)
    expect(audio.isPlaying.value).toBe(true)

    const firstClip = audio.currentAudio.value
    expect(firstClip).toBeTruthy()

    firstClip._fireEnded()
    await advanceToNextClip()

    // Chain must still be advancing
    expect(audio.isPlaying.value).toBe(true)
    expect(audio.currentItemIndex.value).toBeGreaterThan(0)
  })

  it('skips assessment items from the audio queue', async () => {
    // Playing mode is for listening — assessments are hidden and skipped.
    const lesson = {
      title: 'Mixed',
      number: 4,
      _filename: '04-mixed',
      sections: [{
        title: 'S',
        examples: [
          { q: 'Plain question', a: 'Plain answer' },           // type: qa (default)
          { type: 'input', q: 'Type this', a: 'hello' },         // assessment — skipped
          { type: 'multiple-choice', q: 'Pick one', options: [] }, // assessment — skipped
          { type: 'select', q: 'Select', options: [] },          // assessment — skipped
          { q: 'Another plain', a: 'Also plain' },
        ]
      }]
    }

    await audio.initializeAudio(lesson, 'de', 'pt', settings)

    // Queue should contain: lesson-title, section-title, Q1, A1, Q5, A5 = 6
    // (NOT the 3 assessment items)
    expect(audio.readingQueue.value.length).toBe(6)
    const questions = audio.readingQueue.value.filter(i => i.type === 'question')
    expect(questions).toHaveLength(2)
    expect(questions[0].text).toBe('Plain question')
    expect(questions[1].text).toBe('Another plain')
  })
})

// -----------------------------------------------------------------------------
// Focus mode — single flag that puts the lesson into listen-only state.
// -----------------------------------------------------------------------------
describe('focus mode (playing = read-only)', () => {
  let audio

  beforeEach(() => {
    audio = useAudio()
    audio.isTransitioning.value = false
    audio.disableContinuousMode()
    audio.cleanup()
  })

  const settings = { readAnswers: true, hideLearnedExamples: false, audioSpeed: 1.0 }
  const lesson = {
    title: 'Focus Test',
    number: 1,
    _filename: '01-focus',
    sections: [{ title: 'S', examples: [{ q: 'Q', a: 'A' }] }]
  }

  it('is false when not playing', async () => {
    await audio.initializeAudio(lesson, 'de', 'pt', settings)
    expect(audio.isInFocusMode.value).toBe(false)
  })

  it('is true while playing', async () => {
    await audio.initializeAudio(lesson, 'de', 'pt', settings)
    audio.play(settings)
    expect(audio.isInFocusMode.value).toBe(true)
  })

  it('is false after pause', async () => {
    await audio.initializeAudio(lesson, 'de', 'pt', settings)
    audio.play(settings)
    audio.pause()
    expect(audio.isInFocusMode.value).toBe(false)
  })

  it('is false after stop', async () => {
    await audio.initializeAudio(lesson, 'de', 'pt', settings)
    audio.play(settings)
    audio.stop()
    expect(audio.isInFocusMode.value).toBe(false)
  })
})

describe('useLessonAudioSync: focus mode gates watchers', () => {
  let audio
  let sync

  beforeEach(async () => {
    audio = useAudio()
    audio.isTransitioning.value = false
    audio.disableContinuousMode()
    audio.cleanup()
    const { useLessonAudioSync } = await import('../src/composables/useLessonAudioSync')
    sync = useLessonAudioSync()
  })

  const settings = { readAnswers: true, hideLearnedExamples: true, audioSpeed: 1.0 }
  const lesson = {
    title: 'Gate Test',
    number: 1,
    _filename: '01-gate',
    sections: [{ title: 'S', examples: [{ q: 'Q', a: 'A' }] }]
  }

  it('onSettingsChanged is a no-op during focus mode', async () => {
    await audio.initializeAudio(lesson, 'de', 'pt', settings)
    audio.play(settings)
    // focus mode active
    const result = await sync.onSettingsChanged({
      lesson, learning: 'de', workshop: 'pt', audioSettings: settings
    })
    expect(result).toBe(false)
  })

  it('onProgressChanged is a no-op during focus mode', async () => {
    await audio.initializeAudio(lesson, 'de', 'pt', settings)
    audio.play(settings)
    const result = await sync.onProgressChanged({
      lesson, learning: 'de', workshop: 'pt', audioSettings: settings
    })
    expect(result).toBe(false)
  })

  it('onSettingsChanged runs normally when not in focus mode', async () => {
    await audio.initializeAudio(lesson, 'de', 'pt', settings)
    // NOT playing
    const result = await sync.onSettingsChanged({
      lesson, learning: 'de', workshop: 'pt', audioSettings: settings
    })
    expect(result).toBe(true)
  })
})
