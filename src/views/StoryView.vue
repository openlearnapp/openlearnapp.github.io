<template>
  <div class="fixed inset-0 z-[100] flex flex-col story-bg" style="height: 100lvh">
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

    <!-- Scroll hint: up arrow at top (when playing, scroll up to pause) -->
    <div v-if="state === 'narrating' && !paused" class="absolute top-2 left-1/2 -translate-x-1/2 z-[110] pointer-events-none">
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="opacity-30"><polyline points="18 15 12 9 6 15"/></svg>
    </div>

    <!-- Scroll hint: down arrow at bottom (when paused, scroll down to play) -->
    <div v-if="state === 'narrating' && paused" class="absolute bottom-4 left-1/2 -translate-x-1/2 z-[110] pointer-events-none animate-bounce">
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="opacity-50"><polyline points="6 9 12 15 18 9"/></svg>
    </div>

    <!-- Loading state -->
    <div v-if="state === 'loading'" class="flex-1 flex items-center justify-center">
      <div class="text-white text-2xl animate-pulse">Loading story...</div>
    </div>

    <!-- Finished state -->
    <div v-else-if="state === 'finished'" class="flex-1 flex flex-col items-center justify-center gap-8 px-6">
      <div class="text-4xl">&#10024;</div>
      <div class="text-white text-2xl font-bold text-center">Story complete</div>
      <div class="flex flex-col gap-3 w-full max-w-xs">
        <button
          @click="restartFromBeginning"
          class="w-full px-6 py-3 rounded-xl bg-white/10 text-white text-lg font-medium hover:bg-white/20 transition">
          Restart from Lesson 1
        </button>
        <button
          @click="goToOverview"
          class="w-full px-6 py-3 rounded-xl bg-white/5 text-white/60 text-sm hover:bg-white/10 transition">
          Back to overview
        </button>
      </div>
    </div>

    <!-- Story content -->
    <template v-else>
      <div class="flex-1 relative overflow-hidden" @click="handleTap($event)">

        <!-- Assessment background -->
        <div v-if="isAssessmentState" class="absolute inset-0 story-bg" />
        <div v-if="isAssessmentState && currentSection?.title" class="absolute top-16 left-0 right-0 px-6 pointer-events-none z-[1]">
          <p class="text-amber-200/40 text-sm tracking-wider text-center font-serif">{{ currentSection.title }}</p>
        </div>

        <!-- Book page layout: all examples of current section on paginated pages -->
        <template v-if="!isAssessmentState">
          <!-- Intro: lesson title centered -->
          <div v-if="showingIntro" class="absolute inset-0 flex items-center justify-center p-6 pointer-events-none">
            <p class="story-text text-2xl md:text-3xl font-semibold text-center">{{ currentLesson?.title }}</p>
          </div>

          <!-- Book page -->
          <div v-else class="absolute inset-0 flex items-center justify-center p-4 md:p-8">
            <div class="book-page w-full max-w-2xl h-full max-h-[85vh] flex flex-col overflow-hidden">
              <!-- Section title -->
              <h2 class="text-amber-200/60 text-xs tracking-[0.2em] uppercase font-sans px-6 pt-5 pb-3 flex-shrink-0">
                {{ currentSection?.title }}
              </h2>

              <!-- Content area with float image -->
              <div class="flex-1 overflow-hidden px-6 pb-4 relative" ref="pageContentRef">
                <div class="h-full overflow-hidden">
                  <!-- All paragraphs for the visible page -->
                  <div ref="textFlowRef" class="story-text-flow">
                    <!-- Float image on first page -->
                    <img
                      v-if="displayImage && currentPage === 0"
                      :src="displayImage"
                      :alt="currentSection?.title || ''"
                      class="book-float-image transition-opacity duration-500"
                      :class="imageLoaded ? 'opacity-100' : 'opacity-0'"
                      @load="imageLoaded = true" />

                    <template v-for="(para, pIdx) in visibleParagraphs" :key="pIdx">
                      <!-- Story/narration paragraph -->
                      <p v-if="!para.hasAnswer" class="story-text text-lg md:text-xl leading-[1.9] mb-4"
                        :class="{ 'story-text-highlight': pIdx === highlightedParagraph }">
                        {{ para.q }}
                      </p>
                      <!-- Language example paragraph (q + a) -->
                      <div v-else class="mb-5">
                        <p class="story-text text-lg md:text-xl leading-[1.7] font-semibold">{{ para.q }}</p>
                        <p class="story-text text-base md:text-lg leading-[1.7] opacity-60 italic">{{ para.a }}</p>
                      </div>
                    </template>
                  </div>
                </div>
              </div>

              <!-- Page indicator + nav -->
              <div v-if="totalPages > 1" class="flex items-center justify-between px-6 py-3 flex-shrink-0 border-t border-amber-200/10">
                <button
                  @click.stop="prevPage"
                  :disabled="currentPage === 0"
                  class="text-amber-200/40 hover:text-amber-200/80 transition disabled:opacity-20 disabled:cursor-default px-2 py-1">
                  ← zurück
                </button>
                <span class="text-amber-200/30 text-sm font-sans">{{ currentPage + 1 }} / {{ totalPages }}</span>
                <button
                  @click.stop="nextPage"
                  :disabled="currentPage >= totalPages - 1"
                  class="text-amber-200/40 hover:text-amber-200/80 transition disabled:opacity-20 disabled:cursor-default px-2 py-1">
                  weiter →
                </button>
              </div>
            </div>
          </div>
        </template>

        <!-- Choice cards overlay (select/multiple-choice) -->
        <div v-if="state === 'choosing'" class="absolute inset-0 story-bg flex items-center justify-center p-6">
          <div class="flex flex-col items-center gap-6 max-w-2xl w-full">
            <p class="story-text text-xl md:text-2xl text-center leading-relaxed">{{ currentNarrationText }}</p>
            <p v-if="isMultiChoice" class="text-amber-200/50 text-sm font-sans">Select all correct answers</p>
            <div class="grid gap-4 w-full" :class="choiceOptions.length <= 2 ? 'grid-cols-2' : 'grid-cols-2 md:grid-cols-3'">
              <button
                v-for="(option, idx) in choiceOptions"
                :key="idx"
                @click.stop="selectChoice(option, idx)"
                @pointerenter="speakOption(option)"
                @pointerleave="stopSpeaking"
                :disabled="multiSelected.has(idx) || optionFeedback !== null"
                class="group relative rounded-2xl overflow-hidden border-2 transition-all active:scale-95"
                :class="getOptionClass(option, idx)">
                <img
                  v-if="option.image"
                  :src="resolveOptionImage(option.image)"
                  :alt="option.text"
                  class="w-full aspect-[4/3] object-cover" />
                <div v-else class="w-full aspect-[4/3] bg-gradient-to-b from-amber-900/30 to-amber-950/20 flex items-center justify-center">
                  <span class="text-6xl">{{ idx === 0 ? '🌊' : idx === 1 ? '🏠' : '🌲' }}</span>
                </div>
                <div class="p-4 text-center">
                  <span class="text-amber-50 text-lg font-semibold font-serif">{{ option.text }}</span>
                </div>
              </button>
            </div>
            <button
              v-if="optionFeedback === null && multiWrong === null"
              @click.stop="useHelp"
              class="mt-2 px-5 py-2 rounded-full bg-amber-200/10 border border-amber-200/20 text-amber-200/50 text-sm hover:bg-amber-200/20 hover:text-amber-200/80 transition-all">
              💡
            </button>
          </div>
        </div>

        <!-- Text input overlay -->
        <div v-if="state === 'input'" class="absolute inset-0 story-bg flex items-center justify-center p-6" @click.stop>
          <div class="flex flex-col items-center gap-6 max-w-lg w-full">
            <p class="story-text text-xl md:text-2xl text-center leading-relaxed">{{ currentNarrationText }}</p>
            <div v-if="!showingHelp" class="w-full relative">
              <input
                ref="inputRef"
                v-model="inputAnswer"
                @keydown.enter="submitInput"
                class="w-full px-6 py-4 text-xl rounded-2xl bg-amber-200/5 border-2 text-amber-50 placeholder-amber-200/30 focus:outline-none transition-colors font-serif"
                :class="inputFeedback === null ? 'border-amber-200/20 focus:border-amber-200/60' :
                         inputFeedback === true ? 'border-green-400 bg-green-500/20' :
                         'border-red-400 bg-red-500/20'"
                placeholder="Antwort eingeben..."
                autocomplete="off" />
            </div>
            <p v-if="showingHelp" class="text-amber-300 text-xl md:text-2xl text-center leading-relaxed font-serif">{{ helpAnswer }}</p>
            <div class="flex items-center gap-3">
              <button
                v-if="!showingHelp"
                @click.stop="submitInput"
                class="px-8 py-3 rounded-full bg-amber-200/10 border-2 border-amber-200/30 text-amber-50 text-lg font-semibold hover:bg-amber-200/20 transition-all active:scale-95 font-serif">
                OK
              </button>
              <button
                v-if="!showingHelp && inputFeedback === null"
                @click.stop="useHelp"
                class="px-5 py-3 rounded-full bg-amber-200/10 border border-amber-200/20 text-amber-200/50 text-sm hover:bg-amber-200/20 hover:text-amber-200/80 transition-all">
                💡
              </button>
            </div>
            <p v-if="inputFeedback === false" class="text-red-300 text-sm font-sans">Versuch es nochmal...</p>
          </div>
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
import { useAssessments } from '../composables/useAssessments'
import { useTextLayout } from '../composables/useTextLayout'

const router = useRouter()
const route = useRoute()
const emit = defineEmits(['update-title'])

const { loadAllLessonsForWorkshop, resolveWorkshopKey } = useLessons()
const { initializeAudio, cleanup, hasAudio, playSingleItem, readingQueue, currentAudio } = useAudio()
const { settings } = useSettings()
const { saveAnswer } = useAssessments()
const { getLayoutVariant } = useTextLayout()

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
const optionFeedback = ref(null) // index of last clicked option (single select), or null
const lastChoiceCorrect = ref(false)
const multiSelected = ref(new Set()) // indices selected in multi-choice
const multiWrong = ref(null) // index of wrong pick in multi-choice
const inputAnswer = ref('')
const inputFeedback = ref(null) // null = no feedback, true = correct, false = wrong
const inputRef = ref(null)
const showingHelp = ref(false)
const helpAnswer = ref('')

// Exit button
const exitProgress = ref(0)
let exitTimer = null
let exitInterval = null

// Scroll play/pause state
let savedBodyOverflow = ''
let savedBodyHeight = ''

const learning = computed(() => route.params.learning)
const workshop = computed(() => route.params.workshop)
const lessonNumber = computed(() => parseInt(route.params.number))

const isAssessmentState = computed(() => state.value === 'choosing' || state.value === 'input')

const currentSection = computed(() => {
  if (!currentLesson.value?.sections) return null
  return currentLesson.value.sections[currentSectionIndex.value] || null
})

const currentSectionImage = computed(() => {
  if (!currentSection.value?.image) return null
  return resolveSectionImage(currentSection.value.image)
})

// Lesson-level image for intro
const currentLessonImage = computed(() => {
  if (!currentLesson.value?.image) return null
  return resolveLessonImage(currentLesson.value.image)
})

// Show lesson image during intro, section image otherwise
const showingIntro = ref(false)
const displayImage = computed(() => {
  if (showingIntro.value && currentLessonImage.value) return currentLessonImage.value
  return currentSectionImage.value
})

const currentExample = computed(() => {
  if (!currentSection.value?.examples) return null
  return currentSection.value.examples[currentExampleIndex.value] || null
})

const currentNarrationText = computed(() => {
  return currentExample.value?.q || ''
})

// Book pagination state
const currentPage = ref(0)
const pageContentRef = ref(null)
const textFlowRef = ref(null)
const PARAGRAPHS_PER_PAGE = 5 // base estimate, adjusted by content length

// All narration paragraphs of the current section (skip assessments)
const sectionParagraphs = computed(() => {
  if (!currentSection.value?.examples) return []
  return currentSection.value.examples
    .filter(ex => !ex.type || ex.type === 'qa')
    .map(ex => ({
      q: ex.q,
      a: ex.a || null,
      hasAnswer: !!ex.a,
      voice: ex.voice || null
    }))
})

// How many paragraphs fit per page (rough: shorter = more, longer = fewer)
const paragraphsPerPage = computed(() => {
  const paras = sectionParagraphs.value
  if (paras.length === 0) return 1
  const avgLen = paras.reduce((sum, p) => sum + (p.q?.length || 0), 0) / paras.length
  if (avgLen > 150) return 3
  if (avgLen > 80) return 4
  return PARAGRAPHS_PER_PAGE
})

const totalPages = computed(() => {
  return Math.max(1, Math.ceil(sectionParagraphs.value.length / paragraphsPerPage.value))
})

const visibleParagraphs = computed(() => {
  const start = currentPage.value * paragraphsPerPage.value
  return sectionParagraphs.value.slice(start, start + paragraphsPerPage.value)
})

// Which paragraph is currently being read (for audio highlight)
const highlightedParagraph = computed(() => {
  if (state.value !== 'narrating' || paused.value) return -1
  const globalIdx = currentExampleIndex.value
  const pageStart = currentPage.value * paragraphsPerPage.value
  const localIdx = globalIdx - pageStart
  if (localIdx >= 0 && localIdx < paragraphsPerPage.value) return localIdx
  return -1
})

function nextPage() {
  if (currentPage.value < totalPages.value - 1) {
    currentPage.value++
  }
}

function prevPage() {
  if (currentPage.value > 0) {
    currentPage.value--
  }
}

const currentVoice = computed(() => {
  return currentExample.value?.voice || null
})

const choiceOptions = computed(() => {
  if (!currentExample.value) return []
  if (currentExample.value.type !== 'select' && currentExample.value.type !== 'multiple-choice') return []
  return currentExample.value.options || []
})

const isMultiChoice = computed(() => {
  return currentExample.value?.type === 'multiple-choice'
})

const audioSettings = computed(() => ({
  ...settings.value,
  readAnswers: false,
  hideLearnedExamples: false
}))

function resolveStoryAssetPath(imagePath, lesson) {
  if (!imagePath) return null
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://') || imagePath.startsWith('/')) {
    return imagePath
  }
  const baseUrl = import.meta.env.BASE_URL
  const effectiveLesson = lesson || currentLesson.value
  if (effectiveLesson?._source?.type === 'url') {
    return `${effectiveLesson._source.path}/${imagePath}`
  }
  const lessonFilename = effectiveLesson?._filename || `${String(lessonNumber.value).padStart(2, '0')}-lesson`
  const resolvedWorkshop = resolveWorkshopKey(learning.value, workshop.value)
  if (resolvedWorkshop !== workshop.value) {
    return `${baseUrl}${resolvedWorkshop}/${lessonFilename}/${imagePath}`
  }
  return `${baseUrl}lessons/${learning.value}/${workshop.value}/${lessonFilename}/${imagePath}`
}

function resolveSectionImage(imagePath) {
  return resolveStoryAssetPath(imagePath)
}

function resolveLessonImage(imagePath) {
  return resolveStoryAssetPath(imagePath)
}

function getAudioBase() {
  const lesson = currentLesson.value
  if (!lesson) return ''
  const lessonFilename = lesson._filename || `${String(lessonNumber.value).padStart(2, '0')}-lesson`
  if (lesson._source?.type === 'url') {
    return `${lesson._source.path}/audio`
  }
  const resolvedWorkshop = resolveWorkshopKey(learning.value, workshop.value)
  if (resolvedWorkshop !== workshop.value) {
    return `${import.meta.env.BASE_URL}${resolvedWorkshop}/${lessonFilename}/audio`
  }
  return `${import.meta.env.BASE_URL}lessons/${learning.value}/${workshop.value}/${lessonFilename}/audio`
}

function resolveOptionImage(imagePath) {
  return resolveSectionImage(imagePath)
}

// Speak option text on hover — try pre-recorded audio, fallback to SpeechSynthesis
function speakOption(option) {
  if (!option.text) return
  // Don't play option audio while question audio is still playing
  if (currentAudio.value && !currentAudio.value.paused) return
  stopSpeaking()

  // Try pre-recorded option audio
  const example = currentExample.value
  if (example && audioReady.value) {
    const optIdx = (example.options || []).indexOf(option)
    if (optIdx !== -1) {
      const audioBase = getAudioBase()
      const audioUrl = `${audioBase}/${currentSectionIndex.value}-${currentExampleIndex.value}-opt${optIdx}.mp3`
      const audio = new Audio(audioUrl)
      audio.playbackRate = audioSettings.value.audioSpeed || 1.0
      audio.play().then(() => {
        currentOptionAudio = audio
        return
      }).catch(() => {
        // Fall through to TTS
        speakWithTTS(option.text)
      })
      return
    }
  }

  speakWithTTS(option.text)
}

function speakWithTTS(text) {
  if (!('speechSynthesis' in window)) return
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = 'de-DE'
  utterance.rate = 0.9
  speechSynthesis.speak(utterance)
}

let currentOptionAudio = null

function stopSpeaking() {
  if ('speechSynthesis' in window) {
    speechSynthesis.cancel()
  }
  if (currentOptionAudio) {
    currentOptionAudio.pause()
    currentOptionAudio = null
  }
}

// Navigate to a goto target
async function navigateGoto(goto) {
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
  } else {
    const sectionChanged = targetSection !== currentSectionIndex.value
    currentSectionIndex.value = targetSection
    currentExampleIndex.value = 0
    currentPage.value = 0
    imageLoaded.value = false
    if (sectionChanged) {
      await playSectionIntro()
    }
    showCurrentExample()
  }
}

// Play audio for current example, auto-advance when done
async function playCurrentAudio() {
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
    try {
      await playSingleItem(idx, audioSettings.value, () => {
        if (!paused.value) {
          scheduleAutoAdvance(800)
        }
      })
    } catch {
      // Browser blocked autoplay — auto-advance anyway if we were playing
      if (!paused.value) {
        scheduleAutoAdvance(2000)
      }
    }
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
  currentPage.value = 0

  emit('update-title', lesson.title || '')

  cleanup()
  await initializeAudio(lesson, learning.value, workshop.value, audioSettings.value)
  audioReady.value = hasAudio.value

  // Intro sequence: show lesson image, read lesson title, then section title, then examples
  await playIntroSequence()
}

async function playIntroSequence() {
  const lesson = currentLesson.value
  if (!lesson) return

  // Show lesson image during intro
  showingIntro.value = true
  state.value = 'narrating'

  // Read lesson title (pre-recorded audio with TTS fallback)
  if (lesson.title) {
    await playAudioWithFallback('lesson-title', lesson.title)
    await delay(500)
  }

  // Transition to section image and read section title
  const introImage = displayImage.value
  showingIntro.value = false
  // Only reset imageLoaded if the image URL actually changed
  if (displayImage.value !== introImage) {
    imageLoaded.value = false
  }

  const section = currentSection.value
  if (section?.title) {
    await delay(300)
    await playAudioWithFallback('section-title', section.title)
    await delay(400)
  }

  // Now start the normal example flow
  showCurrentExample()
}

// Play pre-recorded audio from the reading queue, fall back to SpeechSynthesis
async function playAudioWithFallback(type, text) {
  if (!text) return

  // Try pre-recorded audio first
  if (audioReady.value) {
    const idx = readingQueue.value.findIndex(item => item.type === type && item.text === text)
    if (idx !== -1) {
      try {
        await new Promise((resolve, reject) => {
          playSingleItem(idx, audioSettings.value, resolve).catch(reject)
        })
        return
      } catch {
        // Fall through to TTS
      }
    }
  }

  // Fallback: SpeechSynthesis
  await speakText(text)
}

function speakText(text) {
  if (!('speechSynthesis' in window)) return Promise.resolve()
  return new Promise((resolve) => {
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'de-DE'
    utterance.rate = 0.9
    utterance.onend = resolve
    utterance.onerror = resolve
    speechSynthesis.speak(utterance)
  })
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function showCurrentExample() {
  const example = currentExample.value
  if (!example) {
    advanceSection()
    return
  }

  stopSpeaking()

  // Reset assessment state
  optionFeedback.value = null
  lastChoiceCorrect.value = false
  multiSelected.value = new Set()
  multiWrong.value = null
  inputAnswer.value = ''
  inputFeedback.value = null
  showingHelp.value = false
  helpAnswer.value = ''

  if (example.type === 'input') {
    // Show text input (with answers array + goto_wrong support)
    state.value = 'input'
    clearAutoAdvance()
    playCurrentAudio()
    nextTick(() => { inputRef.value?.focus() })
    return
  }

  if (example.type === 'select' || example.type === 'multiple-choice') {
    state.value = 'choosing'
    clearAutoAdvance()
    playCurrentAudio()
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

// Tap left side to go back, right side to advance — works while paused too
function handleTap(e) {
  const rect = e.currentTarget.getBoundingClientRect()
  const clickX = e.clientX - rect.left
  const isLeftSide = clickX < rect.width / 2

  // In assessment states, only allow going back via left tap
  if (state.value === 'choosing' || state.value === 'input') {
    if (isLeftSide && currentExampleIndex.value > 0) {
      currentExampleIndex.value--
      showCurrentExample()
    }
    return
  }

  if (state.value !== 'narrating') return

  clearAutoAdvance()

  if (isLeftSide) {
    // Go back: previous page, or previous example if on first page
    if (currentPage.value > 0) {
      prevPage()
    } else if (currentExampleIndex.value > 0) {
      currentExampleIndex.value--
      showCurrentExample()
    }
  } else {
    // Advance: next page first, then advance to next section/assessment
    if (currentPage.value < totalPages.value - 1) {
      nextPage()
    } else {
      advanceExample()
    }
  }
}

// Explicit pause / play (no toggle — direction-bound)
function pausePlayback() {
  if (!paused.value) {
    paused.value = true
    clearAutoAdvance()
    if (currentAudio.value) {
      currentAudio.value.pause()
    }
    scrollToTop()
  }
}

function resumePlayback() {
  if (paused.value) {
    paused.value = false
    playCurrentAudio()
    scrollToBottom()
  }
}

function togglePause() {
  if (paused.value) resumePlayback()
  else pausePlayback()
}

// Scroll position sync
let isAutoScrolling = false
function scrollToTop() {
  isAutoScrolling = true
  window.scrollTo({ top: 0, behavior: 'smooth' })
  setTimeout(() => { isAutoScrolling = false }, 500)
}

function scrollToBottom() {
  isAutoScrolling = true
  window.scrollTo({ top: 100, behavior: 'smooth' })
  setTimeout(() => { isAutoScrolling = false }, 500)
}

// Scroll-based play/pause: direction-bound, snapped to two positions only
// Scroll down → play, Scroll up → pause
let lastScrollY = window.scrollY || 0
let snapTimer = null
function handleScroll() {
  if (isAutoScrolling) return
  if (state.value !== 'narrating') return

  const scrollY = window.scrollY
  const delta = scrollY - lastScrollY
  lastScrollY = scrollY

  if (delta > 5 && paused.value) {
    resumePlayback()
  } else if (delta < -5 && !paused.value) {
    pausePlayback()
  } else {
    // Snap to nearest locked position after scroll settles
    if (snapTimer) clearTimeout(snapTimer)
    snapTimer = setTimeout(() => {
      if (paused.value) scrollToTop()
      else scrollToBottom()
    }, 150)
  }
}

// Enable body scroll for iOS URL bar collapse
function enableBodyScroll() {
  savedBodyOverflow = document.body.style.overflow
  savedBodyHeight = document.body.style.height
  document.body.style.overflow = 'auto'
  document.body.style.height = '200lvh'
  // Start scrolled down slightly (playing state)
  nextTick(() => {
    window.scrollTo(0, 100)
    lastScrollY = 100
  })
}

function restoreBodyScroll() {
  document.body.style.overflow = savedBodyOverflow
  document.body.style.height = savedBodyHeight
  window.scrollTo(0, 0)
}

// Keyboard controls
function handleKeydown(e) {
  if (e.code === 'Escape' && !e.repeat) {
    e.preventDefault()
    startExit()
    return
  }
  if (e.code !== 'Space') return
  const tag = e.target.tagName
  if (tag === 'INPUT' || tag === 'TEXTAREA' || e.target.isContentEditable) return
  e.preventDefault()
  if (state.value === 'narrating') {
    togglePause()
  }
}

function handleKeyup(e) {
  if (e.code === 'Escape') {
    cancelExit()
  }
}

// Get CSS class for an option button
function getOptionClass(option, idx) {
  // Multi-choice: show selected correct in green, wrong in red
  if (isMultiChoice.value) {
    if (multiWrong.value === idx) return 'bg-red-500/30 border-red-400'
    if (multiSelected.value.has(idx)) return 'bg-green-500/30 border-green-400'
    if (multiWrong.value !== null) return 'bg-white/10 border-white/20 opacity-50'
    return 'bg-white/10 border-white/30 hover:border-white hover:scale-105'
  }
  // Single select
  if (optionFeedback.value === null) return 'bg-white/10 border-white/30 hover:border-white hover:scale-105'
  if (optionFeedback.value === idx && lastChoiceCorrect.value) return 'bg-green-500/30 border-green-400'
  if (optionFeedback.value === idx && !lastChoiceCorrect.value) return 'bg-red-500/30 border-red-400'
  return 'bg-white/10 border-white/20 opacity-50'
}

// Select choice handler
function selectChoice(option, idx) {
  clearAutoAdvance()
  const example = currentExample.value

  // If option has its own goto (pure branching, no correct/wrong)
  if (option.goto && !example.goto_correct && !example.goto_wrong) {
    navigateGoto(option.goto)
    return
  }

  // Multiple-choice: accumulate correct picks, fail on wrong
  if (isMultiChoice.value) {
    if (multiSelected.value.has(idx) || multiWrong.value !== null) return

    if (option.correct) {
      const newSet = new Set(multiSelected.value)
      newSet.add(idx)
      multiSelected.value = newSet

      // Check if all correct options have been selected
      const totalCorrect = choiceOptions.value.filter(o => o.correct).length
      if (newSet.size >= totalCorrect) {
        // All correct selected — navigate after brief delay
        setTimeout(() => {
          navigateGoto(example.goto_correct)
        }, 800)
      }
    } else {
      // Wrong pick — show red, then navigate to goto_wrong
      multiWrong.value = idx
      setTimeout(() => {
        navigateGoto(example.goto_wrong)
      }, 1200)
    }
    return
  }

  // Single select: check correct/wrong
  if (optionFeedback.value !== null) return
  const isCorrect = !!option.correct
  optionFeedback.value = idx
  lastChoiceCorrect.value = isCorrect

  setTimeout(() => {
    optionFeedback.value = null
    if (isCorrect) {
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

// Help button: show correct answer and advance
function useHelp() {
  const example = currentExample.value
  if (!example) return

  // Record as helped in stats
  saveAnswer(learning.value, workshop.value, lessonNumber.value,
    currentSectionIndex.value, currentExampleIndex.value,
    { answer: '💡 help', correct: false, helped: true })

  if (example.type === 'input') {
    // Show the correct answer text
    const answer = example.answers?.[0]?.text || example.a || ''
    helpAnswer.value = answer
    showingHelp.value = true

    // Navigate after showing the answer
    setTimeout(() => {
      navigateGoto(example.goto_correct)
    }, 2000)
    return
  }

  if (example.type === 'select' || example.type === 'multiple-choice') {
    // Highlight the correct option(s) and advance
    const correctIdx = (example.options || []).findIndex(o => o.correct)
    if (correctIdx !== -1) {
      optionFeedback.value = correctIdx
      lastChoiceCorrect.value = true
    }

    setTimeout(() => {
      optionFeedback.value = null
      navigateGoto(example.goto_correct)
    }, 1500)
  }
}

async function playSectionIntro() {
  const section = currentSection.value
  if (section?.title) {
    state.value = 'narrating'
    await delay(300)
    await playAudioWithFallback('section-title', section.title)
    await delay(400)
  }
}

async function advanceSection() {
  if (!currentLesson.value?.sections) return
  const nextSectionIdx = currentSectionIndex.value + 1
  if (nextSectionIdx < currentLesson.value.sections.length) {
    currentSectionIndex.value = nextSectionIdx
    currentExampleIndex.value = 0
    currentPage.value = 0
    imageLoaded.value = false
    await playSectionIntro()
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
    // Story complete — stay in story mode, show finished screen
    clearAutoAdvance()
    stopSpeaking()
    state.value = 'finished'
    restoreBodyScroll()
  }
}

function restartFromBeginning() {
  const firstLesson = lessons.value.reduce((min, l) => l.number < min.number ? l : min, lessons.value[0])
  if (firstLesson) {
    router.replace({
      name: 'story-view',
      params: { learning: learning.value, workshop: workshop.value, number: firstLesson.number }
    })
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
  stopSpeaking()
  cleanup()
  router.push({
    name: 'lessons-overview',
    params: { learning: learning.value, workshop: workshop.value }
  })
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
  document.addEventListener('keyup', handleKeyup)
  window.addEventListener('scroll', handleScroll, { passive: true })
  enableBodyScroll()
  loadAndStart()
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
  document.removeEventListener('keyup', handleKeyup)
  window.removeEventListener('scroll', handleScroll)
  restoreBodyScroll()
  clearAutoAdvance()
  cancelExit()
  cleanup()
})
</script>

<style scoped>
.story-bg {
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
}

.story-text {
  font-family: Georgia, 'Times New Roman', serif;
  color: #f5e6d3;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
}

.book-page {
  background: rgba(20, 20, 40, 0.85);
  border: 1px solid rgba(245, 230, 211, 0.08);
  border-radius: 1rem;
  box-shadow: 0 8px 40px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(245, 230, 211, 0.05);
}

.book-float-image {
  float: left;
  width: 45%;
  max-height: 40vh;
  object-fit: contain;
  margin: 0 1rem 0.75rem 0;
  border-radius: 0.5rem;
}

@media (max-width: 640px) {
  .book-float-image {
    width: 40%;
    max-height: 30vh;
  }
}

.story-text-flow {
  font-family: Georgia, 'Times New Roman', serif;
  color: #f5e6d3;
}

.story-text-highlight {
  color: #fde68a;
  transition: color 0.3s ease;
}
</style>
