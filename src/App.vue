<template>
  <div class="w-full md:max-w-6xl md:mx-auto bg-background md:rounded-xl md:shadow-2xl">
    <!-- Header with unified navigation - sticky on desktop -->
    <header class="bg-gradient-to-br from-primary to-secondary text-white py-4 px-4 md:rounded-t-xl relative sticky top-0 z-50">
      <div class="flex items-center justify-between gap-2">
        <!-- Left side: language dropdown + nav buttons -->
        <div class="flex items-center gap-2 min-w-fit">
          <!-- Language dropdown (always visible) -->
          <div v-if="learningLanguages.length > 0" class="relative">
            <button
              @click="toggleLanguageMenu"
              class="flex items-center gap-1.5 bg-white/20 border-2 border-white/50 text-white hover:bg-white/30 rounded-lg px-2.5 py-1.5 text-sm font-medium transition flex-shrink-0"
              title="Change language"
              aria-label="Change language">
              <span class="text-base leading-none">{{ getFlag(selectedLanguage) }}</span>
              <span class="hidden sm:inline">{{ selectedLanguage ? formatLangName(selectedLanguage) : 'Language' }}</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="opacity-70"><path d="m6 9 6 6 6-6"/></svg>
            </button>

            <!-- Dropdown menu -->
            <div
              v-if="showLanguageMenu"
              class="absolute top-full left-0 mt-1 bg-popover text-popover-foreground border rounded-lg shadow-lg overflow-hidden min-w-[160px] z-[100]">
              <button
                v-for="lang in learningLanguages"
                :key="lang"
                @click="switchLanguage(lang)"
                :class="[
                  'flex items-center gap-2 w-full px-3 py-2 text-sm text-left hover:bg-accent transition',
                  selectedLanguage === lang ? 'bg-accent font-medium' : ''
                ]">
                <span class="text-base leading-none">{{ getFlag(lang) }}</span>
                <span>{{ formatLangName(lang) }}</span>
              </button>
            </div>
          </div>

          <!-- Home button (visible except on home page and lesson detail page) -->
          <Button
            v-if="canGoBack && route.name !== 'lesson-detail'"
            variant="ghost"
            size="icon"
            @click="goHome"
            class="bg-white/20 border-2 border-white/50 text-white hover:bg-white/30 hover:text-white rounded-full w-10 h-10 text-xl flex-shrink-0"
            title="Go to home"
            aria-label="Go to home">
            🏠
          </Button>

          <!-- Back button (only on lesson detail page) -->
          <Button
            v-if="route.name === 'lesson-detail'"
            variant="ghost"
            @click="goBackToLessons"
            class="bg-white/20 border-2 border-white/50 text-white hover:bg-white/30 hover:text-white px-3 py-1.5 rounded-lg text-sm flex-shrink-0"
            title="Back to lessons"
            aria-label="Back to lessons">
            ←
          </Button>
        </div>

        <!-- Title (grows to fill available space) -->
        <h1 class="text-xl md:text-3xl font-bold text-center flex-grow truncate">
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
            class="hidden md:flex bg-white/20 border-2 border-white/50 text-white hover:bg-white/30 hover:text-white rounded-full w-12 h-12 text-2xl flex-shrink-0"
            :title="isPlaying ? 'Pause' : 'Play'"
            :aria-label="isPlaying ? 'Pause audio' : 'Play audio'">
            {{ isPlaying ? '⏸' : '▶️' }}
          </Button>

          <!-- Assessment Results button (visible when workshop context exists) -->
          <Button
            v-if="canShowResultsButton"
            variant="ghost"
            size="icon"
            @click="goToResults"
            class="bg-white/20 border-2 border-white/50 text-white hover:bg-white/30 hover:text-white rounded-full w-12 h-12 text-2xl flex-shrink-0"
            title="Assessment Results"
            aria-label="Assessment Results">
            📋
          </Button>

          <!-- Coach button (visible when coach API is configured for workshop) -->
          <Button
            v-if="hasCoach"
            variant="ghost"
            size="icon"
            @click="goToCoach"
            class="bg-white/20 border-2 border-white/50 text-white hover:bg-white/30 hover:text-white rounded-full w-12 h-12 text-2xl flex-shrink-0"
            title="Coach"
            aria-label="Coach">
            🤖
          </Button>

          <!-- Items button (visible on lesson pages and overview page) -->
          <Button
            v-if="canShowItemsButton"
            variant="ghost"
            size="icon"
            @click="goToItems"
            class="bg-white/20 border-2 border-white/50 text-white hover:bg-white/30 hover:text-white rounded-full w-12 h-12 text-2xl flex-shrink-0"
            title="Learning Items"
            aria-label="Learning items">
            📚
          </Button>

          <!-- Settings button (hidden on settings page) -->
          <Button
            v-if="route.name !== 'settings'"
            variant="ghost"
            size="icon"
            @click="goToSettings"
            class="bg-white/20 border-2 border-white/50 text-white hover:bg-white/30 hover:text-white rounded-full w-12 h-12 text-2xl hover:rotate-90 flex-shrink-0"
            title="Settings"
            aria-label="Settings">
            ⚙️
          </Button>

          <!-- Done button (visible only on settings page) -->
          <Button
            v-if="route.name === 'settings'"
            variant="ghost"
            size="icon"
            @click="goBack"
            class="bg-white/20 border-2 border-white/50 text-white hover:bg-white/30 hover:text-white rounded-full w-12 h-12 text-2xl flex-shrink-0"
            title="Done"
            aria-label="Done">
            ✓
          </Button>
        </div>
      </div>
    </header>

    <!-- Content -->
    <div class="p-8">
      <RouterView v-slot="{ Component, route: currentRoute }">
        <Transition name="fade" mode="out-in">
          <component :is="Component" :key="currentRoute.path" @update-title="updatePageTitle" />
        </Transition>
      </RouterView>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAudio } from './composables/useAudio'
import { useSettings } from './composables/useSettings'
import { useLessons } from './composables/useLessons'
import { useLanguage } from './composables/useLanguage'
import { formatLangName } from './utils/formatters'
import { Button } from '@/components/ui/button'

const router = useRouter()
const route = useRoute()

const pageTitle = ref('🎓 Open Learn')
const showLanguageMenu = ref(false)

const { isPlaying, play, pause, resume } = useAudio()
const { settings } = useSettings()
const { availableContent, getWorkshopMeta, loadAvailableContent, loadWorkshopsForLanguage } = useLessons()
const { selectedLanguage, getFlag, setLanguage } = useLanguage()

// Deduplicated list of available languages
const learningLanguages = computed(() => {
  return [...new Set(Object.keys(availableContent.value))]
})

const canGoBack = computed(() => {
  return route.name !== 'home'
})

const isLessonPage = computed(() => {
  return route.name === 'lesson-detail'
})

const canShowResultsButton = computed(() => {
  return route.name === 'lesson-detail' ||
         route.name === 'lessons-overview' ||
         route.name === 'learning-items'
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
         route.name === 'learning-items'
})

function toggleLanguageMenu() {
  showLanguageMenu.value = !showLanguageMenu.value
}

async function switchLanguage(lang) {
  showLanguageMenu.value = false
  setLanguage(lang)
  await loadWorkshopsForLanguage(lang)
  // If on home page, stay there. If elsewhere, navigate home to show workshops for new language.
  if (route.name !== 'home') {
    router.push({ name: 'home' })
  }
}

// Close dropdown when clicking outside
function handleClickOutside(e) {
  if (showLanguageMenu.value && !e.target.closest('[aria-label="Change language"]') && !e.target.closest('.absolute')) {
    showLanguageMenu.value = false
  }
}

onMounted(async () => {
  document.addEventListener('click', handleClickOutside)
  await loadAvailableContent()
  // Restore language selection if stored
  const stored = localStorage.getItem('lastLearningLanguage')
  if (stored && learningLanguages.value.includes(stored)) {
    setLanguage(stored)
    await loadWorkshopsForLanguage(stored)
  }
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

function goHome() {
  router.push({ name: 'home' })
}

function goBackToLessons() {
  const learning = route.params.learning
  const workshop = route.params.workshop
  router.push({
    name: 'lessons-overview',
    params: { learning, workshop }
  })
}

function goBack() {
  router.back()
}

function goToSettings() {
  if (route.name !== 'settings') {
    router.push({ name: 'settings' })
  }
}

function goToResults() {
  const learning = route.params.learning
  const workshop = route.params.workshop
  if (learning && workshop) {
    router.push({
      name: 'assessment-results',
      params: { learning, workshop }
    })
  }
}

function goToCoach() {
  const learning = route.params.learning
  const workshop = route.params.workshop
  if (learning && workshop) {
    router.push({
      name: 'coach',
      params: { learning, workshop }
    })
  }
}

function goToItems() {
  const learning = route.params.learning
  const workshop = route.params.workshop
  const number = route.params.number

  if (route.name === 'learning-items') {
    // If on items page, go back to lessons
    if (number) {
      // Go to specific lesson
      router.push({
        name: 'lesson-detail',
        params: { learning, workshop, number }
      })
    } else {
      // Go to lessons overview
      router.push({
        name: 'lessons-overview',
        params: { learning, workshop }
      })
    }
    return
  }

  if (learning && workshop) {
    // If coming from a lesson, include the lesson number to filter
    if (number && route.name === 'lesson-detail') {
      router.push({
        name: 'learning-items',
        params: { learning, workshop, number }
      })
    } else {
      // If coming from overview, show all items
      router.push({
        name: 'learning-items',
        params: { learning, workshop }
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
