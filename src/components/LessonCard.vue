<template>
  <div
    :class="[
      'group relative rounded-xl transition-all duration-200 cursor-pointer overflow-hidden',
      'hover:shadow-lg',
      isNext
        ? 'ring-2 ring-primary shadow-md shadow-primary/10 bg-white dark:bg-slate-800'
        : isCompleted
          ? 'ring-1 ring-green-400 dark:ring-green-500 bg-white dark:bg-slate-800'
          : 'ring-1 ring-black/[0.06] dark:ring-white/[0.08] hover:ring-primary/30 bg-white dark:bg-slate-800/80'
    ]"
    @click="$emit('open', lesson.number)">

    <!-- Mobile: image on top (full width) -->
    <div v-if="imageUrl" class="sm:hidden w-full h-32 overflow-hidden bg-slate-900">
      <img :src="imageUrl" :alt="lesson.title" class="w-full h-full object-contain" />
    </div>

    <!-- Main row: number | text | image (desktop) | actions -->
    <div class="flex items-stretch">
      <!-- Lesson number -->
      <div class="flex items-center justify-center w-12 sm:w-14 flex-shrink-0">
        <span :class="[
          'text-xl sm:text-2xl font-black',
          isNext ? 'text-primary' : isCompleted ? 'text-green-500 dark:text-green-400' : 'text-muted-foreground/40'
        ]">{{ lesson.number }}</span>
      </div>

      <!-- Title + Description + Stats -->
      <div class="flex-1 py-3 min-w-0">
        <!-- Title row -->
        <div class="flex items-center gap-2 mb-0.5">
          <h3 :class="['text-sm sm:text-[15px] font-bold leading-snug truncate', isCompleted ? 'text-green-700 dark:text-green-300' : 'text-foreground']">
            {{ lesson.title }}
          </h3>
          <span v-if="isNext" class="flex-shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary text-primary-foreground">
            {{ nextLabel }}
          </span>
        </div>

        <!-- Description -->
        <p v-if="lesson.description" class="text-xs sm:text-[13px] text-muted-foreground line-clamp-2 leading-relaxed mb-2">
          {{ lesson.description }}
        </p>

        <!-- Stats row (compact) -->
        <div class="flex items-center gap-2.5 text-[11px] text-muted-foreground">
          <span class="flex items-center gap-1">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>
            {{ lesson.sections.length }} {{ sectionsLabel }}
          </span>
          <span v-if="exampleCount > 0" class="flex items-center gap-1">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            {{ exampleCount }} {{ examplesLabel }}
          </span>
          <span v-if="assessmentCount > 0" class="flex items-center gap-1 text-primary/70">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
            {{ assessmentCount }} {{ quizzesLabel }}
          </span>
          <span v-if="hasAudio" class="flex items-center gap-1 text-primary/70" :title="audioLabel">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/></svg>
          </span>
        </div>

        <!-- Labels -->
        <div v-if="uniqueLabels.length > 0" class="flex flex-wrap gap-1 mt-1.5">
          <span
            v-for="label in uniqueLabels"
            :key="label"
            class="text-[10px] font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary dark:bg-primary/20">
            {{ label }}
          </span>
        </div>

        <!-- Progress bars -->
        <div v-if="itemCount > 0" class="flex items-center gap-2 mt-1.5">
          <span class="text-[11px] text-muted-foreground whitespace-nowrap">
            {{ learnedItemCount }}/{{ itemCount }} {{ itemsLabel }}
          </span>
          <div class="flex-1 h-1 bg-muted rounded-full overflow-hidden">
            <div
              class="h-full rounded-full bg-gradient-to-r from-green-500 to-green-400 transition-all duration-500"
              :style="{ width: itemProgressPercent + '%' }">
            </div>
          </div>
        </div>
        <div v-if="exampleCount > 0" class="flex items-center gap-2 mt-1">
          <span class="text-[11px] text-muted-foreground whitespace-nowrap">
            {{ answeredCount }}/{{ exampleCount }} {{ examplesLabel }}
          </span>
          <div class="flex-1 h-1 bg-muted rounded-full overflow-hidden">
            <div
              :class="[
                'h-full rounded-full transition-all duration-500',
                answeredCount >= exampleCount
                  ? 'bg-gradient-to-r from-green-500 to-green-400'
                  : answeredCount > 0
                    ? 'bg-gradient-to-r from-green-500/70 to-green-400/70'
                    : ''
              ]"
              :style="{ width: Math.round((answeredCount / exampleCount) * 100) + '%' }">
            </div>
          </div>
        </div>
      </div>

      <!-- Desktop: image thumbnail (right side) -->
      <div v-if="imageUrl" class="hidden sm:block w-28 md:w-36 flex-shrink-0 overflow-hidden bg-slate-900 rounded-r-xl">
        <img :src="imageUrl" :alt="lesson.title" class="w-full h-full object-contain" />
      </div>

      <!-- Actions: always visible (not on hover — mobile!) -->
      <div class="flex flex-col items-center justify-center gap-1 px-2 sm:px-3 flex-shrink-0">
        <button
          @click.stop="$emit('toggle-favorite', lesson.number)"
          :title="isFavorite ? removeFavoriteLabel : addFavoriteLabel"
          :class="['p-1.5 rounded-lg transition-colors', isFavorite ? 'text-amber-500 hover:text-amber-600' : 'text-muted-foreground/40 hover:text-amber-400']">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" :fill="isFavorite ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
        </button>
        <button
          @click.stop="$emit('toggle-completed', lesson.number)"
          :title="isCompleted ? markIncompleteLabel : markCompleteLabel"
          :class="['p-1.5 rounded-lg transition-colors', isCompleted ? 'text-green-500 hover:text-green-600' : 'text-muted-foreground/40 hover:text-green-400']">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path v-if="isCompleted" d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline v-if="isCompleted" points="22 4 12 14.01 9 11.01" /><circle v-else cx="12" cy="12" r="10" /></svg>
        </button>
      </div>
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
</script>
