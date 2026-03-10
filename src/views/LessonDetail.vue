<template>
  <div>
    <div v-if="lesson">
      <h2 class="text-3xl font-bold text-foreground mb-3">
        {{ lesson.title }}
      </h2>
      <p v-if="lesson.description" class="text-muted-foreground mb-5 text-lg">
        {{ lesson.description }}
      </p>

      <!-- Sections -->
      <Card
        v-for="(section, idx) in filteredSections"
        :key="idx"
        class="p-5 mb-5">
        <CardHeader class="p-0 pb-4">
          <CardTitle class="text-2xl text-primary">
            {{ section.title }}
          </CardTitle>
        </CardHeader>
        <CardContent class="p-0">
          <div v-if="section.video" class="mb-4">
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

          <div v-if="section.image" class="mb-4">
            <img
              :src="resolveImagePath(section.image)"
              :alt="section.image_caption || section.title"
              class="w-full rounded-lg object-cover max-h-96 cursor-zoom-in shadow-sm"
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
            v-if="section.explanation"
            class="bg-muted p-4 rounded mb-4 prose prose-sm dark:prose-invert max-w-none"
            v-html="DOMPurify.sanitize(marked(section.explanation))">
          </div>

          <div
            v-for="(example, exIdx) in section.examples"
            :key="exIdx"
            :id="`example-${example._originalSectionIdx}-${example._originalExampleIdx}`"
            @click="handleExampleClick(example)"
            :class="[
              'p-4 mb-3 rounded transition',
              isAssessmentType(example) ? '' : 'cursor-pointer',
              isCurrentlyReading(example) && isPlaying
                ? 'ring-4 ring-yellow-400 dark:ring-yellow-600'
                : '',
              isCurrentlyReading(example) && isPaused
                ? 'ring-4 ring-orange-400 dark:ring-orange-600'
                : '',
              isAssessmentCorrect(example)
                ? 'bg-green-50 dark:bg-green-900/30 border-l-4 border-green-500'
                : example.labels
                  ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500'
                  : 'bg-orange-50 dark:bg-orange-900/20 border-l-4 border-orange-500'
            ]">
            <div :class="example.image ? 'flex gap-4' : ''">
              <div :class="example.image ? 'flex-1 min-w-0' : ''">
                <div class="text-lg font-semibold text-foreground mb-2">
                  <span v-if="isAssessmentCorrect(example)" class="text-green-600 dark:text-green-400 mr-1">✓</span>{{ example.q }}
                </div>

            <template v-if="!example.type || example.type === 'qa'">
              <div
                v-show="settings.showAnswers"
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

            <div v-if="settings.showLearningItems && example.rel && example.rel.length > 0" class="flex flex-wrap gap-2 mb-3">
              <Badge
                v-for="(item, relIdx) in example.rel"
                :key="relIdx"
                variant="outline"
                @click.stop="handleItemClick(item[0])"
                :class="[
                  'cursor-pointer transition',
                  isItemLearned(learning, workshop, item[0])
                    ? 'bg-green-100 dark:bg-green-900 border-green-400 dark:border-green-600 line-through opacity-60'
                    : 'hover:border-green-400 dark:hover:border-green-600'
                ]">
                <span class="font-semibold text-primary">
                  {{ item[0] }}
                </span>
                <span class="text-foreground ml-1">
                  • {{ item.slice(1).join(' • ') }}
                </span>
                <span v-if="isItemLearned(learning, workshop, item[0])" class="ml-1">✓</span>
              </Badge>
            </div>

            <div v-if="settings.showLabels && example.labels" class="flex gap-1">
              <Badge
                v-for="label in example.labels"
                :key="label">
                {{ label }}
              </Badge>
            </div>
              </div><!-- end flex-1 text column -->

              <div v-if="example.image" class="flex-shrink-0 w-32 sm:w-40">
                <img
                  :src="resolveImagePath(example.image)"
                  :alt="example.image_caption || example.q"
                  class="w-full rounded-lg object-cover cursor-zoom-in shadow-sm"
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

    <!-- Floating play/pause button for mobile -->
    <Button
      v-if="lesson"
      size="icon"
      @click="togglePlayPause"
      class="md:hidden fixed bottom-6 right-6 w-16 h-16 rounded-full shadow-lg text-3xl z-50"
      :title="isPlaying ? $t('nav.pause') : $t('nav.play')"
      :aria-label="isPlaying ? $t('nav.pauseAudio') : $t('nav.playAudio')">
      {{ isPlaying ? '⏸' : '▶️' }}
    </Button>
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

const { loadAllLessonsForWorkshop } = useLessons()
const { settings } = useSettings()
const { isItemLearned, toggleItemLearned, areAllItemsLearned, progress } = useProgress()
const { isPlaying, isPaused, currentItem, initializeAudio, jumpToExample, cleanup, play, pause } = useAudio()
const { getAnswer, saveAnswer, validateAnswer } = useAssessments()
const { setLessonFooter, clearLessonFooter } = useFooter()

const lesson = ref(null)
const allLessons = ref([])
const drafts = reactive({})
const mcLive = reactive({})
const lightbox = reactive({ open: false, src: '', caption: '' })

function isYouTubeUrl(url) {
  return /(?:youtube\.com|youtu\.be)/.test(url)
}

function normalizeVideoUrl(url) {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?]+)/)
  if (match) return `https://www.youtube.com/embed/${match[1]}`
  if (url.includes('youtube.com/embed/')) return url
  return url
}

function resolveVideoPath(videoPath) {
  if (videoPath.startsWith('http://') || videoPath.startsWith('https://') || videoPath.startsWith('/')) {
    return videoPath
  }
  const baseUrl = import.meta.env.BASE_URL
  if (lesson.value?._source?.type === 'url') {
    return `${lesson.value._source.path}/${videoPath}`
  }
  const filename = lesson.value?._filename || `${String(lesson.value?.number).padStart(2, '0')}-lesson`
  return `${baseUrl}lessons/${learning.value}/${workshop.value}/${filename}/${videoPath}`
}

function resolveImagePath(imagePath) {
  if (!imagePath) return ''
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://') || imagePath.startsWith('/')) {
    return imagePath
  }
  const baseUrl = import.meta.env.BASE_URL
  if (lesson.value?._source?.type === 'url') {
    return `${lesson.value._source.path}/${imagePath}`
  }
  const filename = lesson.value?._filename || `${String(lesson.value?.number).padStart(2, '0')}-lesson`
  return `${baseUrl}lessons/${learning.value}/${workshop.value}/${filename}/${imagePath}`
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

function isAssessmentCorrect(example) {
  if (!isAssessmentType(example)) return false
  const sub = getSubmission(example)
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
  validateMcLive(example)
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
    if (!Array.isArray(userAnswer) || userAnswer.length === 0) return
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

function handleItemClick(itemId) {
  toggleItemLearned(learning.value, workshop.value, itemId)
}

function handleExampleClick(example) {
  if (isAssessmentType(example)) return

  const originalSectionIdx = example._originalSectionIdx
  const originalExampleIdx = example._originalExampleIdx

  if (isPlaying.value) {
    jumpToExample(originalSectionIdx, originalExampleIdx, settings.value)
  } else {
    jumpToExample(originalSectionIdx, originalExampleIdx, settings.value)
  }
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
    play(settings.value)
  }
}

watch(currentItem, async (newItem) => {
  if (!newItem) return
  await nextTick()
  const elementId = `example-${newItem.sectionIdx}-${newItem.exampleIdx}`
  const element = document.getElementById(elementId)
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }
})

// Keep footer in sync with next lesson number
watch(nextLessonNumber, (val) => {
  if (lesson.value) {
    setLessonFooter(learning.value, workshop.value, val)
  }
})

watch(
  () => [settings.value.hideLearnedExamples, settings.value.readAnswers],
  async () => {
    if (lesson.value) {
      await initializeAudio(lesson.value, learning.value, workshop.value, settings.value)
    }
  },
  { deep: true }
)

watch(
  progress,
  async () => {
    if (lesson.value && settings.value.hideLearnedExamples) {
      await initializeAudio(lesson.value, learning.value, workshop.value, settings.value)
    }
  },
  { deep: true }
)

onMounted(async () => {
  const currentLearning = route.params.learning
  const currentWorkshop = route.params.workshop
  const currentLessonNumber = parseInt(route.params.number)

  const lessons = await loadAllLessonsForWorkshop(currentLearning, currentWorkshop)
  allLessons.value = lessons

  lesson.value = lessons.find(l => l.number === currentLessonNumber)

  if (lesson.value) {
    emit('update-title', `${t('results.lessonLabel')} ${lesson.value.number}`)

    // Set footer navigation data
    setLessonFooter(currentLearning, currentWorkshop, nextLessonNumber.value)

    await initializeAudio(lesson.value, currentLearning, currentWorkshop, settings.value)
    restoreDraftsFromSaved()
  }
})

onBeforeUnmount(() => {
  cleanup()
  clearLessonFooter()
  closeLightbox()
})
</script>
