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

        <!-- Already added -->
        <div v-else-if="alreadyAdded" class="text-center">
          <div class="text-2xl font-bold text-green-500 mb-4">
            {{ $t('addSource.alreadyAdded') }}
          </div>
          <p class="text-muted-foreground mb-6">
            {{ $t('addSource.alreadyAddedDesc') }}
          </p>
          <Button @click="goHome">
            {{ $t('addSource.goHome') }}
          </Button>
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

        <!-- Confirmation -->
        <div v-else>
          <h2 class="text-3xl font-bold mb-4 text-primary">
            {{ $t('addSource.addHeading') }}
          </h2>

          <Card class="mb-6">
            <CardContent class="p-4">
              <div class="text-sm text-muted-foreground mb-1">{{ $t('addSource.sourceUrl') }}</div>
              <div class="text-foreground font-mono text-sm break-all">
                {{ sourceUrl }}
              </div>
            </CardContent>
          </Card>

          <!-- Discovered content -->
          <div class="mb-6">
            <h3 class="text-lg font-semibold text-foreground mb-3">
              {{ $t('addSource.availableContent') }}
            </h3>
            <div v-for="(workshops, lang) in discoveredContent" :key="lang" class="mb-3">
              <div class="font-semibold text-primary">
                {{ formatLangName(lang) }}
              </div>
              <div class="flex flex-wrap gap-2 mt-1">
                <Badge
                  v-for="ws in workshops"
                  :key="ws"
                  variant="secondary">
                  {{ formatWorkshopName(ws) }}
                </Badge>
              </div>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex gap-3">
            <Button @click="addSource" class="bg-green-500 hover:bg-green-600 text-white">
              {{ $t('addSource.add') }}
            </Button>
            <Button variant="secondary" @click="goHome">
              {{ $t('addSource.cancel') }}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useLessons } from '../composables/useLessons'
import { formatLangName } from '../utils/formatters'
import yaml from 'js-yaml'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const router = useRouter()
const route = useRoute()
const { getContentSources, addContentSource } = useLessons()

const sourceUrl = ref(route.query.source || '')
const isValidating = ref(false)
const alreadyAdded = ref(false)
const error = ref(null)
const discoveredContent = ref({})

function formatWorkshopName(folderName) {
  return formatLangName(folderName)
}

function goHome() {
  router.push({ name: 'home' })
}

function addSource() {
  addContentSource(sourceUrl.value)
  router.push({ name: 'home' })
}

async function validateSource() {
  const url = sourceUrl.value
  if (!url) return

  // Check if already added
  if (getContentSources().includes(url)) {
    alreadyAdded.value = true
    return
  }

  isValidating.value = true
  error.value = null

  try {
    // If URL doesn't end with .yaml, try appending /index.yaml
    let fetchUrl = url
    if (!url.endsWith('.yaml')) {
      fetchUrl = url.replace(/\/$/, '') + '/index.yaml'
    }

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
        const topicsResponse = await fetch(`${baseUrl}/${langKey}/topics.yaml`)
        if (!topicsResponse.ok) continue

        const topicsText = await topicsResponse.text()
        const topicsData = yaml.load(topicsText)

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

    discoveredContent.value = content
  } catch (e) {
    error.value = e.message
  } finally {
    isValidating.value = false
  }
}

onMounted(() => {
  validateSource()
})
</script>
