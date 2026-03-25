<template>
  <div
    :class="[
      'group relative flex items-stretch rounded-xl border transition-all duration-200 cursor-pointer overflow-hidden',
      isNext
        ? 'border-primary shadow-lg shadow-primary/10 bg-primary/5 dark:bg-primary/10'
        : isCompleted
          ? 'border-muted bg-muted/30 opacity-70'
          : 'border-border hover:border-primary/40 hover:shadow-md bg-card'
    ]"
    @click="$emit('open', lesson.number)">

    <!-- Thumbnail -->
    <div v-if="lesson.image" class="w-24 sm:w-32 flex-shrink-0 overflow-hidden">
      <img
        :src="imageUrl"
        :alt="lesson.title"
        class="w-full h-full object-cover" />
    </div>

    <!-- Content -->
    <div class="flex-1 p-4 min-w-0">
      <div class="flex items-start gap-3">
        <!-- Lesson number -->
        <div :class="[
          'text-2xl font-bold flex-shrink-0 leading-none mt-0.5',
          isNext ? 'text-primary' : isCompleted ? 'text-muted-foreground/50' : 'text-primary/70'
        ]">
          {{ lesson.number }}
        </div>

        <!-- Title + description -->
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2">
            <h3 :class="[
              'text-base font-semibold truncate',
              isCompleted ? 'text-muted-foreground line-through' : 'text-foreground'
            ]">
              {{ lesson.title }}
            </h3>
            <!-- Next lesson badge -->
            <span v-if="isNext" class="flex-shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full bg-primary text-primary-foreground">
              {{ nextLabel }}
            </span>
          </div>
          <p v-if="lesson.description" class="text-sm text-muted-foreground mt-0.5 line-clamp-1">
            {{ lesson.description }}
          </p>
          <div class="text-xs text-muted-foreground/60 mt-1">
            {{ lesson.sections.length }} {{ sectionsLabel }}
          </div>
        </div>
      </div>
    </div>

    <!-- Actions (right side) -->
    <div class="flex flex-col items-center justify-center gap-1 px-3 flex-shrink-0">
      <!-- Favorite toggle -->
      <button
        @click.stop="$emit('toggle-favorite', lesson.number)"
        :title="isFavorite ? removeFavoriteLabel : addFavoriteLabel"
        :class="[
          'p-1.5 rounded-lg transition-colors',
          isFavorite
            ? 'text-amber-500 hover:text-amber-600'
            : 'text-muted-foreground/30 hover:text-amber-400'
        ]">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" :fill="isFavorite ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      </button>

      <!-- Completed toggle -->
      <button
        @click.stop="$emit('toggle-completed', lesson.number)"
        :title="isCompleted ? markIncompleteLabel : markCompleteLabel"
        :class="[
          'p-1.5 rounded-lg transition-colors',
          isCompleted
            ? 'text-green-500 hover:text-green-600'
            : 'text-muted-foreground/30 hover:text-green-400'
        ]">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path v-if="isCompleted" d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline v-if="isCompleted" points="22 4 12 14.01 9 11.01" />
          <circle v-else cx="12" cy="12" r="10" />
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  lesson: { type: Object, required: true },
  status: { type: String, default: null }, // null, 'visited', 'completed'
  isFavorite: { type: Boolean, default: false },
  isNext: { type: Boolean, default: false },
  imageUrl: { type: String, default: '' },
  nextLabel: { type: String, default: 'Next' },
  sectionsLabel: { type: String, default: 'sections' },
  addFavoriteLabel: { type: String, default: 'Add to favorites' },
  removeFavoriteLabel: { type: String, default: 'Remove from favorites' },
  markCompleteLabel: { type: String, default: 'Mark as completed' },
  markIncompleteLabel: { type: String, default: 'Mark as incomplete' }
})

defineEmits(['open', 'toggle-favorite', 'toggle-completed'])

const isCompleted = computed(() => props.status === 'completed')
</script>
