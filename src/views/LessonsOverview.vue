<template>
  <div>
    <!-- Source indicator for remote topics -->
    <div v-if="!isLoading && isRemote" class="mb-4 flex items-center justify-between text-sm">
      <div>
        <span v-if="workshopDescription" class="text-muted-foreground">{{ workshopDescription }}</span>
        <span v-if="workshopDescription && sourceLabel" class="text-muted-foreground/40 mx-2">·</span>
        <a v-if="sourceLabel" :href="sourceUrl" target="_blank" rel="noopener" class="text-muted-foreground/60 hover:text-primary transition">{{ sourceLabel }}</a>
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
        class="cursor-pointer transition hover:-translate-y-1 hover:shadow-xl overflow-hidden">
        <div v-if="lesson.image" class="overflow-hidden aspect-[16/9] bg-accent/20">
          <img
            :src="resolveLessonImage(lesson)"
            :alt="lesson.title"
            class="w-full h-full object-cover" />
        </div>
        <div class="p-6">
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

const isRemote = computed(() => isRemoteWorkshop(learning.value, workshop.value))
const workshopDescription = computed(() => {
  const meta = getWorkshopMeta(learning.value, workshop.value)
  return meta.description || null
})
const sourceLabel = computed(() => {
  const url = getSourceForSlug(learning.value, workshop.value)
  if (!url) return ''
  try {
    const u = new URL(url)
    const path = u.pathname.replace(/\/index\.yaml$/, '')
    return u.hostname + path
  } catch { return '' }
})
const sourceUrl = computed(() => {
  const url = getSourceForSlug(learning.value, workshop.value)
  if (!url) return '#'
  try {
    const u = new URL(url)
    u.pathname = u.pathname.replace(/\/index\.yaml$/, '/')
    return u.toString()
  } catch { return '#' }
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

function resolveLessonImage(lesson) {
  const imagePath = lesson.image
  if (!imagePath) return ''
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://') || imagePath.startsWith('/')) {
    return imagePath
  }
  const baseUrl = import.meta.env.BASE_URL
  if (lesson._source?.type === 'url') {
    return `${lesson._source.path}/${imagePath}`
  }
  return `${baseUrl}lessons/${learning.value}/${workshop.value}/${lesson._filename}/${imagePath}`
}

function openLesson(number) {
  const meta = getWorkshopMeta(learning.value, workshop.value)
  const routeName = meta.mode === 'story' ? 'story-view' : 'lesson-detail'
  router.push({
    name: routeName,
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
