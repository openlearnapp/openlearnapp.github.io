import { ref } from 'vue'

const TOUR_KEYS = {
  workshopOverview:  'tour_workshop_overview_done',
  lessonsOverview:   'tour_lessons_overview_done',
  lessonDetail:      'tour_lesson_detail_done',
  storyMode:         'tour_story_mode_done',
}

// Reactive global state (singleton)
const tourVisible = ref(false)
const tourSteps = ref([])
const tourDoneKey = ref(null)

function isTourDone(key) {
  return localStorage.getItem(key) === 'true'
}

function markTourDone(key) {
  if (key) localStorage.setItem(key, 'true')
}

// Check element visibility — works for sticky/fixed elements too
function isElementVisible(selector) {
  const el = document.querySelector(selector)
  if (!el) return false
  const style = window.getComputedStyle(el)
  if (style.display === 'none' || style.visibility === 'hidden') return false
  const rect = el.getBoundingClientRect()
  return rect.width > 0 && rect.height > 0
}

// Wait until an element appears in the DOM (up to maxMs)
function waitForElement(selector, maxMs = 5000) {
  return new Promise((resolve) => {
    if (isElementVisible(selector)) { resolve(true); return }
    const start = Date.now()
    const tick = () => {
      if (isElementVisible(selector)) { resolve(true); return }
      if (Date.now() - start >= maxMs) { resolve(false); return }
      setTimeout(tick, 300)
    }
    setTimeout(tick, 300)
  })
}

function buildVisibleSteps(definitions) {
  return definitions.filter(step => !step.element || isElementVisible(step.element))
}

async function showTour(stepDefs, doneKey, force = false, anchorSelector = null) {
  if (!force && !urlForce && isTourDone(doneKey)) return

  // Wait for anchor element (guaranteed to appear when the view is ready)
  if (anchorSelector) {
    const found = await waitForElement(anchorSelector, 6000)
    if (!found) return // View never loaded — skip silently, do NOT mark as done
    // Give dynamic content (workshop cards, filter chips) time to render
    await new Promise(r => setTimeout(r, 400))
  }

  const steps = buildVisibleSteps(stepDefs)
  if (!steps.length) return

  tourSteps.value = steps
  tourDoneKey.value = doneKey
  tourVisible.value = true
}

// ?tour=1 in URL forces tour every time (for testing)
const urlForce = new URLSearchParams(window.location.search).get('tour') === '1'

export function useTour() {
  function startWorkshopOverviewTour(tr, force = false) {
    showTour([
      {
        element: '#tour-language-btn',
        emoji: '🌍',
        title: tr.title1,
        desc: tr.desc1,
      },
      {
        element: '#tour-filter-chips',
        emoji: '🔍',
        title: tr.title2,
        desc: tr.desc2,
      },
      {
        element: '#tour-workshop-card',
        emoji: '🚀',
        title: tr.title3,
        desc: tr.desc3,
      },
      {
        element: '#tour-burger-btn',
        emoji: '☰',
        title: tr.title4,
        desc: tr.desc4,
      },
    ], TOUR_KEYS.workshopOverview, force, '#tour-burger-btn')
    // ↑ Anchor = burger button (always visible). Waits for it, then extra 400ms for workshop cards.
  }

  function startLessonsOverviewTour(tr, force = false) {
    showTour([
      {
        element: '#tour-progress-bar',
        emoji: '📊',
        title: tr.title1,
        desc: tr.desc1,
      },
      {
        element: '#tour-first-lesson',
        emoji: '📚',
        title: tr.title2,
        desc: tr.desc2,
      },
      {
        element: '#tour-story-btn',
        emoji: '📺',
        title: tr.title3,
        desc: tr.desc3,
      },
    ], TOUR_KEYS.lessonsOverview, force, '#tour-burger-btn')
  }

  function startLessonDetailTour(tr, force = false) {
    showTour([
      {
        element: '#tour-answer-reveal',
        emoji: '👁️',
        title: tr.title1,
        desc: tr.desc1,
      },
      {
        element: '#tour-filter-test',
        emoji: '📝',
        title: tr.title2,
        desc: tr.desc2,
      },
      {
        element: '#tour-learning-item',
        emoji: '💡',
        title: tr.title3,
        desc: tr.desc3,
      },
      {
        element: '#tour-floating-play',
        emoji: '🔊',
        title: tr.title4,
        desc: tr.desc4,
      },
      // Desktop: results button and items button (hidden on mobile → auto-filtered)
      {
        element: '#tour-nav-results',
        emoji: '📋',
        title: tr.title5,
        desc: tr.desc5,
      },
      {
        element: '#tour-nav-items',
        emoji: '🗂️',
        title: tr.title6,
        desc: tr.desc6,
      },
      // Mobile: single toggle button (hidden on desktop → auto-filtered)
      {
        element: '#tour-nav-toggle',
        emoji: '🔄',
        title: tr.titleToggle,
        desc: tr.descToggle,
      },
    ], TOUR_KEYS.lessonDetail, force, '#tour-burger-btn')
  }

  function startStoryTour(tr, force = false) {
    showTour([
      {
        element: null,
        position: 'left',
        emoji: '👈',
        title: tr.title1,
        desc: tr.desc1,
      },
      {
        element: null,
        position: 'right',
        emoji: '👉',
        title: tr.title2,
        desc: tr.desc2,
      },
      {
        element: null,
        position: 'top',
        emoji: '☝️',
        title: tr.title3,
        desc: tr.desc3,
      },
      {
        element: null,
        position: 'bottom',
        emoji: '👇',
        title: tr.title4,
        desc: tr.desc4,
      },
      {
        element: '#tour-story-pause',
        emoji: '⏸️',
        title: tr.title5,
        desc: tr.desc5,
      },
      {
        element: '#tour-story-exit',
        emoji: '✕',
        title: tr.title6,
        desc: tr.desc6,
      },
    ], TOUR_KEYS.storyMode, force, '#tour-story-exit')
  }

  function startTourForRoute(routeName, translations) {
    if (routeName === 'workshop-overview') {
      startWorkshopOverviewTour(translations.workshopOverview)
    } else if (routeName === 'lessons-overview') {
      startLessonsOverviewTour(translations.lessonsOverview)
    } else if (routeName === 'lesson-detail') {
      startLessonDetailTour(translations.lessonDetail)
    } else if (routeName === 'story-view') {
      startStoryTour(translations.storyMode)
    }
  }

  function restartTour(routeName, translations) {
    closeTour()
    if (routeName === 'workshop-overview') {
      localStorage.removeItem(TOUR_KEYS.workshopOverview)
      startWorkshopOverviewTour(translations.workshopOverview, true)
    } else if (routeName === 'lessons-overview') {
      localStorage.removeItem(TOUR_KEYS.lessonsOverview)
      startLessonsOverviewTour(translations.lessonsOverview, true)
    } else if (routeName === 'lesson-detail') {
      localStorage.removeItem(TOUR_KEYS.lessonDetail)
      startLessonDetailTour(translations.lessonDetail, true)
    } else if (routeName === 'story-view') {
      localStorage.removeItem(TOUR_KEYS.storyMode)
      startStoryTour(translations.storyMode, true)
    } else {
      Object.values(TOUR_KEYS).forEach(k => localStorage.removeItem(k))
    }
  }

  function onTourDone() {
    if (!urlForce) markTourDone(tourDoneKey.value) // Don't save when ?tour=1
    tourVisible.value = false
    tourSteps.value = []
    tourDoneKey.value = null
  }

  function closeTour() {
    tourVisible.value = false
    tourSteps.value = []
    tourDoneKey.value = null
  }

  return {
    tourVisible,
    tourSteps,
    startTourForRoute,
    restartTour,
    onTourDone,
    closeTour,
  }
}
