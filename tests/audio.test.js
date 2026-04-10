import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock useLessons and useProgress before importing useAudio
vi.mock('../src/composables/useLessons', () => ({
  useLessons: () => ({
    getLanguageCode: () => null,
    getWorkshopCode: () => null,
    resolveWorkshopKey: (key) => key
  })
}))

vi.mock('../src/composables/useProgress', () => ({
  useProgress: () => ({
    areAllItemsLearned: () => false
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
