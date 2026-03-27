import { createRouter, createWebHashHistory } from 'vue-router'
import Home from '../views/Home.vue'
import WorkshopOverview from '../views/WorkshopOverview.vue'
import LessonsOverview from '../views/LessonsOverview.vue'
import LessonDetail from '../views/LessonDetail.vue'
import LearningItems from '../views/LearningItems.vue'
import AssessmentResults from '../views/AssessmentResults.vue'
import Coach from '../views/Coach.vue'
import StoryView from '../views/StoryView.vue'
import Settings from '../views/Settings.vue'
import AddSource from '../views/AddSource.vue'
import Creators from '../views/Creators.vue'
import Profile from '../views/Profile.vue'

const routes = [
  {
    path: '/',
    name: 'home',
    component: Home,
    meta: { title: '🎓 Open Learn' }
  },
  {
    path: '/:learning',
    name: 'workshop-overview',
    component: WorkshopOverview,
    meta: { title: 'Workshops' }
  },
  {
    path: '/:learning/workshops',
    redirect: to => `/${to.params.learning}`
  },
  {
    path: '/:learning/:workshop/lessons',
    name: 'lessons-overview',
    component: LessonsOverview,
    meta: { title: null } // Will be set dynamically
  },
  {
    path: '/:learning/:workshop/lesson/:number',
    name: 'lesson-detail',
    component: LessonDetail,
    meta: { title: null } // Will be set dynamically
  },
  {
    path: '/:learning/:workshop/story/:number',
    name: 'story-view',
    component: StoryView,
    meta: { title: null, storyMode: true }
  },
  {
    path: '/:learning/:workshop/items/:number?',
    name: 'learning-items',
    component: LearningItems,
    meta: { title: null } // Will be set dynamically
  },
  {
    path: '/:learning/:workshop/results',
    name: 'assessment-results',
    component: AssessmentResults,
    meta: { title: null } // Will be set dynamically
  },
  {
    path: '/:learning/:workshop/coach',
    name: 'coach',
    component: Coach,
    meta: { title: null } // Will be set dynamically
  },
  {
    path: '/settings',
    name: 'settings',
    component: Settings,
    meta: { title: '⚙️ Settings' }
  },
  {
    path: '/add',
    name: 'add-source',
    component: AddSource,
    meta: { title: '🎓 Open Learn' }
  },
  {
    path: '/creators',
    name: 'creators',
    component: Creators,
    meta: { title: null }
  },
  {
    path: '/profile',
    name: 'profile',
    component: Profile,
    meta: { title: null }
  }
]

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior() {
    return { top: 0 }
  }
})

// Redirect returning users from Home to their last language's workshop overview
// In PWA (standalone) mode, always skip Home
router.beforeEach((to) => {
  if (to.name !== 'home') return true

  const lastLang = localStorage.getItem('selectedLanguage')
  if (!lastLang) return true // First-time visitor, show Home

  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true
  const hasVisited = localStorage.getItem('hasVisitedBefore')

  if (isStandalone || hasVisited) {
    return { name: 'workshop-overview', params: { learning: lastLang } }
  }

  return true
})

// Track that the user has visited before
router.afterEach((to) => {
  if (to.name === 'workshop-overview' || to.name === 'lessons-overview') {
    localStorage.setItem('hasVisitedBefore', 'true')
  }
})

export default router
