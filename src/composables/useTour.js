import { ref } from 'vue'

const TOUR_KEYS = {
  workshopOverview: 'tour_workshop_overview_done',
  lessonDetail: 'tour_lesson_detail_done',
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
  if (!force && isTourDone(doneKey)) return

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

  function startLessonDetailTour(tr, force = false) {
    showTour([
      {
        element: '#tour-story-btn',
        emoji: '📺',
        title: tr.title1,
        desc: tr.desc1,
      },
      {
        element: '#tour-play-btn',
        emoji: '🔊',
        title: tr.title2,
        desc: tr.desc2,
      },
      {
        element: '#tour-burger-btn',
        emoji: '⚙️',
        title: tr.title3,
        desc: tr.desc3,
      },
    ], TOUR_KEYS.lessonDetail, force, '#tour-burger-btn')
  }

  function startTourForRoute(routeName, translations) {
    if (routeName === 'workshop-overview') {
      startWorkshopOverviewTour(translations.workshopOverview)
    } else if (routeName === 'lesson-detail') {
      startLessonDetailTour(translations.lessonDetail)
    }
  }

  function restartTour(routeName, translations) {
    closeTour()
    if (routeName === 'workshop-overview') {
      localStorage.removeItem(TOUR_KEYS.workshopOverview)
      startWorkshopOverviewTour(translations.workshopOverview, true)
    } else if (routeName === 'lesson-detail') {
      localStorage.removeItem(TOUR_KEYS.lessonDetail)
      startLessonDetailTour(translations.lessonDetail, true)
    } else {
      // On other pages: reset everything so tour runs next time they visit
      localStorage.removeItem(TOUR_KEYS.workshopOverview)
      localStorage.removeItem(TOUR_KEYS.lessonDetail)
    }
  }

  function onTourDone() {
    markTourDone(tourDoneKey.value)
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
