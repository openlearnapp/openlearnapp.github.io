<template>
  <div class="relative overflow-hidden">
    <!-- Vertical path line (always left) -->
    <div class="absolute top-0 bottom-0 left-5 w-0.5">
      <!-- Background line -->
      <div class="absolute inset-0 border-l-2 border-dashed border-zinc-200/60 dark:border-zinc-700/40"></div>
      <!-- Completed portion with glow -->
      <div
        v-if="completedRatio > 0"
        class="absolute top-0 left-0 w-full transition-all duration-1000 ease-out"
        :style="{ height: completedRatio * 100 + '%' }">
        <div class="w-full h-full bg-gradient-to-b from-primary via-primary/70 to-primary/30 rounded-full"></div>
        <div class="absolute inset-0 bg-primary/20 blur-sm -mx-0.5 rounded-full"></div>
      </div>
    </div>

    <!-- Lesson nodes -->
    <div class="relative space-y-4">
      <div
        v-for="lesson in sortedLessons"
        :key="lesson.number"
        :style="{ animationDelay: `${(lesson.number - 1) * 60}ms` }"
        class="relative flex items-start gap-4 min-w-0 animate-[fadeInUp_0.4s_ease_forwards] opacity-0">

        <!-- Node dot -->
        <div :class="[
          'relative z-10 flex-shrink-0 w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all duration-300',
          getNodeClass(lesson)
        ]">
          <!-- Pulse ring on next lesson -->
          <div v-if="isNextLesson(lesson.number)" class="absolute -inset-1 rounded-full border-2 border-primary/40 animate-ping"></div>
          <!-- Glow behind active nodes -->
          <div v-if="isNextLesson(lesson.number)" class="absolute -inset-1 rounded-full bg-primary/10 blur-sm"></div>
          <div v-if="getStatus(lesson.number) === 'completed'" class="absolute -inset-0.5 rounded-full bg-emerald-500/10 blur-sm"></div>

          <!-- Completed checkmark -->
          <svg v-if="getStatus(lesson.number) === 'completed'" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <!-- Visited dot -->
          <div v-else-if="getStatus(lesson.number) === 'visited'" class="w-2.5 h-2.5 rounded-full bg-current"></div>
          <!-- Next lesson number -->
          <span v-else-if="isNextLesson(lesson.number)" class="text-sm font-bold">{{ lesson.number }}</span>
          <!-- Open: number -->
          <span v-else class="text-sm font-bold">{{ lesson.number }}</span>
        </div>

        <!-- Card -->
        <div class="flex-1 min-w-0">
          <div class="relative">
            <div
              v-if="draggable && checkFavorite(lesson.number) && getStatus(lesson.number) !== 'completed'"
              class="absolute -left-5 top-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing text-zinc-300 dark:text-zinc-600 hover:text-zinc-500 transition-colors touch-none z-10"
              :data-drag-handle="lesson.number">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="9" cy="6" r="1"/><circle cx="15" cy="6" r="1"/>
                <circle cx="9" cy="12" r="1"/><circle cx="15" cy="12" r="1"/>
                <circle cx="9" cy="18" r="1"/><circle cx="15" cy="18" r="1"/>
              </svg>
            </div>
            <div class="flex-1 min-w-0">
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

  return lessons.sort((a, b) => {
    const aIsNext = a.number === nextNum
    const bIsNext = b.number === nextNum
    if (aIsNext && !bIsNext) return -1
    if (!aIsNext && bIsNext) return 1

    const aIsFav = favSet.has(a.number)
    const bIsFav = favSet.has(b.number)
    const aCompleted = props.getStatus(a.number) === 'completed'
    const bCompleted = props.getStatus(b.number) === 'completed'

    if (aIsFav && !aCompleted && (!bIsFav || bCompleted)) return -1
    if (bIsFav && !bCompleted && (!aIsFav || aCompleted)) return 1

    if (aCompleted && !bCompleted) return 1
    if (!aCompleted && bCompleted) return -1

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
    return 'border-emerald-500 bg-emerald-500 text-white shadow-sm shadow-emerald-500/30'
  }
  if (isNextLesson(lesson.number)) {
    return 'border-primary bg-primary text-white shadow-md shadow-primary/40'
  }
  if (status === 'visited') {
    return 'border-primary/50 bg-primary/5 dark:bg-primary/10 text-primary'
  }
  return 'border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500'
}
</script>
