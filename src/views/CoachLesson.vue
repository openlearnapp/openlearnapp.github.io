<template>
  <div>
    <!-- No coach lessons -->
    <div v-if="coachLessonList.length === 0" class="text-center py-12">
      <div class="text-5xl mb-4">🤖</div>
      <p class="text-lg font-semibold text-foreground mb-2">{{ $t('coachLesson.noLessons') }}</p>
      <p class="text-sm text-muted-foreground mb-6">{{ $t('coachLesson.noLessonsDesc') }}</p>
      <router-link :to="{ name: 'coach', params: { learning, workshop } }">
        <Button>{{ $t('coachLesson.goToCoach') }}</Button>
      </router-link>
    </div>

    <div v-else>
      <!-- Lesson selector -->
      <div v-if="coachLessonList.length > 1" class="flex flex-wrap gap-2 mb-5">
        <Button
          v-for="(lesson, idx) in coachLessonList"
          :key="idx"
          :variant="selectedIndex === idx ? 'default' : 'outline'"
          size="sm"
          @click="selectedIndex = idx">
          {{ idx + 1 }}. {{ lesson.title }}
        </Button>
      </div>

      <div v-if="currentLesson">
        <!-- Lesson header -->
        <div class="mb-4 p-4 rounded-lg border border-primary/20 bg-primary/5">
          <div class="flex items-center gap-2 mb-1">
            <span class="text-xs font-medium text-primary uppercase tracking-wide">{{ $t('coachLesson.generatedBy') }}</span>
          </div>
          <h2 class="text-xl font-bold text-foreground">{{ currentLesson.title }}</h2>
          <p v-if="currentLesson.description" class="text-sm text-muted-foreground mt-1">{{ currentLesson.description }}</p>
          <p class="text-xs text-muted-foreground mt-2">{{ formatDate(currentLesson._generatedAt) }}</p>
        </div>

        <!-- Sections -->
        <div v-for="(section, sIdx) in currentLesson.sections" :key="sIdx" class="mb-6">
          <h3 class="text-lg font-semibold text-foreground mb-3">{{ section.title }}</h3>

          <div v-if="section.explanation" class="prose prose-sm dark:prose-invert max-w-none mb-4 p-4 rounded-lg bg-muted/40"
            v-html="renderMarkdown(section.explanation)" />

          <!-- Examples -->
          <div v-for="(example, eIdx) in section.examples" :key="eIdx" class="mb-3 p-3 rounded-lg border">
            <div class="font-medium text-foreground">{{ example.q }}</div>
            <div v-if="example.a" class="text-sm text-muted-foreground mt-1">→ {{ example.a }}</div>
          </div>
        </div>

        <!-- Delete lesson -->
        <div class="mt-6 pt-4 border-t border-border">
          <Button variant="ghost" size="sm" class="text-muted-foreground hover:text-red-500" @click="deleteLesson(selectedIndex)">
            {{ $t('coachLesson.delete') }}
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { marked } from 'marked'
import { useCoach } from '../composables/useCoach'
import { Button } from '@/components/ui/button'

const route = useRoute()
const { t } = useI18n()
const emit = defineEmits(['update-title'])

const { getCoachLessons, clearCoachLessons, coachLessons, loadChatHistory } = useCoach()

const learning = computed(() => route.params.learning)
const workshop = computed(() => route.params.workshop)
const selectedIndex = ref(0)

const coachLessonList = computed(() => getCoachLessons(learning.value, workshop.value))
const currentLesson = computed(() => coachLessonList.value[selectedIndex.value] || null)

function renderMarkdown(text) {
  return marked(text || '')
}

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleString(undefined, { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  } catch { return iso }
}

function deleteLesson(idx) {
  const key = `${learning.value}:${workshop.value}`
  if (coachLessons.value[key]) {
    coachLessons.value[key].splice(idx, 1)
    if (coachLessons.value[key].length === 0) delete coachLessons.value[key]
    localStorage.setItem('coachLessons', JSON.stringify(coachLessons.value))
    if (selectedIndex.value >= coachLessonList.value.length) selectedIndex.value = 0
  }
}

loadChatHistory()

watch([learning, workshop], () => {
  selectedIndex.value = 0
  emit('update-title', t('coachLesson.title'))
}, { immediate: true })
</script>
