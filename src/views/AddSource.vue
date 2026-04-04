<template>
  <div>
    <Card class="p-6">
      <CardContent class="p-0">
        <!-- Loading state -->
        <div v-if="isValidating" class="text-center">
          <div class="text-2xl font-bold text-primary mb-4">
            {{ $t('addSource.checking') }}
          </div>
          <div class="text-muted-foreground">
            {{ sourceUrl }}
          </div>
        </div>

        <!-- Error state -->
        <div v-else-if="error" class="text-center">
          <div class="text-2xl font-bold text-red-500 mb-4">
            {{ $t('addSource.loadError') }}
          </div>
          <p class="text-muted-foreground mb-2">{{ sourceUrl }}</p>
          <p class="text-red-400 mb-6">{{ error }}</p>
          <Button variant="secondary" @click="goHome">
            {{ $t('addSource.backHome') }}
          </Button>
        </div>

        <!-- No URL provided -->
        <div v-else-if="!sourceUrl" class="text-center">
          <div class="text-2xl font-bold text-foreground mb-4">
            {{ $t('addSource.noUrl') }}
          </div>
          <p class="text-muted-foreground mb-6">
            {{ $t('addSource.useShareLink') }} <code class="bg-muted px-2 py-1 rounded">{{ $t('addSource.sourceParam') }}</code>
          </p>
          <Button variant="secondary" @click="goHome">
            {{ $t('addSource.backHome') }}
          </Button>
        </div>
      </CardContent>
    </Card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useLessons } from '../composables/useLessons'
import { useLanguage } from '../composables/useLanguage'
import { formatLangName } from '../utils/formatters'
import yaml from 'js-yaml'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

const router = useRouter()
const route = useRoute()
const { getContentSources, addContentSource, loadAvailableContent } = useLessons()
const { selectedLanguage, setLanguage } = useLanguage()

const sourceUrl = ref(route.query.source || '')
const requestedLang = ref(route.query.lang || '')
const isValidating = ref(false)
const error = ref(null)

function goHome() {
  router.push({ name: 'home' })
}

async function validateAndAddSource() {
  const url = sourceUrl.value
  if (!url) return

  isValidating.value = true
  error.value = null

  try {
    // If URL doesn't end with .yaml, try appending /index.yaml
    let fetchUrl = url
    if (!url.endsWith('.yaml')) {
      fetchUrl = url.replace(/\/$/, '') + '/index.yaml'
    }

    // Check if already added — still discover content for navigation
    const alreadyExists = getContentSources().includes(fetchUrl) || getContentSources().includes(url)

    const response = await fetch(fetchUrl)
    if (!response.ok) {
      throw new Error(`Could not reach ${fetchUrl} (HTTP ${response.status})`)
    }

    // Update sourceUrl to include the resolved filename
    sourceUrl.value = fetchUrl

    const text = await response.text()
    const data = yaml.load(text)

    if (!data || !data.languages || data.languages.length === 0) {
      throw new Error('No languages found in the content source')
    }

    // Derive base URL by stripping the yaml filename
    const baseUrl = fetchUrl.replace(/\/[^/]+\.yaml$/, '')

    // Discover content structure
    const content = {}
    for (const lang of data.languages) {
      const langKey = typeof lang === 'string' ? lang : (lang.folder || lang.url)
      if (!langKey) continue

      try {
        // Try workshops.yaml first, fallback to topics.yaml
        let topicsData = null
        for (const filename of ['workshops.yaml', 'topics.yaml']) {
          const topicsResponse = await fetch(`${baseUrl}/${langKey}/${filename}`)
          if (!topicsResponse.ok) continue
          const topicsText = await topicsResponse.text()
          topicsData = yaml.load(topicsText)
          break
        }

        const workshopsList = topicsData && (topicsData.workshops || topicsData.topics)
        if (workshopsList) {
          content[langKey] = workshopsList.map(t =>
            typeof t === 'string' ? t : (t.folder || t.url || '')
          )
        }
      } catch {
        // Skip languages where workshops can't be loaded
      }
    }

    if (Object.keys(content).length === 0) {
      throw new Error('No workshops found in the content source')
    }

    // Auto-add the source
    if (!alreadyExists) {
      addContentSource(fetchUrl)
    }

    // Reload content so the new source is available for navigation
    const targetLangForLoad = requestedLang.value || selectedLanguage.value || Object.keys(content)[0]
    await loadAvailableContent(targetLangForLoad)

    // Determine target language: requested from landing page > user's selected > fallback
    const targetLang = (requestedLang.value && content[requestedLang.value])
      ? requestedLang.value
      : (content[selectedLanguage.value] ? selectedLanguage.value : null)
    const userLang = targetLang || Object.keys(content)[0] || 'deutsch'

    // Switch platform language to match
    setLanguage(userLang)

    const workshopsForLang = content[userLang]

    if (workshopsForLang && workshopsForLang.length === 1) {
      // Single workshop available — go directly to lessons
      router.replace({
        name: 'lessons-overview',
        params: { learning: userLang, workshop: workshopsForLang[0] }
      })
    } else if (workshopsForLang && workshopsForLang.length > 1) {
      // Multiple workshops — go to workshop overview
      router.replace({
        name: 'workshop-overview',
        params: { learning: userLang }
      })
    } else {
      // Workshop not available — go to workshop overview with notification
      const availableLangs = Object.keys(content).map(l => formatLangName(l)).join(', ')
      const workshopNames = Object.values(content).flat().map(w => formatLangName(w)).join(', ')
      router.replace({
        name: 'workshop-overview',
        params: { learning: userLang },
        query: {
          added: workshopNames,
          availableIn: availableLangs
        }
      })
    }
  } catch (e) {
    error.value = e.message
  } finally {
    isValidating.value = false
  }
}

onMounted(() => {
  validateAndAddSource()
})
</script>
