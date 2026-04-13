import { driver } from 'driver.js'
import 'driver.js/dist/driver.css'

const TOUR_KEYS = {
  workshopOverview: 'tour_workshop_overview_done',
  lessonDetail: 'tour_lesson_detail_done',
}

function isTourDone(key) {
  return localStorage.getItem(key) === 'true'
}

function markTourDone(key) {
  localStorage.setItem(key, 'true')
}

function resetAllTours() {
  Object.values(TOUR_KEYS).forEach(k => localStorage.removeItem(k))
}

let driverInstance = null

function destroyTour() {
  if (driverInstance) {
    driverInstance.destroy()
    driverInstance = null
  }
}

function buildSteps(definitions) {
  // Only include steps where the target element exists in the DOM
  return definitions.filter(step => {
    if (!step.element) return true // no target = centered popover, always include
    return !!document.querySelector(step.element)
  })
}

function runTour(steps, onDone) {
  if (!steps.length) {
    onDone?.()
    return
  }
  destroyTour()
  driverInstance = driver({
    animate: true,
    showProgress: true,
    allowClose: true,
    popoverClass: 'open-learn-tour',
    nextBtnText: '→',
    prevBtnText: '←',
    doneBtnText: '✓',
    onDestroyStarted: () => {
      onDone?.()
      driverInstance?.destroy()
      driverInstance = null
    },
    steps,
  })
  driverInstance.drive()
}

export function useTour() {
  function startWorkshopOverviewTour(translations, force = false) {
    if (!force && isTourDone(TOUR_KEYS.workshopOverview)) return
    const { title1, desc1, title2, desc2, title3, desc3, title4, desc4 } = translations

    setTimeout(() => {
      const steps = buildSteps([
        {
          element: '#tour-language-btn',
          popover: { title: title1, description: desc1, side: 'bottom', align: 'start' },
        },
        {
          element: '#tour-filter-chips',
          popover: { title: title2, description: desc2, side: 'bottom', align: 'start' },
        },
        {
          element: '#tour-workshop-card',
          popover: { title: title3, description: desc3, side: 'bottom', align: 'start' },
        },
        {
          element: '#tour-burger-btn',
          popover: { title: title4, description: desc4, side: 'bottom', align: 'end' },
        },
      ])
      runTour(steps, () => markTourDone(TOUR_KEYS.workshopOverview))
    }, 1200)
  }

  function startLessonDetailTour(translations, force = false) {
    if (!force && isTourDone(TOUR_KEYS.lessonDetail)) return
    const { title1, desc1, title2, desc2, title3, desc3 } = translations

    setTimeout(() => {
      const steps = buildSteps([
        {
          element: '#tour-story-btn',
          popover: { title: title1, description: desc1, side: 'bottom', align: 'end' },
        },
        {
          element: '#tour-play-btn',
          popover: { title: title2, description: desc2, side: 'bottom', align: 'end' },
        },
        {
          element: '#tour-burger-btn',
          popover: { title: title3, description: desc3, side: 'bottom', align: 'end' },
        },
      ])
      runTour(steps, () => markTourDone(TOUR_KEYS.lessonDetail))
    }, 600)
  }

  function startTourForRoute(routeName, translations) {
    if (routeName === 'workshop-overview') {
      startWorkshopOverviewTour(translations.workshopOverview)
    } else if (routeName === 'lesson-detail') {
      startLessonDetailTour(translations.lessonDetail)
    }
  }

  function restartTour(routeName, translations) {
    destroyTour()
    if (routeName === 'workshop-overview') {
      startWorkshopOverviewTour(translations.workshopOverview, true)
    } else if (routeName === 'lesson-detail') {
      startLessonDetailTour(translations.lessonDetail, true)
    } else {
      // On other pages, reset all and hint user to go to workshop overview
      resetAllTours()
    }
  }

  return {
    startTourForRoute,
    restartTour,
    destroyTour,
    TOUR_KEYS,
    isTourDone,
    resetAllTours,
  }
}
