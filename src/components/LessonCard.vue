<template>
  <div
    :class="[
      'group relative rounded-2xl transition-all duration-300 cursor-pointer overflow-hidden',
      'hover:scale-[1.015] hover:shadow-xl',
      isNext
        ? 'ring-2 ring-primary shadow-lg shadow-primary/20 bg-white dark:bg-slate-800/90'
        : isCompleted
          ? 'ring-2 ring-green-400 dark:ring-green-500 bg-white dark:bg-slate-800/90'
          : 'ring-1 ring-black/[0.06] dark:ring-white/[0.08] hover:ring-primary/40 bg-white dark:bg-slate-800/80 hover:shadow-lg'
    ]"
    @click="$emit('open', lesson.number)">

    <!-- Header Image (16:9 aspect ratio, full width) -->
    <div v-if="imageUrl" class="relative aspect-video w-full overflow-hidden bg-slate-900">
      <img
        :src="imageUrl"
        :alt="lesson.title"
        class="w-full h-full object-contain" />
      <!-- Gradient overlay for text readability -->
      <div class="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/50 to-transparent"></div>
      <!-- Lesson number on image -->
      <div class="absolute bottom-2 left-3 flex items-center gap-2">
        <span class="text-xl font-black text-white/90 drop-shadow-md">{{ lesson.number }}</span>
        <span v-if="isNext" class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary text-primary-foreground shadow">
          {{ nextLabel }}
        </span>
      </div>
      <!-- Actions on image -->
      <div class="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          @click.stop="$emit('toggle-favorite', lesson.number)"
          :title="isFavorite ? 'Remove from favorites' : 'Add to favorites'"
          :class="['p-1.5 rounded-full backdrop-blur-sm transition-colors', isFavorite ? 'text-amber-400 bg-black/40' : 'text-white/60 bg-black/30 hover:text-amber-400']">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" :fill="isFavorite ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
        </button>
        <button
          @click.stop="$emit('toggle-completed', lesson.number)"
          :title="isCompleted ? 'Completed' : 'Mark as completed'"
          :class="['p-1.5 rounded-full backdrop-blur-sm transition-colors', isCompleted ? 'text-green-400 bg-black/40' : 'text-white/60 bg-black/30 hover:text-green-400']">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path v-if="isCompleted" d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline v-if="isCompleted" points="22 4 12 14.01 9 11.01" /><circle v-else cx="12" cy="12" r="10" /></svg>
        </button>
      </div>
    </div>

    <!-- No-image header -->
    <div v-else class="flex items-center justify-between px-4 pt-4">
      <div class="flex items-center gap-2">
        <span :class="['text-2xl font-black', isNext ? 'text-primary' : isCompleted ? 'text-green-500' : 'text-primary/50']">{{ lesson.number }}</span>
        <span v-if="isNext" class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary text-primary-foreground">{{ nextLabel }}</span>
      </div>
      <div class="flex gap-1">
        <button @click.stop="$emit('toggle-favorite', lesson.number)" :title="isFavorite ? 'Remove from favorites' : 'Add to favorites'" :class="['p-1.5 rounded-lg transition-colors', isFavorite ? 'text-amber-500' : 'text-muted-foreground/30 hover:text-amber-400']">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" :fill="isFavorite ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
        </button>
        <button @click.stop="$emit('toggle-completed', lesson.number)" :title="isCompleted ? 'Completed' : 'Mark as completed'" :class="['p-1.5 rounded-lg transition-colors', isCompleted ? 'text-green-500' : 'text-muted-foreground/30 hover:text-green-400']">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path v-if="isCompleted" d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline v-if="isCompleted" points="22 4 12 14.01 9 11.01" /><circle v-else cx="12" cy="12" r="10" /></svg>
        </button>
      </div>
    </div>

    <!-- Title + Description -->
    <div class="px-4 pt-3">
      <h3 :class="['text-[15px] font-bold leading-snug', isCompleted ? 'text-green-700 dark:text-green-300' : 'text-foreground']">
        {{ lesson.title }}
      </h3>
      <p v-if="lesson.description" class="text-[13px] text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
        {{ lesson.description }}
      </p>
    </div>

    <!-- Bottom row: Stats + Labels -->
    <div class="px-4 pb-3.5 pt-2">
      <!-- Stats row -->
      <div class="flex items-center gap-3 text-xs text-muted-foreground">
        <!-- Sections -->
        <span class="flex items-center gap-1">
          <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>
          {{ lesson.sections.length }} {{ sectionsLabel }}
        </span>

        <!-- Examples count -->
        <span v-if="exampleCount > 0" class="flex items-center gap-1">
          <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          {{ exampleCount }} {{ examplesLabel }}
        </span>

        <!-- Assessments count -->
        <span v-if="assessmentCount > 0" class="flex items-center gap-1 text-primary/70">
          <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
          {{ assessmentCount }} {{ quizzesLabel }}
        </span>

        <!-- Audio available -->
        <span v-if="hasAudio" class="flex items-center gap-1 text-primary/70" :title="audioLabel">
          <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/></svg>
        </span>

        <!-- Video available -->
        <span v-if="hasVideo" class="flex items-center gap-1 text-primary/70" :title="videoLabel">
          <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
        </span>
      </div>

      <!-- Labels / Tags -->
      <div v-if="uniqueLabels.length > 0" class="flex flex-wrap gap-1.5 mt-2">
        <span
          v-for="label in uniqueLabels"
          :key="label"
          class="text-[10px] font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary dark:bg-primary/20">
          {{ label }}
        </span>
      </div>

      <!-- Learning Items -->
      <div v-if="itemCount > 0" class="flex items-center gap-2 mt-2">
        <span class="flex items-center gap-1 text-xs text-muted-foreground">
          <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
          {{ learnedItemCount }}/{{ itemCount }} {{ itemsLabel }}
        </span>
        <!-- Items progress bar (green) -->
        <div class="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            class="h-full rounded-full bg-gradient-to-r from-green-500 to-green-400 transition-all duration-500"
            :style="{ width: itemProgressPercent + '%' }">
          </div>
        </div>
      </div>

      <!-- Assessment progress bar (green) -->
      <div v-if="exampleCount > 0" class="flex items-center gap-2 mt-1.5">
        <span class="text-xs text-muted-foreground">
          {{ answeredCount }}/{{ exampleCount }} {{ examplesLabel }}
        </span>
        <div class="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
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

// Count total learning items (rel entries) across all sections
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

// Count total examples across all sections
const exampleCount = computed(() => {
  if (!props.lesson.sections) return 0
  return props.lesson.sections.reduce((sum, s) => sum + (s.examples?.length || 0), 0)
})

// Count assessments (examples with type !== 'qa' and type is defined)
const assessmentCount = computed(() => {
  if (!props.lesson.sections) return 0
  return props.lesson.sections.reduce((sum, s) => {
    return sum + (s.examples?.filter(e => e.type && e.type !== 'qa').length || 0)
  }, 0)
})

// Check if any section has audio (lesson has _filename which means audio folder exists)
const hasAudio = computed(() => {
  return !!props.lesson._filename && props.lesson.sections?.some(s =>
    s.examples?.some(e => e.q || e.a)
  )
})

// Check if any section has video embed
const hasVideo = computed(() => {
  if (!props.lesson.sections) return false
  return props.lesson.sections.some(s =>
    s.video || s.examples?.some(e => e.video)
  )
})

// Collect unique labels from all examples
const uniqueLabels = computed(() => {
  if (!props.lesson.sections) return []
  const labels = new Set()
  props.lesson.sections.forEach(s => {
    s.examples?.forEach(e => {
      e.labels?.forEach(l => labels.add(l))
    })
  })
  return [...labels].slice(0, 5) // max 5 labels shown
})
</script>
