<template>
  <div
    :class="[
      'group relative flex items-stretch rounded-2xl cursor-pointer overflow-hidden',
      'transition-all duration-300 ease-out',
      isNext
        ? 'bg-white dark:bg-zinc-800/95 shadow-lg shadow-primary/15 ring-2 ring-primary/50 hover:shadow-xl hover:shadow-primary/25 hover:-translate-y-1.5 hover:ring-primary/70'
        : isCompleted
          ? 'bg-gradient-to-r from-emerald-50/80 to-white dark:from-emerald-950/30 dark:to-zinc-800/90 shadow-sm hover:shadow-md hover:-translate-y-0.5'
          : 'bg-white dark:bg-zinc-800/80 shadow-sm hover:shadow-lg hover:shadow-black/8 dark:hover:shadow-black/25 hover:-translate-y-1'
    ]"
    :style="{ animationDelay: `${(lesson.number - 1) * 60}ms` }"
    @click="$emit('open', lesson.number)">

    <!-- Left accent bar -->
    <div :class="[
      'w-1 flex-shrink-0 rounded-l-2xl transition-all duration-300',
      isNext
        ? 'bg-gradient-to-b from-primary via-primary/80 to-primary/40'
        : isCompleted
          ? 'bg-gradient-to-b from-emerald-500 via-emerald-400 to-emerald-300'
          : status === 'visited'
            ? 'bg-gradient-to-b from-primary/40 to-primary/10'
            : 'bg-zinc-200/60 dark:bg-zinc-700/40 group-hover:bg-primary/30'
    ]"></div>

    <!-- Thumbnail -->
    <div v-if="imageUrl" class="relative flex-shrink-0 w-24 sm:w-28 overflow-hidden">
      <img
        :src="imageUrl"
        :alt="lesson.title"
        class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
      <div class="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-white/10 dark:to-zinc-800/20"></div>
    </div>
    <div v-else :class="[
      'relative flex-shrink-0 w-20 sm:w-24 flex flex-col items-center justify-center',
      isNext
        ? 'bg-primary/5 dark:bg-primary/10'
        : isCompleted
          ? 'bg-emerald-500/5 dark:bg-emerald-500/10'
          : 'bg-zinc-50 dark:bg-zinc-800/50'
    ]">
      <span :class="[
        'text-2xl font-black transition-all duration-300 group-hover:scale-110',
        isNext ? 'text-primary' : isCompleted ? 'text-emerald-500' : 'text-zinc-300 dark:text-zinc-600 group-hover:text-primary/60'
      ]">{{ lesson.number }}</span>
    </div>

    <!-- Content -->
    <div class="flex-1 min-w-0 py-3 px-3.5">
      <!-- Title + badge -->
      <div class="flex items-center gap-2">
        <h3 :class="[
          'text-[15px] font-bold truncate transition-colors duration-200',
          isCompleted
            ? 'text-emerald-700 dark:text-emerald-400'
            : 'text-foreground group-hover:text-primary dark:group-hover:text-primary'
        ]">
          {{ lesson.title }}
        </h3>
        <span v-if="isNext" class="flex-shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary text-primary-foreground leading-none shadow-sm shadow-primary/30">
          {{ nextLabel }}
        </span>
        <svg v-if="isCompleted" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="flex-shrink-0 text-emerald-500"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
      </div>

      <!-- Description -->
      <p v-if="lesson.description" class="text-[13px] text-muted-foreground/70 line-clamp-2 mt-1 leading-relaxed">
        {{ lesson.description }}
      </p>

      <!-- Stats + media -->
      <div class="flex items-center gap-1.5 mt-2 flex-wrap">
        <span v-if="statsLine" class="text-[11px] font-medium text-muted-foreground/60 bg-zinc-100/80 dark:bg-zinc-700/40 px-2 py-0.5 rounded-md">
          {{ statsLine }}
        </span>
        <span v-if="hasAudio" class="text-muted-foreground/40 bg-zinc-100/60 dark:bg-zinc-700/30 p-1 rounded-md" :title="audioLabel">
          <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
        </span>
        <span v-if="hasVideo" class="text-muted-foreground/40 bg-zinc-100/60 dark:bg-zinc-700/30 p-1 rounded-md" :title="videoLabel">
          <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
        </span>
        <span
          v-for="label in uniqueLabels.slice(0, 2)"
          :key="label"
          class="text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-primary/6 text-primary/60 dark:bg-primary/10 dark:text-primary/70">
          {{ label }}
        </span>
      </div>

      <!-- Segmented progress (one dot per section) -->
      <div v-if="lesson.sections && lesson.sections.length > 0 && overallProgress > 0" class="flex items-center gap-1 mt-2.5">
        <div
          v-for="(_, i) in lesson.sections"
          :key="i"
          :class="[
            'h-1.5 rounded-full transition-all duration-500',
            lesson.sections.length > 8 ? 'flex-1' : 'w-6',
            i < completedSections
              ? 'bg-emerald-500/80'
              : i === completedSections
                ? 'bg-primary/50'
                : 'bg-zinc-200/60 dark:bg-zinc-700/30'
          ]">
        </div>
        <span class="text-[10px] text-muted-foreground/50 ml-1">{{ overallProgress }}%</span>
      </div>
    </div>

    <!-- Action buttons -->
    <div class="flex flex-col items-center justify-center gap-0.5 pr-2 flex-shrink-0">
      <button
        @click.stop="$emit('toggle-favorite', lesson.number)"
        :class="[
          'p-2 rounded-xl transition-all duration-200 active:scale-90',
          isFavorite
            ? 'text-amber-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-500/10'
            : 'text-zinc-300 dark:text-zinc-600 hover:text-amber-400 hover:bg-amber-50/50 dark:hover:bg-amber-500/5'
        ]"
        :title="isFavorite ? removeFavoriteLabel : addFavoriteLabel">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" :fill="isFavorite ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
      </button>
      <button
        @click.stop="$emit('toggle-completed', lesson.number)"
        :class="[
          'p-2 rounded-xl transition-all duration-200 active:scale-90',
          isCompleted
            ? 'text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10'
            : 'text-zinc-300 dark:text-zinc-600 hover:text-emerald-400 hover:bg-emerald-50/50 dark:hover:bg-emerald-500/5'
        ]"
        :title="isCompleted ? markIncompleteLabel : markCompleteLabel">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path v-if="isCompleted" d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline v-if="isCompleted" points="22 4 12 14.01 9 11.01" /><circle v-else cx="12" cy="12" r="10" /></svg>
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  lesson: { type: Object, required: true },
  status: { type: String, default: null },
  isFavorite: { type: Boolean, default: false },
  isNext: { type: Boolean, default: false },
  imageUrl: { type: String, default: '' },
  answeredCount: { type: Number, default: 0 },
  learnedItemCount: { type: Number, default: 0 },
  nextLabel: { type: String, default: 'Next' },
  sectionsLabel: { type: String, default: 'sections' },
  examplesLabel: { type: String, default: 'examples' },
  quizzesLabel: { type: String, default: 'quizzes' },
  audioLabel: { type: String, default: 'Audio available' },
  videoLabel: { type: String, default: 'Video available' },
  addFavoriteLabel: { type: String, default: 'Add to favorites' },
  removeFavoriteLabel: { type: String, default: 'Remove from favorites' },
  markCompleteLabel: { type: String, default: 'Mark as completed' },
  markIncompleteLabel: { type: String, default: 'Mark as incomplete' },
  itemsLabel: { type: String, default: 'items learned' }
})

defineEmits(['open', 'toggle-favorite', 'toggle-completed'])

const isCompleted = computed(() => props.status === 'completed')

const itemCount = computed(() => {
  if (!props.lesson.sections) return 0
  let count = 0
  props.lesson.sections.forEach(s => {
    s.examples?.forEach(e => {
      count += e.rel?.length || 0
    })
  })
  return count
})

const itemProgressPercent = computed(() => {
  if (itemCount.value === 0) return 0
  return Math.round((props.learnedItemCount / itemCount.value) * 100)
})

const exampleCount = computed(() => {
  if (!props.lesson.sections) return 0
  return props.lesson.sections.reduce((sum, s) => sum + (s.examples?.length || 0), 0)
})

const assessmentCount = computed(() => {
  if (!props.lesson.sections) return 0
  return props.lesson.sections.reduce((sum, s) => {
    return sum + (s.examples?.filter(e => e.type && e.type !== 'qa').length || 0)
  }, 0)
})

const hasAudio = computed(() => {
  return !!props.lesson._filename && props.lesson.sections?.some(s =>
    s.examples?.some(e => e.q || e.a)
  )
})

const hasVideo = computed(() => {
  if (!props.lesson.sections) return false
  return props.lesson.sections.some(s =>
    s.video || s.examples?.some(e => e.video)
  )
})

const uniqueLabels = computed(() => {
  if (!props.lesson.sections) return []
  const labels = new Set()
  props.lesson.sections.forEach(s => {
    s.examples?.forEach(e => {
      e.labels?.forEach(l => labels.add(l))
    })
  })
  return [...labels].slice(0, 5)
})

const statsLine = computed(() => {
  const parts = []
  if (props.lesson.sections?.length) parts.push(`${props.lesson.sections.length} ${props.sectionsLabel}`)
  if (exampleCount.value > 0) parts.push(`${exampleCount.value} ${props.examplesLabel}`)
  if (assessmentCount.value > 0) parts.push(`${assessmentCount.value} ${props.quizzesLabel}`)
  return parts.join(' · ')
})

const overallProgress = computed(() => {
  let total = 0, done = 0
  if (itemCount.value > 0) { total += itemCount.value; done += props.learnedItemCount }
  if (exampleCount.value > 0) { total += exampleCount.value; done += props.answeredCount }
  if (total === 0) return 0
  return Math.round((done / total) * 100)
})

// Approximate completed sections based on overall progress
const completedSections = computed(() => {
  if (!props.lesson.sections) return 0
  return Math.floor((overallProgress.value / 100) * props.lesson.sections.length)
})
</script>
