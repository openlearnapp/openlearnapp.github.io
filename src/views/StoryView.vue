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
      <svg v-if="exitProgress > 0" class="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 56 56">
        <circle cx="28" cy="28" r="24" fill="none" stroke="white" stroke-width="3"
          :stroke-dasharray="`${exitProgress * 150.8} 150.8`"
          stroke-linecap="round" />
      </svg>
    </button>

    <!-- Play/Pause button (top-right) -->
    <button
      v-if="state === 'narrating'"
      @click.stop="togglePause"
      class="absolute z-[110] w-14 h-14 rounded-full bg-black/50 text-white flex items-center justify-center transition-all hover:bg-black/70 top-4 right-4"
      :class="paused ? 'ring-2 ring-white/60' : ''"
      :title="paused ? 'Play' : 'Pause'"
      :aria-label="paused ? 'Play' : 'Pause'">
      <svg v-if="!paused" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="white">
        <rect x="6" y="4" width="4" height="16" rx="1" /><rect x="14" y="4" width="4" height="16" rx="1" />
      </svg>
      <svg v-else xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="white">
        <polygon points="6,4 20,12 6,20" />
      </svg>
    </button>

    <!-- Loading state -->
    <div v-if="state === 'loading'" class="flex-1 flex items-center justify-center">
      <div class="text-white text-2xl animate-pulse">Loading story...</div>
    </div>

    <!-- Story content -->
    <template v-else>
      <div class="flex-1 relative overflow-hidden" @click="handleTap">
        <!-- Section image -->
        <img
          v-if="currentSectionImage"
          :src="currentSectionImage"
          :alt="currentSection?.title || ''"
          class="absolute inset-0 w-full h-full object-cover transition-opacity duration-700"
          :class="imageLoaded ? 'opacity-100' : 'opacity-0'"
          @load="imageLoaded = true" />
        <div v-else class="absolute inset-0 bg-gradient-to-b from-gray-900 to-black" />

        <!-- Choice cards overlay (select/multiple-choice) -->
        <div v-if="state === 'choosing'" class="absolute inset-0 bg-black/60 flex items-center justify-center p-6">
          <div class="flex flex-col items-center gap-6 max-w-2xl w-full">
            <!-- Question text -->
            <p class="text-white text-xl md:text-2xl text-center leading-relaxed">{{ currentNarrationText }}</p>
            <!-- Options -->
            <div class="grid gap-4 w-full" :class="choiceOptions.length <= 2 ? 'grid-cols-2' : 'grid-cols-2 md:grid-cols-3'">
              <button
                v-for="(option, idx) in choiceOptions"
                :key="idx"
                @click.stop="selectChoice(option)"
                class="group relative rounded-2xl overflow-hidden border-2 transition-all hover:scale-105 active:scale-95"
                :class="optionFeedback === null ? 'bg-white/10 border-white/30 hover:border-white' :
                         optionFeedback === idx && lastChoiceCorrect ? 'bg-green-500/30 border-green-400' :
                         optionFeedback === idx && !lastChoiceCorrect ? 'bg-red-500/30 border-red-400' :
                         'bg-white/10 border-white/20 opacity-50'">
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
        </div>

        <!-- Text input overlay -->
        <div v-if="state === 'input'" class="absolute inset-0 bg-black/60 flex items-center justify-center p-6" @click.stop>
          <div class="flex flex-col items-center gap-6 max-w-lg w-full">
            <p class="text-white text-xl md:text-2xl text-center leading-relaxed">{{ currentNarrationText }}</p>
            <div class="w-full relative">
              <input
                ref="inputRef"
                v-model="inputAnswer"
                @keydown.enter="submitInput"
                class="w-full px-6 py-4 text-xl rounded-2xl bg-white/10 border-2 text-white placeholder-white/40 focus:outline-none transition-colors"
                :class="inputFeedback === null ? 'border-white/30 focus:border-white' :
                         inputFeedback === true ? 'border-green-400 bg-green-500/20' :
                         'border-red-400 bg-red-500/20'"
                placeholder="Antwort eingeben..."
                autocomplete="off" />
            </div>
            <button
              @click.stop="submitInput"
              class="px-8 py-3 rounded-full bg-white/20 border-2 border-white/40 text-white text-lg font-semibold hover:bg-white/30 transition-all active:scale-95">
              OK
            </button>
            <p v-if="inputFeedback === false" class="text-red-300 text-sm">Versuch es nochmal...</p>
          </div>
        </div>

        <!-- Paused overlay -->
        <div v-if="paused" class="absolute inset-0 bg-black/40 flex items-center justify-center pointer-events-none">
          <div class="text-white/60 text-lg">Paused</div>
        </div>

        <!-- Narration text overlay (bottom) -->
        <div v-if="state === 'narrating'" class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent p-6 pt-16">
          <p v-if="currentVoice" class="text-white/60 text-sm mb-1 uppercase tracking-wider">{{ currentVoice }}</p>
          <p class="text-white text-xl md:text-2xl leading-relaxed">{{ currentNarrationText }}</p>
          <p v-if="!paused" class="text-white/40 text-sm mt-3">Tap to skip</p>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useLessons } from '../composables/useLessons'
import { useAudio } from '../composables/useAudio'
import { useSettings } from '../composables/useSettings'

const router = useRouter()
const route = useRoute()
const emit = defineEmits(['update-title'])

const { loadAllLessonsForWorkshop, resolveWorkshopKey } = useLessons()
const { initializeAudio, cleanup, hasAudio, playSingleItem, readingQueue, currentAudio } = useAudio()
const { settings } = useSettings()

// State machine: loading | narrating | choosing | input
const state = ref('loading')
const paused = ref(false)

// Lesson data
const lessons = ref([])
const currentLesson = ref(null)
const currentSectionIndex = ref(0)
const currentExampleIndex = ref(0)
const imageLoaded = ref(false)
const audioReady = ref(false)

// Assessment state
const optionFeedback = ref(null) // index of last clicked option, or null
const lastChoiceCorrect = ref(false)
const inputAnswer = ref('')
const inputFeedback = ref(null) // null = no feedback, true = correct, false = wrong
const inputRef = ref(null)

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

// Navigate to a goto target
function navigateGoto(goto) {
  if (!goto) {
    advanceExample()
    return
  }
  clearAutoAdvance()
  const targetLesson = goto.lesson
  const targetSection = goto.section || 0

  if (targetLesson && targetLesson !== lessonNumber.value) {
    router.replace({
      name: 'story-view',
      params: { learning: learning.value, workshop: workshop.value, number: targetLesson }
    })
  } else if (targetLesson) {
    currentSectionIndex.value = targetSection
    currentExampleIndex.value = 0
    imageLoaded.value = false
    showCurrentExample()
  } else {
    // goto has only section
    currentSectionIndex.value = targetSection
    currentExampleIndex.value = 0
    imageLoaded.value = false
    showCurrentExample()
  }
}

// Play audio for current example, auto-advance when done
function playCurrentAudio() {
  if (!audioReady.value) {
    scheduleAutoAdvance(2000)
    return
  }

  const idx = readingQueue.value.findIndex(
    item => item.sectionIdx === currentSectionIndex.value &&
            item.exampleIdx === currentExampleIndex.value &&
            item.type === 'question'
  )
  if (idx !== -1) {
    playSingleItem(idx, audioSettings.value, () => {
      if (!paused.value) {
        scheduleAutoAdvance(800)
      }
    })
  } else {
    scheduleAutoAdvance(2000)
  }
}

let autoAdvanceTimer = null

function scheduleAutoAdvance(delay) {
  clearAutoAdvance()
  autoAdvanceTimer = setTimeout(() => {
    if (!paused.value && state.value === 'narrating') {
      advanceExample()
    }
  }, delay)
}

function clearAutoAdvance() {
  if (autoAdvanceTimer) {
    clearTimeout(autoAdvanceTimer)
    autoAdvanceTimer = null
  }
}

// Load lesson and start
async function loadAndStart() {
  state.value = 'loading'
  imageLoaded.value = false
  audioReady.value = false
  paused.value = false

  if (lessons.value.length === 0) {
    lessons.value = await loadAllLessonsForWorkshop(learning.value, workshop.value)
  }

  const lesson = lessons.value.find(l => l.number === lessonNumber.value)
  if (!lesson) {
    goToOverview()
    return
  }

  currentLesson.value = lesson
  currentSectionIndex.value = 0
  currentExampleIndex.value = 0

  emit('update-title', lesson.title || '')

  cleanup()
  await initializeAudio(lesson, learning.value, workshop.value, audioSettings.value)
  audioReady.value = hasAudio.value

  showCurrentExample()
}

function showCurrentExample() {
  const example = currentExample.value
  if (!example) {
    advanceSection()
    return
  }

  // Reset assessment state
  optionFeedback.value = null
  lastChoiceCorrect.value = false
  inputAnswer.value = ''
  inputFeedback.value = null

  if (example.type === 'input') {
    // Show text input (with answers array + goto_wrong support)
    state.value = 'input'
    clearAutoAdvance()
    nextTick(() => { inputRef.value?.focus() })
    return
  }

  if (example.type === 'select' || example.type === 'multiple-choice') {
    state.value = 'choosing'
    clearAutoAdvance()
    return
  }

  // Default: narration
  state.value = 'narrating'
  if (!paused.value) {
    playCurrentAudio()
  }
}

function advanceExample() {
  currentExampleIndex.value++
  showCurrentExample()
}

// Tap to skip narration
function handleTap() {
  if (state.value !== 'narrating') return
  if (paused.value) return
  clearAutoAdvance()
  advanceExample()
}

// Toggle pause
function togglePause() {
  paused.value = !paused.value
  if (paused.value) {
    clearAutoAdvance()
    if (currentAudio.value) {
      currentAudio.value.pause()
    }
  } else {
    playCurrentAudio()
  }
}

// Spacebar
function handleKeydown(e) {
  if (e.code !== 'Space') return
  const tag = e.target.tagName
  if (tag === 'INPUT' || tag === 'TEXTAREA' || e.target.isContentEditable) return
  e.preventDefault()
  if (state.value === 'narrating') {
    togglePause()
  }
}

// Select choice handler — supports per-option goto AND goto_correct/goto_wrong
function selectChoice(option) {
  if (optionFeedback.value !== null) return // already processing feedback
  clearAutoAdvance()

  const example = currentExample.value
  const idx = choiceOptions.value.indexOf(option)

  // If option has its own goto (pure branching, no correct/wrong)
  if (option.goto && !example.goto_correct && !example.goto_wrong) {
    navigateGoto(option.goto)
    return
  }

  // Assessment mode: check correct/wrong
  const isCorrect = !!option.correct
  optionFeedback.value = idx
  lastChoiceCorrect.value = isCorrect

  // Show feedback briefly, then navigate
  setTimeout(() => {
    optionFeedback.value = null
    if (isCorrect) {
      // Option's own goto takes priority, then example's goto_correct, then advance
      navigateGoto(option.goto || example.goto_correct)
    } else {
      navigateGoto(option.goto || example.goto_wrong)
    }
  }, 1200)
}

// Submit text input answer
function submitInput() {
  const answer = inputAnswer.value.trim()
  if (!answer) return

  const example = currentExample.value
  if (!example) return

  // Check against answers array
  const answers = example.answers || []
  const match = answers.find(a =>
    a.text.toLowerCase() === answer.toLowerCase()
  )

  if (match) {
    inputFeedback.value = true
    setTimeout(() => {
      inputFeedback.value = null
      navigateGoto(match.goto || example.goto_correct)
    }, 1000)
  } else {
    // Check legacy single answer (a field)
    if (example.a && example.a.toLowerCase() === answer.toLowerCase()) {
      inputFeedback.value = true
      setTimeout(() => {
        inputFeedback.value = null
        navigateGoto(example.goto_correct)
      }, 1000)
    } else {
      // Wrong answer
      inputFeedback.value = false
      if (example.goto_wrong) {
        setTimeout(() => {
          inputFeedback.value = null
          navigateGoto(example.goto_wrong)
        }, 1500)
      } else {
        // No goto_wrong — let user retry
        setTimeout(() => {
          inputFeedback.value = null
          inputAnswer.value = ''
          inputRef.value?.focus()
        }, 1500)
      }
    }
  }
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
    advanceLesson()
  }
}

function advanceLesson() {
  const nextLesson = lessons.value.find(l => l.number === lessonNumber.value + 1)
  if (nextLesson) {
    router.replace({
      name: 'story-view',
      params: { learning: learning.value, workshop: workshop.value, number: nextLesson.number }
    })
  } else {
    goToOverview()
  }
}

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
  if (exitTimer) { clearTimeout(exitTimer); exitTimer = null }
  if (exitInterval) { clearInterval(exitInterval); exitInterval = null }
  exitProgress.value = 0
}

function goToOverview() {
  clearAutoAdvance()
  cleanup()
  router.push({
    name: 'lessons-overview',
    params: { learning: learning.value, workshop: workshop.value }
  })
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
  loadAndStart()
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
  clearAutoAdvance()
  cancelExit()
  cleanup()
})
</script>
