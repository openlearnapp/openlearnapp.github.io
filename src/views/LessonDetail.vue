<template>
  <div>
    <div v-if="lesson">
      <div v-if="lesson.image && !isInFocusMode" class="mb-5 rounded-lg overflow-hidden shadow-sm">
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
      <p v-if="lesson.description && !isInFocusMode" class="text-muted-foreground mb-5 text-lg">
        {{ lesson.description }}
      </p>

      <div v-if="activeLabel" class="mb-4 flex items-center gap-2">
        <Badge class="bg-primary text-primary-foreground px-3 py-1">
          {{ activeLabel }}
          <button @click="activeLabel = null" class="ml-2 hover:opacity-70" :aria-label="$t('lesson.clearFilter')">✕</button>
        </Badge>
      </div>

      <!-- Take the test buttons — shown when the lesson has assessment items -->
      <div v-if="hasAssessments && !activeLabel && !isInFocusMode" class="mb-4 flex flex-wrap gap-2">
        <Button
          id="tour-filter-test"
          size="sm"
          variant="outline"
          @click="activeLabel = LABEL_TEST">
          📝 {{ $t('lesson.takeTest') }}
        </Button>
        <Button
          v-if="hasOpenAssessments"
          size="sm"
          variant="outline"
          @click="activeLabel = LABEL_OPEN">
          ❓ {{ $t('lesson.openTests') }}
        </Button>
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
          <div v-if="section.video && !activeLabel && !isInFocusMode" class="mb-4">
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
            v-if="section.explanation && !activeLabel && !isInFocusMode"
            class="bg-muted/60 p-4 rounded-lg mb-4 border-l-4 border-primary/30 prose prose-sm dark:prose-invert max-w-none"
            v-html="DOMPurify.sanitize(marked(section.explanation))">
          </div>

          <div v-if="section.image && !isInFocusMode" :class="activeLabel ? 'mb-3' : 'mb-4'">
            <img
              :src="resolveImagePath(section.image)"
              :alt="section.image_caption || section.title"
              class="w-full rounded-xl cursor-zoom-in shadow-md"
              @click="openLightbox(resolveImagePath(section.image), section.image_caption)"
            />
            <p v-if="section.image_caption && !activeLabel" class="text-xs text-muted-foreground mt-1.5 text-center italic">
              {{ section.image_caption }}
            </p>
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
            <div :class="example.image && !isInFocusMode ? 'flex flex-col sm:flex-row gap-4 items-start' : ''">
              <div :class="example.image && !isInFocusMode ? 'flex-1 min-w-0' : ''">
                <div class="text-lg font-semibold text-foreground mb-2 flex items-start gap-2">
                  <div class="flex-1">
                    <span v-if="isAssessmentCorrect(example)" class="text-green-600 dark:text-green-400 mr-1">✓</span>{{ example.q }}
                  </div>
                  <!-- Reveal answer button (only when answers are hidden and example has an answer) -->
                  <button
                    v-if="!isAssessmentType(example) && !settings.showAnswers && example.a"
                    :id="idx === 0 && exIdx === 0 ? 'tour-answer-reveal' : undefined"
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

            <template v-else-if="example.type === 'input' && !isInFocusMode">
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

            <template v-else-if="example.type === 'multiple-choice' && !isInFocusMode">
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

            <template v-else-if="example.type === 'select' && !isInFocusMode">
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
                :id="idx === 0 && exIdx === 0 && relIdx === 0 ? 'tour-learning-item' : undefined"
                variant="outline"
                @click.stop="handleItemClick(item[0])"
                :class="[
                  'transition-all duration-200 text-xs',
                  isInFocusMode ? 'cursor-default pointer-events-none opacity-60' : 'cursor-pointer',
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
                  'transition-all text-[10px] font-semibold px-2.5 py-0.5 rounded-full',
                  isInFocusMode ? 'cursor-default pointer-events-none opacity-60' : 'cursor-pointer',
                  activeLabel === label
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'bg-primary/10 text-primary dark:bg-primary/20 hover:bg-primary/20 dark:hover:bg-primary/30'
                ]">
                {{ label }}
              </Badge>
            </div>
              </div><!-- end text column -->

              <div v-if="example.image && !isInFocusMode" class="sm:w-2/5 w-full flex-shrink-0">
                <img
                  :src="resolveImagePath(example.image)"
                  :alt="example.image_caption || example.q"
                  class="w-full rounded-xl cursor-zoom-in shadow-sm"
                  @click.stop="openLightbox(resolveImagePath(example.image), example.image_caption)"
                />
              </div>
            </div>
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
    <button
      v-if="lesson && (isLoadingAudio || hasAudio)"
      id="tour-floating-play"
      @click="togglePlayPause"
      :disabled="isLoadingAudio"
      class="md:hidden fixed bottom-20 right-6 w-12 h-12 rounded-full shadow-lg z-50 flex items-center justify-center bg-primary text-white border-2 border-primary-foreground/30 disabled:opacity-50"
      :title="isLoadingAudio ? $t('nav.loading') : (isPlaying ? $t('nav.pause') : $t('nav.play'))"
      :aria-label="isLoadingAudio ? $t('nav.loadingAudio') : (isPlaying ? $t('nav.pauseAudio') : $t('nav.playAudio'))">
      <svg v-if="isLoadingAudio" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
      <svg v-else-if="isPlaying" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
      <svg v-else xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="6 3 20 12 6 21 6 3"/></svg>
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
  isLoadingAudio, isPlaying, isPaused, isInFocusMode,
  playbackFinished, hasAudio, currentItem,
  lessonMetadata: audioLessonMetadata,
  isTransitioning, lessonTransitionTick,
  play, pause,
  setWorkshopLessons,
  onSettingsChanged, onProgressChanged, onLessonMount, onLessonUnmount,
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

// Computed labels automatically attached to assessment examples. These are
// real label strings (not sentinels), so the standard label filter matches
// them like any other label. Kept short and untranslated so the URL query
// param is stable across languages.
const LABEL_TEST = 'Test'
const LABEL_OPEN = 'Open'

// Return the effective label list for an example: its own YAML labels plus
// computed labels for assessments (Test, and Open for unanswered).
function getEffectiveLabels(example, sectionIdx, exampleIdx) {
  const labels = Array.isArray(example.labels) ? [...example.labels] : []
  if (example.type && example.type !== 'qa') {
    labels.push(LABEL_TEST)
    const saved = getAnswer(learning.value, workshop.value, lessonNumber.value, sectionIdx, exampleIdx)
    if (!saved) labels.push(LABEL_OPEN)
  }
  return labels
}

// True if the lesson contains any assessment items — used to decide whether
// to show the "Take the test" buttons in the header.
const hasAssessments = computed(() => {
  if (!lesson.value || !lesson.value.sections) return false
  return lesson.value.sections.some(section =>
    section.examples.some(example => example.type && example.type !== 'qa')
  )
})

// True if the lesson has any unanswered assessments
const hasOpenAssessments = computed(() => {
  if (!lesson.value || !lesson.value.sections) return false
  return lesson.value.sections.some((section, sIdx) =>
    section.examples.some((example, eIdx) => {
      if (!example.type || example.type === 'qa') return false
      const saved = getAnswer(learning.value, workshop.value, lessonNumber.value, sIdx, eIdx)
      return !saved
    })
  )
})

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
  // Focus mode: no assessment submissions while playing.
  if (isInFocusMode.value) return
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
        // Label filter — matches against effective labels (YAML labels +
        // computed assessment labels like "Test" and "Open").
        if (activeLabel.value) {
          const effective = getEffectiveLabels(
            example, example._originalSectionIdx, example._originalExampleIdx
          )
          if (!effective.includes(activeLabel.value)) {
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
  // Focus mode: no label changes while playing (would rebuild the audio queue).
  if (isInFocusMode.value) return
  activeLabel.value = activeLabel.value === label ? null : label
}

function handleItemClick(itemId) {
  // Focus mode: no progress mutations while playing.
  if (isInFocusMode.value) return
  toggleItemLearned(learning.value, workshop.value, itemId)
}

function handleQuestionClick(example) {
  if (isAssessmentType(example)) return
  // Focus mode: no answer reveals while playing (purely visual, but keeps
  // the "locked-down read-only lesson" contract clean).
  if (isInFocusMode.value) return
  if (!settings.value.showAnswers && (!example.type || example.type === 'qa')) {
    const key = draftKey(example)
    revealedAnswers[key] = !revealedAnswers[key]
  }
}

function handleExampleClick(example) {
  if (isAssessmentType(example)) return
  // Focus mode: no jump-to-example clicks (would restart the chain from
  // a different position and drop the currently playing clip).
  if (isInFocusMode.value) return
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

// No double-click handler — play is always continuous. One click to
// play/pause. play() auto-enables continuous mode when a workshop
// context is available.

watch(currentItem, async (newItem) => {
  if (!newItem) return
  await nextTick()

  let element = null
  if (newItem.type === 'lesson-title') {
    window.scrollTo({ top: 0, behavior: 'smooth' })
    return
  } else if (newItem.type === 'section-title') {
    // When playing a section title, scroll to the first example of that
    // section so the section header is visible at the top and we don't
    // scroll again when the first example starts playing next. During
    // focus mode the descriptions/explanations are hidden, so the first
    // example sits right below the section header.
    const section = filteredSections.value.find(
      s => s._originalSectionIdx === newItem.sectionIdx
    )
    if (section && section.examples.length > 0) {
      const firstExample = section.examples[0]
      element = document.getElementById(
        `example-${firstExample._originalSectionIdx}-${firstExample._originalExampleIdx}`
      )
    }
    // Fallback: scroll to the section header itself
    if (!element) {
      const sectionHeaders = document.querySelectorAll('[id^="section-header-"]')
      for (const el of sectionHeaders) {
        const idx = parseInt(el.id.split('-')[2])
        const sec = filteredSections.value[idx]
        if (sec && sec._originalSectionIdx === newItem.sectionIdx) {
          element = el
          break
        }
      }
    }
  } else {
    element = document.getElementById(`example-${newItem.sectionIdx}-${newItem.exampleIdx}`)
  }

  if (element) {
    // Skip the scroll if the element is already fully visible — avoids
    // the redundant jitter when the first example plays right after its
    // section title (we already scrolled to it during the title).
    const rect = element.getBoundingClientRect()
    const isVisible = rect.top >= 0 && rect.bottom <= window.innerHeight
    if (!isVisible) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }
})

// Auto-advance to next lesson ONLY in continuous mode (double-click play).
// Single-click play stops at the end of the current lesson — the user can
// manually navigate to the next one via the footer button.
// In continuous mode, the composable handles the transition in-place via
// transitionToNextLesson → lessonTransitionTick, so this watcher only
// fires for the non-continuous case (which is now a no-op).
watch(playbackFinished, (finished) => {
  if (!finished) return
  // Nothing to do — lesson ended, playback stopped.
  // The footer "Next Lesson →" button is always visible for manual nav.
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

// Load a lesson by route params. Extracted from onMounted so we can call
// it again from a watcher on route.params.number — this is what makes the
// "no remount within a workshop" architecture work (fix B for #240).
async function loadCurrentLesson() {
  window.scrollTo(0, 0)
  const currentLearning = route.params.learning
  const currentWorkshop = route.params.workshop
  const currentLessonNumber = parseInt(route.params.number)

  // Reset per-lesson local state. We stay in the same component instance,
  // so refs from the previous lesson would otherwise leak through.
  lesson.value = null
  Object.keys(drafts).forEach(k => delete drafts[k])
  Object.keys(mcLive).forEach(k => delete mcLive[k])
  Object.keys(revealedAnswers).forEach(k => delete revealedAnswers[k])
  activeLabel.value = route.query.label || null

  // Capture stable values for onBeforeUnmount / cleanup. Route-param-based
  // computed refs can become stale/undefined during unmount.
  mountedLearning = currentLearning
  mountedWorkshop = currentWorkshop
  mountedLessonNumber = currentLessonNumber

  // loadAllLessonsForWorkshop is now memoized (fix A), so this is instant
  // on every navigation after the first within the same workshop.
  const lessons = await loadAllLessonsForWorkshop(currentLearning, currentWorkshop)
  allLessons.value = lessons

  // Share the lesson list with the audio composable so its built-in
  // resolver can find "the next lesson" in continuous mode without us
  // having to pass a fresh closure on every remount (fix C for #240).
  setWorkshopLessons(currentLearning, currentWorkshop, lessons)

  lesson.value = lessons.find(l => l.number === currentLessonNumber)

  if (lesson.value) {
    emit('update-title', `${t('results.lessonLabel')} ${lesson.value.number}`)

    // Track last visited lesson for profile "continue" feature
    setLastVisited(currentLearning, currentWorkshop, lesson.value.number)

    // Set footer navigation data
    setLessonFooter(currentLearning, currentWorkshop, nextLessonNumber.value)

    // Delegate init + autoplay to the pure composable so it can be
    // unit-tested. setWorkshopLessons was already called above, so the
    // composable can resolve the next lesson itself in continuous mode.
    await onLessonMount({
      lesson: lesson.value,
      learning: currentLearning,
      workshop: currentWorkshop,
      audioSettings: audioSettings.value,
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
}

// React to in-workshop lesson navigation WITHOUT a full remount.
// `:key="lesson-detail:<lang>/<workshop>"` in App.vue keeps the same
// component instance alive across lesson-to-lesson routing. When only the
// lesson number changes, this watcher rebinds the state instead of going
// through mount/unmount. Workshop changes still remount (different key).
watch(
  () => [route.params.learning, route.params.workshop, route.params.number],
  (next, prev) => {
    if (!prev) return // initial — onMounted handles it
    const [nl, nw, nn] = next
    const [pl, pw, pn] = prev
    if (nl === pl && nw === pw && nn === pn) return
    loadCurrentLesson()
  }
)

onMounted(async () => {
  document.addEventListener('keydown', handleKeydown)
  await loadCurrentLesson()
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', handleKeydown)

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
