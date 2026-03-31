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

        <!-- Atmospheric background layer -->
        <div class="absolute inset-0 pointer-events-none z-0" :class="`scene-bg scene-${sceneType}`">
          <!-- Floating particles -->
          <div v-for="n in 20" :key="n"
            class="particle"
            :class="`particle-${sceneType}`"
            :style="particleStyle(n)" />
          <!-- Scene-specific decorations -->
          <svg v-if="sceneType === 'forest'" class="scene-deco scene-deco-trees" viewBox="0 0 800 200" preserveAspectRatio="none">
            <path d="M0,200 Q100,120 200,180 Q300,100 400,160 Q500,80 600,150 Q700,110 800,180 L800,200Z" fill="rgba(34,80,50,0.15)" class="tree-wave" />
            <path d="M0,200 Q150,140 300,190 Q450,130 600,170 Q750,120 800,190 L800,200Z" fill="rgba(34,80,50,0.08)" class="tree-wave-2" />
          </svg>
          <svg v-if="sceneType === 'water'" class="scene-deco scene-deco-waves" viewBox="0 0 800 100" preserveAspectRatio="none">
            <path d="M0,50 Q100,20 200,50 Q300,80 400,50 Q500,20 600,50 Q700,80 800,50 L800,100 L0,100Z" fill="rgba(56,120,180,0.08)" class="water-wave" />
            <path d="M0,60 Q100,30 200,60 Q300,90 400,60 Q500,30 600,60 Q700,90 800,60 L800,100 L0,100Z" fill="rgba(56,120,180,0.05)" class="water-wave-2" />
          </svg>
          <div v-if="sceneType === 'house'" class="scene-deco scene-deco-glow" />
        </div>

        <!-- Assessment background -->
        <div v-if="isAssessmentState && currentSection?.title" class="absolute top-16 left-0 right-0 px-6 pointer-events-none z-[1]">
          <p class="text-amber-200/40 text-sm tracking-wider text-center font-serif">{{ currentSection.title }}</p>
        </div>

        <!-- Book page layout -->
        <template v-if="!isAssessmentState">
          <!-- Intro: lesson title with dramatic entrance -->
          <div v-if="showingIntro" class="absolute inset-0 flex items-center justify-center p-6 pointer-events-none">
            <div class="intro-title">
              <p class="story-text text-3xl md:text-4xl font-semibold text-center leading-relaxed intro-text-glow">
                {{ currentLesson?.title }}
              </p>
            </div>
          </div>

          <!-- Book page -->
          <div v-else class="absolute inset-0 flex items-center justify-center p-4 md:p-8 z-[1]">
            <div class="book-page w-full max-w-2xl h-full max-h-[85vh] flex flex-col overflow-hidden" :key="`page-${currentSectionIndex}-${currentPage}`">
              <!-- Section title with decorative line -->
              <div class="px-6 pt-5 pb-3 flex-shrink-0 flex items-center gap-3">
                <div class="h-px flex-1 bg-gradient-to-r from-transparent" :class="sceneTitleLineColor" />
                <h2 class="text-xs tracking-[0.25em] uppercase font-sans whitespace-nowrap" :class="sceneTitleColor">
                  {{ currentSection?.title }}
                </h2>
                <div class="h-px flex-1 bg-gradient-to-l from-transparent" :class="sceneTitleLineColor" />
              </div>

              <!-- Content area -->
              <div class="flex-1 overflow-hidden px-6 pb-4 relative" ref="pageContentRef">
                <div class="h-full overflow-hidden">
                  <div ref="textFlowRef" class="story-text-flow">
                    <!-- Section image (same as in LessonDetail, floats left) -->
                    <div v-if="displayImage && currentPage === 0" class="book-image-wrapper">
                      <img
                        :src="displayImage"
                        :alt="currentSection?.title || ''"
                        class="book-float-image"
                        :class="imageLoaded ? 'image-loaded' : 'image-loading'"
                        @load="imageLoaded = true" />
                      <div class="image-glow" :class="`glow-${sceneType}`" />
                    </div>

                    <template v-for="(para, pIdx) in visibleParagraphs" :key="`${currentPage}-${pIdx}`">
                      <!-- Story/narration paragraph with staggered animation -->
                      <p v-if="!para.hasAnswer"
                        class="story-para text-lg md:text-xl leading-[1.9] mb-4"
                        :class="{ 'para-highlight': pIdx === highlightedParagraph }"
                        :style="{ animationDelay: `${pIdx * 150}ms` }">
                        <template v-for="(word, wIdx) in splitWords(para.q)" :key="wIdx">
                          <span class="story-word" :class="getWordClass(word)"
                            :style="{ animationDelay: `${pIdx * 150 + wIdx * 20}ms` }">{{ word }}</span>{{ ' ' }}
                        </template>
                      </p>
                      <!-- Language example with styled blocks -->
                      <div v-else class="mb-5 example-block" :style="{ animationDelay: `${pIdx * 150}ms` }">
                        <p class="story-para text-lg md:text-xl leading-[1.7] font-semibold example-q">{{ para.q }}</p>
                        <p class="story-para text-base md:text-lg leading-[1.7] opacity-50 italic example-a">{{ para.a }}</p>
                      </div>
                    </template>
                  </div>
                </div>
              </div>

              <!-- Page indicator + nav -->
              <div v-if="totalPages > 1" class="flex items-center justify-between px-6 py-3 flex-shrink-0 border-t border-amber-200/10">
                <button @click.stop="prevPage" :disabled="currentPage === 0"
                  class="page-nav-btn disabled:opacity-20 disabled:cursor-default">
                  ← zurück
                </button>
                <div class="flex items-center gap-1.5">
                  <span v-for="p in totalPages" :key="p"
                    class="w-2 h-2 rounded-full transition-all duration-300"
                    :class="p - 1 === currentPage ? 'bg-amber-200/60 scale-125' : 'bg-amber-200/15'" />
                </div>
                <button @click.stop="nextPage" :disabled="currentPage >= totalPages - 1"
                  class="page-nav-btn disabled:opacity-20 disabled:cursor-default">
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
// StoryScene removed — Story Mode uses the same section images from YAML

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

// Scene detection — determines atmosphere, particles, colors
const sceneType = computed(() => {
  const image = currentSection.value?.image || currentLesson.value?.image || ''
  const title = (currentSection.value?.title || '').toLowerCase()
  const text = sectionParagraphs.value.map(p => p.q).join(' ').toLowerCase()

  if (image.includes('river') || image.includes('fluss') || title.includes('fluss') || text.includes('fluss') || text.includes('wasser')) return 'water'
  if (image.includes('house') || image.includes('haus') || title.includes('haus') || text.includes('haus') || text.includes('geschicht')) return 'house'
  return 'forest' // default
})

const sceneTitleColor = computed(() => ({
  forest: 'text-emerald-300/50',
  water: 'text-sky-300/50',
  house: 'text-amber-300/50'
}[sceneType.value]))

const sceneTitleLineColor = computed(() => ({
  forest: 'via-emerald-400/20 to-emerald-400/20',
  water: 'via-sky-400/20 to-sky-400/20',
  house: 'via-amber-400/20 to-amber-400/20'
}[sceneType.value]))

// Particle positioning — each particle gets unique random-looking position
function particleStyle(n) {
  const seed = n * 7.3
  const left = ((seed * 13.7) % 100)
  const top = ((seed * 17.3) % 100)
  const size = 3 + ((seed * 3.1) % 6)
  const dur = 8 + ((seed * 2.7) % 12)
  const delay = ((seed * 1.3) % 8)
  return {
    left: `${left}%`,
    top: `${top}%`,
    width: `${size}px`,
    height: `${size}px`,
    animationDuration: `${dur}s`,
    animationDelay: `-${delay}s`
  }
}

// Keyword highlighting — special words get scene-colored accents
const sceneKeywords = {
  forest: ['wald', 'baum', 'baeume', 'blaetter', 'pfad', 'moos', 'gruen', 'voegel', 'natur'],
  water: ['fluss', 'wasser', 'ufer', 'frosch', 'fridolin', 'glitzern', 'plaetschern', 'fische', 'see'],
  house: ['haus', 'tuer', 'licht', 'buch', 'geschichten', 'feuer', 'warm', 'sessel', 'kuchen', 'kakao']
}

function splitWords(text) {
  if (!text) return []
  return text.split(/(\s+)/).filter(w => w.trim())
}

function getWordClass(word) {
  const lower = word.toLowerCase().replace(/[.,!?'"]/g, '')
  const scene = sceneType.value
  if (sceneKeywords[scene]?.some(kw => lower.includes(kw))) {
    return `keyword-${scene}`
  }
  return ''
}

// Map paragraph to a unique scene based on section + paragraph index
function paragraphScene(pIdx) {
  const globalIdx = currentPage.value * paragraphsPerPage.value + pIdx
  const sectionTitle = (currentSection.value?.title || '').toLowerCase()
  const lessonNum = lessonNumber.value

  // Lektion 1: Der Wald
  if (lessonNum === 1) {
    const forestScenes = ['mila-portrait', 'village', 'window-birds', 'sunrise-melody', 'mila-wondering', 'sneaking-out', 'fork-in-road']
    return forestScenes[globalIdx] || 'mila-portrait'
  }
  // Lektion 2: Der Fluss
  if (lessonNum === 2) return 'river'
  // Lektion 3: Das Haus
  if (lessonNum === 3) return 'house'

  return 'mila-portrait'
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
    const prefix = resolvedWorkshop.startsWith('http://') || resolvedWorkshop.startsWith('https://') || resolvedWorkshop.startsWith('/') ? '' : baseUrl
    return `${prefix}${resolvedWorkshop}/${lessonFilename}/${imagePath}`
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
/* === Scene Backgrounds === */
.story-bg {
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
}
.scene-bg { position: absolute; inset: 0; overflow: hidden; }
.scene-forest { background: linear-gradient(160deg, #0a1a12 0%, #0f2318 30%, #1a1a2e 70%, #0f1a28 100%); }
.scene-water { background: linear-gradient(160deg, #0a1520 0%, #0f1e30 30%, #1a1a2e 70%, #0a1828 100%); }
.scene-house { background: linear-gradient(160deg, #1a150a 0%, #1e1810 30%, #1a1a2e 70%, #1a1510 100%); }

/* === Floating Particles === */
.particle {
  position: absolute;
  border-radius: 50%;
  pointer-events: none;
  opacity: 0;
  animation: particleFloat linear infinite;
}
.particle-forest {
  background: radial-gradient(circle, rgba(80, 200, 100, 0.6), rgba(80, 200, 100, 0));
  animation-name: particleLeaf;
}
.particle-water {
  background: radial-gradient(circle, rgba(100, 180, 255, 0.5), rgba(100, 180, 255, 0));
  animation-name: particleBubble;
}
.particle-house {
  background: radial-gradient(circle, rgba(255, 200, 80, 0.6), rgba(255, 200, 80, 0));
  animation-name: particleFirefly;
}

@keyframes particleLeaf {
  0% { opacity: 0; transform: translate(0, -20px) rotate(0deg) scale(0.5); }
  10% { opacity: 0.7; }
  90% { opacity: 0.3; }
  100% { opacity: 0; transform: translate(30px, 100vh) rotate(360deg) scale(1); }
}
@keyframes particleBubble {
  0% { opacity: 0; transform: translate(0, 20px) scale(0.3); }
  10% { opacity: 0.5; }
  50% { transform: translate(15px, -20px) scale(1); opacity: 0.6; }
  90% { opacity: 0.2; }
  100% { opacity: 0; transform: translate(-10px, -60px) scale(0.5); }
}
@keyframes particleFirefly {
  0% { opacity: 0; transform: scale(0.5); }
  20% { opacity: 0.8; transform: scale(1.2); }
  50% { opacity: 0.3; transform: translate(20px, -15px) scale(0.8); }
  80% { opacity: 0.9; transform: translate(-10px, 10px) scale(1.1); }
  100% { opacity: 0; transform: translate(5px, -5px) scale(0.5); }
}

/* === Scene Decorations === */
.scene-deco { position: absolute; pointer-events: none; }
.scene-deco-trees { bottom: 0; left: 0; right: 0; height: 200px; }
.scene-deco-waves { bottom: 0; left: 0; right: 0; height: 100px; }
.scene-deco-glow {
  position: absolute; top: 15%; right: 10%;
  width: 200px; height: 200px;
  background: radial-gradient(circle, rgba(255, 180, 60, 0.06) 0%, transparent 70%);
  border-radius: 50%;
  animation: glowPulse 4s ease-in-out infinite;
}

.tree-wave { animation: treesSway 6s ease-in-out infinite; transform-origin: bottom; }
.tree-wave-2 { animation: treesSway 8s ease-in-out infinite reverse; transform-origin: bottom; }
.water-wave { animation: wavesFlow 4s ease-in-out infinite; }
.water-wave-2 { animation: wavesFlow 5s ease-in-out infinite reverse; }

@keyframes treesSway { 0%, 100% { transform: scaleY(1); } 50% { transform: scaleY(1.05) translateX(5px); } }
@keyframes wavesFlow { 0%, 100% { transform: translateX(0); } 50% { transform: translateX(15px); } }
@keyframes glowPulse { 0%, 100% { opacity: 0.5; transform: scale(1); } 50% { opacity: 1; transform: scale(1.15); } }

/* === Intro Title === */
.intro-title { animation: introAppear 1.5s ease-out; }
.intro-text-glow {
  font-family: Georgia, serif;
  color: #f5e6d3;
  text-shadow: 0 0 30px rgba(255, 200, 100, 0.3), 0 0 60px rgba(255, 200, 100, 0.1), 0 2px 4px rgba(0,0,0,0.5);
}
@keyframes introAppear {
  0% { opacity: 0; transform: scale(0.9) translateY(20px); filter: blur(8px); }
  100% { opacity: 1; transform: scale(1) translateY(0); filter: blur(0); }
}

/* === Book Page === */
.book-page {
  background: rgba(15, 18, 30, 0.88);
  border: 1px solid rgba(245, 230, 211, 0.06);
  border-radius: 1rem;
  box-shadow: 0 12px 50px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(245, 230, 211, 0.04);
  animation: pageAppear 0.6s ease-out;
}
@keyframes pageAppear {
  0% { opacity: 0; transform: translateX(30px) scale(0.98); }
  100% { opacity: 1; transform: translateX(0) scale(1); }
}

/* === Float Image with 3D Pop === */
.book-image-wrapper {
  float: left;
  width: 45%;
  margin: 0 1.2rem 0.8rem 0;
  position: relative;
  perspective: 600px;
}
.book-float-image {
  width: 100%;
  max-height: 38vh;
  object-fit: contain;
  border-radius: 0.6rem;
  transition: all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.image-loading { opacity: 0; transform: rotateY(-8deg) scale(0.9); }
.image-loaded { opacity: 1; transform: rotateY(0deg) scale(1); animation: imageFloat 6s ease-in-out infinite; }
.image-glow {
  position: absolute; inset: -10%; border-radius: 1rem;
  pointer-events: none; z-index: -1; opacity: 0.4;
  animation: imageGlowPulse 4s ease-in-out infinite;
}
.glow-forest { background: radial-gradient(ellipse, rgba(80, 200, 100, 0.15), transparent 70%); }
.glow-water { background: radial-gradient(ellipse, rgba(100, 180, 255, 0.15), transparent 70%); }
.glow-house { background: radial-gradient(ellipse, rgba(255, 180, 60, 0.15), transparent 70%); }

@keyframes imageFloat {
  0%, 100% { transform: translateY(0) rotateY(0deg); }
  50% { transform: translateY(-4px) rotateY(1deg); }
}
@keyframes imageGlowPulse { 0%, 100% { opacity: 0.3; } 50% { opacity: 0.6; } }

@media (max-width: 640px) {
  .book-image-wrapper { width: 40%; }
  .book-float-image { max-height: 28vh; }
}

/* === Text Flow === */
.story-text-flow {
  font-family: Georgia, 'Times New Roman', serif;
  color: #f5e6d3;
}

/* === Paragraph Animation === */
.story-para {
  font-family: Georgia, 'Times New Roman', serif;
  color: #f5e6d3;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
  animation: paraSlideIn 0.5s ease-out both;
}
@keyframes paraSlideIn {
  0% { opacity: 0; transform: translateY(12px); }
  100% { opacity: 1; transform: translateY(0); }
}

/* === Word-by-word appearance === */
.story-word {
  display: inline;
  animation: wordAppear 0.3s ease-out both;
}
@keyframes wordAppear {
  0% { opacity: 0.3; }
  100% { opacity: 1; }
}

/* === Keyword Highlights === */
.keyword-forest { color: #86efac; text-shadow: 0 0 8px rgba(80, 200, 100, 0.3); }
.keyword-water { color: #93c5fd; text-shadow: 0 0 8px rgba(100, 180, 255, 0.3); }
.keyword-house { color: #fcd34d; text-shadow: 0 0 8px rgba(255, 200, 80, 0.3); }

/* === Active paragraph highlight === */
.para-highlight {
  color: #fef3c7 !important;
  text-shadow: 0 0 12px rgba(255, 220, 100, 0.2), 0 1px 3px rgba(0, 0, 0, 0.3);
  border-left: 2px solid rgba(255, 220, 100, 0.3);
  padding-left: 0.75rem;
  transition: all 0.4s ease;
}

/* === Example blocks (language workshops) === */
.example-block {
  animation: paraSlideIn 0.5s ease-out both;
  padding: 0.5rem 0;
  border-bottom: 1px solid rgba(245, 230, 211, 0.06);
}
.example-q { letter-spacing: 0.01em; }
.example-a { letter-spacing: 0.02em; }

/* === Page nav buttons === */
.page-nav-btn {
  font-family: Georgia, serif;
  font-size: 0.875rem;
  color: rgba(245, 230, 211, 0.35);
  padding: 0.25rem 0.5rem;
  border-radius: 0.375rem;
  transition: all 0.2s;
}
.page-nav-btn:hover:not(:disabled) {
  color: rgba(245, 230, 211, 0.7);
  background: rgba(245, 230, 211, 0.05);
}

.story-text {
  font-family: Georgia, 'Times New Roman', serif;
  color: #f5e6d3;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
}

/* Inline scene between paragraphs */
.scene-inline {
  width: 100%; margin: 0.5rem 0 1rem; clear: both;
  border-radius: 0.6rem; overflow: hidden;
  animation: paraSlideIn 0.6s ease-out both;
}

/* Mila breakout at the end — overflows the page */
.scene-breakout {
  width: 60%; margin: 1rem auto 0; clear: both;
  position: relative; z-index: 10;
  animation: breakoutPop 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) both;
  animation-delay: 0.5s;
  filter: drop-shadow(0 8px 20px rgba(0,0,0,0.4));
}
@keyframes breakoutPop {
  0% { opacity: 0; transform: scale(0.5) translateY(30px); }
  100% { opacity: 1; transform: scale(1) translateY(-20px); }
}
</style>
