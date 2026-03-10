<template>
  <div v-if="allItems.length > 0">
    <Card class="p-4 mb-5">
      <div class="flex flex-wrap gap-4 items-center">
        <Select :model-value="String(selectedLesson)" @update:model-value="selectedLesson = $event === 'all' ? 'all' : parseInt($event)">
          <SelectTrigger class="w-auto min-w-[200px]">
            <SelectValue :placeholder="$t('items.allLessons')" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{{ $t('items.allLessons') }}</SelectItem>
            <SelectItem v-for="lesson in availableLessons" :key="lesson.number" :value="String(lesson.number)">
              {{ $t('items.lessonLabel') }} {{ lesson.number }}: {{ lesson.title }}
            </SelectItem>
          </SelectContent>
        </Select>

        <div class="flex items-center gap-4">
          <label class="flex items-center gap-2 cursor-pointer">
            <Checkbox :checked="groupByLearnStatus" @update:checked="groupByLearnStatus = $event" />
            <Label>{{ $t('items.groupByStatus') }}</Label>
          </label>

          <label v-if="showGroupByLessonOption" class="flex items-center gap-2 cursor-pointer">
            <Checkbox :checked="groupByLesson" @update:checked="groupByLesson = $event" />
            <Label>{{ $t('items.groupByLesson') }}</Label>
          </label>
        </div>
      </div>
    </Card>

    <div v-if="activeLabel" class="mb-4 flex items-center gap-2">
      <Badge class="bg-primary text-primary-foreground px-3 py-1">
        {{ activeLabel }}
        <button @click="activeLabel = null" class="ml-2 hover:opacity-70">✕</button>
      </Badge>
    </div>

    <div v-if="!groupByLesson && !groupByLearnStatus">
      <div class="grid grid-cols-2 md:flex md:flex-wrap gap-2">
        <Badge
          v-for="item in filteredItems"
          :key="item.id"
          variant="outline"
          @click="toggleItemLearned(learning, workshop, item.term)"
          :class="[
            'px-3 py-2 text-sm transition cursor-pointer flex flex-col items-start h-auto',
            isItemLearned(learning, workshop, item.term)
              ? 'bg-green-100 dark:bg-green-900 border-green-400 dark:border-green-600 line-through opacity-60'
              : 'hover:border-green-400 dark:hover:border-green-600'
          ]">
          <div class="font-semibold text-primary">{{ item.term }}</div>
          <div class="text-foreground">{{ item.translation }}</div>
          <div v-if="item.context" class="text-muted-foreground text-xs">{{ item.context }}</div>
          <span v-if="isItemLearned(learning, workshop, item.term)" class="ml-1">✓</span>
        </Badge>
      </div>
    </div>

    <div v-else-if="groupByLearnStatus && !groupByLesson">
      <div class="mb-6">
        <h2 class="text-2xl font-bold text-foreground mb-3">
          {{ $t('items.unlearned') }} ({{ unlearnedItems.length }})
        </h2>
        <div class="grid grid-cols-2 md:flex md:flex-wrap gap-2">
          <Badge
            v-for="item in unlearnedItems"
            :key="item.id"
            variant="outline"
            @click="toggleItemLearned(learning, workshop, item.term)"
            class="px-3 py-2 text-sm transition cursor-pointer flex flex-col items-start h-auto hover:border-green-400 dark:hover:border-green-600">
            <div class="font-semibold text-primary">{{ item.term }}</div>
            <div class="text-foreground">{{ item.translation }}</div>
            <div v-if="item.context" class="text-muted-foreground text-xs">{{ item.context }}</div>
          </Badge>
        </div>
      </div>

      <div>
        <h2 class="text-2xl font-bold text-foreground mb-3">
          {{ $t('items.learned') }} ({{ learnedItems.length }})
        </h2>
        <div class="grid grid-cols-2 md:flex md:flex-wrap gap-2">
          <Badge
            v-for="item in learnedItems"
            :key="item.id"
            variant="outline"
            @click="toggleItemLearned(learning, workshop, item.term)"
            class="px-3 py-2 text-sm transition cursor-pointer flex flex-col items-start h-auto bg-green-100 dark:bg-green-900 border-green-400 dark:border-green-600 line-through opacity-60">
            <div class="font-semibold text-primary">{{ item.term }}</div>
            <div class="text-foreground">{{ item.translation }}</div>
            <div v-if="item.context" class="text-muted-foreground text-xs">{{ item.context }}</div>
            <span class="ml-1">✓</span>
          </Badge>
        </div>
      </div>
    </div>

    <div v-else-if="groupByLesson">
      <div v-for="lesson in lessonsWithItems" :key="lesson.number" class="mb-6">
        <h2 class="text-2xl font-bold text-primary mb-3 cursor-pointer hover:underline" @click="openLesson(lesson.number)">
          {{ $t('items.lessonLabel') }} {{ lesson.number }}: {{ lesson.title }}
        </h2>

        <div v-if="groupByLearnStatus">
          <div class="mb-4">
            <h3 class="text-lg font-semibold text-foreground mb-2">
              {{ $t('items.unlearned') }} ({{ lesson.unlearnedItems.length }})
            </h3>
            <div class="grid grid-cols-2 md:flex md:flex-wrap gap-2">
              <Badge
                v-for="item in lesson.unlearnedItems"
                :key="item.id"
                variant="outline"
                @click="toggleItemLearned(learning, workshop, item.term)"
                class="px-3 py-2 text-sm transition cursor-pointer flex flex-col items-start h-auto hover:border-green-400 dark:hover:border-green-600">
                <div class="font-semibold text-primary">{{ item.term }}</div>
                <div class="text-foreground">{{ item.translation }}</div>
                <div v-if="item.context" class="text-muted-foreground text-xs">{{ item.context }}</div>
              </Badge>
            </div>
          </div>

          <div>
            <h3 class="text-lg font-semibold text-foreground mb-2">
              {{ $t('items.learned') }} ({{ lesson.learnedItems.length }})
            </h3>
            <div class="grid grid-cols-2 md:flex md:flex-wrap gap-2">
              <Badge
                v-for="item in lesson.learnedItems"
                :key="item.id"
                variant="outline"
                @click="toggleItemLearned(learning, workshop, item.term)"
                class="px-3 py-2 text-sm transition cursor-pointer flex flex-col items-start h-auto bg-green-100 dark:bg-green-900 border-green-400 dark:border-green-600 line-through opacity-60">
                <div class="font-semibold text-primary">{{ item.term }}</div>
                <div class="text-foreground">{{ item.translation }}</div>
                <div v-if="item.context" class="text-muted-foreground text-xs">{{ item.context }}</div>
                <span class="ml-1">✓</span>
              </Badge>
            </div>
          </div>
        </div>

        <div v-else>
          <div class="grid grid-cols-2 md:flex md:flex-wrap gap-2">
            <Badge
              v-for="item in lesson.items"
              :key="item.id"
              variant="outline"
              @click="toggleItemLearned(learning, workshop, item.term)"
              :class="[
                'px-3 py-2 text-sm transition cursor-pointer flex flex-col items-start h-auto',
                isItemLearned(learning, workshop, item.term)
                  ? 'bg-green-100 dark:bg-green-900 border-green-400 dark:border-green-600 line-through opacity-60'
                  : 'hover:border-green-400 dark:hover:border-green-600'
              ]">
              <div class="font-semibold text-primary">{{ item.term }}</div>
              <div class="text-foreground">{{ item.translation }}</div>
              <div v-if="item.context" class="text-muted-foreground text-xs">{{ item.context }}</div>
              <span v-if="isItemLearned(learning, workshop, item.term)" class="ml-1">✓</span>
            </Badge>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div v-else class="text-center py-8">
    <div class="text-2xl font-bold text-primary mb-4">
      {{ allItems.length === 0 && !loading ? $t('items.noItems') : $t('items.loadingItems') }}
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useLessons } from '../composables/useLessons'
import { useProgress } from '../composables/useProgress'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const emit = defineEmits(['update-title'])

const { loadAllLessonsForWorkshop } = useLessons()
const { isItemLearned, toggleItemLearned } = useProgress()

const learning = computed(() => route.params.learning)
const workshop = computed(() => route.params.workshop)
const lessonNumber = computed(() => route.params.number ? parseInt(route.params.number) : null)

const allItems = ref([])
const availableLessons = ref([])
const selectedLesson = ref(lessonNumber.value || 'all')
const groupByLearnStatus = ref(true)
const groupByLesson = ref(lessonNumber.value ? false : true)
const loading = ref(true)
const activeLabel = ref(route.query.label || null)

const showGroupByLessonOption = computed(() => {
  return selectedLesson.value === 'all'
})

const filteredItems = computed(() => {
  let items = allItems.value
  if (selectedLesson.value !== 'all') {
    items = items.filter(item => item.lessonNumber === selectedLesson.value)
  }
  if (activeLabel.value) {
    items = items.filter(item => item.labels && item.labels.includes(activeLabel.value))
  }
  return items
})

const unlearnedItems = computed(() => {
  return filteredItems.value.filter(item => !isItemLearned(learning.value, workshop.value, item.term))
})

const learnedItems = computed(() => {
  return filteredItems.value.filter(item => isItemLearned(learning.value, workshop.value, item.term))
})

const lessonsWithItems = computed(() => {
  if (selectedLesson.value !== 'all') {
    const lesson = availableLessons.value.find(l => l.number === selectedLesson.value)
    if (!lesson) return []

    const lessonItems = filteredItems.value.filter(item => item.lessonNumber === lesson.number)
    return [{
      ...lesson,
      items: lessonItems,
      unlearnedItems: lessonItems.filter(item => !isItemLearned(learning.value, workshop.value, item.term)),
      learnedItems: lessonItems.filter(item => isItemLearned(learning.value, workshop.value, item.term))
    }]
  }

  return availableLessons.value.map(lesson => {
    const lessonItems = allItems.value.filter(item => item.lessonNumber === lesson.number)
    return {
      ...lesson,
      items: lessonItems,
      unlearnedItems: lessonItems.filter(item => !isItemLearned(learning.value, workshop.value, item.term)),
      learnedItems: lessonItems.filter(item => isItemLearned(learning.value, workshop.value, item.term))
    }
  }).filter(lesson => lesson.items.length > 0)
})

function openLesson(number) {
  router.push({
    name: 'lesson-detail',
    params: { learning: learning.value, workshop: workshop.value, number }
  })
}

async function loadItems() {
  loading.value = true

  const currentLearning = learning.value
  const currentTeaching = workshop.value
  const currentLessonNumber = lessonNumber.value

  const lessons = await loadAllLessonsForWorkshop(currentLearning, currentTeaching)
  availableLessons.value = lessons

  const items = []
  lessons.forEach(lesson => {
    if (lesson.sections) {
      lesson.sections.forEach(section => {
        if (section.examples) {
          section.examples.forEach(example => {
            if (example.rel && example.rel.length > 0) {
              example.rel.forEach(relItem => {
                items.push({
                  id: `${lesson.number}-${relItem[0]}`,
                  term: relItem[0],
                  translation: relItem[1] || '',
                  context: relItem[2] || '',
                  labels: example.labels || [],
                  lessonNumber: lesson.number,
                  lessonTitle: lesson.title
                })
              })
            }
          })
        }
      })
    }
  })

  const uniqueItems = []
  const seenTerms = new Set()
  items.forEach(item => {
    if (!seenTerms.has(item.term)) {
      seenTerms.add(item.term)
      uniqueItems.push(item)
    }
  })

  allItems.value = uniqueItems
  loading.value = false

  selectedLesson.value = currentLessonNumber || 'all'
  groupByLesson.value = currentLessonNumber ? false : true

  emit('update-title', t('nav.learningItems'))
}

watch([learning, workshop, lessonNumber], async () => {
  await loadItems()
}, { immediate: true })

watch(selectedLesson, (newValue) => {
  const currentNumber = lessonNumber.value
  if ((newValue === 'all' && !currentNumber) || (newValue === currentNumber)) {
    return
  }

  if (newValue === 'all') {
    router.replace({
      name: 'learning-items',
      params: { learning: learning.value, workshop: workshop.value }
    })
  } else {
    router.replace({
      name: 'learning-items',
      params: { learning: learning.value, workshop: workshop.value, number: newValue }
    })
  }
})
</script>
