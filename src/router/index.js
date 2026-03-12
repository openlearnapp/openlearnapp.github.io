import { createRouter, createWebHashHistory } from 'vue-router'
import Home from '../views/Home.vue'
import WorkshopOverview from '../views/WorkshopOverview.vue'
import LessonsOverview from '../views/LessonsOverview.vue'
import LessonDetail from '../views/LessonDetail.vue'
import LearningItems from '../views/LearningItems.vue'
import AssessmentResults from '../views/AssessmentResults.vue'
import Coach from '../views/Coach.vue'
import CoachLesson from '../views/CoachLesson.vue'
import Settings from '../views/Settings.vue'
import AddSource from '../views/AddSource.vue'
import Creators from '../views/Creators.vue'
import Profile from '../views/Profile.vue'
import Instructor from '../views/Instructor.vue'

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
    meta: { title: null }
  },
  {
    path: '/:learning/:workshop/coach/lessons',
    name: 'coach-lessons',
    component: CoachLesson,
    meta: { title: null }
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
    meta: { title: 'Profile' }
  },
  {
    path: '/instructor',
    name: 'instructor',
    component: Instructor,
    meta: { title: 'Instructor Dashboard' }
  }
]

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior() {
    return { top: 0 }
  }
})

export default router
