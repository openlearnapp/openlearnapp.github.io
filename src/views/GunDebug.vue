<template>
  <div class="space-y-6">

    <!-- Connection Status -->
    <Card>
      <CardHeader class="pb-3">
        <CardTitle class="text-lg flex items-center justify-between">
          Connection
          <span class="text-sm font-medium px-2 py-0.5 rounded-full"
            :class="isConnected ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'">
            {{ isConnected ? '● Connected' : '○ Disconnected' }}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div class="space-y-1 text-sm font-mono">
          <div><span class="text-muted-foreground">Logged in:</span> {{ isLoggedIn }}</div>
          <div><span class="text-muted-foreground">Username:</span> {{ username || '—' }}</div>
          <div><span class="text-muted-foreground">Syncing:</span> {{ isSyncing }}</div>
          <div><span class="text-muted-foreground">Peers:</span> {{ activePeers.join(', ') || 'none' }}</div>
        </div>
      </CardContent>
    </Card>

    <!-- Gun Data -->
    <Card v-for="key in syncKeys" :key="key">
      <CardHeader class="pb-3">
        <CardTitle class="text-lg flex items-center justify-between">
          <span>gun.user().openlearn.<span class="text-primary">{{ key }}</span></span>
          <span class="text-xs font-mono text-muted-foreground">
            {{ gunData[key] ? formatSize(gunData[key]) : '—' }}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div v-if="gunData[key] === undefined" class="text-sm text-muted-foreground italic">Loading…</div>
        <div v-else-if="gunData[key] === null" class="text-sm text-muted-foreground italic">No data on relay</div>
        <pre v-else class="text-xs font-mono bg-muted rounded-lg p-3 overflow-x-auto max-h-64 overflow-y-auto whitespace-pre-wrap break-all">{{ JSON.stringify(gunData[key], null, 2) }}</pre>
      </CardContent>
    </Card>

    <!-- Local vs Remote Diff -->
    <Card>
      <CardHeader class="pb-3">
        <CardTitle class="text-lg">Local vs Remote</CardTitle>
      </CardHeader>
      <CardContent>
        <div class="space-y-3">
          <div v-for="key in syncKeys" :key="key" class="text-sm">
            <div class="font-medium mb-1">{{ key }}</div>
            <div v-if="gunData[key] === undefined" class="text-muted-foreground italic">Loading…</div>
            <div v-else :class="diffStatus(key) === 'match' ? 'text-green-600 dark:text-green-400' : diffStatus(key) === 'mismatch' ? 'text-orange-600 dark:text-orange-400' : 'text-muted-foreground'">
              {{ diffStatus(key) === 'match' ? '✓ In sync' : diffStatus(key) === 'mismatch' ? '✗ Different' : '— No remote data' }}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Actions -->
    <Card>
      <CardHeader class="pb-3">
        <CardTitle class="text-lg">Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div class="flex flex-wrap gap-3">
          <Button variant="outline" size="sm" @click="refresh" :disabled="!isLoggedIn || isRefreshing">
            {{ isRefreshing ? '⟳ Loading…' : '↻ Refresh from Gun' }}
          </Button>
          <Button variant="outline" size="sm" @click="pushAll" :disabled="!isLoggedIn || isPushing">
            {{ isPushing ? '⟳ Pushing…' : '↑ Push all to Gun' }}
          </Button>
        </div>
      </CardContent>
    </Card>

    <!-- Event Log -->
    <Card>
      <CardHeader class="pb-3">
        <CardTitle class="text-lg flex items-center justify-between">
          Sync Events
          <Button v-if="events.length" variant="ghost" size="sm" class="text-xs h-6 px-2 text-muted-foreground" @click="events = []">
            Clear
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div v-if="!events.length" class="text-sm text-muted-foreground italic">No events yet. Changes on other devices will appear here.</div>
        <div v-else class="space-y-1 max-h-64 overflow-y-auto">
          <div v-for="(event, i) in events" :key="i" class="text-xs font-mono flex gap-2">
            <span class="text-muted-foreground flex-shrink-0">{{ event.time }}</span>
            <span class="text-primary flex-shrink-0">{{ event.key }}</span>
            <span class="truncate text-muted-foreground">{{ event.preview }}</span>
          </div>
        </div>
      </CardContent>
    </Card>

  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useGun } from '../composables/useGun'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

const emit = defineEmits(['update-title'])
emit('update-title', '🔍 Gun Debug')

const { isLoggedIn, username, isSyncing, isConnected, getActivePeers, syncToGun } = useGun()

const syncKeys = ['settings', 'progress', 'assessments']
const activePeers = ref(getActivePeers())
const gunData = ref({})
const events = ref([])
const isRefreshing = ref(false)
const isPushing = ref(false)

// Dynamically import Gun to read data directly
let gun = null

async function getGunInstance() {
  if (gun) return gun
  const GunModule = await import('gun/gun')
  const Gun = GunModule.default || GunModule
  await import('gun/sea')
  // Reuse existing Gun instance by connecting to same peers
  gun = Gun({ localStorage: true, peers: getActivePeers() })
  return gun
}

async function refresh() {
  if (!isLoggedIn.value) return
  isRefreshing.value = true

  try {
    // Read directly from the Gun user graph via useGun's loadFromGun-style approach
    // We use the shared Gun instance via the composable
    const { loadFromGun } = useGun()
    const remote = await loadFromGun()

    for (const key of syncKeys) {
      gunData.value[key] = remote && remote[key] ? remote[key] : null
    }
  } finally {
    isRefreshing.value = false
  }
}

async function pushAll() {
  if (!isLoggedIn.value) return
  isPushing.value = true

  try {
    for (const key of syncKeys) {
      const saved = localStorage.getItem(key)
      if (saved) {
        try {
          await syncToGun(key, JSON.parse(saved))
        } catch { /* skip */ }
      }
    }
    // Re-read after push
    await refresh()
  } finally {
    isPushing.value = false
  }
}

function diffStatus(key) {
  const remote = gunData.value[key]
  if (remote === null || remote === undefined) return 'empty'
  const local = localStorage.getItem(key)
  if (!local) return 'mismatch'
  try {
    const localStr = JSON.stringify(JSON.parse(local))
    const remoteStr = JSON.stringify(remote)
    return localStr === remoteStr ? 'match' : 'mismatch'
  } catch {
    return 'mismatch'
  }
}

function formatSize(data) {
  const bytes = JSON.stringify(data).length
  if (bytes < 1024) return `${bytes} B`
  return `${(bytes / 1024).toFixed(1)} KB`
}

function onGunSync(e) {
  const { key, data } = e.detail
  const now = new Date()
  const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`
  const preview = JSON.stringify(data).slice(0, 80)
  events.value.unshift({ time, key, preview })
  if (events.value.length > 50) events.value.pop()

  // Update displayed data live
  gunData.value[key] = data
}

onMounted(() => {
  window.addEventListener('gun-sync', onGunSync)
  if (isLoggedIn.value) refresh()
})

onUnmounted(() => {
  window.removeEventListener('gun-sync', onGunSync)
})
</script>
