<template>
  <div>
    <!-- Loading state -->
    <div v-if="isLoading" class="text-center py-12">
      <div class="inline-block w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-4"></div>
      <p class="text-muted-foreground">Loading...</p>
    </div>

    <div v-else>
      <!-- Hero section (always visible, adapts to language) -->
      <div class="mb-8">
        <h2 class="text-3xl font-bold mb-3 text-primary">
          {{ t('title') }}
        </h2>
        <p class="text-muted-foreground mb-5 leading-relaxed">
          {{ t('subtitle') }}
        </p>

        <!-- Feature highlights -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          <div v-for="feature in features" :key="feature.key"
            class="flex items-start gap-3 p-3 rounded-lg bg-accent/30">
            <span class="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-base flex-shrink-0">
              {{ feature.icon }}
            </span>
            <div>
              <div class="text-sm font-medium text-foreground">{{ feature.title }}</div>
              <div class="text-xs text-muted-foreground">{{ feature.desc }}</div>
            </div>
          </div>
        </div>

        <!-- Getting started hint (when no language selected) -->
        <div v-if="!selectedLanguage" class="p-4 rounded-lg border border-primary/20 bg-primary/5">
          <p class="text-sm text-foreground font-medium mb-1">
            {{ t('getStartedTitle') }}
          </p>
          <p class="text-sm text-muted-foreground">
            {{ t('getStartedDesc') }}
          </p>
        </div>
      </div>

      <!-- How it works section (always visible) -->
      <div v-if="!selectedLanguage || workshops.length === 0" class="mb-8">
        <h3 class="text-lg font-semibold text-foreground mb-4">{{ t('howItWorks') }}</h3>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div v-for="(step, i) in steps" :key="i" class="text-center p-4">
            <div class="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center text-lg font-bold mx-auto mb-3">
              {{ i + 1 }}
            </div>
            <div class="text-sm font-medium text-foreground mb-1">{{ step.title }}</div>
            <div class="text-xs text-muted-foreground">{{ step.desc }}</div>
          </div>
        </div>
      </div>

      <!-- Workshops as tiles -->
      <div v-if="selectedLanguage && workshops.length > 0">
        <div class="flex items-center justify-between mb-3">
          <label class="text-sm font-medium text-muted-foreground">
            {{ t('workshops') }}
          </label>
          <span class="text-xs text-muted-foreground">
            {{ workshops.length }} {{ workshops.length === 1 ? 'Workshop' : 'Workshops' }}
          </span>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card
            v-for="ws in visibleWorkshops"
            :key="ws"
            @click="openWorkshop(ws)"
            class="group cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 hover:border-primary/50 overflow-hidden">

            <!-- Color accent bar at top -->
            <div class="h-1.5 bg-gradient-to-r from-primary to-secondary"></div>

            <div class="p-5">
              <div class="flex items-start justify-between gap-2 mb-2">
                <h3 class="font-semibold text-foreground text-lg group-hover:text-primary transition-colors leading-tight">
                  {{ getWorkshopTitle(ws) }}
                </h3>
                <button
                  @click.stop="copyWorkshopLink(ws)"
                  class="p-1.5 rounded-md text-muted-foreground/40 hover:text-primary hover:bg-accent transition opacity-0 group-hover:opacity-100 flex-shrink-0"
                  title="Copy link">
                  <svg v-if="copiedWorkshop !== ws" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                  <svg v-else xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-green-500"><polyline points="20 6 9 17 4 12"/></svg>
                </button>
              </div>

              <p v-if="getWorkshopDescription(ws)" class="text-sm text-muted-foreground leading-relaxed mb-3">
                {{ getWorkshopDescription(ws) }}
              </p>

              <div class="flex items-center justify-between">
                <span v-if="isRemoteWorkshop(ws)" class="text-xs text-muted-foreground/50 truncate max-w-[60%]">
                  {{ getWorkshopSourceLabel(ws) }}
                </span>
                <span v-else></span>

                <div class="flex items-center gap-1">
                  <button
                    v-if="isRemoteWorkshop(ws)"
                    @click.stop="removeSource(ws)"
                    class="p-1 rounded text-muted-foreground/40 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition text-xs"
                    title="Remove">
                    Remove
                  </button>
                  <span class="text-primary text-sm font-medium group-hover:translate-x-0.5 transition-transform">
                    →
                  </span>
                </div>
              </div>
            </div>
          </Card>
        </div>

        <!-- Show more button -->
        <div v-if="workshops.length > maxVisible && !showAll" class="mt-4 text-center">
          <button
            @click="showAll = true"
            class="px-6 py-2 text-sm font-medium text-primary border border-primary/30 rounded-lg hover:bg-primary/5 transition">
            {{ t('showAll') }} ({{ workshops.length - maxVisible }} {{ t('more') }})
          </button>
        </div>

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

      <!-- Info links -->
      <div v-if="selectedLanguage" class="mt-8 pt-4 border-t border-border">
        <div class="flex flex-wrap gap-4 text-sm">
          <a
            :href="'#/' + selectedLanguage + '/open-learn-guide/lessons'"
            class="text-primary hover:underline">
            {{ t('guide') }}
          </a>
          <a
            :href="'#/' + selectedLanguage + '/open-learn-feedback/lessons'"
            class="text-primary hover:underline">
            {{ t('feedback') }}
          </a>
          <a
            href="https://github.com/felixboehm/open-learn/issues"
            target="_blank"
            rel="noopener"
            class="text-primary hover:underline">
            {{ t('bugReport') }}
          </a>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useLessons } from '../composables/useLessons'
import { useLanguage } from '../composables/useLanguage'
import { formatLangName } from '../utils/formatters'
import { Card } from '@/components/ui/card'

const router = useRouter()
const { availableContent, isLoading, loadAvailableContent, loadWorkshopsForLanguage, removeContentSource, isRemoteWorkshop, getSourceForSlug, getWorkshopMeta, getContentSources } = useLessons()
const { selectedLanguage } = useLanguage()

const copiedWorkshop = ref(null)
const showAll = ref(false)
const maxVisible = 4

const knownWorkshops = []

const isDE = computed(() => selectedLanguage.value === 'deutsch')

// Simple i18n helper
function t(key) {
  const strings = {
    title: isDE.value ? 'Willkommen bei Open Learn' : 'Welcome to Open Learn',
    subtitle: isDE.value
      ? 'Eine kostenlose, quelloffene Lernplattform. Keine Werbung, kein Tracking, kein Konto nötig. Dein Fortschritt wird im Browser gespeichert.'
      : 'A free, open-source learning platform. No ads, no tracking, no account required. Your progress is saved in your browser.',
    getStartedTitle: isDE.value ? 'Erste Schritte' : 'Get Started',
    getStartedDesc: isDE.value
      ? 'Wähle oben links deine Sprache aus, um verfügbare Workshops zu sehen.'
      : 'Select your language in the top-left dropdown to see available workshops.',
    howItWorks: isDE.value ? 'So funktioniert es' : 'How It Works',
    workshops: isDE.value ? 'Workshops' : 'Workshops',
    showAll: isDE.value ? 'Alle anzeigen' : 'Show all',
    more: isDE.value ? 'weitere' : 'more',
    discover: isDE.value ? 'Workshops entdecken' : 'Discover Workshops',
    guide: isDE.value ? 'Anleitung & Erste Schritte' : 'Guide & First Steps',
    feedback: isDE.value ? 'Feedback geben' : 'Give Feedback',
    bugReport: isDE.value ? 'Fehler melden' : 'Report a Bug',
  }
  return strings[key] || key
}

const features = computed(() => isDE.value ? [
  { key: 'qa', icon: '💬', title: 'Fragen & Antworten', desc: 'Lerne mit Karteikarten, Quizzen und interaktiven Assessments' },
  { key: 'video', icon: '🎬', title: 'Videos & Audio', desc: 'YouTube-Videos, lokale Dateien und Audioaussprache' },
  { key: 'progress', icon: '📊', title: 'Fortschritt verfolgen', desc: 'Markiere Gelerntes und sieh deinen Fortschritt pro Lektion' },
  { key: 'create', icon: '✏️', title: 'Workshops erstellen', desc: 'Erstelle eigene Workshops mit einfachen YAML-Dateien' },
] : [
  { key: 'qa', icon: '💬', title: 'Q&A Cards & Quizzes', desc: 'Learn with flashcards, quizzes, and interactive assessments' },
  { key: 'video', icon: '🎬', title: 'Videos & Audio', desc: 'YouTube embeds, local files, and audio pronunciation' },
  { key: 'progress', icon: '📊', title: 'Track Progress', desc: 'Mark items as learned and see your progress per lesson' },
  { key: 'create', icon: '✏️', title: 'Create Workshops', desc: 'Build your own workshops with simple YAML files' },
])

const steps = computed(() => isDE.value ? [
  { title: 'Sprache wählen', desc: 'Wähle oben links deine Sprache — die Oberfläche passt sich an.' },
  { title: 'Workshop starten', desc: 'Klicke auf einen Workshop und starte mit der ersten Lektion.' },
  { title: 'Lernen & Fortschritt', desc: 'Beantworte Fragen, markiere Gelerntes und verfolge deinen Fortschritt.' },
] : [
  { title: 'Pick a Language', desc: 'Choose your language in the top-left dropdown — the interface adapts.' },
  { title: 'Start a Workshop', desc: 'Click on any workshop tile to jump into the first lesson.' },
  { title: 'Learn & Track', desc: 'Answer questions, mark items as learned, and track your progress.' },
])

const workshops = computed(() => {
  if (!selectedLanguage.value) return []
  return Object.keys(availableContent.value[selectedLanguage.value] || {})
})

const visibleWorkshops = computed(() => {
  if (showAll.value) return workshops.value
  return workshops.value.slice(0, maxVisible)
})

const availableWorkshops = computed(() => {
  const sources = getContentSources()
  return knownWorkshops.filter(w => !sources.includes(w.url))
})

// Reset showAll when language changes
watch(selectedLanguage, () => {
  showAll.value = false
})

function getWorkshopTitle(workshop) {
  const meta = getWorkshopMeta(selectedLanguage.value, workshop)
  return meta.title || formatLangName(workshop)
}

function getWorkshopDescription(workshop) {
  const meta = getWorkshopMeta(selectedLanguage.value, workshop)
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

async function copyWorkshopLink(workshop) {
  const base = window.location.href.replace(/#.*$/, '')
  const url = `${base}#/${selectedLanguage.value}/${workshop}/lessons`
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
    params: {
      learning: selectedLanguage.value,
      workshop: workshop
    }
  })
}

async function removeSource(workshopSlug) {
  const sourceUrl = getSourceForSlug(workshopSlug)
  if (sourceUrl) {
    removeContentSource(sourceUrl)
  }
  await loadAvailableContent()
  if (selectedLanguage.value) {
    await loadWorkshopsForLanguage(selectedLanguage.value)
  }
}

function cleanupLegacySources() {
  const legacyUrls = [
    'https://felixboehm.github.io/workshop-open-learn/index.yaml',
    'https://felixboehm.github.io/workshop-english/index.yaml'
  ]
  const sources = getContentSources()
  const cleaned = sources.filter(s => !legacyUrls.includes(s))
  if (cleaned.length !== sources.length) {
    localStorage.setItem('contentSources', JSON.stringify(cleaned))
  }
}

onMounted(async () => {
  cleanupLegacySources()
  if (Object.keys(availableContent.value).length === 0) {
    await loadAvailableContent()
  }
  // If language was already selected (by App.vue), ensure workshops are loaded
  if (selectedLanguage.value) {
    await loadWorkshopsForLanguage(selectedLanguage.value)
  }
})
</script>
