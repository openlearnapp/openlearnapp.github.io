<template>
  <div class="relative">
    <!-- Vertical path line (center on desktop, left on mobile) -->
    <div class="absolute top-0 bottom-0 left-5 sm:left-1/2 sm:-translate-x-px w-0.5">
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
        v-for="(lesson, index) in sortedLessons"
        :key="lesson.number"
        :class="[
          'relative flex items-start gap-4',
          // Desktop: alternate left/right
          'sm:gap-0',
          index % 2 === 0 ? 'sm:flex-row' : 'sm:flex-row-reverse'
        ]">

        <!-- Node dot -->
        <div :class="[
          'relative z-10 flex-shrink-0 w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all duration-300',
          'sm:absolute sm:left-1/2 sm:-translate-x-1/2',
          getNodeClass(lesson)
        ]">
          <!-- Completed checkmark -->
          <svg v-if="getStatus(lesson.number) === 'completed'" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <!-- Visited dot -->
          <div v-else-if="getStatus(lesson.number) === 'visited'" class="w-2.5 h-2.5 rounded-full bg-current"></div>
          <!-- Next lesson pulse -->
          <div v-else-if="isNextLesson(lesson.number)" class="w-3 h-3 rounded-full bg-primary animate-pulse"></div>
          <!-- Open: empty -->
          <span v-else class="text-xs font-bold">{{ lesson.number }}</span>
        </div>

        <!-- Card -->
        <div :class="[
          'flex-1 ml-2',
          // Desktop positioning
          'sm:ml-0',
          index % 2 === 0 ? 'sm:mr-[calc(50%+1.5rem)] sm:pr-0' : 'sm:ml-[calc(50%+1.5rem)] sm:pl-0'
        ]">
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
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  lessons: { type: Array, required: true },
  nextLessonNumber: { type: Number, default: null },
  favorites: { type: Array, default: () => [] },
  getStatus: { type: Function, required: true },
  completedCount: { type: Number, default: 0 }
})

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
    return 'border-primary bg-primary/10 text-primary'
  }
  if (status === 'visited') {
    return 'border-primary/50 bg-background text-primary/50'
  }
  return 'border-muted-foreground/30 bg-background text-muted-foreground/40'
}
</script>
