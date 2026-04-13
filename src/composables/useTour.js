import { ref } from 'vue'

const TOUR_KEYS = {
  workshopOverview: 'tour_workshop_overview_done',
  lessonDetail: 'tour_lesson_detail_done',
}

// Reactive global state
const tourVisible = ref(false)
const tourSteps = ref([])
const tourDoneKey = ref(null)

function isTourDone(key) {
  return localStorage.getItem(key) === 'true'
}

function markTourDone(key) {
  if (key) localStorage.setItem(key, 'true')
}

function isElementVisible(selector) {
  const el = document.querySelector(selector)
  if (!el) return false
  const style = window.getComputedStyle(el)
  return style.display !== 'none' && style.visibility !== 'hidden' && el.offsetParent !== null
}

function buildVisibleSteps(definitions) {
  return definitions.filter(step => {
    if (!step.element) return true
    return isElementVisible(step.element)
  })
}

function showTour(stepDefs, doneKey, force = false) {
  if (!force && isTourDone(doneKey)) return

  // Small delay so DOM is ready (route transition + data load)
  setTimeout(() => {
    const steps = buildVisibleSteps(stepDefs)
    if (!steps.length) {
      // No visible elements — mark done so we don't retry forever
      markTourDone(doneKey)
      return
    }
    tourSteps.value = steps
    tourDoneKey.value = doneKey
    tourVisible.value = true
  }, 900)
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
    ], TOUR_KEYS.workshopOverview, force)
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
    ], TOUR_KEYS.lessonDetail, force)
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
      // On other pages: reset both and go to workshop-overview next time
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
