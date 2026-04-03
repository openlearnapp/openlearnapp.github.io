<template>
  <div class="w-full md:max-w-6xl md:mx-auto bg-primary md:rounded-xl md:shadow-2xl">
    <!-- Header with unified navigation - sticky on desktop -->
    <header v-if="!isHomePage && !isStoryMode" class="bg-primary text-white py-4 px-4 relative sticky top-0 z-50">
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

          <!-- Back to workshop overview (on lessons overview, hidden in single-workshop PWA) -->
          <Button
            v-if="route.name === 'lessons-overview' && !isSingleWorkshopPwa"
            variant="ghost"
            size="icon"
            @click="goToWorkshopOverview"
            class="bg-white/20 border-2 border-white/50 text-white hover:bg-white/30 hover:text-white rounded-full w-10 h-10 flex-shrink-0"
            :title="$t('home.workshops')"
            :aria-label="$t('home.workshops')">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/></svg>
          </Button>

          <!-- Back to lessons (on lesson detail and other workshop subpages) -->
          <Button
            v-if="isWorkshopSubpage && route.name !== 'lessons-overview'"
            variant="ghost"
            size="icon"
            @click="goBackToLessons"
            class="bg-white/20 border-2 border-white/50 text-white hover:bg-white/30 hover:text-white rounded-full w-10 h-10 flex-shrink-0"
            :title="$t('nav.backToLessons')"
            :aria-label="$t('nav.backToLessons')">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" x2="21" y1="6" y2="6"/><line x1="8" x2="21" y1="12" y2="12"/><line x1="8" x2="21" y1="18" y2="18"/><line x1="3" x2="3.01" y1="6" y2="6"/><line x1="3" x2="3.01" y1="12" y2="12"/><line x1="3" x2="3.01" y1="18" y2="18"/></svg>
          </Button>
        </div>

        <!-- Title (grows to fill available space) -->
        <h1 class="text-lg sm:text-xl md:text-3xl font-bold flex-grow truncate px-3 flex items-center gap-2">
          <span class="truncate">{{ pageTitle }}</span>
          <span v-if="!online" class="flex-shrink-0 inline-flex items-center gap-1 bg-white/20 text-white/80 text-xs font-medium px-2 py-0.5 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="2" x2="22" y1="2" y2="22"/><path d="M8.5 16.5a5 5 0 0 1 7 0"/><path d="M2 8.82a15 15 0 0 1 4.17-2.65"/><path d="M10.66 5c4.01-.36 8.14.9 11.34 3.76"/><path d="M16.85 11.25a10 10 0 0 1 2.22 1.68"/><path d="M5 12.86a10 10 0 0 1 5.17-2.94"/></svg>
            offline
          </span>
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
            class="hidden md:flex bg-white/20 border-2 border-white/50 text-white hover:bg-white/30 hover:text-white rounded-full w-10 h-10 flex-shrink-0"
            :title="isLoadingAudio ? $t('nav.loading') : (isPlaying ? $t('nav.pause') : $t('nav.play'))"
            :aria-label="isLoadingAudio ? $t('nav.loadingAudio') : (isPlaying ? $t('nav.pauseAudio') : $t('nav.playAudio'))">
            <svg v-if="isLoadingAudio" class="animate-spin" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
            <svg v-else-if="isPlaying" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
            <svg v-else xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="6 3 20 12 6 21 6 3"/></svg>
          </Button>

          <!-- Story mode button (visible on lesson/overview pages) -->
          <Button
            v-if="canEnterStoryMode"
            variant="ghost"
            size="icon"
            @click="enterStoryMode"
            class="hidden sm:flex bg-white/20 border-2 border-white/50 text-white hover:bg-white/30 hover:text-white rounded-full w-10 h-10 flex-shrink-0"
            title="Story Mode"
            aria-label="Story Mode">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
          </Button>

          <!-- Mobile: single toggle button cycling lesson → items → results -->
          <Button
            v-if="canShowToggleButton"
            variant="ghost"
            size="icon"
            @click="cycleView"
            class="md:hidden bg-white/20 border-2 border-white/50 text-white hover:bg-white/30 hover:text-white rounded-full w-10 h-10 flex-shrink-0"
            :title="toggleButtonTitle"
            :aria-label="toggleButtonTitle">
            <span v-if="toggleButtonMode === 'number'" class="text-sm font-bold">{{ fromLessonNumber }}</span>
            <svg v-else-if="toggleButtonMode === 'items'" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
            <svg v-else xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M15 2H9a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1z"/><path d="M12 11h4"/><path d="M12 16h4"/><path d="M8 11h.01"/><path d="M8 16h.01"/></svg>
          </Button>

          <!-- Desktop: individual buttons (hidden on mobile) -->
          <!-- Results / Lesson# toggle button -->
          <Button
            v-if="canShowResultsButton"
            variant="ghost"
            size="icon"
            @click="isOnResultsPage ? goBackToLesson() : goToResults()"
            class="hidden md:flex bg-white/20 border-2 border-white/50 text-white hover:bg-white/30 hover:text-white rounded-full w-10 h-10 flex-shrink-0"
            :title="isOnResultsPage ? $t('nav.backToLessons') : $t('nav.assessmentResults')"
            :aria-label="isOnResultsPage ? $t('nav.backToLessons') : $t('nav.assessmentResults')">
            <span v-if="isOnResultsPage && fromLessonNumber" class="text-sm font-bold">{{ fromLessonNumber }}</span>
            <svg v-else xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M15 2H9a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1z"/><path d="M12 11h4"/><path d="M12 16h4"/><path d="M8 11h.01"/><path d="M8 16h.01"/></svg>
          </Button>

          <!-- Items / Lesson# toggle button -->
          <Button
            v-if="canShowItemsButton"
            variant="ghost"
            size="icon"
            @click="isOnItemsPage ? goBackToLesson() : goToItems()"
            class="hidden md:flex bg-white/20 border-2 border-white/50 text-white hover:bg-white/30 hover:text-white rounded-full w-10 h-10 flex-shrink-0"
            :title="isOnItemsPage ? $t('nav.backToLessons') : $t('nav.learningItems')"
            :aria-label="isOnItemsPage ? $t('nav.backToLessons') : $t('nav.learningItems')">
            <span v-if="isOnItemsPage && fromLessonNumber" class="text-sm font-bold">{{ fromLessonNumber }}</span>
            <svg v-else xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
          </Button>

          <!-- Burger menu (replaces Settings, Profile, Workshops buttons) -->
          <div v-if="!isHomePage" class="relative">
            <Button
              variant="ghost"
              size="icon"
              @click="showBurgerMenu = !showBurgerMenu"
              class="bg-white/20 border-2 border-white/50 text-white hover:bg-white/30 hover:text-white rounded-full w-10 h-10 flex-shrink-0"
              :title="showBurgerMenu ? $t('nav.closeMenu') : $t('nav.menu')"
              :aria-label="showBurgerMenu ? $t('nav.closeMenu') : $t('nav.menu')">
              <svg v-if="!showBurgerMenu" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="18" y2="18"/></svg>
              <svg v-else xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" x2="6" y1="6" y2="18"/><line x1="6" x2="18" y1="6" y2="18"/></svg>
            </Button>

            <!-- Dropdown menu -->
            <div
              v-if="showBurgerMenu"
              class="absolute top-full mt-1 bg-popover text-popover-foreground border rounded-lg shadow-lg overflow-hidden min-w-[180px] z-[100]"
              :class="isRtl ? 'left-0' : 'right-0'">
              <button
                @click="goToSettings(); showBurgerMenu = false"
                :class="['flex items-center gap-3 w-full px-4 py-3 text-sm hover:bg-accent transition', isRtl ? 'text-right' : 'text-left', route.name === 'settings' ? 'bg-accent font-medium' : '']">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
                <span>{{ $t('nav.settings') }}</span>
              </button>
              <button
                @click="goToProfile(); showBurgerMenu = false"
                :class="['flex items-center gap-3 w-full px-4 py-3 text-sm hover:bg-accent transition', isRtl ? 'text-right' : 'text-left', route.name === 'profile' ? 'bg-accent font-medium' : '']">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                <span>{{ $t('nav.profile') }}</span>
              </button>
              <button
                v-if="hasCoach"
                @click="goToCoach(); showBurgerMenu = false"
                :class="['flex items-center gap-3 w-full px-4 py-3 text-sm hover:bg-accent transition', isRtl ? 'text-right' : 'text-left', route.name === 'coach' ? 'bg-accent font-medium' : '']">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/></svg>
                <span>{{ $t('nav.coach') }}</span>
              </button>
            </div>
          </div>
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
    <footer v-if="!isStoryMode" class="border-t border-border px-8 py-4 md:rounded-b-xl" :class="contentBgClass">
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
import { useOffline } from './composables/useOffline'
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
const showBurgerMenu = ref(false)

const { isLoadingAudio, isPlaying, play, pause, resume } = useAudio()
const { settings } = useSettings()
const { availableContent, getWorkshopMeta, workshopMeta, loadAvailableContent, loadWorkshopsForLanguage } = useLessons()
const { selectedLanguage, getFlag, setLanguage } = useLanguage()
const { nextLessonNumber: footerNextLesson, lessonLearning, lessonWorkshop } = useFooter()
const { isLoggedIn: isGunLoggedIn, username: gunUsername } = useGun()
const { isOnline: online } = useOffline()

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
const isStoryMode = computed(() => route.meta?.storyMode === true)
const isWorkshopOverview = computed(() => route.name === 'workshop-overview')
const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true
// Single-workshop PWA: launched with a workshop-specific start_url (e.g. /#/deutsch/portugiesisch/lessons)
// Full-app PWA: launched from / — show full navigation
const isSingleWorkshopPwa = isStandalone && /^#\/[^/]+\/[^/]+\/lessons/.test(window.location.hash)
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

const canEnterStoryMode = computed(() => {
  return route.name === 'lesson-detail' || route.name === 'lessons-overview'
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

// Mobile toggle button: cycles lesson → items → results → lesson
const canShowToggleButton = computed(() => {
  return ['lesson-detail', 'lessons-overview', 'learning-items', 'assessment-results'].includes(route.name)
})

const toggleButtonMode = computed(() => {
  if (route.name === 'learning-items') return 'results'
  if (route.name === 'assessment-results' && fromLessonNumber.value) return 'number'
  if (route.name === 'assessment-results') return 'items'
  return 'items'
})

const toggleButtonTitle = computed(() => {
  if (route.name === 'learning-items') return 'Results'
  if (route.name === 'assessment-results') return 'Lesson'
  return 'Items'
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

// Close dropdowns when clicking outside
function handleClickOutside(e) {
  if (showLanguageMenu.value && !e.target.closest('[aria-label]') && !e.target.closest('.absolute')) {
    showLanguageMenu.value = false
  }
  if (showBurgerMenu.value && !e.target.closest('.relative')) {
    showBurgerMenu.value = false
  }
}

// Spacebar to pause/resume audio (normal mode only — story mode handles its own)
function handleKeydown(e) {
  if (e.code !== 'Space') return
  if (isStoryMode.value) return
  const tag = e.target.tagName
  if (tag === 'INPUT' || tag === 'TEXTAREA' || e.target.isContentEditable) return

  e.preventDefault()
  togglePlayPause()
}

onMounted(async () => {
  document.addEventListener('click', handleClickOutside)
  document.addEventListener('keydown', handleKeydown)
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
  document.removeEventListener('keydown', handleKeydown)
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

function enterStoryMode() {
  const learning = route.params.learning
  const workshop = route.params.workshop
  const number = route.params.number || 1
  if (learning && workshop) {
    router.push({
      name: 'story-view',
      params: { learning, workshop, number }
    })
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

function cycleView() {
  if (route.name === 'learning-items') {
    goToResults()
  } else if (route.name === 'assessment-results') {
    goBackToLesson()
  } else {
    // lesson-detail or lessons-overview → items
    goToItems()
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
