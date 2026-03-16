<template>
  <div class="w-full md:max-w-6xl md:mx-auto bg-primary md:rounded-xl md:shadow-2xl">
    <!-- Header with unified navigation - sticky on desktop -->
    <header v-if="!isHomePage" class="bg-primary text-white py-4 px-4 relative sticky top-0 z-50">
      <div class="flex items-center justify-between gap-2">
        <!-- Left side: language dropdown + nav buttons -->
        <div class="flex items-center gap-2 min-w-fit">
          <!-- Language dropdown (only on workshop overview) -->
          <div v-if="isWorkshopOverview && learningLanguages.length > 0" class="relative">
            <button
              @click="toggleLanguageMenu"
              class="flex items-center gap-1.5 bg-white/20 border-2 border-white/50 text-white hover:bg-white/30 rounded-full px-3 py-1.5 text-sm font-medium transition flex-shrink-0"
              :title="$t('nav.changeLanguage')"
              :aria-label="$t('nav.changeLanguage')">
              <span class="text-base leading-none">{{ getFlag(selectedLanguage) }}</span>
              <span class="hidden sm:inline">{{ selectedLanguage ? formatLangName(selectedLanguage) : $t('nav.changeLanguage') }}</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="opacity-70"><path d="m6 9 6 6 6-6"/></svg>
            </button>

            <!-- Dropdown menu -->
            <div
              v-if="showLanguageMenu"
              class="absolute top-full mt-1 bg-popover text-popover-foreground border rounded-lg shadow-lg overflow-hidden min-w-[160px] z-[100]"
              :class="isRtl ? 'right-0' : 'left-0'">
              <button
                v-for="lang in learningLanguages"
                :key="lang"
                @click="switchLanguage(lang)"
                :class="[
                  'flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-accent transition',
                  isRtl ? 'text-right' : 'text-left',
                  selectedLanguage === lang ? 'bg-accent font-medium' : ''
                ]">
                <span class="text-base leading-none">{{ getFlag(lang) }}</span>
                <span>{{ formatLangName(lang) }}</span>
              </button>
            </div>
          </div>

          <!-- Back to workshop overview (on lessons overview) -->
          <Button
            v-if="route.name === 'lessons-overview'"
            variant="ghost"
            size="icon"
            @click="goToWorkshopOverview"
            class="bg-white/20 border-2 border-white/50 text-white hover:bg-white/30 hover:text-white rounded-full w-12 h-12 text-2xl flex-shrink-0"
            :title="$t('home.workshops')"
            :aria-label="$t('home.workshops')">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/></svg>
          </Button>

          <!-- Back to lessons (on lesson detail and other workshop subpages) -->
          <Button
            v-if="isWorkshopSubpage && route.name !== 'lessons-overview'"
            variant="ghost"
            size="icon"
            @click="goBackToLessons"
            class="bg-white/20 border-2 border-white/50 text-white hover:bg-white/30 hover:text-white rounded-full w-12 h-12 text-2xl flex-shrink-0"
            :title="$t('nav.backToLessons')"
            :aria-label="$t('nav.backToLessons')">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" x2="21" y1="6" y2="6"/><line x1="8" x2="21" y1="12" y2="12"/><line x1="8" x2="21" y1="18" y2="18"/><line x1="3" x2="3.01" y1="6" y2="6"/><line x1="3" x2="3.01" y1="12" y2="12"/><line x1="3" x2="3.01" y1="18" y2="18"/></svg>
          </Button>
        </div>

        <!-- Title (grows to fill available space) -->
        <h1 class="text-xl md:text-3xl font-bold flex-grow truncate px-3">
          {{ pageTitle }}
        </h1>

        <!-- Right side buttons (fixed width container) -->
        <div class="flex items-center gap-2 min-w-fit">
          <!-- Play/Pause button (visible only on lesson detail page, hidden on mobile) -->
          <Button
            v-if="isLessonPage"
            variant="ghost"
            size="icon"
            @click="togglePlayPause"
            :disabled="isLoadingAudio"
            class="hidden md:flex bg-white/20 border-2 border-white/50 text-white hover:bg-white/30 hover:text-white rounded-full w-12 h-12 text-2xl flex-shrink-0"
            :title="isLoadingAudio ? $t('nav.loading') : (isPlaying ? $t('nav.pause') : $t('nav.play'))"
            :aria-label="isLoadingAudio ? $t('nav.loadingAudio') : (isPlaying ? $t('nav.pauseAudio') : $t('nav.playAudio'))">
            <span v-if="isLoadingAudio" class="animate-spin">⏳</span>
            <span v-else>{{ isPlaying ? '⏸' : '▶️' }}</span>
          </Button>

          <!-- Results / Lesson# toggle button -->
          <Button
            v-if="canShowResultsButton"
            variant="ghost"
            size="icon"
            @click="isOnResultsPage ? goBackToLesson() : goToResults()"
            class="bg-white/20 border-2 border-white/50 text-white hover:bg-white/30 hover:text-white rounded-full w-12 h-12 flex-shrink-0"
            :class="isOnResultsPage && fromLessonNumber ? 'text-lg font-bold' : 'text-2xl'"
            :title="isOnResultsPage ? $t('nav.backToLessons') : $t('nav.assessmentResults')"
            :aria-label="isOnResultsPage ? $t('nav.backToLessons') : $t('nav.assessmentResults')">
            <span v-if="isOnResultsPage && fromLessonNumber">{{ fromLessonNumber }}</span>
            <span v-else>📋</span>
          </Button>

          <!-- Coach button (visible when coach API is configured for workshop) -->
          <Button
            v-if="hasCoach"
            variant="ghost"
            size="icon"
            @click="goToCoach"
            class="bg-white/20 border-2 border-white/50 text-white hover:bg-white/30 hover:text-white rounded-full w-12 h-12 text-2xl flex-shrink-0"
            :title="$t('nav.coach')"
            :aria-label="$t('nav.coach')">
            🤖
          </Button>

          <!-- Items / Lesson# toggle button -->
          <Button
            v-if="canShowItemsButton"
            variant="ghost"
            size="icon"
            @click="isOnItemsPage ? goBackToLesson() : goToItems()"
            class="bg-white/20 border-2 border-white/50 text-white hover:bg-white/30 hover:text-white rounded-full w-12 h-12 flex-shrink-0"
            :class="isOnItemsPage && fromLessonNumber ? 'text-lg font-bold' : 'text-2xl'"
            :title="isOnItemsPage ? $t('nav.backToLessons') : $t('nav.learningItems')"
            :aria-label="isOnItemsPage ? $t('nav.backToLessons') : $t('nav.learningItems')">
            <span v-if="isOnItemsPage && fromLessonNumber">{{ fromLessonNumber }}</span>
            <span v-else>📚</span>
          </Button>

          <!-- Profile avatar (visible when logged in, hidden on profile page) -->
          <button
            v-if="!isHomePage && isGunLoggedIn && route.name !== 'profile'"
            @click="goToProfile"
            class="flex-shrink-0 w-10 h-10 rounded-full overflow-hidden border-2 border-white/60 hover:border-white transition"
            :title="$t('nav.profile')"
            :aria-label="$t('nav.profile')">
            <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
              <rect width="40" height="40" :fill="`hsl(${avatarHue}, 30%, 85%)`" />
              <text x="20" y="27" text-anchor="middle" font-size="18" font-weight="bold"
                :fill="`hsl(${avatarHue}, 65%, 35%)`" font-family="Arial, sans-serif">{{ avatarInitial }}</text>
            </svg>
          </button>

          <!-- Settings button (hidden on home and settings pages) -->
          <Button
            v-if="!isHomePage && route.name !== 'settings'"
            variant="ghost"
            size="icon"
            @click="goToSettings"
            class="bg-white/20 border-2 border-white/50 text-white hover:bg-white/30 hover:text-white rounded-full w-12 h-12 text-2xl hover:rotate-90 flex-shrink-0"
            :title="$t('nav.settings')"
            :aria-label="$t('nav.settings')">
            ⚙️
          </Button>

          <!-- Done button (visible only on settings page) -->
          <Button
            v-if="route.name === 'settings'"
            variant="ghost"
            size="icon"
            @click="goBack"
            class="bg-white/20 border-2 border-white/50 text-white hover:bg-white/30 hover:text-white rounded-full w-12 h-12 text-2xl flex-shrink-0"
            :title="$t('nav.done')"
            :aria-label="$t('nav.done')">
            ✓
          </Button>
        </div>
      </div>
    </header>

    <!-- Content -->
    <div class="p-8" :class="contentBgClass">
      <RouterView v-slot="{ Component, route: currentRoute }">
        <Transition name="fade" mode="out-in">
          <component :is="Component" :key="currentRoute.path" @update-title="updatePageTitle" />
        </Transition>
      </RouterView>
    </div>

    <!-- Footer -->
    <footer class="border-t border-border px-8 py-4 md:rounded-b-xl" :class="contentBgClass">
      <div class="flex items-center gap-4 text-sm">
        <a href="#/" class="text-primary hover:underline whitespace-nowrap">Home</a>
        <a
          :href="'#/' + footerLearning + '/open-learn-guide/lessons'"
          class="text-primary hover:underline whitespace-nowrap">
          {{ $t('home.guide') }}
        </a>
        <a
          :href="'#/' + footerLearning + '/open-learn-feedback/lessons'"
          class="text-primary hover:underline whitespace-nowrap">
          {{ $t('home.feedback') }}
        </a>
        <a
          href="https://github.com/openlearnapp/openlearnapp.github.io/issues"
          target="_blank"
          rel="noopener"
          class="text-primary hover:underline whitespace-nowrap">
          {{ $t('home.bugReport') }}
        </a>

        <!-- Next Lesson button (right-aligned) -->
        <router-link
          v-if="isLessonPage && footerNextLesson"
          :to="{ path: `/${lessonLearning}/${lessonWorkshop}/lesson/${footerNextLesson}`, query: route.query.label ? { label: route.query.label } : {} }"
          class="ml-auto">
          <Button size="sm">
            {{ $t('lesson.nextLesson') }} {{ isRtl ? '←' : '→' }}
          </Button>
        </router-link>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAudio } from './composables/useAudio'
import { useSettings } from './composables/useSettings'
import { useLessons } from './composables/useLessons'
import { useLanguage } from './composables/useLanguage'
import { useFooter } from './composables/useFooter'
import { useGun } from './composables/useGun'
import { isRtlLocale } from './i18n'
import { formatLangName } from './utils/formatters'
import { Button } from '@/components/ui/button'

const router = useRouter()
const route = useRoute()
const { locale } = useI18n()

const pageTitle = ref('🎓 Open Learn')
const showLanguageMenu = ref(false)

const { isLoadingAudio, isPlaying, play, pause, resume } = useAudio()
const { settings } = useSettings()
const { availableContent, getWorkshopMeta, workshopMeta, loadAvailableContent, loadWorkshopsForLanguage } = useLessons()
const { selectedLanguage, getFlag, setLanguage } = useLanguage()
const { nextLessonNumber: footerNextLesson, lessonLearning, lessonWorkshop } = useFooter()
const { isLoggedIn: isGunLoggedIn, username: gunUsername } = useGun()

const isRtl = computed(() => isRtlLocale(locale.value))

// Avatar for logged-in user (initial letter)
const avatarInitial = computed(() => (gunUsername.value ? gunUsername.value[0].toUpperCase() : ''))
function simpleHash(str) {
  let h = 5381
  for (let i = 0; i < str.length; i++) { h = ((h << 5) + h) + str.charCodeAt(i); h = h & 0xffffffff }
  return Math.abs(h)
}
const avatarHue = computed(() => simpleHash(gunUsername.value || '') % 360)

// Deduplicated list of available languages
const learningLanguages = computed(() => {
  return [...new Set(Object.keys(availableContent.value))]
})

const isHomePage = computed(() => route.name === 'home')
const isWorkshopOverview = computed(() => route.name === 'workshop-overview')
const isWorkshopSubpage = computed(() =>
  ['lesson-detail', 'lessons-overview', 'learning-items', 'assessment-results', 'coach'].includes(route.name)
)

const isLessonPage = computed(() => {
  return route.name === 'lesson-detail'
})
const isOnItemsPage = computed(() => route.name === 'learning-items')
const isOnResultsPage = computed(() => route.name === 'assessment-results')

// Footer: learning param for links (from route or last known)
const footerLearning = computed(() => {
  return route.params.learning || selectedLanguage.value || 'deutsch'
})
const footerWorkshop = computed(() => route.params.workshop)

const defaultBackground = { light: '0 0% 100%', dark: '222.2 84% 4.9%' }
const defaultPrimary = '228 78% 66%'

function darkenColor(hslStr) {
  const parts = hslStr.split(/\s+/)
  if (parts.length === 3) {
    const lightness = parseFloat(parts[2])
    if (lightness > 80) {
      return `${parts[0]} ${parts[1]} ${lightness - 40}%`
    }
  }
  return hslStr
}

function applyWorkshopColors() {
  const learning = route.params.learning
  const workshop = route.params.workshop
  const el = document.documentElement.style
  const body = document.body
  const fallbackBg = settings.value.darkMode ? defaultBackground.dark : defaultBackground.light

  if (learning && workshop) {
    const meta = getWorkshopMeta(learning, workshop)
    el.setProperty('--background', meta.color ? darkenColor(meta.color) : fallbackBg)
    el.setProperty('--primary', meta.primaryColor || defaultPrimary)
  } else {
    el.setProperty('--background', fallbackBg)
    el.setProperty('--primary', defaultPrimary)
  }

  // Use gradient when no workshop color is active, solid bg-background otherwise
  const hasWorkshopColor = learning && workshop && getWorkshopMeta(learning, workshop).color
  body.classList.toggle('bg-background', !!hasWorkshopColor)
  body.classList.toggle('bg-gradient-to-br', !hasWorkshopColor)
  body.classList.toggle('from-primary', !hasWorkshopColor)
  body.classList.toggle('to-secondary', !hasWorkshopColor)
}

// Re-apply when route, meta data, or dark mode changes
watch([() => route.params.learning, () => route.params.workshop, workshopMeta, () => settings.value.darkMode], applyWorkshopColors, { immediate: true, deep: true })

const workshopColors = computed(() => {
  const learning = route.params.learning
  const workshop = route.params.workshop
  if (!learning || !workshop) return null
  const meta = getWorkshopMeta(learning, workshop)
  if (!meta.color && !meta.primaryColor) return null
  return { background: meta.color || null, primary: meta.primaryColor || null }
})

const contentBgClass = computed(() => {
  return workshopColors.value?.background ? 'bg-card' : 'bg-background'
})

const canShowResultsButton = computed(() => {
  return route.name === 'lesson-detail' ||
         route.name === 'lessons-overview' ||
         route.name === 'learning-items' ||
         route.name === 'assessment-results'
})

const hasCoach = computed(() => {
  const learning = route.params.learning
  const workshop = route.params.workshop
  if (!learning || !workshop) return false
  const meta = getWorkshopMeta(learning, workshop)
  return !!(meta.coach?.api)
})

const canShowItemsButton = computed(() => {
  return route.name === 'lesson-detail' ||
         route.name === 'lessons-overview' ||
         route.name === 'learning-items' ||
         route.name === 'assessment-results'
})

const fromLessonNumber = computed(() => {
  return route.params.number || route.query.fromLesson || null
})

function toggleLanguageMenu() {
  showLanguageMenu.value = !showLanguageMenu.value
}

async function switchLanguage(lang) {
  showLanguageMenu.value = false
  setLanguage(lang)
  await loadWorkshopsForLanguage(lang)
  // Navigate to workshop overview for new language
  router.push({ name: 'workshop-overview', params: { learning: lang } })
}

// Close dropdown when clicking outside
function handleClickOutside(e) {
  if (showLanguageMenu.value && !e.target.closest('[aria-label]') && !e.target.closest('.absolute')) {
    showLanguageMenu.value = false
  }
}

onMounted(async () => {
  document.addEventListener('click', handleClickOutside)
  await loadAvailableContent()
  // Load workshops for route language or stored language
  const routeLang = route.params.learning
  const stored = localStorage.getItem('lastLearningLanguage')
  const lang = routeLang || (stored && learningLanguages.value.includes(stored) ? stored : null)
  if (lang) {
    setLanguage(lang)
    await loadWorkshopsForLanguage(lang)
  }
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

function goHome() {
  router.push({ name: 'home' })
}

function goToWorkshopOverview() {
  const learning = route.params.learning || selectedLanguage.value
  if (learning) {
    router.push({ name: 'workshop-overview', params: { learning } })
  } else {
    router.push({ name: 'home' })
  }
}

function goBackToLessons() {
  const learning = route.params.learning
  const workshop = route.params.workshop
  router.push({
    name: 'lessons-overview',
    params: { learning, workshop }
  })
}

function goBackToLesson() {
  const learning = route.params.learning
  const workshop = route.params.workshop
  const number = fromLessonNumber.value
  if (number) {
    router.push({
      name: 'lesson-detail',
      params: { learning, workshop, number }
    })
  } else {
    router.push({
      name: 'lessons-overview',
      params: { learning, workshop }
    })
  }
}

function goBack() {
  router.back()
}

function goToSettings() {
  if (route.name !== 'settings') {
    router.push({ name: 'settings' })
  }
}

function goToProfile() {
  if (route.name !== 'profile') {
    router.push({ name: 'profile' })
  }
}

function goToResults() {
  const learning = route.params.learning
  const workshop = route.params.workshop
  if (learning && workshop) {
    const lessonNum = fromLessonNumber.value
    const query = lessonNum ? { fromLesson: lessonNum } : {}
    router.push({
      name: 'assessment-results',
      params: { learning, workshop },
      query
    })
  }
}

function goToCoach() {
  const learning = route.params.learning
  const workshop = route.params.workshop
  if (learning && workshop) {
    const lessonNum = fromLessonNumber.value
    const query = lessonNum ? { fromLesson: lessonNum } : {}
    router.push({
      name: 'coach',
      params: { learning, workshop },
      query
    })
  }
}

function goToItems() {
  const learning = route.params.learning
  const workshop = route.params.workshop
  const number = route.params.number
  const lessonNum = fromLessonNumber.value

  if (learning && workshop) {
    const query = {}
    if (route.query.label) query.label = route.query.label
    if (number && route.name === 'lesson-detail') {
      router.push({
        name: 'learning-items',
        params: { learning, workshop, number },
        query
      })
    } else {
      if (lessonNum) query.fromLesson = lessonNum
      router.push({
        name: 'learning-items',
        params: { learning, workshop },
        query
      })
    }
  }
}

function togglePlayPause() {
  if (isPlaying.value) {
    pause()
  } else {
    play(settings.value)
  }
}

function updatePageTitle(title) {
  pageTitle.value = title
}

// Update title based on route
watch(() => route.meta.title, (newTitle) => {
  if (newTitle) {
    pageTitle.value = newTitle
  }
}, { immediate: true })
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
