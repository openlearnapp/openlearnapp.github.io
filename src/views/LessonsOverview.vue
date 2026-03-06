<template>
  <div>
    <!-- Source indicator for remote topics -->
    <div v-if="!isLoading && isRemote" class="mb-4 flex items-center justify-between text-sm">
      <div>
        <span v-if="workshopDescription" class="text-muted-foreground">{{ workshopDescription }}</span>
        <span v-if="workshopDescription && sourceLabel" class="text-muted-foreground/40 mx-2">·</span>
        <span v-if="sourceLabel" class="text-muted-foreground/60">{{ sourceLabel }}</span>
      </div>
      <Button
        variant="outline"
        size="sm"
        @click="copyShareLink">
        {{ copied ? $t('lesson.copied') : $t('lesson.share') }}
      </Button>
    </div>

    <!-- Lessons grid -->
    <div v-if="!isLoading && lessons.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      <Card
        v-for="lesson in lessons"
        :key="lesson.number"
        @click="openLesson(lesson.number)"
        class="p-6 cursor-pointer transition hover:-translate-y-1 hover:shadow-xl">
        <div class="flex items-center gap-3 mb-2">
          <div class="text-5xl font-bold text-primary flex-shrink-0 leading-none">
            {{ lesson.number }}
          </div>
          <div class="text-2xl font-semibold text-foreground">
            {{ lesson.title }}
          </div>
        </div>
        <div class="text-muted-foreground mb-2">
          {{ lesson.description || '' }}
        </div>
        <div class="text-primary font-semibold">
          {{ lesson.sections.length }} {{ $t('lesson.sections') }}
        </div>
      </Card>
    </div>

    <!-- Loading state -->
    <div v-else-if="isLoading" class="text-center py-8">
      <div class="text-2xl font-bold text-primary mb-4">
        {{ $t('lesson.loadingLessons') }}
      </div>
    </div>

    <!-- Empty state -->
    <div v-else class="text-center py-8">
      <div class="text-xl text-muted-foreground">
        {{ $t('lesson.noLessonsFound') }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useLessons } from '../composables/useLessons'
import { formatLangName } from '../utils/formatters'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

const router = useRouter()
const route = useRoute()
const emit = defineEmits(['update-title'])

const { loadAllLessonsForWorkshop, isRemoteWorkshop, getSourceForSlug, getWorkshopMeta } = useLessons()

const lessons = ref([])
const isLoading = ref(true)
const copied = ref(false)

const learning = computed(() => route.params.learning)
const workshop = computed(() => route.params.workshop)

const isRemote = computed(() => isRemoteWorkshop(workshop.value))
const workshopDescription = computed(() => {
  const meta = getWorkshopMeta(learning.value, workshop.value)
  return meta.description || null
})
const sourceLabel = computed(() => {
  const url = getSourceForSlug(workshop.value)
  if (!url) return ''
  try {
    const u = new URL(url)
    const path = u.pathname.replace(/\/index\.yaml$/, '')
    return u.hostname + path
  } catch { return '' }
})

async function copyShareLink() {
  const base = window.location.href.replace(/#.*$/, '')
  const url = `${base}#/${learning.value}/${workshop.value}/lessons`
  try {
    await navigator.clipboard.writeText(url)
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  } catch {}
}

function openLesson(number) {
  router.push({
    name: 'lesson-detail',
    params: {
      learning: learning.value,
      workshop: workshop.value,
      number
    }
  })
}

async function loadLessons() {
  if (!learning.value || !workshop.value) return

  isLoading.value = true
  lessons.value = await loadAllLessonsForWorkshop(learning.value, workshop.value)
  isLoading.value = false

  const meta = getWorkshopMeta(learning.value, workshop.value)
  console.log(`🎨 [LessonsOverview] ${workshop.value}: color="${meta.color}", primaryColor="${meta.primaryColor}"`)
  emit('update-title', meta.title || formatLangName(workshop.value))
}

watch([learning, workshop], () => {
  loadLessons()
}, { immediate: true })
</script>
