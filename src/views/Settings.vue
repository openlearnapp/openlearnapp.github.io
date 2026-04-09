<template>
  <div class="space-y-8">
    <!-- Account Section -->
    <Card>
      <CardHeader>
        <CardTitle class="text-2xl">{{ $t('settings.accountSync') }}</CardTitle>
      </CardHeader>
      <CardContent>
        <template v-if="!isLoggedIn">
          <p class="text-sm text-muted-foreground mb-4">
            {{ $t('settings.accountSyncDesc') }}
          </p>
          <Button @click="goToProfile">{{ $t('settings.manageAccount') }}</Button>
        </template>
        <template v-else>
          <p class="text-sm text-muted-foreground mb-4">
            {{ $t('settings.signedInAs') }} <span class="font-semibold text-foreground">{{ gunUser }}</span>
            <span v-if="isSyncing" class="ml-2 text-xs text-muted-foreground">({{ $t('settings.syncing') }})</span>
          </p>
          <div class="flex gap-3">
            <Button variant="secondary" @click="goToProfile">{{ $t('settings.viewProfile') }}</Button>
          </div>
        </template>
      </CardContent>
    </Card>

    <!-- Sync Peers Section -->
    <Card>
      <CardHeader>
        <CardTitle class="text-2xl">🔗 {{ isDE ? 'Sync-Server' : 'Sync Peers' }}</CardTitle>
      </CardHeader>
      <CardContent>
        <p class="text-sm text-muted-foreground mb-2">
          {{ isDE ? 'GunDB Relay-Server für die Synchronisierung zwischen Geräten.' : 'GunDB relay servers for cross-device sync.' }}
        </p>
        <p class="text-xs mb-3" :class="isSyncing ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground/60'">
          {{ isSyncing ? (isDE ? '● Verbunden' : '● Connected') : (isDE ? '○ Nicht verbunden' : '○ Not connected') }}
        </p>
        <div class="space-y-2 mb-3">
          <div v-for="(peer, idx) in peerList" :key="idx" class="flex gap-2 items-center">
            <span class="flex-shrink-0 text-xs" :title="peerStatus[peer] || 'Unknown'">
              {{ peerStatus[peer] === 'ok' ? '🟢' : peerStatus[peer] === 'fail' ? '🔴' : '⚪' }}
            </span>
            <input
              :value="peer"
              @input="updatePeer(idx, $event.target.value)"
              class="flex-1 px-3 py-2 text-sm rounded-lg border border-input bg-background"
              placeholder="https://gun-relay.example.com/gun" />
            <Button variant="ghost" size="icon" @click="removePeer(idx)" class="flex-shrink-0 text-muted-foreground hover:text-red-500">✕</Button>
          </div>
        </div>
        <div class="flex gap-2">
          <Button variant="outline" size="sm" @click="addPeer">+ {{ isDE ? 'Server hinzufügen' : 'Add peer' }}</Button>
          <Button variant="outline" size="sm" @click="checkPeers">{{ isDE ? 'Prüfen' : 'Check' }}</Button>
          <Button v-if="peersChanged" variant="secondary" size="sm" @click="resetPeers">{{ isDE ? 'Standard wiederherstellen' : 'Reset to defaults' }}</Button>
        </div>
        <p v-if="peersSaved" class="mt-2 text-xs text-green-600 dark:text-green-400">{{ isDE ? 'Gespeichert — Seite neu laden um zu verbinden.' : 'Saved — reload page to connect.' }}</p>
      </CardContent>
    </Card>

    <!-- Appearance Section -->
    <Card>
      <CardHeader>
        <CardTitle class="text-2xl">🎨 {{ $t('settings.appearance') }}</CardTitle>
      </CardHeader>
      <CardContent>
        <div class="flex items-center justify-between">
          <div>
            <Label class="text-lg font-semibold">{{ $t('settings.darkMode') }}</Label>
            <p class="text-sm text-muted-foreground">{{ $t('settings.darkModeDesc') }}</p>
          </div>
          <Switch :checked="settings.darkMode" @update:checked="settings.darkMode = $event" />
        </div>
      </CardContent>
    </Card>

    <!-- Display Settings Section -->
    <Card>
      <CardHeader>
        <CardTitle class="text-2xl">📖 {{ $t('settings.lessonDisplay') }}</CardTitle>
      </CardHeader>
      <CardContent class="space-y-6">
        <div class="flex items-center justify-between">
          <div>
            <Label class="text-lg font-semibold">{{ $t('settings.showAnswers') }}</Label>
            <p class="text-sm text-muted-foreground">{{ $t('settings.showAnswersDesc') }}</p>
          </div>
          <Switch :checked="settings.showAnswers" @update:checked="settings.showAnswers = $event" />
        </div>

        <div class="flex items-center justify-between">
          <div>
            <Label class="text-lg font-semibold">{{ $t('settings.showLearningItems') }}</Label>
            <p class="text-sm text-muted-foreground">{{ $t('settings.showLearningItemsDesc') }}</p>
          </div>
          <Switch :checked="settings.showLearningItems" @update:checked="settings.showLearningItems = $event" />
        </div>

        <div class="flex items-center justify-between">
          <div>
            <Label class="text-lg font-semibold">{{ $t('settings.showLabels') }}</Label>
            <p class="text-sm text-muted-foreground">{{ $t('settings.showLabelsDesc') }}</p>
          </div>
          <Switch :checked="settings.showLabels" @update:checked="settings.showLabels = $event" />
        </div>

        <div class="flex items-center justify-between">
          <div>
            <Label class="text-lg font-semibold">{{ $t('settings.hideLearnedExamples') }}</Label>
            <p class="text-sm text-muted-foreground">{{ $t('settings.hideLearnedExamplesDesc') }}</p>
          </div>
          <Switch :checked="settings.hideLearnedExamples" @update:checked="settings.hideLearnedExamples = $event" />
        </div>
      </CardContent>
    </Card>

    <!-- Audio Settings Section -->
    <Card>
      <CardHeader>
        <CardTitle class="text-2xl">🔊 {{ $t('settings.audioSettings') }}</CardTitle>
      </CardHeader>
      <CardContent class="space-y-6">
        <div>
          <Label class="text-lg font-semibold">{{ $t('settings.audioSpeed') }}</Label>
          <p class="text-sm text-muted-foreground mb-3">{{ $t('settings.audioSpeedDesc') }}</p>
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

        <div class="flex items-center justify-between">
          <div>
            <Label class="text-lg font-semibold">{{ $t('settings.readAnswers') }}</Label>
            <p class="text-sm text-muted-foreground">{{ $t('settings.readAnswersDesc') }}</p>
          </div>
          <Switch :checked="settings.readAnswers" @update:checked="settings.readAnswers = $event" />
        </div>

        <div class="flex items-center justify-between">
          <div>
            <Label class="text-lg font-semibold">{{ $t('settings.debugOverlay') }}</Label>
            <p class="text-sm text-muted-foreground">{{ $t('settings.debugOverlayDesc') }}</p>
          </div>
          <Switch :checked="settings.showDebugOverlay" @update:checked="settings.showDebugOverlay = $event" />
        </div>
      </CardContent>
    </Card>

    <!-- Data Section -->
    <Card>
      <CardHeader>
        <CardTitle class="text-2xl">{{ $t('settings.data') }}</CardTitle>
      </CardHeader>
      <CardContent>
        <div v-if="availableWorkshops.length === 0" class="text-sm text-muted-foreground mb-4">
          {{ $t('settings.noDataYet') }}
        </div>

        <template v-else>
          <div class="mb-4">
            <Label class="text-lg font-semibold mb-2 block">{{ $t('settings.workshopLabel') }}</Label>
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
              {{ $t('settings.export') }}
            </Button>

            <Button variant="secondary" @click="$refs.fileInput.click()">
              {{ $t('settings.import') }}
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

    <!-- Offline Workshops Section -->
    <Card v-if="offlineWorkshopList.length > 0 || storageUsage > 0">
      <CardHeader>
        <CardTitle class="text-2xl">{{ isDE ? 'Offline-Workshops' : 'Offline Workshops' }}</CardTitle>
      </CardHeader>
      <CardContent class="space-y-4">
        <p class="text-sm text-muted-foreground">
          {{ isDE
            ? `${formatBytes(storageUsage)} verwendet`
            : `${formatBytes(storageUsage)} used` }}
        </p>

        <div v-if="offlineWorkshopList.length === 0" class="text-sm text-muted-foreground">
          {{ isDE ? 'Keine Workshops heruntergeladen.' : 'No workshops downloaded.' }}
        </div>

        <div v-for="key in offlineWorkshopList" :key="key" class="flex items-center justify-between py-2 border-b border-border last:border-0">
          <span class="text-sm font-medium">{{ formatWorkshopKey(key) }}</span>
          <Button variant="outline" size="sm" @click="handleRemoveOffline(key)">
            {{ isDE ? 'Entfernen' : 'Remove' }}
          </Button>
        </div>
      </CardContent>
    </Card>
  </div>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useSettings } from '../composables/useSettings'
import { useProgress } from '../composables/useProgress'
import { useAssessments } from '../composables/useAssessments'
import { useOffline } from '../composables/useOffline'
import { useGun } from '../composables/useGun'
import { formatLangName } from '../utils/formatters'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'

const { t } = useI18n()
const router = useRouter()
const { settings } = useSettings()
const { progress, getProgress, mergeProgress } = useProgress()
const { assessments, getAssessments, mergeAssessments } = useAssessments()
const { isLoggedIn, username: gunUser, isSyncing, DEFAULT_PEERS, getActivePeers, savePeers } = useGun()
const { getOfflineWorkshops, removeWorkshop, getStorageEstimate } = useOffline()

const storageUsage = ref(0)

// Peer management
const peerList = ref([...getActivePeers()])
const peersSaved = ref(false)
const peersChanged = computed(() => JSON.stringify(peerList.value) !== JSON.stringify(DEFAULT_PEERS))

function updatePeer(idx, value) {
  peerList.value[idx] = value
  savePeers(peerList.value.filter(p => p.trim()))
  peersSaved.value = true
  setTimeout(() => { peersSaved.value = false }, 3000)
}

function addPeer() {
  peerList.value.push('')
}

function removePeer(idx) {
  peerList.value.splice(idx, 1)
  savePeers(peerList.value.filter(p => p.trim()))
  peersSaved.value = true
  setTimeout(() => { peersSaved.value = false }, 3000)
}

const peerStatus = ref({})

async function checkPeers() {
  for (const peer of peerList.value) {
    if (!peer.trim()) continue
    peerStatus.value[peer] = 'checking'
    try {
      const res = await fetch(peer, { mode: 'no-cors', signal: AbortSignal.timeout(5000) })
      peerStatus.value = { ...peerStatus.value, [peer]: 'ok' }
    } catch {
      peerStatus.value = { ...peerStatus.value, [peer]: 'fail' }
    }
  }
}

// Check on mount
checkPeers()

function resetPeers() {
  peerList.value = [...DEFAULT_PEERS]
  savePeers(DEFAULT_PEERS)
  peersSaved.value = true
  setTimeout(() => { peersSaved.value = false }, 3000)
}
const isDE = computed(() => settings.value.language === 'deutsch' || navigator.language?.startsWith('de'))

const offlineWorkshopList = computed(() => getOfflineWorkshops())

function formatWorkshopKey(key) {
  const [lang, ws] = key.split('/')
  return `${formatLangName(ws || key)} (${formatLangName(lang)})`
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

async function handleRemoveOffline(key) {
  const [lang, ws] = key.split('/')
  await removeWorkshop(lang, ws)
  await updateStorageUsage()
}

async function updateStorageUsage() {
  const estimate = await getStorageEstimate()
  storageUsage.value = estimate.usage
}

onMounted(() => {
  updateStorageUsage()
})

const importMessage = ref('')
const importMessageError = ref(false)
const selectedWorkshop = ref('')

function goToProfile() {
  router.push({ name: 'profile' })
}

const availableWorkshops = computed(() => {
  const keys = new Set()
  for (const key of Object.keys(progress.value)) {
    keys.add(key)
  }
  for (const key of Object.keys(assessments.value)) {
    const parts = key.split(':')
    if (parts.length >= 2) keys.add(`${parts[0]}:${parts[1]}`)
  }
  const sorted = [...keys].sort()
  if (sorted.length > 0 && !sorted.includes(selectedWorkshop.value)) {
    selectedWorkshop.value = sorted[0]
  }
  return sorted.map(key => {
    const [learning, workshop] = key.split(':')
    return { key, label: formatLangName(workshop) }
  })
})

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
        importMessage.value = t('settings.invalidFile')
        importMessageError.value = true
        return
      }
      if (data.progress) mergeProgress(data.progress)
      if (data.assessments) mergeAssessments(data.assessments)
      importMessage.value = t('settings.importSuccess')
      importMessageError.value = false
    } catch {
      importMessage.value = t('settings.readError')
      importMessageError.value = true
    }
  }
  reader.readAsText(file)
  event.target.value = ''
}
</script>
