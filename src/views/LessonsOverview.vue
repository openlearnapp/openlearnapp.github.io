<template>
  <div>
    <!-- Source indicator for remote topics -->
    <div v-if="!isLoading && isRemote" class="mb-4 flex items-center justify-between text-sm">
      <div>
        <span v-if="workshopDescription" class="text-muted-foreground">{{ workshopDescription }}</span>
        <span v-if="workshopDescription && sourceLabel" class="text-muted-foreground/40 mx-2">·</span>
        <a v-if="sourceLabel" :href="sourceUrl" target="_blank" rel="noopener" class="text-muted-foreground/60 hover:text-primary transition">{{ sourceLabel }}</a>
      </div>
      <Button
        variant="outline"
        size="sm"
        @click="copyShareLink">
        {{ copied ? $t('lesson.copied') : $t('lesson.share') }}
      </Button>
    </div>

    <!-- Lessons grid -->
    <div v-if="!isLoading && lessons.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      <Card
        v-for="lesson in lessons"
        :key="lesson.number"
        @click="openLesson(lesson.number)"
        class="cursor-pointer transition hover:-translate-y-1 hover:shadow-xl overflow-hidden">
        <div v-if="lesson.image" class="overflow-hidden aspect-[16/9] bg-accent/20">
          <img
            :src="resolveLessonImage(lesson)"
            :alt="lesson.title"
            class="w-full h-full object-cover" />
        </div>
        <div class="p-6">
          <div class="flex items-center gap-3 mb-2">
            <div class="text-5xl font-bold text-primary flex-shrink-0 leading-none">
              {{ lesson.number }}
            </div>
            <div class="text-2xl font-semibold text-foreground">
              {{ lesson.title }}
            </div>
          </div>
          <div class="text-muted-foreground mb-2">
            {{ lesson.description || '' }}
          </div>
          <div class="text-primary font-semibold">
            {{ lesson.sections.length }} {{ $t('lesson.sections') }}
          </div>
        </div>
      </Card>
    </div>

    <!-- Loading state -->
    <div v-else-if="isLoading" class="text-center py-8">
      <div class="text-2xl font-bold text-primary mb-4">
        {{ $t('lesson.loadingLessons') }}
      </div>
    </div>

    <!-- Install as app button -->
    <div v-if="!isLoading && lessons.length > 0 && !isStandalone" class="mt-6 flex justify-center">
      <button
        @click="installApp"
        class="flex items-center gap-2 px-5 py-2.5 rounded-xl border-2 border-muted-foreground/20 text-muted-foreground hover:border-primary hover:text-primary transition text-sm font-medium">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        {{ isDE ? 'Als App installieren' : 'Install as App' }}
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
          {{ isDE ? 'Als App installieren' : 'Install as App' }}
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
import { formatLangName } from '../utils/formatters'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

const router = useRouter()
const route = useRoute()
const emit = defineEmits(['update-title'])

const { loadAllLessonsForWorkshop, isRemoteWorkshop, getSourceForSlug, getWorkshopMeta } = useLessons()

const lessons = ref([])
const isLoading = ref(true)
const copied = ref(false)
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

async function copyShareLink() {
  const base = window.location.href.replace(/#.*$/, '')
  const url = `${base}#/${learning.value}/${workshop.value}/lessons`
  try {
    await navigator.clipboard.writeText(url)
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  } catch {}
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
  return `${baseUrl}lessons/${learning.value}/${workshop.value}/${lesson._filename}/${imagePath}`
}

function openLesson(number) {
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
  const manifest = {
    name: workshopTitle.value,
    short_name: workshopTitle.value,
    start_url: `/#/${learning.value}/${workshop.value}/lessons`,
    display: 'standalone',
    background_color: '#000000',
    theme_color: '#000000',
    icons: [{ src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml' }]
  }
  const blob = new Blob([JSON.stringify(manifest)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.querySelector('link[rel="manifest"]')
  if (link) link.href = url
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

  const meta = getWorkshopMeta(learning.value, workshop.value)
  console.log(`🎨 [LessonsOverview] ${workshop.value}: color="${meta.color}", primaryColor="${meta.primaryColor}"`)
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
})
</script>
