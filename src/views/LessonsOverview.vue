<template>
  <div>
    <!-- Source indicator for remote topics -->
    <div v-if="!isLoading && (isRemote || lessons.length > 0)" class="mb-4 flex items-center justify-between text-sm">
      <div>
        <span v-if="workshopDescription" class="text-muted-foreground">{{ workshopDescription }}</span>
        <span v-if="workshopDescription && sourceLabel" class="text-muted-foreground/40 mx-2">·</span>
        <a v-if="sourceLabel" :href="sourceUrl" target="_blank" rel="noopener" class="text-muted-foreground/60 hover:text-primary transition">{{ sourceLabel }}</a>
      </div>
      <button
        v-if="!workshopOffline && !downloadStatus"
        @click="startDownload"
        :disabled="!online"
        class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-muted-foreground/20 text-muted-foreground hover:border-primary hover:text-primary transition text-sm disabled:opacity-40 disabled:cursor-not-allowed">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        {{ isDE ? 'Offline' : 'Download' }}
      </button>
      <div v-else-if="downloadStatus?.status === 'downloading'" class="flex items-center gap-1.5 text-sm text-muted-foreground">
        <svg class="animate-spin h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
        {{ downloadStatus.progress }}/{{ downloadStatus.total }}
      </div>
      <div v-else-if="workshopOffline" class="flex items-center gap-1 text-sm text-emerald-600 dark:text-emerald-400">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
        {{ isDE ? 'Offline' : 'Offline' }}
      </div>
    </div>

    <!-- Progress bar -->
    <div id="tour-progress-bar" v-if="!isLoading && lessons.length > 0" class="mb-6">
      <ProgressBar
        :completed="completionInfo.completed"
        :total="completionInfo.total"
        :label="$t('lesson.completed')" />
    </div>

    <!-- Learning path -->
    <div v-if="!isLoading && lessons.length > 0">
      <LearningPath
        :lessons="lessons"
        :next-lesson-number="nextLessonNumber"
        :favorites="favorites"
        :get-status="getLessonStatusForPath"
        :completed-count="completionInfo.completed"
        :draggable="favorites.length > 1"
        @reorder="handleReorder">
        <template #card="{ lesson, status, isFavorite, isNext }">
          <LessonCard
            :lesson="lesson"
            :status="status"
            :is-favorite="isFavorite"
            :is-next="isNext"
            :image-url="resolveLessonImage(lesson)"
            :answered-count="getAnsweredCount(lesson)"
            :learned-item-count="getLearnedItemCount(lesson)"
            :next-label="$t('lesson.continueLabel')"
            :sections-label="$t('lesson.sections')"
            :examples-label="$t('lesson.examples')"
            :quizzes-label="$t('lesson.quizzes')"
            :audio-label="$t('lesson.audioAvailable')"
            :video-label="$t('lesson.videoAvailable')"
            :add-favorite-label="$t('lesson.addFavorite')"
            :remove-favorite-label="$t('lesson.removeFavorite')"
            :mark-complete-label="$t('lesson.markComplete')"
            :mark-incomplete-label="$t('lesson.markIncomplete')"
            :items-label="$t('lesson.itemsLearned')"
            @open="openLesson"
            @toggle-favorite="handleToggleFavorite"
            @toggle-completed="handleToggleCompleted" />
        </template>
      </LearningPath>
    </div>

    <!-- Loading state -->
    <div v-else-if="isLoading" class="text-center py-8">
      <div class="text-2xl font-bold text-primary mb-4">
        {{ $t('lesson.loadingLessons') }}
      </div>
    </div>

    <!-- Download for offline use -->
    <div v-if="!isLoading && lessons.length > 0" class="mt-6 flex flex-col items-center gap-3">
      <button
        v-if="!workshopOffline && !downloadStatus"
        @click="startDownload"
        :disabled="!online"
        class="flex items-center gap-2 px-5 py-2.5 rounded-xl border-2 border-muted-foreground/20 text-muted-foreground hover:border-primary hover:text-primary transition text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        {{ isDE ? 'Offline verfügbar machen' : 'Download for offline' }}
      </button>
      <div v-if="downloadStatus?.status === 'downloading'" class="flex items-center gap-2 text-sm text-muted-foreground">
        <svg class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
        {{ downloadStatus.progress }} / {{ downloadStatus.total }}
      </div>
      <div v-if="workshopOffline" class="flex items-center gap-1.5 text-sm text-emerald-600 dark:text-emerald-400">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
        {{ isDE ? 'Offline verfügbar' : 'Available offline' }}
      </div>
    </div>

    <!-- Install single workshop as app -->
    <div v-if="!isLoading && lessons.length > 0 && !isStandalone" class="mt-3 flex justify-center">
      <button
        @click="installApp"
        class="flex items-center gap-2 px-5 py-2.5 rounded-xl border-2 border-muted-foreground/20 text-muted-foreground hover:border-primary hover:text-primary transition text-sm font-medium">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        {{ isDE ? `„${workshopTitle}" als App` : `Install "${workshopTitle}" as App` }}
      </button>
    </div>

    <!-- Empty state -->
    <div v-else-if="!isLoading" class="text-center py-8">
      <div class="text-xl text-muted-foreground">
        {{ $t('lesson.noLessonsFound') }}
      </div>
    </div>

    <!-- iOS install instructions modal -->
    <div v-if="showIOSInstall" class="fixed inset-0 z-50 bg-black/60 flex items-end justify-center p-4" @click.self="showIOSInstall = false">
      <div class="bg-background rounded-2xl p-6 max-w-sm w-full mb-8 shadow-xl">
        <h3 class="font-semibold text-lg text-foreground mb-3">
          {{ isDE ? `„${workshopTitle}" als App` : `Install "${workshopTitle}"` }}
        </h3>
        <p class="text-muted-foreground text-sm mb-4">
          {{ isDE
            ? `Um "${workshopTitle}" als App zu installieren:`
            : `To install "${workshopTitle}" as an app:` }}
        </p>
        <ol class="text-sm text-foreground space-y-2 mb-5">
          <li>1. {{ isDE ? 'Tippe auf' : 'Tap the' }} <span class="inline-block align-middle"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg></span> {{ isDE ? '(Teilen-Button)' : '(Share button)' }}</li>
          <li>2. {{ isDE ? 'Wähle "Zum Home-Bildschirm"' : 'Choose "Add to Home Screen"' }}</li>
          <li>3. {{ isDE ? 'Tippe "Hinzufügen"' : 'Tap "Add"' }}</li>
        </ol>
        <button
          @click="showIOSInstall = false"
          class="w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition">
          {{ isDE ? 'Verstanden' : 'Got it' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useLessons } from '../composables/useLessons'
import { useProgress } from '../composables/useProgress'
import { useAssessments } from '../composables/useAssessments'
import { useOffline } from '../composables/useOffline'
import { useManifest } from '../composables/useManifest'
import { formatLangName } from '../utils/formatters'
import ProgressBar from '@/components/ProgressBar.vue'
import LessonCard from '@/components/LessonCard.vue'
import LearningPath from '@/components/LearningPath.vue'

const router = useRouter()
const route = useRoute()
const emit = defineEmits(['update-title'])

const lessonsApi = useLessons()
const { loadAllLessonsForWorkshop, isRemoteWorkshop, getSourceForSlug, getWorkshopMeta, resolveWorkshopKey } = lessonsApi
const {
  getLessonStatus, toggleLessonCompleted, markLessonVisited,
  toggleFavorite, getFavorites, reorderFavorites, getCompletionCount, getNextLesson,
  isItemLearned
} = useProgress()
const { getAssessments } = useAssessments()
const { isOnline: online, isWorkshopOffline, getDownloadStatus, downloadWorkshop } = useOffline()
const { setWorkshopManifest: applyWorkshopManifest, setDefaultManifest } = useManifest()

const lessons = ref([])
const isLoading = ref(true)
const showIOSInstall = ref(false)
let deferredInstallPrompt = null

const learning = computed(() => route.params.learning)
const workshop = computed(() => route.params.workshop)
const isDE = computed(() => learning.value === 'deutsch')
const isStandalone = computed(() =>
  window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true
)
const isIOS = computed(() => /iPad|iPhone|iPod/.test(navigator.userAgent))
const workshopTitle = computed(() => {
  const meta = getWorkshopMeta(learning.value, workshop.value)
  return meta.title || formatLangName(workshop.value)
})

const workshopOffline = computed(() => isWorkshopOffline(learning.value, workshop.value))
const downloadStatus = computed(() => getDownloadStatus(learning.value, workshop.value))

function startDownload() {
  downloadWorkshop(learning.value, workshop.value, lessonsApi)
}

const isRemote = computed(() => isRemoteWorkshop(learning.value, workshop.value))
const workshopDescription = computed(() => {
  const meta = getWorkshopMeta(learning.value, workshop.value)
  return meta.description || null
})
const sourceLabel = computed(() => {
  const url = getSourceForSlug(learning.value, workshop.value)
  if (!url) return ''
  try {
    const u = new URL(url)
    const path = u.pathname.replace(/\/index\.yaml$/, '')
    return u.hostname + path
  } catch { return '' }
})
const sourceUrl = computed(() => {
  const url = getSourceForSlug(learning.value, workshop.value)
  if (!url) return '#'
  try {
    const u = new URL(url)
    u.pathname = u.pathname.replace(/\/index\.yaml$/, '/')
    return u.toString()
  } catch { return '#' }
})

// Progress computeds
const completionInfo = computed(() => {
  return getCompletionCount(learning.value, workshop.value, lessons.value.length)
})

const nextLessonNumber = computed(() => {
  return getNextLesson(learning.value, workshop.value, lessons.value.length)
})

const favorites = computed(() => {
  return getFavorites(learning.value, workshop.value)
})

function getLessonStatusForPath(lessonNumber) {
  return getLessonStatus(learning.value, workshop.value, lessonNumber)
}

function handleToggleFavorite(lessonNumber) {
  toggleFavorite(learning.value, workshop.value, lessonNumber)
}

function handleToggleCompleted(lessonNumber) {
  toggleLessonCompleted(learning.value, workshop.value, lessonNumber)
}

function getLearnedItemCount(lesson) {
  if (!lesson.sections) return 0
  let count = 0
  lesson.sections.forEach(s => {
    s.examples?.forEach(e => {
      e.rel?.forEach(item => {
        if (isItemLearned(learning.value, workshop.value, item[0])) {
          count++
        }
      })
    })
  })
  return count
}

function getAnsweredCount(lesson) {
  const assessmentData = getAssessments()
  const key = `${learning.value}:${workshop.value}:${lesson.number}`
  const answers = assessmentData[key]
  if (!answers) return 0
  return Object.values(answers).filter(v => v && !v._cleared).length
}

function handleReorder(orderedNumbers) {
  reorderFavorites(learning.value, workshop.value, orderedNumbers)
}

function resolveLessonImage(lesson) {
  const imagePath = lesson.image
  if (!imagePath) return ''
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://') || imagePath.startsWith('/')) {
    return imagePath
  }
  const baseUrl = import.meta.env.BASE_URL
  if (lesson._source?.type === 'url') {
    return `${lesson._source.path}/${imagePath}`
  }
  const resolvedWorkshop = resolveWorkshopKey(learning.value, workshop.value)
  if (resolvedWorkshop !== workshop.value) {
    const prefix = resolvedWorkshop.startsWith('http://') || resolvedWorkshop.startsWith('https://') ? '' : baseUrl
    return `${prefix}${resolvedWorkshop}/${lesson._source?.path || lesson._filename}/${imagePath}`
  }
  return `${baseUrl}lessons/${learning.value}/${workshop.value}/${lesson._filename}/${imagePath}`
}

function openLesson(number) {
  // Mark as visited when opening
  markLessonVisited(learning.value, workshop.value, number)
  router.push({
    name: 'lesson-detail',
    params: {
      learning: learning.value,
      workshop: workshop.value,
      number
    }
  })
}

function setWorkshopManifest() {
  applyWorkshopManifest(workshopTitle.value, learning.value, workshop.value)
}

async function installApp() {
  setWorkshopManifest()

  if (deferredInstallPrompt) {
    deferredInstallPrompt.prompt()
    await deferredInstallPrompt.userChoice
    deferredInstallPrompt = null
    return
  }

  if (isIOS.value) {
    showIOSInstall.value = true
    return
  }

  // Fallback: open lessons URL so user can use browser install
  window.open(`/#/${learning.value}/${workshop.value}/lessons`, '_blank')
}

function handleBeforeInstallPrompt(e) {
  e.preventDefault()
  deferredInstallPrompt = e
}

async function loadLessons() {
  if (!learning.value || !workshop.value) return

  isLoading.value = true
  lessons.value = await loadAllLessonsForWorkshop(learning.value, workshop.value)
  isLoading.value = false

  // Update manifest so "Add to Home Screen" uses this workshop's name and URL
  setWorkshopManifest()

  const meta = getWorkshopMeta(learning.value, workshop.value)
  emit('update-title', meta.title || formatLangName(workshop.value))
}

watch([learning, workshop], () => {
  loadLessons()
}, { immediate: true })

function handleKeydown(e) {
  if (e.code === 'Escape') {
    router.push({ name: 'workshop-overview', params: { learning: learning.value } })
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
  window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
  window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
  setDefaultManifest()
})
</script>
