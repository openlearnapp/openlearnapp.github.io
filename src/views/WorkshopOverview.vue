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

      <!-- Filter chips -->
      <div class="mb-3">
        <div v-if="allLabels.length > 0" class="flex flex-wrap gap-2">
          <button
            v-for="label in allLabels"
            :key="label"
            @click="toggleFilter(label)"
            class="px-3 py-1 rounded-full text-xs font-medium transition-all"
            :class="activeFilters.has(label)
              ? 'bg-primary text-primary-foreground'
              : 'bg-accent text-muted-foreground hover:text-foreground'">
            {{ getDisplayLabel(label) }}
            <span class="ml-1 opacity-60">{{ labelCount(label) }}</span>
          </button>
        </div>
      </div>

      <!-- Workshop cards grid -->
      <div v-if="filteredWorkshops.length > 0" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card
          v-for="ws in filteredWorkshops"
          :key="ws"
          @click="openWorkshop(ws)"
          class="group cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 hover:border-primary/50 overflow-hidden"
          :style="getWorkshopCardStyle(ws)">

          <!-- Color accent bar at top (always shown) -->
          <div class="h-1.5 bg-gradient-to-r from-primary to-secondary" :style="getWorkshopBarStyle(ws)"></div>

          <!-- Workshop thumbnail image (optional, no fallback) -->
          <div v-if="getWorkshopImage(ws)" class="overflow-hidden aspect-[16/9] bg-accent/20">
            <img
              :src="getWorkshopImage(ws)"
              :alt="getWorkshopTitle(ws)"
              class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
          </div>

          <div class="p-5">
            <div class="flex items-start gap-2 mb-2">
              <h3 class="font-semibold text-foreground text-lg group-hover:text-primary transition-colors leading-tight flex-1" :style="getWorkshopTitleStyle(ws)">
                {{ getWorkshopTitle(ws) }}
                <span v-if="isWorkshopOffline(learning, ws)" class="inline-flex items-center ml-1.5 align-middle" :title="isDE ? 'Offline verfügbar' : 'Available offline'">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="text-emerald-500"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                </span>
              </h3>
              <div class="flex items-center gap-1 flex-shrink-0">
                <button
                  @click.stop="toggleFavorite(ws)"
                  class="p-1.5 rounded-md hover:bg-accent transition"
                  :title="isFavorite(ws) ? 'Remove favorite' : 'Add favorite'">
                  <svg v-if="isFavorite(ws)" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-red-500"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
                  <svg v-else xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-muted-foreground/40"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
                </button>
                <button
                  @click.stop="copyWorkshopLink(ws)"
                  class="p-1.5 rounded-md hover:bg-accent transition"
                  :style="getWorkshopTitleStyle(ws)"
                  title="Copy link">
                  <svg v-if="copiedWorkshop !== ws" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                  <svg v-else xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-green-500"><polyline points="20 6 9 17 4 12"/></svg>
                </button>
              </div>
            </div>

            <div v-if="getWorkshopLabels(ws).length > 0 || isActive(ws)" class="flex flex-wrap gap-1.5 mb-2">
              <span v-if="isActive(ws)" class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs transition-all"
                :class="activeFilters.has('active')
                  ? 'bg-green-200 dark:bg-green-800/40 text-green-800 dark:text-green-300 font-medium'
                  : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'">
                <button @click.stop="toggleFilter('active')">{{ isDE ? 'Aktiv' : 'Active' }}</button>
                <button @click.stop="deactivateWorkshop(ws)" class="hover:text-red-500 transition" title="Remove active">✕</button>
              </span>
              <button
                v-for="label in getWorkshopLabels(ws)"
                :key="label"
                @click.stop="toggleFilter(label)"
                class="px-2 py-0.5 rounded-full text-xs transition-all"
                :class="activeFilters.has(label)
                  ? 'bg-primary/20 text-primary font-medium'
                  : 'bg-accent text-muted-foreground hover:text-foreground'">
                {{ getDisplayLabel(label) }}
              </button>
            </div>

            <p v-if="getWorkshopDescription(ws)" class="text-sm text-muted-foreground leading-relaxed mb-3">
              {{ getWorkshopDescription(ws) }}
            </p>

            <div v-if="isRemoteWorkshop(learning, ws)" class="flex items-center">
              <a
                :href="getWorkshopSourceUrl(ws)"
                target="_blank"
                rel="noopener"
                @click.stop
                class="text-xs text-muted-foreground/50 hover:text-primary truncate transition">
                {{ getWorkshopSourceLabel(ws) }}
              </a>
            </div>
          </div>
        </Card>
      </div>

      <!-- Loading workshops -->
      <div v-else-if="workshopsLoading" class="text-center py-8">
        <div class="inline-block w-6 h-6 border-3 border-primary/30 border-t-primary rounded-full animate-spin mb-3"></div>
        <p class="text-muted-foreground text-sm">{{ isDE ? 'Workshops laden...' : 'Loading workshops...' }}</p>
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

      <!-- Install full app -->
      <div v-if="!isStandalone" class="mt-8 flex justify-center">
        <button
          @click="installFullApp"
          class="flex items-center gap-2 px-5 py-2.5 rounded-xl border-2 border-muted-foreground/20 text-muted-foreground hover:border-primary hover:text-primary transition text-sm font-medium">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          {{ isDE ? '„Open Learn" als App installieren' : 'Install "Open Learn" as App' }}
        </button>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useLessons } from '../composables/useLessons'
import { useOffline } from '../composables/useOffline'
import { useManifest } from '../composables/useManifest'
import { useLanguage } from '../composables/useLanguage'
import { formatLangName } from '../utils/formatters'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const emit = defineEmits(['update-title'])
const router = useRouter()
const route = useRoute()

const { availableContent, isLoading, loadAvailableContent, loadWorkshopsForLanguage, removeContentSource, isRemoteWorkshop, isDefaultSource, getSourceForSlug, getWorkshopMeta, getContentSources } = useLessons()
const { selectedLanguage, setLanguage } = useLanguage()
const { isWorkshopOffline } = useOffline()
const { setDefaultManifest } = useManifest()

const isStandalone = computed(() =>
  window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true
)
let deferredInstallPrompt = null

const workshopsLoading = ref(true)
const activeFilters = ref(new Set())
const copiedWorkshop = ref(null)
const addedNotice = ref(null)
const favorites = ref(JSON.parse(localStorage.getItem('workshopFavorites') || '[]'))
const activeWorkshops = ref(JSON.parse(localStorage.getItem('activeWorkshops') || '[]'))

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
  const list = Object.keys(availableContent.value[learning.value] || {})
  return list.sort((a, b) => {
    const aKey = `${learning.value}:${a}`
    const bKey = `${learning.value}:${b}`
    const aActive = activeWorkshops.value.includes(aKey) ? 0 : 1
    const bActive = activeWorkshops.value.includes(bKey) ? 0 : 1
    if (aActive !== bActive) return aActive - bActive
    const aFav = favorites.value.includes(a) ? 0 : 1
    const bFav = favorites.value.includes(b) ? 0 : 1
    if (aFav !== bFav) return aFav - bFav
    const aImg = getWorkshopImage(a) ? 0 : 1
    const bImg = getWorkshopImage(b) ? 0 : 1
    return aImg - bImg
  })
})

function getWorkshopLabels(workshop) {
  const meta = getWorkshopMeta(learning.value, workshop)
  return meta.labels || []
}

function workshopMatchesFilter(ws, filter) {
  if (filter === 'active') return isActive(ws)
  return getWorkshopLabels(ws).includes(filter)
}

function toggleFilter(label) {
  const filters = new Set(activeFilters.value)
  if (filters.has(label)) {
    filters.delete(label)
  } else {
    filters.add(label)
  }
  activeFilters.value = filters
}

const filteredWorkshops = computed(() => {
  if (activeFilters.value.size === 0) return workshops.value
  return workshops.value.filter(ws =>
    [...activeFilters.value].every(f => workshopMatchesFilter(ws, f))
  )
})

function getDisplayLabel(label) {
  if (label === 'active') return isDE.value ? 'Aktiv' : 'Active'
  if (label === 'local-dev') return '🔧 local-dev'
  return label
}

// Labels from filtered workshops, sorted by count (most common first)
// Active filters always shown so they can be deselected
const allLabels = computed(() => {
  const counts = {}
  const source = filteredWorkshops.value

  if (source.some(ws => isActive(ws)) || activeFilters.value.has('active')) {
    counts['active'] = source.filter(ws => isActive(ws)).length
  }

  for (const ws of source) {
    for (const label of getWorkshopLabels(ws)) {
      counts[label] = (counts[label] || 0) + 1
    }
  }

  // Always include active filters so they can be deselected
  for (const f of activeFilters.value) {
    if (!(f in counts)) counts[f] = 0
  }
  const special = ['active', 'local-dev']
  const regular = Object.keys(counts).filter(l => !special.includes(l))
  regular.sort((a, b) => counts[b] - counts[a])

  const sorted = []
  if ('active' in counts) sorted.push('active')
  if ('local-dev' in counts) sorted.push('local-dev')
  sorted.push(...regular)
  return sorted
})

function labelCount(label) {
  return filteredWorkshops.value.filter(ws => workshopMatchesFilter(ws, label)).length
}

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
  if (!meta.image) return null
  // Absolute URLs are used as-is; relative paths are resolved from the app base
  if (meta.image.startsWith('http://') || meta.image.startsWith('https://') || meta.image.startsWith('/')) {
    return meta.image
  }
  return `${import.meta.env.BASE_URL}${meta.image}`
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
  const sourceUrl = getSourceForSlug(learning.value, workshop)
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
  const sourceUrl = getSourceForSlug(learning.value, workshop)
  return sourceUrl ? isDefaultSource(sourceUrl) : false
}

function getWorkshopSourceUrl(workshop) {
  const sourceUrl = getSourceForSlug(learning.value, workshop)
  if (!sourceUrl) return '#'
  try {
    const url = new URL(sourceUrl)
    url.pathname = url.pathname.replace(/\/index\.yaml$/, '/')
    return url.toString()
  } catch {
    return '#'
  }
}

function isActive(workshop) {
  return activeWorkshops.value.includes(`${learning.value}:${workshop}`)
}

function deactivateWorkshop(workshop) {
  const key = `${learning.value}:${workshop}`
  const idx = activeWorkshops.value.indexOf(key)
  if (idx !== -1) {
    activeWorkshops.value.splice(idx, 1)
    localStorage.setItem('activeWorkshops', JSON.stringify(activeWorkshops.value))
  }
}

function isFavorite(workshop) {
  return favorites.value.includes(workshop)
}

function toggleFavorite(workshop) {
  const idx = favorites.value.indexOf(workshop)
  if (idx === -1) {
    favorites.value.push(workshop)
  } else {
    favorites.value.splice(idx, 1)
  }
  localStorage.setItem('workshopFavorites', JSON.stringify(favorites.value))
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
  const key = `${learning.value}:${workshop}`
  if (!activeWorkshops.value.includes(key)) {
    activeWorkshops.value.push(key)
    localStorage.setItem('activeWorkshops', JSON.stringify(activeWorkshops.value))
  }
  router.push({
    name: 'lessons-overview',
    params: { learning: learning.value, workshop }
  })
}

async function removeSource(workshopSlug) {
  const sourceUrl = getSourceForSlug(learning.value, workshopSlug)
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

function handleBeforeInstallPrompt(e) {
  e.preventDefault()
  deferredInstallPrompt = e
}

async function installFullApp() {
  setDefaultManifest()
  if (deferredInstallPrompt) {
    deferredInstallPrompt.prompt()
    await deferredInstallPrompt.userChoice
    deferredInstallPrompt = null
  }
}

onMounted(async () => {
  window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
  setDefaultManifest()
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
  workshopsLoading.value = false
  emit('update-title', 'Workshops')
})

onUnmounted(() => {
  window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
})
</script>
