<template>
  <div class="fixed inset-0 z-[100] bg-black flex flex-col" style="height: 100dvh">
    <!-- Exit button (top-left, press-and-hold 2s) -->
    <button
      class="absolute top-4 left-4 z-[110] w-14 h-14 rounded-full bg-black/50 text-white flex items-center justify-center transition-all"
      :class="{ 'ring-4 ring-white': exitProgress > 0 }"
      @pointerdown="startExit"
      @pointerup="cancelExit"
      @pointerleave="cancelExit"
      title="Hold to exit"
      aria-label="Hold to exit">
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
      </svg>
      <!-- Ring progress indicator -->
      <svg v-if="exitProgress > 0" class="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 56 56">
        <circle cx="28" cy="28" r="24" fill="none" stroke="white" stroke-width="3"
          :stroke-dasharray="`${exitProgress * 150.8} 150.8`"
          stroke-linecap="round" />
      </svg>
    </button>

    <!-- Loading state -->
    <div v-if="state === 'loading'" class="flex-1 flex items-center justify-center">
      <div class="text-white text-2xl animate-pulse">Loading story...</div>
    </div>

    <!-- Story content -->
    <template v-else>
      <!-- Section image (fills screen), tap to advance -->
      <div class="flex-1 relative overflow-hidden" @click="handleTap">
        <img
          v-if="currentSectionImage"
          :src="currentSectionImage"
          :alt="currentSection?.title || ''"
          class="absolute inset-0 w-full h-full object-cover transition-opacity duration-700"
          :class="imageLoaded ? 'opacity-100' : 'opacity-0'"
          @load="imageLoaded = true" />
        <div v-else class="absolute inset-0 bg-gradient-to-b from-gray-900 to-black" />

        <!-- Choice cards overlay -->
        <div v-if="state === 'choosing'" class="absolute inset-0 bg-black/60 flex items-center justify-center p-6">
          <div class="grid gap-4" :class="choiceOptions.length <= 2 ? 'grid-cols-2' : 'grid-cols-2 md:grid-cols-3'">
            <button
              v-for="(option, idx) in choiceOptions"
              :key="idx"
              @click.stop="selectChoice(option)"
              class="group relative rounded-2xl overflow-hidden bg-white/10 border-2 border-white/30 hover:border-white transition-all hover:scale-105 active:scale-95">
              <img
                v-if="option.image"
                :src="resolveOptionImage(option.image)"
                :alt="option.text"
                class="w-full aspect-[4/3] object-cover" />
              <div v-else class="w-full aspect-[4/3] bg-gradient-to-b from-primary/40 to-primary/20 flex items-center justify-center">
                <span class="text-6xl">{{ idx === 0 ? '🌊' : idx === 1 ? '🏠' : '🌲' }}</span>
              </div>
              <div class="p-4 text-center">
                <span class="text-white text-lg font-semibold">{{ option.text }}</span>
              </div>
            </button>
          </div>
        </div>

        <!-- Narration text overlay (bottom) -->
        <div v-if="state === 'narrating'" class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent p-6 pt-16">
          <p v-if="currentVoice" class="text-white/60 text-sm mb-1 uppercase tracking-wider">{{ currentVoice }}</p>
          <p class="text-white text-xl md:text-2xl leading-relaxed">{{ currentNarrationText }}</p>
          <p class="text-white/40 text-sm mt-3">Tap to continue</p>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useLessons } from '../composables/useLessons'
import { useAudio } from '../composables/useAudio'
import { useSettings } from '../composables/useSettings'

const router = useRouter()
const route = useRoute()
const emit = defineEmits(['update-title'])

const { loadAllLessonsForWorkshop, resolveWorkshopKey } = useLessons()
const { initializeAudio, cleanup, hasAudio, playSingleItem, readingQueue } = useAudio()
const { settings } = useSettings()

// State machine
const state = ref('loading') // loading | narrating | choosing

// Lesson data
const lessons = ref([])
const currentLesson = ref(null)
const currentSectionIndex = ref(0)
const currentExampleIndex = ref(0)
const imageLoaded = ref(false)
const audioReady = ref(false)

// Exit button
const exitProgress = ref(0)
let exitTimer = null
let exitInterval = null

const learning = computed(() => route.params.learning)
const workshop = computed(() => route.params.workshop)
const lessonNumber = computed(() => parseInt(route.params.number))

const currentSection = computed(() => {
  if (!currentLesson.value?.sections) return null
  return currentLesson.value.sections[currentSectionIndex.value] || null
})

const currentSectionImage = computed(() => {
  if (!currentSection.value?.image) return null
  return resolveSectionImage(currentSection.value.image)
})

const currentExample = computed(() => {
  if (!currentSection.value?.examples) return null
  return currentSection.value.examples[currentExampleIndex.value] || null
})

const currentNarrationText = computed(() => {
  return currentExample.value?.q || ''
})

const currentVoice = computed(() => {
  return currentExample.value?.voice || null
})

const choiceOptions = computed(() => {
  if (!currentExample.value) return []
  if (currentExample.value.type !== 'select' && currentExample.value.type !== 'multiple-choice') return []
  return currentExample.value.options || []
})

const audioSettings = computed(() => ({
  ...settings.value,
  readAnswers: false,
  hideLearnedExamples: false
}))

function resolveSectionImage(imagePath) {
  if (!imagePath) return null
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://') || imagePath.startsWith('/')) {
    return imagePath
  }
  const resolvedWorkshop = resolveWorkshopKey(learning.value, workshop.value)
  const lessonFilename = currentLesson.value?._filename || `${String(lessonNumber.value).padStart(2, '0')}-lesson`
  if (resolvedWorkshop?.startsWith('http')) {
    return `${resolvedWorkshop}/${lessonFilename}/${imagePath}`
  }
  return `${import.meta.env.BASE_URL}lessons/${learning.value}/${workshop.value}/${lessonFilename}/${imagePath}`
}

function resolveOptionImage(imagePath) {
  return resolveSectionImage(imagePath)
}

// Play audio for the current example (fire-and-forget, no auto-advance)
function playCurrentAudio() {
  if (!audioReady.value) return

  // Find the queue item matching current section/example
  const idx = readingQueue.value.findIndex(
    item => item.sectionIdx === currentSectionIndex.value &&
            item.exampleIdx === currentExampleIndex.value &&
            item.type === 'question'
  )
  if (idx !== -1) {
    playSingleItem(idx, audioSettings.value)
  }
}

// Load lesson and start narration
async function loadAndStart() {
  state.value = 'loading'
  imageLoaded.value = false
  audioReady.value = false

  // Load all lessons for the workshop
  if (lessons.value.length === 0) {
    lessons.value = await loadAllLessonsForWorkshop(learning.value, workshop.value)
  }

  // Find the requested lesson
  const lesson = lessons.value.find(l => l.number === lessonNumber.value)
  if (!lesson) {
    console.error('Lesson not found:', lessonNumber.value)
    goToOverview()
    return
  }

  currentLesson.value = lesson
  currentSectionIndex.value = 0
  currentExampleIndex.value = 0

  emit('update-title', lesson.title || '')

  // Initialize audio (preload files, but don't auto-play)
  cleanup()
  await initializeAudio(lesson, learning.value, workshop.value, audioSettings.value)
  audioReady.value = hasAudio.value

  // Show first narration item and play its audio
  showCurrentExample()
}

function showCurrentExample() {
  const example = currentExample.value
  if (!example) {
    // No more examples in this section, try next section
    advanceSection()
    return
  }

  // Skip input type examples
  if (example.type === 'input') {
    currentExampleIndex.value++
    showCurrentExample()
    return
  }

  // Check if this is a choice point
  if (example.type === 'select' || example.type === 'multiple-choice') {
    state.value = 'choosing'
    return
  }

  // Regular narration — show text and play this item's audio
  state.value = 'narrating'
  playCurrentAudio()
}

// Tap to advance to next example
function handleTap() {
  if (state.value !== 'narrating') return

  currentExampleIndex.value++
  showCurrentExample()
}

function advanceSection() {
  if (!currentLesson.value?.sections) return

  const nextSectionIdx = currentSectionIndex.value + 1
  if (nextSectionIdx < currentLesson.value.sections.length) {
    currentSectionIndex.value = nextSectionIdx
    currentExampleIndex.value = 0
    imageLoaded.value = false
    showCurrentExample()
  } else {
    // End of lesson — try next lesson
    advanceLesson()
  }
}

function advanceLesson() {
  const nextLesson = lessons.value.find(l => l.number === lessonNumber.value + 1)
  if (nextLesson) {
    router.replace({
      name: 'story-view',
      params: {
        learning: learning.value,
        workshop: workshop.value,
        number: nextLesson.number
      }
    })
  } else {
    // Story complete
    goToOverview()
  }
}

function selectChoice(option) {
  if (option.goto) {
    const targetLesson = option.goto.lesson
    const targetSection = option.goto.section || 0

    if (targetLesson && targetLesson !== lessonNumber.value) {
      router.replace({
        name: 'story-view',
        params: {
          learning: learning.value,
          workshop: workshop.value,
          number: targetLesson
        }
      })
    } else {
      currentSectionIndex.value = targetSection
      currentExampleIndex.value = 0
      imageLoaded.value = false
      showCurrentExample()
    }
  } else {
    currentExampleIndex.value++
    showCurrentExample()
  }
}

// Watch route changes to reload lesson
watch(() => route.params.number, (newNumber, oldNumber) => {
  if (newNumber && newNumber !== oldNumber) {
    loadAndStart()
  }
})

// Exit: press-and-hold 2s
function startExit() {
  exitProgress.value = 0
  const duration = 2000
  const interval = 50

  exitInterval = setInterval(() => {
    exitProgress.value = Math.min(1, exitProgress.value + (interval / duration))
  }, interval)

  exitTimer = setTimeout(() => {
    clearInterval(exitInterval)
    exitProgress.value = 0
    goToOverview()
  }, duration)
}

function cancelExit() {
  if (exitTimer) {
    clearTimeout(exitTimer)
    exitTimer = null
  }
  if (exitInterval) {
    clearInterval(exitInterval)
    exitInterval = null
  }
  exitProgress.value = 0
}

function goToOverview() {
  cleanup()
  router.push({
    name: 'lessons-overview',
    params: {
      learning: learning.value,
      workshop: workshop.value
    }
  })
}

onMounted(() => {
  loadAndStart()
})

onUnmounted(() => {
  cancelExit()
  cleanup()
})
</script>
