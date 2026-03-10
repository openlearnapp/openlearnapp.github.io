<template>
  <div>
    <div v-if="!isLoading && lessons.length > 0">
      <!-- Lesson filter -->
      <div v-if="lessons.length > 1" class="flex flex-wrap gap-2 mb-5">
        <Button
          :variant="selectedLesson === null ? 'default' : 'outline'"
          size="sm"
          @click="selectedLesson = null">
          {{ $t('results.allLessons') }}
        </Button>
        <Button
          v-for="lesson in lessons"
          :key="lesson.number"
          :variant="selectedLesson === lesson.number ? 'default' : 'outline'"
          size="sm"
          @click="selectedLesson = lesson.number">
          {{ lesson.number }}
        </Button>
      </div>

      <!-- Summary header -->
      <Card class="p-5 mb-6">
        <div class="text-lg font-semibold text-foreground mb-2">
          {{ totalAnswered }} {{ $t('results.of') }} {{ totalAssessments }} {{ $t('results.assessmentsAnswered') }}
        </div>
        <div class="text-sm text-muted-foreground">
          {{ totalCorrect }} {{ $t('results.correct') }}, {{ totalWrong }} {{ $t('results.incorrect') }}, {{ totalUnanswered }} {{ $t('results.missing') }}
        </div>
        <div class="text-sm text-muted-foreground mt-1">
          {{ totalLearnedItems }} {{ $t('results.learningItemsLearned') }}
        </div>
      </Card>

      <!-- Per-lesson cards -->
      <Card v-for="entry in filteredEntries" :key="entry.lesson.number" class="p-5 mb-5">
        <CardHeader class="p-0 pb-3">
          <div class="flex items-center justify-between flex-wrap gap-2">
            <router-link
              :to="{ name: 'lesson-detail', params: { learning, workshop, number: entry.lesson.number } }"
              class="text-xl font-semibold text-primary hover:underline">
              {{ $t('results.lessonLabel') }} {{ entry.lesson.number }}: {{ entry.lesson.title }}
            </router-link>

            <!-- Sent status badge -->
            <Badge :variant="entry.sentStatus === 'changed' ? 'destructive' : entry.sentStatus === 'up-to-date' ? 'default' : 'secondary'">
              {{ entry.sentStatusLabel }}
            </Badge>
          </div>
        </CardHeader>
        <CardContent class="p-0">
          <!-- Last sent info -->
          <div v-if="entry.lastSent" class="text-xs text-muted-foreground mb-2">
            {{ $t('results.lastSent') }}: {{ formatDate(entry.lastSent.timestamp) }} {{ $t('results.via') }} {{ entry.lastSent.channel }}
          </div>

          <!-- Learning items stats -->
          <div v-if="entry.totalItems > 0" class="text-sm text-muted-foreground mb-3">
            {{ entry.learnedItems }}/{{ entry.totalItems }} {{ $t('results.itemsLearned') }}
          </div>

          <!-- Unlearned learning items (max 10) -->
          <div v-if="entry.unlearnedItems.length > 0" class="mb-3">
            <div class="text-sm font-medium text-muted-foreground mb-1">{{ $t('results.unlearnedItems') }}:</div>
            <div class="flex flex-wrap gap-1.5">
              <Badge
                v-for="item in entry.unlearnedItems.slice(0, 10)"
                :key="item.id"
                variant="outline"
                class="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                @click="toggleItem(item.id)">
                {{ item.term }}
              </Badge>
              <span v-if="entry.unlearnedItems.length > 10" class="text-xs text-muted-foreground self-center">
                +{{ entry.unlearnedItems.length - 10 }} {{ $t('results.moreItems') }}
              </span>
            </div>
          </div>

          <!-- Assessment answers per section -->
          <div v-for="section in entry.sections" :key="section.index" class="mb-4">
            <div class="font-semibold text-primary mb-2">{{ section.title }}</div>

            <div v-for="ex in section.examples" :key="ex.key" class="ml-4 mb-1 text-sm cursor-pointer hover:bg-accent/50 rounded px-1 -mx-1 transition"
              @click="goToExample(entry.lesson.number, ex.key)">
              <template v-if="ex.answered">
                <span v-if="ex.correct === true" class="text-green-600 dark:text-green-400 font-mono">[ok]</span>
                <span v-else-if="ex.correct === false" class="text-red-600 dark:text-red-400 font-mono">[!!]</span>
                <span v-else class="text-muted-foreground font-mono">[--]</span>
                <span class="text-foreground ml-1">{{ ex.question }}</span>
                <span class="text-muted-foreground mx-1">&rarr;</span>
                <span class="text-foreground/80 italic">{{ ex.displayAnswer }}</span>
                <span v-if="ex.correct === false && ex.expected" class="text-red-500 dark:text-red-400 ml-1">({{ $t('results.expected') }}: {{ ex.expected }})</span>
              </template>
              <template v-else>
                <span class="text-muted-foreground font-mono">[  ]</span>
                <span class="text-muted-foreground ml-1">{{ ex.question }}</span>
                <span class="text-muted-foreground ml-1">({{ $t('results.notAnswered') }})</span>
              </template>
            </div>
          </div>

          <!-- No assessments in this lesson -->
          <div v-if="entry.assessmentCount === 0" class="text-sm text-muted-foreground italic">
            {{ $t('results.noAssessments') }}
          </div>
        </CardContent>
      </Card>

      <!-- Send to coach button -->
      <Card v-if="coachEmail" class="p-5 mb-5">
        <div class="text-sm text-muted-foreground mb-3">
          {{ $t('results.sendResultsTo') }} <strong class="text-foreground">{{ coachName || coachEmail }}</strong> {{ $t('results.viaEmail') }}
        </div>
        <a :href="mailtoLink" @click="onSendEmail">
          <Button class="bg-green-600 hover:bg-green-700 text-white">
            {{ $t('results.sendViaEmail') }}
          </Button>
        </a>
      </Card>
    </div>

    <!-- Loading state -->
    <div v-else-if="isLoading" class="text-center py-8">
      <div class="text-2xl font-bold text-primary mb-4">
        {{ $t('results.loadingResults') }}
      </div>
    </div>

    <!-- Empty state -->
    <div v-else class="text-center py-8">
      <div class="text-xl text-muted-foreground">
        {{ $t('results.noLessonsFound') }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useLessons } from '../composables/useLessons'
import { useAssessments } from '../composables/useAssessments'
import { useProgress } from '../composables/useProgress'
import { formatLangName } from '../utils/formatters'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const emit = defineEmits(['update-title'])

const { loadAllLessonsForWorkshop, getWorkshopMeta } = useLessons()
const { getAnswer, getLastSent, recordSent, getLessonHash } = useAssessments()
const { isItemLearned, toggleItemLearned, progress } = useProgress()

const lessons = ref([])
const isLoading = ref(true)
const selectedLesson = ref(null)

const learning = computed(() => route.params.learning)
const workshop = computed(() => route.params.workshop)

// Coach info from workshop metadata
const coachEmail = computed(() => {
  const meta = getWorkshopMeta(learning.value, workshop.value)
  return meta.coach?.email || null
})

const coachName = computed(() => {
  const meta = getWorkshopMeta(learning.value, workshop.value)
  return meta.coach?.name || null
})

function formatDate(iso) {
  try {
    const d = new Date(iso)
    return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  } catch {
    return iso
  }
}

function goToExample(lessonNumber, exKey) {
  router.push({
    name: 'lesson-detail',
    params: { learning: learning.value, workshop: workshop.value, number: lessonNumber },
    query: { scrollTo: `example-${exKey}` }
  })
}

// Toggle a learning item
function toggleItem(itemId) {
  toggleItemLearned(learning.value, workshop.value, itemId)
}

// Build structured data for each lesson
const allEntries = computed(() => {
  return lessons.value.map(lesson => {
    const lessonKey = `${learning.value}:${workshop.value}:${lesson.number}`
    const sections = []
    let assessmentCount = 0
    let totalItems = 0
    let learnedItems = 0
    const itemsSeen = new Set()
    const unlearnedItems = []

    lesson.sections.forEach((section, sIdx) => {
      const examples = []

      section.examples.forEach((example, eIdx) => {
        // Count learning items
        if (example.rel) {
          example.rel.forEach(item => {
            const id = item[0]
            if (!itemsSeen.has(id)) {
              itemsSeen.add(id)
              totalItems++
              if (isItemLearned(learning.value, workshop.value, id)) {
                learnedItems++
              } else {
                unlearnedItems.push({ id, term: item[0], translation: item[1] || '' })
              }
            }
          })
        }

        // Only show assessment-type examples
        const type = example.type || 'qa'
        if (type === 'qa') return

        assessmentCount++
        const saved = getAnswer(learning.value, workshop.value, lesson.number, sIdx, eIdx)

        examples.push({
          key: `${sIdx}-${eIdx}`,
          question: example.q,
          type,
          answered: !!saved,
          correct: saved?.correct ?? null,
          displayAnswer: formatSavedAnswer(saved, example),
          expected: saved?.correct === false ? formatExpectedAnswer(example) : null
        })
      })

      if (examples.length > 0) {
        sections.push({
          index: sIdx,
          title: section.title,
          examples
        })
      }
    })

    // Sent status tracking
    const workshopProgress = progress.value[`${learning.value}:${workshop.value}`] || {}
    const currentHash = getLessonHash(lessonKey, workshopProgress)
    const lastSent = getLastSent(lessonKey)
    let sentStatus = 'never-sent'
    let sentStatusLabel = t('results.neverSent')
    if (lastSent) {
      if (lastSent.hash === currentHash) {
        sentStatus = 'up-to-date'
        sentStatusLabel = t('results.upToDate')
      } else {
        sentStatus = 'changed'
        sentStatusLabel = t('results.changed')
      }
    }

    return {
      lesson,
      sections,
      assessmentCount,
      totalItems,
      learnedItems,
      unlearnedItems,
      lastSent,
      sentStatus,
      sentStatusLabel,
      currentHash,
      lessonKey
    }
  })
})

// Filter by selected lesson
const filteredEntries = computed(() => {
  if (selectedLesson.value === null) return allEntries.value
  return allEntries.value.filter(e => e.lesson.number === selectedLesson.value)
})

// Aggregate totals (based on filtered view)
const totalAssessments = computed(() => filteredEntries.value.reduce((sum, e) => sum + e.assessmentCount, 0))
const totalAnswered = computed(() => filteredEntries.value.reduce((sum, e) =>
  sum + e.sections.reduce((s, sec) => s + sec.examples.filter(ex => ex.answered).length, 0), 0))
const totalCorrect = computed(() => filteredEntries.value.reduce((sum, e) =>
  sum + e.sections.reduce((s, sec) => s + sec.examples.filter(ex => ex.correct === true).length, 0), 0))
const totalWrong = computed(() => filteredEntries.value.reduce((sum, e) =>
  sum + e.sections.reduce((s, sec) => s + sec.examples.filter(ex => ex.correct === false).length, 0), 0))
const totalUnanswered = computed(() => totalAssessments.value - totalAnswered.value)
const totalLearnedItems = computed(() => filteredEntries.value.reduce((sum, e) => sum + e.learnedItems, 0))

// Record sent when email is clicked
function onSendEmail() {
  for (const entry of filteredEntries.value) {
    recordSent(entry.lessonKey, 'email', entry.currentHash)
  }
}

// Generate plain-text report (uses filtered view)
function generateReport() {
  const lines = []
  const workshopName = formatLangName(workshop.value)
  const date = new Date().toISOString().slice(0, 10)

  lines.push(`Open Learn - ${t('results.title')}`)
  lines.push(`Workshop: ${workshopName}`)
  lines.push(`Date: ${date}`)
  lines.push('')

  for (const entry of filteredEntries.value) {
    lines.push(`${t('results.lessonLabel')} ${entry.lesson.number}: ${entry.lesson.title}`)
    if (entry.totalItems > 0) {
      lines.push(`  ${t('results.itemsLearned')}: ${entry.learnedItems}/${entry.totalItems}`)
    }

    if (entry.assessmentCount === 0) {
      lines.push(`  ${t('results.noAssessments')}`)
    } else {
      const answered = entry.sections.reduce((s, sec) => s + sec.examples.filter(ex => ex.answered).length, 0)
      const correct = entry.sections.reduce((s, sec) => s + sec.examples.filter(ex => ex.correct === true).length, 0)
      lines.push(`  ${t('results.assessmentsAnswered')}: ${answered}/${entry.assessmentCount}, ${correct} ${t('results.correct')}`)
    }

    for (const section of entry.sections) {
      lines.push('')
      lines.push(`  Section: ${section.title}`)
      for (const ex of section.examples) {
        if (ex.answered) {
          const mark = ex.correct === true ? 'ok' : ex.correct === false ? '!!' : '--'
          let line = `    [${mark}] ${ex.question} -> ${ex.displayAnswer}`
          if (ex.expected) line += ` (${t('results.expected')}: ${ex.expected})`
          lines.push(line)
        } else {
          lines.push(`    [  ] ${ex.question} -> (${t('results.notAnswered')})`)
        }
        lines.push('')
      }
    }
    lines.push('')
  }

  return lines.join('\n')
}

// Build mailto: link
const mailtoLink = computed(() => {
  if (!coachEmail.value) return '#'
  const workshopName = formatLangName(workshop.value)
  const subject = `${t('results.title')} - ${workshopName}`
  const body = generateReport()
  return `mailto:${encodeURIComponent(coachEmail.value)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
})

// Format a saved answer for display
function formatSavedAnswer(saved, example) {
  if (!saved) return ''
  const type = saved.type || example.type || 'qa'

  if (type === 'input') {
    return saved.answer
  }
  if (type === 'select' && example.options) {
    return example.options[saved.answer]?.text || String(saved.answer)
  }
  if (type === 'multiple-choice' && example.options && Array.isArray(saved.answer)) {
    return saved.answer.map(i => example.options[i]?.text || String(i)).join(', ')
  }
  return String(saved.answer)
}

// Format expected answer for display (on incorrect)
function formatExpectedAnswer(example) {
  const type = example.type || 'qa'
  if (type === 'input') {
    return Array.isArray(example.a) ? example.a[0] : example.a
  }
  if (type === 'select' && example.options) {
    const idx = example.options.findIndex(o => o.correct)
    return idx >= 0 ? example.options[idx].text : null
  }
  if (type === 'multiple-choice' && example.options) {
    return example.options.filter(o => o.correct).map(o => o.text).join(', ')
  }
  return null
}

async function loadData() {
  if (!learning.value || !workshop.value) return
  isLoading.value = true
  lessons.value = await loadAllLessonsForWorkshop(learning.value, workshop.value)
  isLoading.value = false
  emit('update-title', t('results.title'))
}

watch([learning, workshop], () => {
  loadData()
}, { immediate: true })
</script>
