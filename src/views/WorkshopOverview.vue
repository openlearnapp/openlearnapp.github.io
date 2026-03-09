<template>
  <div>
    <!-- Loading state -->
    <div v-if="isLoading" class="text-center py-12">
      <div class="inline-block w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-4"></div>
      <p class="text-muted-foreground">Loading...</p>
    </div>

    <div v-else>
      <!-- Workshop added notification (different language) -->
      <div v-if="addedNotice" class="mb-4 p-4 rounded-lg border border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20">
        <p class="text-sm text-blue-800 dark:text-blue-200">
          <span class="font-semibold">{{ addedNotice.name }}</span> {{ t('addedNotice') }}
          <span class="font-medium">{{ addedNotice.languages }}</span>
        </p>
        <button @click="dismissNotice" class="mt-2 text-xs text-blue-600 dark:text-blue-400 hover:underline">
          {{ t('dismiss') }}
        </button>
      </div>

      <!-- Workshop count -->
      <div class="flex items-center justify-between mb-3">
        <label class="text-sm font-medium text-muted-foreground">
          {{ t('workshops') }}
        </label>
        <span class="text-xs text-muted-foreground">
          {{ workshops.length }} {{ workshops.length === 1 ? 'Workshop' : 'Workshops' }}
        </span>
      </div>

      <!-- Workshop cards grid -->
      <div v-if="workshops.length > 0" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card
          v-for="ws in workshops"
          :key="ws"
          @click="openWorkshop(ws)"
          class="group cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 hover:border-primary/50 overflow-hidden"
          :style="getWorkshopCardStyle(ws)">

          <!-- Workshop thumbnail image (if available) -->
          <div v-if="getWorkshopImage(ws)" class="overflow-hidden h-36 bg-accent/20">
            <img
              :src="getWorkshopImage(ws)"
              :alt="getWorkshopTitle(ws)"
              class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
          </div>
          <!-- Color accent bar (shown when no image) -->
          <div v-else class="h-1.5 bg-gradient-to-r from-primary to-secondary" :style="getWorkshopBarStyle(ws)"></div>

          <div class="p-5">
            <div class="flex items-start justify-between gap-2 mb-2">
              <h3 class="font-semibold text-foreground text-lg group-hover:text-primary transition-colors leading-tight" :style="getWorkshopTitleStyle(ws)">
                {{ getWorkshopTitle(ws) }}
              </h3>
              <button
                @click.stop="copyWorkshopLink(ws)"
                class="p-1.5 rounded-md hover:bg-accent transition flex-shrink-0"
                :style="getWorkshopTitleStyle(ws)"
                title="Copy link">
                <svg v-if="copiedWorkshop !== ws" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                <svg v-else xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-green-500"><polyline points="20 6 9 17 4 12"/></svg>
              </button>
            </div>

            <p v-if="getWorkshopDescription(ws)" class="text-sm text-muted-foreground leading-relaxed mb-3">
              {{ getWorkshopDescription(ws) }}
            </p>

            <div v-if="isRemoteWorkshop(ws)" class="flex items-center justify-between">
              <a
                :href="getWorkshopSourceUrl(ws)"
                target="_blank"
                rel="noopener"
                @click.stop
                class="text-xs text-muted-foreground/50 hover:text-primary truncate max-w-[60%] transition">
                {{ getWorkshopSourceLabel(ws) }}
              </a>
              <button
                v-if="!isDefaultWorkshop(ws)"
                @click.stop="removeSource(ws)"
                class="p-1 rounded text-muted-foreground/40 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition text-xs"
                title="Remove">
                Remove
              </button>
            </div>
          </div>
        </Card>
      </div>

      <!-- No workshops -->
      <p v-else class="text-muted-foreground text-center py-8">
        {{ t('noWorkshops') }}
      </p>

      <!-- Workshop discovery -->
      <div v-if="availableWorkshops.length > 0" class="mt-6">
        <label class="block text-sm font-medium text-muted-foreground mb-3">
          {{ t('discover') }}
        </label>
        <div class="flex flex-col gap-2">
          <Card
            v-for="workshop in availableWorkshops"
            :key="workshop.url"
            class="flex items-center justify-between p-3 border-dashed">
            <div>
              <div class="font-semibold text-foreground text-sm">{{ workshop.title }}</div>
              <div class="text-xs text-muted-foreground">{{ workshop.host }}</div>
            </div>
            <a
              :href="'#/add?source=' + encodeURIComponent(workshop.url)"
              class="px-3 py-1 rounded text-sm font-semibold text-primary border border-primary hover:bg-accent transition">
              Add
            </a>
          </Card>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useLessons } from '../composables/useLessons'
import { useLanguage } from '../composables/useLanguage'
import { formatLangName } from '../utils/formatters'
import { Card } from '@/components/ui/card'

const emit = defineEmits(['update-title'])
const router = useRouter()
const route = useRoute()

const { availableContent, isLoading, loadAvailableContent, loadWorkshopsForLanguage, removeContentSource, isRemoteWorkshop, isDefaultSource, getSourceForSlug, getWorkshopMeta, getContentSources } = useLessons()
const { selectedLanguage, setLanguage } = useLanguage()

const copiedWorkshop = ref(null)
const addedNotice = ref(null)

const knownWorkshops = []

const learning = computed(() => route.params.learning)
const isDE = computed(() => learning.value === 'deutsch')

function t(key) {
  const strings = {
    workshops: isDE.value ? 'Workshops' : 'Workshops',
    noWorkshops: isDE.value ? 'Keine Workshops verfügbar.' : 'No workshops available.',
    discover: isDE.value ? 'Workshops entdecken' : 'Discover Workshops',
    addedNotice: isDE.value ? 'wurde hinzugefügt. Verfügbar in: ' : 'was added. Available in: ',
    dismiss: isDE.value ? 'Ausblenden' : 'Dismiss',
  }
  return strings[key] || key
}

function dismissNotice() {
  addedNotice.value = null
  // Clear query params
  router.replace({ name: 'workshop-overview', params: { learning: learning.value } })
}

const workshops = computed(() => {
  if (!learning.value) return []
  return Object.keys(availableContent.value[learning.value] || {})
})

const availableWorkshops = computed(() => {
  const sources = getContentSources()
  return knownWorkshops.filter(w => !sources.includes(w.url))
})

function getWorkshopCardStyle(workshop) {
  const meta = getWorkshopMeta(learning.value, workshop)
  if (!meta.primaryColor) return {}
  return { borderColor: `hsl(${meta.primaryColor} / 0.3)` }
}

function getWorkshopBarStyle(workshop) {
  const meta = getWorkshopMeta(learning.value, workshop)
  if (!meta.color) return {}
  // Use the hue/saturation from color but with visible lightness for the bar
  const parts = meta.color.split(/\s+/)
  if (parts.length === 3) {
    const lightness = parseFloat(parts[2])
    // If too light (>80%), darken it for visibility
    if (lightness > 80) {
      return { background: `hsl(${parts[0]} ${parts[1]} ${lightness - 40}%)` }
    }
  }
  return { background: `hsl(${meta.color})` }
}

function getWorkshopTitleStyle(workshop) {
  const meta = getWorkshopMeta(learning.value, workshop)
  if (!meta.primaryColor) return {}
  return { color: `hsl(${meta.primaryColor})` }
}

function getWorkshopImage(workshop) {
  const meta = getWorkshopMeta(learning.value, workshop)
  return meta.image || null
}

function getWorkshopTitle(workshop) {
  const meta = getWorkshopMeta(learning.value, workshop)
  return meta.title || formatLangName(workshop)
}

function getWorkshopDescription(workshop) {
  const meta = getWorkshopMeta(learning.value, workshop)
  return meta.description || null
}

function getWorkshopSourceLabel(workshop) {
  const sourceUrl = getSourceForSlug(workshop)
  if (!sourceUrl) return ''
  try {
    const url = new URL(sourceUrl)
    const path = url.pathname.replace(/\/index\.yaml$/, '')
    return url.hostname + path
  } catch {
    return sourceUrl
  }
}

function isDefaultWorkshop(workshop) {
  const sourceUrl = getSourceForSlug(workshop)
  return sourceUrl ? isDefaultSource(sourceUrl) : false
}

function getWorkshopSourceUrl(workshop) {
  const sourceUrl = getSourceForSlug(workshop)
  if (!sourceUrl) return '#'
  try {
    const url = new URL(sourceUrl)
    url.pathname = url.pathname.replace(/\/index\.yaml$/, '/')
    return url.toString()
  } catch {
    return '#'
  }
}

async function copyWorkshopLink(workshop) {
  const base = window.location.href.replace(/#.*$/, '')
  const url = `${base}#/${learning.value}/${workshop}/lessons`
  try {
    await navigator.clipboard.writeText(url)
    copiedWorkshop.value = workshop
    setTimeout(() => { copiedWorkshop.value = null }, 2000)
  } catch {
    // Clipboard API not available
  }
}

function openWorkshop(workshop) {
  localStorage.setItem('lastWorkshop', workshop)
  router.push({
    name: 'lessons-overview',
    params: { learning: learning.value, workshop }
  })
}

async function removeSource(workshopSlug) {
  const sourceUrl = getSourceForSlug(workshopSlug)
  if (sourceUrl) {
    removeContentSource(sourceUrl)
  }
  await loadAvailableContent()
  if (learning.value) {
    await loadWorkshopsForLanguage(learning.value)
  }
}

function cleanupLegacySources() {
  const legacyUrls = [
    'https://felixboehm.github.io/workshop-open-learn/index.yaml'
  ]
  const sources = getContentSources()
  const cleaned = sources.filter(s => !legacyUrls.includes(s))
  if (cleaned.length !== sources.length) {
    localStorage.setItem('contentSources', JSON.stringify(cleaned))
  }
}

onMounted(async () => {
  cleanupLegacySources()
  // Show notification if redirected from add source with language mismatch
  if (route.query.added && route.query.availableIn) {
    addedNotice.value = {
      name: route.query.added,
      languages: route.query.availableIn
    }
  }
  // Sync language state with route param
  if (learning.value && learning.value !== selectedLanguage.value) {
    setLanguage(learning.value)
  }
  if (Object.keys(availableContent.value).length === 0) {
    await loadAvailableContent()
  }
  if (learning.value) {
    await loadWorkshopsForLanguage(learning.value)
  }
  // Debug: log colors for all workshops
  for (const ws of workshops.value) {
    const meta = getWorkshopMeta(learning.value, ws)
    console.log(`🎨 [WorkshopOverview] ${ws}: color="${meta.color}", primaryColor="${meta.primaryColor}"`)
  }
  emit('update-title', 'Workshops')
})
</script>
