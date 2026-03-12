<template>
  <div class="space-y-8">
    <!-- Not logged in -->
    <template v-if="!isLoggedIn">
      <Card>
        <CardContent class="py-12 text-center space-y-4">
          <div class="text-4xl">🔒</div>
          <p class="text-muted-foreground">Please sign in first to access the Instructor Dashboard.</p>
          <Button @click="goToProfile">Sign In</Button>
        </CardContent>
      </Card>
    </template>

    <!-- Logged in -->
    <template v-else>
      <!-- Header -->
      <div>
        <h2 class="text-3xl font-bold">Instructor Dashboard</h2>
        <p class="text-muted-foreground mt-1">Share your workshops with learners</p>
      </div>

      <!-- My Workshops -->
      <Card>
        <CardHeader>
          <CardTitle class="text-xl">My Workshops</CardTitle>
        </CardHeader>
        <CardContent>
          <template v-if="userSources.length > 0">
            <div class="space-y-3">
              <div
                v-for="source in userSources"
                :key="source"
                class="flex items-center justify-between p-3 border rounded-lg">
                <span class="text-sm font-mono truncate flex-1 mr-3">{{ source }}</span>
                <div class="flex items-center gap-2 flex-shrink-0">
                  <Button size="sm" variant="outline" @click="copyLink(source)">
                    {{ copiedSource === source ? 'Copied!' : 'Copy Link' }}
                  </Button>
                  <a :href="source" target="_blank" rel="noopener">
                    <Button size="sm" variant="ghost">Open</Button>
                  </a>
                </div>
              </div>
            </div>
          </template>
          <template v-else>
            <p class="text-sm text-muted-foreground">
              You haven't added any workshops yet. Add one via the + button on the home page.
            </p>
          </template>
        </CardContent>
      </Card>

      <!-- Create a Workshop -->
      <Card>
        <CardHeader>
          <CardTitle class="text-xl">Create a Workshop</CardTitle>
        </CardHeader>
        <CardContent class="space-y-3">
          <p class="text-sm text-muted-foreground">
            Workshops are written in simple YAML — no code needed. You can host them on GitHub Pages, IPFS, or any URL. Learners add them with a single share link.
          </p>
          <div class="flex gap-3 flex-wrap">
            <a href="docs/external-workshop-guide.md" target="_blank" rel="noopener">
              <Button variant="outline">Read the Guide</Button>
            </a>
            <a href="https://github.com/openlearnapp/openlearnapp.github.io" target="_blank" rel="noopener">
              <Button variant="outline">View on GitHub</Button>
            </a>
          </div>
        </CardContent>
      </Card>

      <!-- Coach Setup -->
      <Card>
        <CardHeader>
          <CardTitle class="text-xl">Coach Setup</CardTitle>
        </CardHeader>
        <CardContent class="space-y-3">
          <p class="text-sm text-muted-foreground">
            Add an AI coach to your workshop by configuring a <code class="bg-muted px-1 rounded text-xs">coach.api</code> endpoint in your <code class="bg-muted px-1 rounded text-xs">workshops.yaml</code>. The coach receives learner answers and can provide personalized feedback.
          </p>
          <p class="text-sm text-muted-foreground">
            See the documentation for configuration details and API requirements.
          </p>
          <a href="docs/external-workshop-guide.md" target="_blank" rel="noopener">
            <Button variant="outline">Coach Documentation</Button>
          </a>
        </CardContent>
      </Card>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useGun } from '../composables/useGun'
import { useLessons } from '../composables/useLessons'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

const router = useRouter()
const { t } = useI18n()
const { isLoggedIn } = useGun()
const { getContentSources } = useLessons()

const copiedSource = ref('')
const emit = defineEmits(['update-title'])

onMounted(() => {
  emit('update-title', 'Instructor Dashboard')
})

const userSources = computed(() => {
  return getContentSources() || []
})

async function copyLink(url) {
  try {
    await navigator.clipboard.writeText(url)
    copiedSource.value = url
    setTimeout(() => { copiedSource.value = '' }, 2000)
  } catch (e) {
    console.error('Failed to copy:', e)
  }
}

function goToProfile() {
  router.push({ name: 'profile' })
}
</script>
