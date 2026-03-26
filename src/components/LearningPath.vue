<template>
  <div class="relative">
    <!-- Vertical path line (always left) -->
    <div class="absolute top-0 bottom-0 left-5 w-0.5">
      <!-- Background line (full height, dashed for incomplete) -->
      <div class="absolute inset-0 border-l-2 border-dashed border-muted-foreground/20"></div>
      <!-- Completed portion (solid, gradient) -->
      <div
        v-if="completedRatio > 0"
        class="absolute top-0 left-0 w-full bg-gradient-to-b from-primary to-primary/60 transition-all duration-700 ease-out"
        :style="{ height: completedRatio * 100 + '%' }">
      </div>
    </div>

    <!-- Lesson nodes -->
    <div class="relative space-y-6">
      <div
        v-for="lesson in sortedLessons"
        :key="lesson.number"
        class="relative flex items-start gap-4">

        <!-- Node dot -->
        <div :class="[
          'relative z-10 flex-shrink-0 w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all duration-300',
          getNodeClass(lesson)
        ]">
          <!-- Completed checkmark -->
          <svg v-if="getStatus(lesson.number) === 'completed'" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <!-- Visited dot -->
          <div v-else-if="getStatus(lesson.number) === 'visited'" class="w-2.5 h-2.5 rounded-full bg-current"></div>
          <!-- Next lesson: number on filled background -->
          <span v-else-if="isNextLesson(lesson.number)" class="text-sm font-bold">{{ lesson.number }}</span>
          <!-- Open: show number -->
          <span v-else class="text-sm font-bold">{{ lesson.number }}</span>
        </div>

        <!-- Card -->
        <div class="flex-1">
          <!-- Drag handle for favorites -->
          <div class="flex items-center gap-1">
            <div
              v-if="draggable && checkFavorite(lesson.number) && getStatus(lesson.number) !== 'completed'"
              class="flex-shrink-0 cursor-grab active:cursor-grabbing text-muted-foreground/40 hover:text-muted-foreground touch-none"
              :data-drag-handle="lesson.number">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="9" cy="6" r="1"/><circle cx="15" cy="6" r="1"/>
                <circle cx="9" cy="12" r="1"/><circle cx="15" cy="12" r="1"/>
                <circle cx="9" cy="18" r="1"/><circle cx="15" cy="18" r="1"/>
              </svg>
            </div>
            <div class="flex-1">
              <slot
                name="card"
                :lesson="lesson"
                :status="getStatus(lesson.number)"
                :is-favorite="checkFavorite(lesson.number)"
                :is-next="isNextLesson(lesson.number)">
              </slot>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  lessons: { type: Array, required: true },
  nextLessonNumber: { type: Number, default: null },
  favorites: { type: Array, default: () => [] },
  getStatus: { type: Function, required: true },
  completedCount: { type: Number, default: 0 },
  draggable: { type: Boolean, default: false }
})

const emit = defineEmits(['reorder'])

const completedRatio = computed(() => {
  if (props.lessons.length === 0) return 0
  return props.completedCount / props.lessons.length
})

const sortedLessons = computed(() => {
  const lessons = [...props.lessons]
  const nextNum = props.nextLessonNumber
  const favSet = new Set(props.favorites)

  // Sort: next first, then favorites, then open/visited, then completed
  return lessons.sort((a, b) => {
    const aIsNext = a.number === nextNum
    const bIsNext = b.number === nextNum
    if (aIsNext && !bIsNext) return -1
    if (!aIsNext && bIsNext) return 1

    const aIsFav = favSet.has(a.number)
    const bIsFav = favSet.has(b.number)
    const aCompleted = props.getStatus(a.number) === 'completed'
    const bCompleted = props.getStatus(b.number) === 'completed'

    // Favorites before non-favorites (unless completed)
    if (aIsFav && !aCompleted && (!bIsFav || bCompleted)) return -1
    if (bIsFav && !bCompleted && (!aIsFav || aCompleted)) return 1

    // Completed at the end
    if (aCompleted && !bCompleted) return 1
    if (!aCompleted && bCompleted) return -1

    // Within same group: by favorite order or lesson number
    if (aIsFav && bIsFav) {
      return props.favorites.indexOf(a.number) - props.favorites.indexOf(b.number)
    }

    return a.number - b.number
  })
})

function isNextLesson(number) {
  return number === props.nextLessonNumber
}

function checkFavorite(number) {
  return props.favorites.includes(number)
}

function getNodeClass(lesson) {
  const status = props.getStatus(lesson.number)
  if (status === 'completed') {
    return 'border-green-500 bg-green-500 text-white'
  }
  if (isNextLesson(lesson.number)) {
    return 'border-primary bg-primary text-white'
  }
  if (status === 'visited') {
    return 'border-primary bg-background text-primary font-bold'
  }
  return 'border-muted-foreground bg-background text-foreground font-bold'
}
</script>
