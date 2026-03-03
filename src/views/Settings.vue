<template>
  <div class="space-y-8">
    <!-- Gun Account Section -->
    <Card>
      <CardHeader>
        <CardTitle class="text-2xl">Account &amp; Sync</CardTitle>
      </CardHeader>
      <CardContent>
        <template v-if="!isLoggedIn">
          <p class="text-sm text-muted-foreground mb-4">
            Sign in to sync your progress across devices in the same network. No server required.
          </p>
          <div class="space-y-3">
            <div>
              <Label class="text-sm font-medium mb-1 block">Username</Label>
              <Input v-model="gunUsername" placeholder="Username" />
            </div>
            <div>
              <Label class="text-sm font-medium mb-1 block">Password</Label>
              <Input v-model="gunPassword" type="password" placeholder="Password" />
            </div>
            <div class="flex gap-3">
              <Button @click="handleLogin" :disabled="!gunUsername || !gunPassword || isAuthLoading">
                {{ isAuthLoading ? 'Logging in...' : 'Login' }}
              </Button>
              <Button variant="secondary" @click="handleRegister" :disabled="!gunUsername || !gunPassword || isAuthLoading">
                {{ isAuthLoading ? 'Registering...' : 'Register' }}
              </Button>
            </div>
          </div>
        </template>

        <template v-else>
          <p class="text-sm text-muted-foreground mb-4">
            Signed in as <span class="font-semibold text-foreground">{{ gunUser }}</span>
            <span v-if="isSyncing" class="ml-2 text-xs text-muted-foreground">(syncing...)</span>
          </p>
          <div class="flex gap-3">
            <Button variant="secondary" @click="handleLogout">Logout</Button>
          </div>
        </template>

        <div v-if="authError" class="mt-3 text-sm text-red-500">
          {{ authError }}
        </div>
        <div v-if="syncMessage" class="mt-3 text-sm text-green-600 dark:text-green-400">
          {{ syncMessage }}
        </div>
      </CardContent>
    </Card>

    <!-- Appearance Section -->
    <Card>
      <CardHeader>
        <CardTitle class="text-2xl">🎨 Appearance</CardTitle>
      </CardHeader>
      <CardContent>
        <!-- Dark Mode Toggle -->
        <div class="flex items-center justify-between">
          <div>
            <Label class="text-lg font-semibold">Dark Mode</Label>
            <p class="text-sm text-muted-foreground">Dark color scheme for comfortable reading at night</p>
          </div>
          <Switch :checked="settings.darkMode" @update:checked="settings.darkMode = $event" />
        </div>
      </CardContent>
    </Card>

    <!-- Display Settings Section -->
    <Card>
      <CardHeader>
        <CardTitle class="text-2xl">📖 Lesson Display</CardTitle>
      </CardHeader>
      <CardContent class="space-y-6">
        <!-- Show Answers Toggle -->
        <div class="flex items-center justify-between">
          <div>
            <Label class="text-lg font-semibold">Show Answers</Label>
            <p class="text-sm text-muted-foreground">Show or hide answer translations in lessons</p>
          </div>
          <Switch :checked="settings.showAnswers" @update:checked="settings.showAnswers = $event" />
        </div>

        <!-- Show Learning Items Toggle -->
        <div class="flex items-center justify-between">
          <div>
            <Label class="text-lg font-semibold">Show Learning Items</Label>
            <p class="text-sm text-muted-foreground">Show or hide vocabulary and related items</p>
          </div>
          <Switch :checked="settings.showLearningItems" @update:checked="settings.showLearningItems = $event" />
        </div>

        <!-- Show Labels Toggle -->
        <div class="flex items-center justify-between">
          <div>
            <Label class="text-lg font-semibold">Show Labels</Label>
            <p class="text-sm text-muted-foreground">Show or hide grammar labels (Futur, Gerundium, etc.)</p>
          </div>
          <Switch :checked="settings.showLabels" @update:checked="settings.showLabels = $event" />
        </div>

        <!-- Hide Learned Examples Toggle -->
        <div class="flex items-center justify-between">
          <div>
            <Label class="text-lg font-semibold">Hide Learned Examples</Label>
            <p class="text-sm text-muted-foreground">Automatically hide examples where all vocabulary items are learned</p>
          </div>
          <Switch :checked="settings.hideLearnedExamples" @update:checked="settings.hideLearnedExamples = $event" />
        </div>
      </CardContent>
    </Card>

    <!-- Audio Settings Section -->
    <Card>
      <CardHeader>
        <CardTitle class="text-2xl">🔊 Audio Settings</CardTitle>
      </CardHeader>
      <CardContent class="space-y-6">
        <!-- Audio Speed Selection -->
        <div>
          <Label class="text-lg font-semibold">Audio Speed</Label>
          <p class="text-sm text-muted-foreground mb-3">Playback speed for auto-reading audio</p>
          <div class="flex gap-3">
            <Button
              v-for="speed in [0.6, 0.8, 1.0]"
              :key="speed"
              :variant="settings.audioSpeed === speed ? 'default' : 'outline'"
              @click="settings.audioSpeed = speed">
              {{ speed }}×
            </Button>
          </div>
        </div>

        <!-- Read Answers Toggle -->
        <div class="flex items-center justify-between">
          <div>
            <Label class="text-lg font-semibold">Read Answers</Label>
            <p class="text-sm text-muted-foreground">Include answer translations when auto-reading lessons</p>
          </div>
          <Switch :checked="settings.readAnswers" @update:checked="settings.readAnswers = $event" />
        </div>

        <!-- Debug Overlay Toggle -->
        <div class="flex items-center justify-between">
          <div>
            <Label class="text-lg font-semibold">Show Debug Overlay</Label>
            <p class="text-sm text-muted-foreground">Display playback information overlay (for troubleshooting)</p>
          </div>
          <Switch :checked="settings.showDebugOverlay" @update:checked="settings.showDebugOverlay = $event" />
        </div>
      </CardContent>
    </Card>

    <!-- Data Section -->
    <Card>
      <CardHeader>
        <CardTitle class="text-2xl">Data</CardTitle>
      </CardHeader>
      <CardContent>
        <div v-if="availableWorkshops.length === 0" class="text-sm text-muted-foreground mb-4">
          No data yet. Start learning to track your progress.
        </div>

        <template v-else>
          <!-- Workshop selector -->
          <div class="mb-4">
            <Label class="text-lg font-semibold mb-2 block">Workshop</Label>
            <div class="flex gap-2 flex-wrap">
              <Button
                v-for="ws in availableWorkshops"
                :key="ws.key"
                :variant="selectedWorkshop === ws.key ? 'default' : 'outline'"
                size="sm"
                @click="selectedWorkshop = ws.key">
                {{ ws.label }}
              </Button>
            </div>
          </div>

          <div class="text-sm text-muted-foreground mb-4">
            {{ dataSummary }}
          </div>

          <div class="flex gap-3 flex-wrap">
            <Button @click="exportData">
              Export
            </Button>

            <Button variant="secondary" @click="$refs.fileInput.click()">
              Import
            </Button>
            <input
              ref="fileInput"
              type="file"
              accept=".json"
              class="hidden"
              @change="importData" />
          </div>
        </template>

        <div v-if="importMessage" class="mt-3 text-sm" :class="importMessageError ? 'text-red-500' : 'text-green-600 dark:text-green-400'">
          {{ importMessage }}
        </div>
      </CardContent>
    </Card>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useSettings } from '../composables/useSettings'
import { useProgress } from '../composables/useProgress'
import { useAssessments } from '../composables/useAssessments'
import { useGun } from '../composables/useGun'
import { formatLangName } from '../utils/formatters'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'

const { settings } = useSettings()
const { progress, getProgress, mergeProgress } = useProgress()
const { assessments, getAssessments, mergeAssessments } = useAssessments()
const { isLoggedIn, username: gunUser, authError, isSyncing, login, register, logout, loadFromGun } = useGun()

const importMessage = ref('')
const importMessageError = ref(false)
const selectedWorkshop = ref('')

// Gun auth state
const gunUsername = ref('')
const gunPassword = ref('')
const syncMessage = ref('')
const isAuthLoading = ref(false)

async function handleLogin() {
  if (isAuthLoading.value) return
  isAuthLoading.value = true
  syncMessage.value = ''
  try {
    const ok = await login(gunUsername.value, gunPassword.value)
    if (ok) {
      gunUsername.value = ''
      gunPassword.value = ''
      const remote = await loadFromGun()
      if (remote) {
        if (remote.progress) mergeProgress(remote.progress)
        if (remote.assessments) mergeAssessments(remote.assessments)
        if (remote.settings) {
          Object.assign(settings, remote.settings)
        }
      }
      syncMessage.value = 'Logged in and synced.'
    }
  } finally {
    isAuthLoading.value = false
  }
}

async function handleRegister() {
  if (isAuthLoading.value) return
  isAuthLoading.value = true
  syncMessage.value = ''
  try {
    const ok = await register(gunUsername.value, gunPassword.value)
    if (ok) {
      gunUsername.value = ''
      gunPassword.value = ''
      syncMessage.value = 'Registered and synced.'
    }
  } finally {
    isAuthLoading.value = false
  }
}

function handleLogout() {
  logout()
  syncMessage.value = ''
}

// Collect all unique workshop keys (learning:workshop) from progress + assessments
const availableWorkshops = computed(() => {
  const keys = new Set()
  for (const key of Object.keys(progress.value)) {
    keys.add(key) // progress keys are "learning:workshop"
  }
  for (const key of Object.keys(assessments.value)) {
    // assessment keys are "learning:workshop:lessonNumber"
    const parts = key.split(':')
    if (parts.length >= 2) keys.add(`${parts[0]}:${parts[1]}`)
  }
  const sorted = [...keys].sort()
  // Auto-select first workshop if none selected
  if (sorted.length > 0 && !sorted.includes(selectedWorkshop.value)) {
    selectedWorkshop.value = sorted[0]
  }
  return sorted.map(key => {
    const [learning, workshop] = key.split(':')
    return { key, label: formatLangName(workshop) }
  })
})

// Filter progress/assessments for the selected workshop
function getWorkshopProgress() {
  const all = getProgress()
  return all[selectedWorkshop.value] ? { [selectedWorkshop.value]: all[selectedWorkshop.value] } : {}
}

function getWorkshopAssessments() {
  const all = getAssessments()
  const prefix = selectedWorkshop.value + ':'
  const filtered = {}
  for (const [key, val] of Object.entries(all)) {
    if (key.startsWith(prefix)) filtered[key] = val
  }
  return filtered
}

const dataSummary = computed(() => {
  if (!selectedWorkshop.value) return ''
  const workshopProgress = progress.value[selectedWorkshop.value] || {}
  const itemCount = Object.keys(workshopProgress).length
  const prefix = selectedWorkshop.value + ':'
  let answerCount = 0
  for (const [key, answers] of Object.entries(assessments.value)) {
    if (key.startsWith(prefix)) answerCount += Object.keys(answers).length
  }
  return `${itemCount} item${itemCount !== 1 ? 's' : ''} learned, ${answerCount} answer${answerCount !== 1 ? 's' : ''}`
})

function exportData() {
  const data = {
    version: 1,
    exportedAt: new Date().toISOString(),
    workshop: selectedWorkshop.value,
    progress: getWorkshopProgress(),
    assessments: getWorkshopAssessments()
  }
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const date = new Date().toISOString().slice(0, 10)
  const workshopSlug = selectedWorkshop.value.replace(/:/g, '-')
  const a = document.createElement('a')
  a.href = url
  a.download = `open-learn-${workshopSlug}-${date}.json`
  a.click()
  URL.revokeObjectURL(url)
}

function importData(event) {
  const file = event.target.files[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result)
      if (!data.version || (!data.progress && !data.assessments)) {
        importMessage.value = 'Invalid file format.'
        importMessageError.value = true
        return
      }
      if (data.progress) mergeProgress(data.progress)
      if (data.assessments) mergeAssessments(data.assessments)
      importMessage.value = 'Data imported successfully.'
      importMessageError.value = false
    } catch {
      importMessage.value = 'Could not read file.'
      importMessageError.value = true
    }
  }
  reader.readAsText(file)
  event.target.value = ''
}
</script>
