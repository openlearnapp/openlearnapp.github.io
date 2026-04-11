import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import { createI18n } from 'vue-i18n'

// Mock composables BEFORE importing LessonDetail so the SFC gets the stubs.
vi.mock('../src/composables/useLessons', () => {
  const testLessons = [
    {
      title: 'Lesson 1',
      number: 1,
      _filename: '01-one',
      sections: [{ title: 'S1', examples: [{ q: 'Q1', a: 'A1', rel: [['w1', 'word-one']] }] }]
    },
    {
      title: 'Lesson 2',
      number: 2,
      _filename: '02-two',
      sections: [{ title: 'S1', examples: [{ q: 'Q2', a: 'A2' }] }]
    },
  ]
  return {
    useLessons: () => ({
      loadAllLessonsForWorkshop: async () => testLessons,
      resolveWorkshopKey: (key) => key,
      getLanguageCode: () => null,
      getWorkshopCode: () => null,
      getWorkshopMeta: () => ({}),
    })
  }
})

vi.mock('../src/composables/useProgress', () => {
  const { ref } = require('vue')
  const progress = ref({})
  return {
    useProgress: () => ({
      progress,
      isItemLearned: () => false,
      toggleItemLearned: () => {},
      areAllItemsLearned: () => false,
      setLastVisited: () => {},
    })
  }
})

vi.mock('../src/composables/useGun', () => ({
  useGun: () => ({
    pauseSyncPulls: () => {},
    resumeSyncPulls: () => {},
    isLoggedIn: { value: false },
    syncToGun: () => {},
  })
}))

vi.mock('../src/composables/useAssessments', () => ({
  useAssessments: () => ({
    getAnswer: () => null,
    saveAnswer: () => {},
    validateAnswer: () => true,
  })
}))

vi.mock('../src/composables/useFooter', () => ({
  useFooter: () => ({
    setLessonFooter: () => {},
    clearLessonFooter: () => {},
  })
}))

// Mock Audio — plays resolve immediately, manual _fireEnded helper for chain tests.
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
  _fireEnded() { this.paused = true; if (this.onended) this.onended() }
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

// Stub DOMPurify + marked so the template renders without heavy parsing.
vi.mock('dompurify', () => ({ default: { sanitize: (s) => s } }))
vi.mock('marked', () => ({ marked: (s) => s }))

// Stub the heavy UI component imports (they're not what we're testing).
const stubUiComponent = { template: '<div><slot /></div>' }
vi.mock('@/components/ui/button', () => ({ Button: stubUiComponent }))
vi.mock('@/components/ui/card', () => ({
  Card: stubUiComponent,
  CardHeader: stubUiComponent,
  CardTitle: stubUiComponent,
  CardContent: stubUiComponent,
}))
vi.mock('@/components/ui/input', () => ({ Input: stubUiComponent }))
vi.mock('@/components/ui/checkbox', () => ({ Checkbox: stubUiComponent }))
vi.mock('@/components/ui/radio-group', () => ({
  RadioGroup: stubUiComponent,
  RadioGroupItem: stubUiComponent,
}))
vi.mock('@/components/ui/badge', () => ({ Badge: stubUiComponent }))
vi.mock('@/components/ui/label', () => ({ Label: stubUiComponent }))

const LessonDetail = (await import('../src/views/LessonDetail.vue')).default
const { useAudio } = await import('../src/composables/useAudio')
const { useProgress } = await import('../src/composables/useProgress')

// Build a router + i18n the real component expects.
function buildRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/:learning/:workshop/lesson/:number', name: 'lesson-detail', component: LessonDetail },
      { path: '/:learning/:workshop/lessons', name: 'lessons-overview', component: { template: '<div/>' } },
    ]
  })
}

function buildI18n() {
  return createI18n({
    legacy: false,
    locale: 'en',
    fallbackLocale: 'en',
    messages: {
      en: {
        nav: {
          loading: 'Loading', loadingAudio: 'Loading audio',
          play: 'Play', pause: 'Pause',
          playAudio: 'Play audio', pauseAudio: 'Pause audio',
          continuousPlayActive: 'Continuous active',
        },
        lesson: { sections: 'sections', loadingLesson: 'Loading', typeAnswer: 'Type', nextLesson: 'Next' },
        results: { lessonLabel: 'Lesson' },
      }
    }
  })
}

let _testHarnessCurrentWrapper = null
async function mountLessonDetail({ lessonNumber = 1, query = {} } = {}) {
  const audio = useAudio()
  audio.isTransitioning.value = false
  audio.disableContinuousMode()
  audio.cleanup()

  const router = buildRouter()
  await router.push({
    name: 'lesson-detail',
    params: { learning: 'de', workshop: 'pt', number: String(lessonNumber) },
    query,
  })
  await router.isReady()

  const wrapper = mount(LessonDetail, {
    global: {
      plugins: [router, buildI18n()],
      stubs: {
        Teleport: true,
        Transition: false,
      }
    }
  })
  _testHarnessCurrentWrapper = wrapper

  // Let onMounted + loadAllLessonsForWorkshop + initializeAudio finish
  await flushPromises()
  await flushPromises()

  return { wrapper, router, audio }
}

describe('LessonDetail.vue — component mount tests', () => {
  // @vue/test-utils does not auto-unmount between tests. Leaked mounts keep
  // their reactive watchers alive and fire across test boundaries, so we
  // track the latest wrapper from the harness and unmount it in hooks.
  beforeEach(() => {
    if (_testHarnessCurrentWrapper) {
      try { _testHarnessCurrentWrapper.unmount() } catch {}
      _testHarnessCurrentWrapper = null
    }
    const audio = useAudio()
    audio.isTransitioning.value = false
    audio.disableContinuousMode()
    audio.cleanup()
  })

  afterEach(() => {
    if (_testHarnessCurrentWrapper) {
      try { _testHarnessCurrentWrapper.unmount() } catch {}
      _testHarnessCurrentWrapper = null
    }
  })

  it('mounts and renders the lesson title', async () => {
    const { wrapper } = await mountLessonDetail({ lessonNumber: 1 })
    expect(wrapper.text()).toContain('Lesson 1')
  })

  it('initializes audio for the lesson number in the route', async () => {
    const { audio } = await mountLessonDetail({ lessonNumber: 1 })
    expect(audio.lessonMetadata.value.number).toBe(1)
    expect(audio.hasAudio.value).toBe(true)
  })

  it('autoplays when mounted with ?autoplay=true', async () => {
    const { audio } = await mountLessonDetail({ lessonNumber: 1, query: { autoplay: 'true' } })
    expect(audio.isPlaying.value).toBe(true)
  })

  it('does not autoplay without the query flag', async () => {
    const { audio } = await mountLessonDetail({ lessonNumber: 1 })
    expect(audio.isPlaying.value).toBe(false)
  })

  it('progress mutation during playback does NOT break the audio chain', async () => {
    // This is THE regression test: mount LessonDetail, start playing, then
    // deeply mutate progress (simulating a remote Gun sync tick) and verify
    // the view's watcher does not tear down audio mid-playback.
    const { audio } = await mountLessonDetail({
      lessonNumber: 1,
      query: { autoplay: 'true' },
    })

    expect(audio.isPlaying.value).toBe(true)
    audio.currentItemIndex.value = 2 // pretend we're mid-queue
    const queueRef = audio.readingQueue.value

    // Deep mutation — this is what mergeProgress() does on a gun-sync event
    const { progress } = useProgress()
    progress.value['de:pt'] = { w1: Date.now() }

    await flushPromises()
    await flushPromises()

    expect(audio.isPlaying.value).toBe(true)
    expect(audio.currentItemIndex.value).toBe(2)
    expect(audio.readingQueue.value).toBe(queueRef)
  })

  it('in-workshop navigation swaps lesson state without remounting (fix B)', async () => {
    // The view should bind to route.params.number reactively. When the
    // router pushes a new lesson number within the same workshop, the
    // SAME component instance should re-run its lesson-loading logic and
    // the composable should be on the new lesson — no unmount/remount.
    const { wrapper, router, audio } = await mountLessonDetail({ lessonNumber: 1 })

    expect(audio.lessonMetadata.value.number).toBe(1)
    expect(wrapper.text()).toContain('Lesson 1')

    // Navigate to lesson 2 — same workshop, same instance
    await router.push({
      name: 'lesson-detail',
      params: { learning: 'de', workshop: 'pt', number: '2' },
    })
    await flushPromises()
    await flushPromises()

    // Same wrapper, new state
    expect(audio.lessonMetadata.value.number).toBe(2)
    expect(wrapper.text()).toContain('Lesson 2')
  })

  it('unmounting while playing the same lesson cleans up audio', async () => {
    const { wrapper, audio } = await mountLessonDetail({ lessonNumber: 1 })
    expect(audio.readingQueue.value.length).toBeGreaterThan(0)

    wrapper.unmount()
    await flushPromises()

    // Regression: previously this check failed because route-param-based
    // computed refs became undefined during unmount. The component now
    // captures learning/workshop/number at mount time.
    expect(audio.readingQueue.value.length).toBe(0)
  })

  it('unmounting during a continuous-mode transition preserves audio', async () => {
    const { wrapper, audio } = await mountLessonDetail({ lessonNumber: 1 })

    // Simulate the composable having already moved to lesson 2 in-place
    // (which is what transitionToNextLesson does). The unmounting old
    // component instance should NOT cleanup.
    audio.lessonMetadata.value = { learning: 'de', workshop: 'pt', number: 2 }

    const queueBefore = audio.readingQueue.value
    wrapper.unmount()
    await flushPromises()

    // Queue must still be intact — cleanup was skipped
    expect(audio.readingQueue.value).toBe(queueBefore)
  })
})
