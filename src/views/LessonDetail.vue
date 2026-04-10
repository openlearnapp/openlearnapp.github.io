<template>
  <div>
    <div v-if="lesson">
      <div v-if="lesson.image" class="mb-5 rounded-lg overflow-hidden shadow-sm">
        <img
          :src="resolveImagePath(lesson.image)"
          :alt="lesson.image_caption || lesson.title"
          class="w-full rounded-lg cursor-zoom-in"
          @click="openLightbox(resolveImagePath(lesson.image), lesson.image_caption)"
        />
        <p v-if="lesson.image_caption" class="text-xs text-muted-foreground mt-1.5 text-center italic">
          {{ lesson.image_caption }}
        </p>
      </div>
      <h2 class="text-3xl font-bold text-foreground mb-3">
        {{ lesson.title }}
      </h2>
      <p v-if="lesson.description" class="text-muted-foreground mb-5 text-lg">
        {{ lesson.description }}
      </p>

      <div v-if="activeLabel" class="mb-4 flex items-center gap-2">
        <Badge class="bg-primary text-primary-foreground px-3 py-1">
          {{ activeLabel }}
          <button @click="activeLabel = null" class="ml-2 hover:opacity-70">✕</button>
        </Badge>
      </div>

      <nav v-if="filteredSections.length > 1" class="mb-6 p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl ring-1 ring-border/50 dark:ring-white/[0.06] shadow-sm">
        <h3 class="text-sm font-semibold text-muted-foreground mb-3">{{ $t('lesson.sections') }}</h3>
        <ol class="space-y-1.5">
          <li v-for="(section, idx) in filteredSections" :key="idx" class="flex items-center gap-2.5">
            <span class="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 dark:bg-primary/20 text-primary text-xs font-bold">{{ idx + 1 }}</span>
            <a :href="`#section-${idx}`" class="text-sm text-foreground hover:text-primary transition" @click.prevent="scrollToSection(idx)">
              {{ section.title }}
            </a>
          </li>
        </ol>
      </nav>

      <!-- Sections -->
      <Card
        v-for="(section, idx) in filteredSections"
        :key="idx"
        :id="`section-${idx}`"
        :class="activeLabel ? 'p-0 mb-3 border-0 shadow-none' : 'p-5 mb-6 ring-1 ring-border/50 dark:ring-white/[0.06] shadow-md dark:shadow-lg bg-white dark:bg-slate-800/60'">
        <CardHeader v-if="!activeLabel" :id="`section-header-${idx}`" class="p-0 pb-4" style="scroll-margin-top: 80px">
          <div class="flex items-center gap-3">
            <span class="flex-shrink-0 flex items-center justify-center w-9 h-9 rounded-full bg-primary/15 text-primary text-lg font-bold">
              {{ idx + 1 }}
            </span>
            <CardTitle class="text-2xl text-primary">
              {{ section.title }}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent class="p-0">
          <div v-if="section.video && !activeLabel" class="mb-4">
            <iframe
              v-if="isYouTubeUrl(section.video)"
              :src="normalizeVideoUrl(section.video)"
              class="w-full aspect-video rounded"
              frameborder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowfullscreen>
            </iframe>
            <video
              v-else
              :src="resolveVideoPath(section.video)"
              class="w-full aspect-video rounded"
              controls
              preload="metadata">
            </video>
          </div>

          <div v-if="section.image && !activeLabel" class="mb-4">
            <img
              :src="resolveImagePath(section.image)"
              :alt="section.image_caption || section.title"
              class="w-full rounded-lg cursor-zoom-in shadow-sm"
              @click="openLightbox(resolveImagePath(section.image), section.image_caption)"
            />
            <p v-if="section.image_caption" class="text-xs text-muted-foreground mt-1.5 text-center italic">
              {{ section.image_caption }}
            </p>
          </div>

          <!-- Lightbox -->
          <Teleport to="body">
            <div
              v-if="lightbox.open"
              class="fixed inset-0 bg-black/90 z-[200] flex items-center justify-center p-4 cursor-zoom-out"
              @click="closeLightbox"
              @keydown.esc="closeLightbox">
              <img
                :src="lightbox.src"
                :alt="lightbox.caption"
                class="max-w-full max-h-full rounded-lg shadow-2xl object-contain"
                @click.stop />
              <p v-if="lightbox.caption" class="absolute bottom-6 left-0 right-0 text-center text-white text-sm opacity-80">
                {{ lightbox.caption }}
              </p>
              <button
                class="absolute top-4 right-4 text-white text-3xl hover:text-white/70 transition"
                @click="closeLightbox">✕</button>
            </div>
          </Teleport>

          <div
            v-if="section.explanation && !activeLabel"
            class="bg-muted/60 p-4 rounded-lg mb-4 border-l-4 border-primary/30 prose prose-sm dark:prose-invert max-w-none"
            v-html="DOMPurify.sanitize(marked(section.explanation))">
          </div>

          <div
            v-for="(example, exIdx) in section.examples"
            :key="exIdx"
            :id="`example-${example._originalSectionIdx}-${example._originalExampleIdx}`"
            @click="handleExampleClick(example)"
            :class="[
              'p-4 mb-3 rounded-xl transition-all duration-200',
              isAssessmentType(example) ? '' : 'cursor-pointer',
              isCurrentlyReading(example) && isPlaying
                ? 'ring-4 ring-yellow-400 dark:ring-yellow-600'
                : '',
              isCurrentlyReading(example) && isPaused
                ? 'ring-4 ring-orange-400 dark:ring-orange-600'
                : '',
              isAssessmentCorrect(example)
                ? 'bg-green-50 dark:bg-green-500/10 border border-green-300 dark:border-green-500/30 shadow-sm'
                : isAssessmentType(example)
                  ? 'bg-violet-50 dark:bg-violet-500/10 border border-violet-200 dark:border-violet-500/20 shadow-sm'
                  : 'bg-slate-50 dark:bg-slate-700/50 border border-slate-200/80 dark:border-slate-600/40 shadow-md hover:shadow-lg hover:border-primary/30'
            ]">
            <div :class="example.image ? 'flex gap-4' : ''">
              <div :class="example.image ? 'flex-1 min-w-0' : ''">
                <div class="text-lg font-semibold text-foreground mb-2 flex items-start gap-2">
                  <div class="flex-1">
                    <span v-if="isAssessmentCorrect(example)" class="text-green-600 dark:text-green-400 mr-1">✓</span>{{ example.q }}
                  </div>
                  <!-- Reveal answer button (only when answers are hidden and example has an answer) -->
                  <button
                    v-if="!isAssessmentType(example) && !settings.showAnswers && example.a"
                    @click.stop="handleQuestionClick(example)"
                    class="flex-shrink-0 mt-0.5 p-1 rounded-md text-muted-foreground/40 hover:text-primary hover:bg-primary/10 transition"
                    :title="revealedAnswers[draftKey(example)] ? 'Hide answer' : 'Show answer'">
                    <svg v-if="!revealedAnswers[draftKey(example)]" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/></svg>
                    <svg v-else xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49"/><path d="M14.084 14.158a3 3 0 0 1-4.242-4.242"/><path d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143"/><path d="m2 2 20 20"/></svg>
                  </button>
                </div>

            <template v-if="!example.type || example.type === 'qa'">
              <div
                v-show="settings.showAnswers || revealedAnswers[draftKey(example)]"
                class="text-muted-foreground italic mb-3">
                {{ displayAnswer(example.a) }}
              </div>
            </template>

            <template v-else-if="example.type === 'input'">
              <div class="mt-2" @click.stop>
                <Input
                  type="text"
                  :model-value="getDraft(example)"
                  @update:model-value="setDraft(example, $event)"
                  @keyup.enter="submitAnswer(example)"
                  @blur="onInputBlur(example)"
                  class="w-full"
                  :placeholder="$t('lesson.typeAnswer')" />
              </div>
              <div v-if="getSubmission(example) && getSubmission(example).correct === false" class="mt-2 text-sm font-semibold text-red-600 dark:text-red-400">
                {{ displayAnswer(example.a) }}
              </div>
            </template>

            <template v-else-if="example.type === 'multiple-choice'">
              <div class="mt-2 space-y-2" @click.stop>
                <label
                  v-for="(option, optIdx) in example.options"
                  :key="optIdx"
                  :class="[
                    'flex items-center gap-2 p-2 rounded border cursor-pointer transition',
                    isDraftOptionSelected(example, optIdx) && option.correct
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                      : isDraftOptionSelected(example, optIdx) && option.correct === false
                        ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                        : 'border-input hover:border-primary/50'
                  ]">
                  <Checkbox
                    :checked="isDraftOptionSelected(example, optIdx)"
                    @update:checked="toggleDraftOption(example, optIdx)" />
                  <Label class="cursor-pointer">{{ option.text }}</Label>
                </label>
              </div>
            </template>

            <template v-else-if="example.type === 'select'">
              <div class="mt-2 space-y-2" @click.stop>
                <RadioGroup
                  :model-value="getDraftSelect(example) !== null ? String(getDraftSelect(example)) : undefined"
                  @update:model-value="setDraftSelect(example, parseInt($event))">
                  <label
                    v-for="(option, optIdx) in example.options"
                    :key="optIdx"
                    :class="[
                      'flex items-center gap-2 p-2 rounded border cursor-pointer transition',
                      getDraftSelect(example) === optIdx && option.correct
                        ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                        : getDraftSelect(example) === optIdx && option.correct === false
                          ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                          : 'border-input hover:border-primary/50'
                    ]">
                    <RadioGroupItem :value="String(optIdx)" />
                    <Label class="cursor-pointer">{{ option.text }}</Label>
                  </label>
                </RadioGroup>
              </div>
            </template>


            <div v-if="settings.showLearningItems && example.rel && example.rel.length > 0" class="flex flex-wrap gap-2 mb-3 mt-2 pt-2 border-t border-dashed border-slate-200 dark:border-slate-600/40">
              <Badge
                v-for="(item, relIdx) in example.rel"
                :key="relIdx"
                variant="outline"
                @click.stop="handleItemClick(item[0])"
                :class="[
                  'cursor-pointer transition-all duration-200 text-xs',
                  isItemLearned(learning, workshop, item[0])
                    ? 'bg-green-100 dark:bg-green-800/40 border-green-400 dark:border-green-500/40 opacity-70'
                    : 'bg-sky-50 dark:bg-sky-900/20 border-sky-200 dark:border-sky-500/30 hover:bg-sky-100 dark:hover:bg-sky-800/30 hover:shadow-sm'
                ]">
                <span :class="['font-bold', isItemLearned(learning, workshop, item[0]) ? 'line-through text-green-600 dark:text-green-400' : 'text-sky-700 dark:text-sky-300']">
                  {{ item[0] }}
                </span>
                <span class="text-muted-foreground ml-1">
                  · {{ item.slice(1).join(' · ') }}
                </span>
                <span v-if="isItemLearned(learning, workshop, item[0])" class="ml-1 text-green-500">✓</span>
              </Badge>
            </div>

            <div v-if="settings.showLabels && example.labels" class="flex gap-1.5 mt-1">
              <Badge
                v-for="label in example.labels"
                :key="label"
                @click.stop="toggleLabel(label)"
                :class="[
                  'cursor-pointer transition-all text-[10px] font-semibold px-2.5 py-0.5 rounded-full',
                  activeLabel === label
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'bg-primary/10 text-primary dark:bg-primary/20 hover:bg-primary/20 dark:hover:bg-primary/30'
                ]">
                {{ label }}
              </Badge>
            </div>
              </div><!-- end flex-1 text column -->

              <div v-if="example.image" class="flex-shrink-0 w-32 sm:w-40">
                <img
                  :src="resolveImagePath(example.image)"
                  :alt="example.image_caption || example.q"
                  class="w-full rounded-lg object-contain cursor-zoom-in shadow-sm"
                  @click.stop="openLightbox(resolveImagePath(example.image), example.image_caption)"
                />
              </div>
            </div><!-- end flex row -->
          </div>
        </CardContent>
      </Card>

    </div>

    <!-- Loading state -->
    <div v-else class="text-center py-8">
      <div class="text-2xl font-bold text-primary mb-4">
        {{ $t('lesson.loadingLesson') }}
      </div>
    </div>

    <!-- Debug overlay -->
    <div v-if="lesson && settings.showDebugOverlay" class="fixed top-24 left-2 bg-black bg-opacity-75 text-white text-xs p-2 rounded z-40 font-mono max-w-xs">
      <div>Playing: {{ isPlaying ? 'YES' : 'NO' }}</div>
      <div>Paused: {{ isPaused ? 'YES' : 'NO' }}</div>
      <div>Index: {{ currentItem ? currentItem.sectionIdx + '-' + currentItem.exampleIdx : 'none' }}</div>
      <div v-if="currentItem" class="truncate">{{ currentItem.text.substring(0, 30) }}...</div>
    </div>

    <!-- Floating play/pause button for mobile — only shown when audio is available -->
    <!-- Single click: play/pause current lesson. Double click: continuous play across lessons. -->
    <button
      v-if="lesson && (isLoadingAudio || hasAudio)"
      @click="handlePlayButtonClick"
      @dblclick.prevent="handlePlayButtonDoubleClick"
      :disabled="isLoadingAudio"
      :class="[
        'md:hidden fixed bottom-20 right-6 w-12 h-12 rounded-full shadow-lg z-50 flex items-center justify-center bg-primary text-white border-2 disabled:opacity-50',
        continuousMode ? 'border-yellow-300 ring-2 ring-yellow-300/70' : 'border-primary-foreground/30'
      ]"
      :title="playButtonTitle"
      :aria-label="playButtonAriaLabel">
      <svg v-if="isLoadingAudio" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
      <svg v-else-if="isPlaying" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
      <svg v-else xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="6 3 20 12 6 21 6 3"/></svg>
      <!-- Continuous mode indicator: small repeat badge -->
      <span v-if="continuousMode && !isLoadingAudio" class="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-yellow-300 text-primary flex items-center justify-center" aria-hidden="true">
        <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m17 2 4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="m7 22-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/></svg>
      </span>
    </button>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useLessons } from '../composables/useLessons'
import { useSettings } from '../composables/useSettings'
import { useProgress } from '../composables/useProgress'
import { useAudio } from '../composables/useAudio'
import { useLessonAudioSync } from '../composables/useLessonAudioSync'
import { useAssessments } from '../composables/useAssessments'
import { useFooter } from '../composables/useFooter'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const emit = defineEmits(['update-title'])

const { loadAllLessonsForWorkshop, resolveWorkshopKey } = useLessons()
const { settings } = useSettings()
const { isItemLearned, toggleItemLearned, areAllItemsLearned, progress, setLastVisited } = useProgress()
// jumpToExample still comes from useAudio directly; everything else flows
// through useLessonAudioSync so the logic is testable without mounting.
const { jumpToExample } = useAudio()
const {
  isLoadingAudio, isPlaying, isPaused, playbackFinished, hasAudio, currentItem,
  lessonMetadata: audioLessonMetadata,
  isTransitioning, continuousMode, lessonTransitionTick,
  play, pause,
  enableContinuousMode, disableContinuousMode,
  onSettingsChanged, onProgressChanged, onLessonMount, onLessonUnmount,
  toggleContinuousPlay,
} = useLessonAudioSync()
const { getAnswer, saveAnswer, validateAnswer } = useAssessments()
const { setLessonFooter, clearLessonFooter } = useFooter()

const lesson = ref(null)
const allLessons = ref([])
const drafts = reactive({})
const mcLive = reactive({})
const lightbox = reactive({ open: false, src: '', caption: '' })
const revealedAnswers = reactive({})
const activeLabel = ref(route.query.label || null)

// Captured at mount time so onBeforeUnmount has stable values even after
// Vue has already begun tearing down route-param-based computed refs.
let mountedLearning = null
let mountedWorkshop = null
let mountedLessonNumber = null

const audioSettings = computed(() => ({
  ...settings.value,
  activeLabel: activeLabel.value
}))

function isYouTubeUrl(url) {
  return /(?:youtube\.com|youtu\.be)/.test(url)
}

function normalizeVideoUrl(url) {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?]+)/)
  if (match) return `https://www.youtube.com/embed/${match[1]}`
  if (url.includes('youtube.com/embed/')) return url
  return url
}

function resolveLessonAssetPath(assetPath) {
  if (!assetPath) return ''
  if (assetPath.startsWith('http://') || assetPath.startsWith('https://') || assetPath.startsWith('/')) {
    return assetPath
  }
  const baseUrl = import.meta.env.BASE_URL
  if (lesson.value?._source?.type === 'url') {
    return `${lesson.value._source.path}/${assetPath}`
  }
  const filename = lesson.value?._filename || `${String(lesson.value?.number).padStart(2, '0')}-lesson`
  const resolvedWorkshop = resolveWorkshopKey(learning.value, workshop.value)
  if (resolvedWorkshop !== workshop.value) {
    const prefix = resolvedWorkshop.startsWith('http://') || resolvedWorkshop.startsWith('https://') || resolvedWorkshop.startsWith('/') ? '' : baseUrl
    return `${prefix}${resolvedWorkshop}/${filename}/${assetPath}`
  }
  return `${baseUrl}lessons/${learning.value}/${workshop.value}/${filename}/${assetPath}`
}

function resolveVideoPath(videoPath) {
  return resolveLessonAssetPath(videoPath)
}

function resolveImagePath(imagePath) {
  return resolveLessonAssetPath(imagePath)
}

function openLightbox(src, caption) {
  lightbox.open = true
  lightbox.src = src
  lightbox.caption = caption || ''
  document.addEventListener('keydown', handleLightboxKey)
}

function closeLightbox() {
  lightbox.open = false
  document.removeEventListener('keydown', handleLightboxKey)
}

function handleLightboxKey(e) {
  if (e.key === 'Escape') closeLightbox()
}

function isAssessmentType(example) {
  return example.type && example.type !== 'qa'
}

function hasValidation(example) {
  if (!isAssessmentType(example)) return false
  if (example.type === 'input') return !!example.a
  if (example.type === 'multiple-choice' || example.type === 'select') {
    return example.options?.some(opt => opt.correct === true)
  }
  return false
}

function isAssessmentCorrect(example) {
  if (!isAssessmentType(example)) return false
  const sub = getSubmission(example)
  if (!hasValidation(example)) {
    return !!sub
  }
  if (example.type === 'multiple-choice') {
    return getMcLive(example) === true || sub?.correct === true
  }
  return sub?.correct === true
}

function displayAnswer(a) {
  if (Array.isArray(a)) return a[0]
  return a
}

function draftKey(example) {
  return `${example._originalSectionIdx}-${example._originalExampleIdx}`
}

function getDraft(example) {
  return drafts[draftKey(example)] || ''
}

function setDraft(example, value) {
  drafts[draftKey(example)] = value
}

function getDraftSelect(example) {
  const val = drafts[draftKey(example)]
  return val !== undefined ? val : null
}

function setDraftSelect(example, optIdx) {
  drafts[draftKey(example)] = optIdx
  submitAnswer(example)
}

function isDraftOptionSelected(example, optIdx) {
  const selected = drafts[draftKey(example)]
  return Array.isArray(selected) && selected.includes(optIdx)
}

function toggleDraftOption(example, optIdx) {
  const key = draftKey(example)
  if (!Array.isArray(drafts[key])) {
    drafts[key] = []
  }
  const idx = drafts[key].indexOf(optIdx)
  if (idx === -1) {
    drafts[key].push(optIdx)
  } else {
    drafts[key].splice(idx, 1)
  }
  if (!hasValidation(example)) {
    submitAnswer(example)
  } else {
    validateMcLive(example)
  }
}

function validateMcLive(example) {
  const key = draftKey(example)
  const selected = drafts[key]
  if (!Array.isArray(selected) || selected.length === 0) {
    delete mcLive[key]
    return
  }
  const correct = validateAnswer(example, selected)
  mcLive[key] = correct
  if (correct) {
    submitAnswer(example)
  }
}

function getMcLive(example) {
  const key = draftKey(example)
  return mcLive[key] ?? null
}

function onInputBlur(example) {
  if (!getDraft(example)) return
  submitAnswer(example)
}

function getSubmission(example) {
  return getAnswer(
    learning.value, workshop.value, lessonNumber.value,
    example._originalSectionIdx, example._originalExampleIdx
  )
}

function submitAnswer(example) {
  const type = example.type || 'qa'
  let userAnswer

  if (type === 'input') {
    userAnswer = getDraft(example)
    if (!userAnswer) return
  } else if (type === 'multiple-choice') {
    userAnswer = drafts[draftKey(example)]
    if (!Array.isArray(userAnswer)) return
    if (userAnswer.length === 0 && hasValidation(example)) return
  } else if (type === 'select') {
    userAnswer = getDraftSelect(example)
    if (userAnswer === null) return
  } else {
    return
  }

  const correct = validateAnswer(example, userAnswer)

  saveAnswer(
    learning.value, workshop.value, lessonNumber.value,
    example._originalSectionIdx, example._originalExampleIdx,
    { type, answer: userAnswer, correct }
  )
}

function restoreDraftsFromSaved() {
  if (!lesson.value) return
  lesson.value.sections.forEach((section, sIdx) => {
    section.examples.forEach((example, eIdx) => {
      const saved = getAnswer(learning.value, workshop.value, lessonNumber.value, sIdx, eIdx)
      if (saved) {
        drafts[`${sIdx}-${eIdx}`] = saved.answer
      }
    })
  })
}

const learning = computed(() => route.params.learning)
const workshop = computed(() => route.params.workshop)
const lessonNumber = computed(() => parseInt(route.params.number))

const nextLessonNumber = computed(() => {
  if (!lesson.value || allLessons.value.length === 0) return null
  const sorted = [...allLessons.value].sort((a, b) => a.number - b.number)
  const currentIdx = sorted.findIndex(l => l.number === lesson.value.number)
  if (currentIdx >= 0 && currentIdx < sorted.length - 1) {
    return sorted[currentIdx + 1].number
  }
  return null
})

const filteredSections = computed(() => {
  if (!lesson.value || !lesson.value.sections) {
    return []
  }

  return lesson.value.sections.map((section, originalSectionIdx) => {
    const filteredExamples = section.examples
      .map((example, originalExampleIdx) => ({
        ...example,
        _originalSectionIdx: originalSectionIdx,
        _originalExampleIdx: originalExampleIdx
      }))
      .filter(example => {
        if (activeLabel.value) {
          if (!example.labels || !example.labels.includes(activeLabel.value)) {
            return false
          }
        }
        if (!settings.value.hideLearnedExamples) {
          return true
        }
        if (!example.rel || example.rel.length === 0) {
          return true
        }
        return !areAllItemsLearned(learning.value, workshop.value, example.rel)
      })

    return {
      ...section,
      examples: filteredExamples,
      _originalSectionIdx: originalSectionIdx
    }
  }).filter(section => section.examples.length > 0)
})

function scrollToSection(idx) {
  const el = document.getElementById(`section-${idx}`)
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

function toggleLabel(label) {
  activeLabel.value = activeLabel.value === label ? null : label
}

function handleItemClick(itemId) {
  toggleItemLearned(learning.value, workshop.value, itemId)
}

function handleQuestionClick(example) {
  if (isAssessmentType(example)) return
  if (!settings.value.showAnswers && (!example.type || example.type === 'qa')) {
    const key = draftKey(example)
    revealedAnswers[key] = !revealedAnswers[key]
  }
}

function handleExampleClick(example) {
  if (isAssessmentType(example)) return
  jumpToExample(example._originalSectionIdx, example._originalExampleIdx, audioSettings.value)
}

function isCurrentlyReading(example) {
  if (!currentItem.value) return false
  return currentItem.value.sectionIdx === example._originalSectionIdx &&
         currentItem.value.exampleIdx === example._originalExampleIdx
}

function togglePlayPause() {
  if (isPlaying.value) {
    pause()
  } else {
    play(audioSettings.value)
  }
}

// Debounced click handler so a double click does not also fire a single click
// that would pause playback right after continuous mode starts.
let playClickTimer = null
const PLAY_DOUBLE_CLICK_DELAY = 260 // ms

function handlePlayButtonClick() {
  if (playClickTimer) return // double click in progress
  playClickTimer = setTimeout(() => {
    playClickTimer = null
    togglePlayPause()
  }, PLAY_DOUBLE_CLICK_DELAY)
}

function handlePlayButtonDoubleClick() {
  if (playClickTimer) {
    clearTimeout(playClickTimer)
    playClickTimer = null
  }
  startContinuousPlay()
}

function startContinuousPlay() {
  toggleContinuousPlay({
    nextLessonProvider: resolveNextLessonForAudio,
    audioSettings: audioSettings.value,
  })
}

// Provider used by the audio composable to fetch the next lesson when the
// current one finishes in continuous mode. Returns null at end of workshop.
async function resolveNextLessonForAudio() {
  if (!nextLessonNumber.value) return null
  const nextLesson = allLessons.value.find(l => l.number === nextLessonNumber.value)
  if (!nextLesson) return null
  return {
    lesson: nextLesson,
    learning: learning.value,
    workshop: workshop.value,
  }
}

const playButtonTitle = computed(() => {
  if (isLoadingAudio.value) return t('nav.loading')
  if (continuousMode.value) return t('nav.continuousPlayActive')
  return isPlaying.value ? t('nav.pause') : t('nav.play')
})

const playButtonAriaLabel = computed(() => {
  if (isLoadingAudio.value) return t('nav.loadingAudio')
  if (continuousMode.value) return t('nav.continuousPlayActive')
  return isPlaying.value ? t('nav.pauseAudio') : t('nav.playAudio')
})

watch(currentItem, async (newItem) => {
  if (!newItem) return
  await nextTick()

  let element = null
  if (newItem.type === 'lesson-title') {
    window.scrollTo({ top: 0, behavior: 'smooth' })
    return
  } else if (newItem.type === 'section-title') {
    // Scroll to the section header (not the full card — card is too large)
    const sectionHeaders = document.querySelectorAll('[id^="section-header-"]')
    for (const el of sectionHeaders) {
      const idx = parseInt(el.id.split('-')[2])
      const section = filteredSections.value[idx]
      if (section && section._originalSectionIdx === newItem.sectionIdx) {
        element = el
        break
      }
    }
  } else {
    element = document.getElementById(`example-${newItem.sectionIdx}-${newItem.exampleIdx}`)
  }

  if (element) {
    // Section titles: scroll to top so header image below is visible
    // Examples: center in viewport
    const block = newItem.type === 'section-title' ? 'start' : 'center'
    element.scrollIntoView({ behavior: 'smooth', block })
  }
})

// Auto-advance to next lesson when audio playback finishes (non-continuous mode).
// Navigate with ?autoplay=true so the next lesson starts a fresh playback.
watch(playbackFinished, (finished) => {
  if (!finished || !nextLessonNumber.value) return
  if (continuousMode.value) return // handled by lessonTransitionTick watcher

  const query = { autoplay: 'true' }
  if (activeLabel.value) query.label = activeLabel.value
  router.replace({ path: `/${learning.value}/${workshop.value}/lesson/${nextLessonNumber.value}`, query })
})

// Continuous-mode URL sync: whenever the audio composable swaps to a new lesson
// in-place, update the route to match. The audio is already playing, so the
// remount that follows must be a no-op (initializeAudio is idempotent and
// cleanup is guarded by composableMovedOn check).
watch(lessonTransitionTick, () => {
  const meta = audioLessonMetadata.value
  if (!meta || !meta.learning || meta.number == null) return
  if (
    meta.learning === learning.value &&
    meta.workshop === workshop.value &&
    meta.number === lessonNumber.value
  ) return
  const query = {}
  if (activeLabel.value) query.label = activeLabel.value
  router.replace({
    path: `/${meta.learning}/${meta.workshop}/lesson/${meta.number}`,
    query,
  })
})

// Sync active label to URL query param
watch(activeLabel, (label) => {
  const query = { ...route.query }
  if (label) {
    query.label = label
  } else {
    delete query.label
  }
  router.replace({ query })
})

// Keep footer in sync with next lesson number
watch(nextLessonNumber, (val) => {
  if (lesson.value) {
    setLessonFooter(learning.value, workshop.value, val)
  }
})

// Delegate to useLessonAudioSync so the decision ("should I rebuild?") is
// a pure, unit-testable function instead of inline watcher logic.
watch(
  () => [settings.value.hideLearnedExamples, settings.value.readAnswers, activeLabel.value],
  () => onSettingsChanged({
    lesson: lesson.value,
    learning: learning.value,
    workshop: workshop.value,
    audioSettings: audioSettings.value,
  }),
  { deep: true }
)

watch(
  progress,
  () => onProgressChanged({
    lesson: lesson.value,
    learning: learning.value,
    workshop: workshop.value,
    audioSettings: audioSettings.value,
  }),
  { deep: true }
)

function handleKeydown(e) {
  if (e.code === 'Escape') {
    router.push({ name: 'lessons-overview', params: { learning: learning.value, workshop: workshop.value } })
  }
}

// Listener for "start continuous play" requests dispatched by App.vue's
// desktop play button (it doesn't own the lesson list, so it delegates here).
function handleStartContinuousRequest() {
  if (lesson.value) {
    startContinuousPlay()
  }
}

onMounted(async () => {
  document.addEventListener('keydown', handleKeydown)
  window.addEventListener('open-learn:start-continuous-play', handleStartContinuousRequest)
  window.scrollTo(0, 0)
  const currentLearning = route.params.learning
  const currentWorkshop = route.params.workshop
  const currentLessonNumber = parseInt(route.params.number)

  // Capture stable values for onBeforeUnmount. Route-param-based computed
  // refs can become stale/undefined during unmount, so we remember what
  // this instance was tracking.
  mountedLearning = currentLearning
  mountedWorkshop = currentWorkshop
  mountedLessonNumber = currentLessonNumber

  const lessons = await loadAllLessonsForWorkshop(currentLearning, currentWorkshop)
  allLessons.value = lessons

  lesson.value = lessons.find(l => l.number === currentLessonNumber)

  if (lesson.value) {
    emit('update-title', `${t('results.lessonLabel')} ${lesson.value.number}`)

    // Track last visited lesson for profile "continue" feature
    setLastVisited(currentLearning, currentWorkshop, lesson.value.number)

    // Set footer navigation data
    setLessonFooter(currentLearning, currentWorkshop, nextLessonNumber.value)

    // Delegate init + autoplay + continuous-mode re-registration to the
    // pure composable so it can be unit-tested.
    await onLessonMount({
      lesson: lesson.value,
      learning: currentLearning,
      workshop: currentWorkshop,
      audioSettings: audioSettings.value,
      autoplay: !!route.query.autoplay,
      continuousNextLessonProvider: resolveNextLessonForAudio,
    })
    restoreDraftsFromSaved()

    if (route.query.scrollTo) {
      await nextTick()
      const el = document.getElementById(route.query.scrollTo)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }
  }
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', handleKeydown)
  window.removeEventListener('open-learn:start-continuous-play', handleStartContinuousRequest)

  if (playClickTimer) {
    clearTimeout(playClickTimer)
    playClickTimer = null
  }

  // Delegate the "should we tear down?" decision to the composable —
  // it skips cleanup during continuous-mode transitions so iOS keeps the
  // Media Session alive across component remounts.
  //
  // NOTE: we use the values captured at mount time. Route-param-based
  // computed refs become undefined during unmount, which would make
  // onLessonUnmount falsely think "composable moved on" and skip cleanup.
  onLessonUnmount({
    learning: mountedLearning,
    workshop: mountedWorkshop,
    lessonNumber: mountedLessonNumber,
  })

  clearLessonFooter()
  closeLightbox()
})
</script>
