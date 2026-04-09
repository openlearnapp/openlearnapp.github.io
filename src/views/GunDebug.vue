<template>
  <div class="space-y-6">

    <!-- Connection & Identity -->
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
          <div><span class="text-muted-foreground">Username:</span> {{ username || '—' }}</div>
          <div><span class="text-muted-foreground">Device ID:</span> <span class="text-primary">{{ DEVICE_ID }}</span></div>
          <div><span class="text-muted-foreground">Logged in:</span> {{ isLoggedIn }}</div>
        </div>

        <!-- Connected peers -->
        <div class="mt-3 pt-3 border-t border-border">
          <div class="text-xs font-medium text-foreground mb-2">Connected Peers ({{ connectedPeerList.length }})</div>
          <div v-if="!connectedPeerList.length" class="text-xs text-muted-foreground italic">No peers connected</div>
          <div v-else class="space-y-1">
            <div v-for="peer in connectedPeerList" :key="peer" class="text-xs font-mono flex items-center gap-2">
              <span class="text-green-600 dark:text-green-400">●</span>
              <span>{{ peer }}</span>
              <span class="text-muted-foreground">(Relay)</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Sync Marker — the core of the new sync mechanism -->
    <Card>
      <CardHeader class="pb-3">
        <CardTitle class="text-lg">Sync Marker</CardTitle>
      </CardHeader>
      <CardContent>
        <p class="text-xs text-muted-foreground mb-3">
          Single <code class="bg-muted px-1 rounded">.on()</code> listener on <code class="bg-muted px-1 rounded">lastSync</code>.
          When another device writes a new marker, this device pulls all data via <code class="bg-muted px-1 rounded">.once()</code>.
        </p>

        <div class="p-3 rounded-lg bg-muted font-mono text-sm">
          <div class="text-muted-foreground text-xs mb-1">gun.user().openlearn.lastSync</div>
          <div v-if="lastSyncMarker" class="flex items-center gap-2 flex-wrap">
            <span class="text-foreground">{{ lastSyncMarker.timestamp }}</span>
            <span class="text-muted-foreground">:</span>
            <span :class="lastSyncMarker.deviceId === DEVICE_ID ? 'text-primary' : 'text-orange-600 dark:text-orange-400'">
              {{ lastSyncMarker.deviceId }}
            </span>
            <span v-if="lastSyncMarker.deviceId === DEVICE_ID" class="text-xs text-muted-foreground">(this device)</span>
            <span v-else class="text-xs text-muted-foreground">(remote)</span>
          </div>
          <div v-else class="text-muted-foreground italic">No marker yet</div>
        </div>

        <div class="mt-3 grid grid-cols-2 gap-2 text-center">
          <div class="p-2 rounded bg-muted">
            <div class="text-lg font-bold text-primary">{{ syncStats.duplicatesSkipped }}</div>
            <div class="text-xs text-muted-foreground">Own writes ignored</div>
          </div>
          <div class="p-2 rounded bg-muted">
            <div class="text-lg font-bold text-primary">{{ remotePullCount }}</div>
            <div class="text-xs text-muted-foreground">Remote pulls triggered</div>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Traffic Stats -->
    <Card>
      <CardHeader class="pb-3">
        <CardTitle class="text-lg flex items-center justify-between">
          Traffic
          <div class="flex items-center gap-2">
            <span class="text-xs text-muted-foreground font-normal">{{ uptime }}</span>
            <Button variant="ghost" size="sm" class="text-xs h-6 px-2 text-muted-foreground" @click="handleReset">
              Reset
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div class="grid grid-cols-2 gap-3 mb-3">
          <div class="p-3 rounded-lg bg-muted text-center">
            <div class="text-2xl font-bold text-primary">{{ formatBytes(syncStats.bytesSent) }}</div>
            <div class="text-xs text-muted-foreground mt-1">↑ Pushed ({{ syncStats.pushCount }} ops)</div>
          </div>
          <div class="p-3 rounded-lg bg-muted text-center">
            <div class="text-2xl font-bold text-primary">{{ formatBytes(syncStats.bytesReceived) }}</div>
            <div class="text-xs text-muted-foreground mt-1">↓ Pulled ({{ syncStats.pullCount }} ops)</div>
          </div>
        </div>

        <div class="space-y-1 text-xs font-mono text-muted-foreground">
          <div>Last push: {{ formatTimestamp(syncStats.lastPushAt) }}</div>
          <div>Last pull: {{ formatTimestamp(syncStats.lastPullAt) }}</div>
        </div>

        <!-- WebSocket / Network -->
        <div v-if="wsStats.frames > 0 || syncStats.networkRequests > 0" class="mt-3 pt-3 border-t border-border">
          <div class="text-xs font-medium text-foreground mb-2">Network Layer</div>
          <div class="grid grid-cols-2 gap-3">
            <div v-if="wsStats.frames > 0" class="p-2 rounded bg-muted text-center">
              <div class="text-lg font-bold text-primary">{{ wsStats.frames }}</div>
              <div class="text-xs text-muted-foreground">WS frames ({{ formatBytes(wsStats.bytes) }})</div>
            </div>
            <div v-if="syncStats.networkRequests > 0" class="p-2 rounded bg-muted text-center">
              <div class="text-lg font-bold text-primary">{{ syncStats.networkRequests }}</div>
              <div class="text-xs text-muted-foreground">HTTP reqs ({{ formatBytes(syncStats.networkBytes) }})</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Data Keys — collapsed by default -->
    <Card>
      <CardHeader class="pb-3">
        <CardTitle class="text-lg flex items-center justify-between">
          Synced Data
          <div class="flex items-center gap-2">
            <Button variant="outline" size="sm" class="text-xs h-7" @click="refresh" :disabled="!isLoggedIn || isRefreshing">
              {{ isRefreshing ? '⟳ …' : '↻ Pull' }}
            </Button>
            <Button variant="outline" size="sm" class="text-xs h-7" @click="pushAll" :disabled="!isLoggedIn || isPushing">
              {{ isPushing ? '⟳ …' : '↑ Push' }}
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div class="space-y-3">
          <div v-for="key in syncKeys" :key="key" class="border border-border rounded-lg overflow-hidden">
            <!-- Key header — clickable to expand -->
            <button @click="toggleExpand(key)" class="w-full flex items-center justify-between p-3 text-left hover:bg-muted/50 transition-colors">
              <div class="flex items-center gap-2">
                <span class="text-xs text-muted-foreground">{{ expandedKeys[key] ? '▼' : '▶' }}</span>
                <span class="text-sm font-mono font-medium">{{ key }}</span>
              </div>
              <div class="flex items-center gap-2">
                <span class="text-xs" :class="diffStatus(key) === 'match' ? 'text-green-600 dark:text-green-400' : diffStatus(key) === 'mismatch' ? 'text-orange-600 dark:text-orange-400' : 'text-muted-foreground'">
                  {{ diffStatus(key) === 'match' ? '✓ synced' : diffStatus(key) === 'mismatch' ? '✗ differs' : '— empty' }}
                </span>
                <span class="text-xs font-mono text-muted-foreground">
                  {{ gunData[key] ? formatSize(gunData[key]) : '—' }}
                </span>
              </div>
            </button>
            <!-- Expanded content -->
            <div v-if="expandedKeys[key]" class="border-t border-border">
              <div v-if="gunData[key] === undefined" class="p-3 text-sm text-muted-foreground italic">Loading…</div>
              <div v-else-if="gunData[key] === null" class="p-3 text-sm text-muted-foreground italic">No data on relay</div>
              <pre v-else class="text-xs font-mono p-3 overflow-x-auto max-h-64 overflow-y-auto whitespace-pre-wrap break-all bg-muted/30">{{ JSON.stringify(gunData[key], null, 2) }}</pre>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Event Log -->
    <Card>
      <CardHeader class="pb-3">
        <CardTitle class="text-lg flex items-center justify-between">
          Sync Events
          <div class="flex items-center gap-2">
            <span v-if="events.length" class="text-xs text-muted-foreground font-normal">{{ events.length }}</span>
            <Button v-if="events.length" variant="ghost" size="sm" class="text-xs h-6 px-2 text-muted-foreground" @click="events = []">
              Clear
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div v-if="!events.length" class="text-sm text-muted-foreground italic">
          Waiting for remote sync events… When another device changes data, events will appear here in real time.
        </div>
        <div v-else class="space-y-1 max-h-[32rem] overflow-y-auto">
          <div v-for="(event, i) in events" :key="i" class="border border-border rounded-lg overflow-hidden">
            <button @click="event.open = !event.open" class="w-full flex items-center gap-2 p-2 text-left hover:bg-muted/50 transition-colors text-xs font-mono">
              <span class="text-muted-foreground/60">{{ event.open ? '▼' : '▶' }}</span>
              <span class="text-muted-foreground">{{ event.time }}</span>
              <span class="font-medium px-1.5 py-0.5 rounded bg-primary/10 text-primary">{{ event.key }}</span>
              <span class="text-muted-foreground">{{ event.size }}</span>
            </button>
            <pre v-if="event.open" class="text-xs font-mono bg-muted p-2 overflow-x-auto whitespace-pre-wrap break-all max-h-64 overflow-y-auto border-t border-border">{{ event.data }}</pre>
          </div>
        </div>
      </CardContent>
    </Card>

  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { useGun } from '../composables/useGun'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

const emit = defineEmits(['update-title'])
emit('update-title', '🔍 Gun Debug')

const { isLoggedIn, username, isSyncing, isConnected, connectedPeerList, syncStats, resetSyncStats, DEVICE_ID, getActivePeers, syncToGun, readSyncMarker } = useGun()

const syncKeys = ['settings', 'progress', 'assessments', 'contentSources']
const activePeers = ref(getActivePeers())
const gunData = ref({})
const events = ref([])
const isRefreshing = ref(false)
const isPushing = ref(false)
const uptime = ref('—')
const wsStats = reactive({ frames: 0, bytes: 0 })
const expandedKeys = reactive({})
const lastSyncMarker = ref(null)
const remotePullCount = ref(0)

let uptimeTimer = null
let markerListener = null

async function refresh() {
  if (!isLoggedIn.value) return
  isRefreshing.value = true

  try {
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
    await refresh()
    await fetchSyncMarker()
  } finally {
    isPushing.value = false
  }
}

function toggleExpand(key) {
  expandedKeys[key] = !expandedKeys[key]
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
  return formatBytes(JSON.stringify(data).length)
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 B'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatTimestamp(ts) {
  if (!ts) return '—'
  const d = new Date(ts)
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`
}

function updateUptime() {
  if (!syncStats.startedAt) {
    uptime.value = '—'
    return
  }
  const secs = Math.floor((Date.now() - syncStats.startedAt) / 1000)
  if (secs < 60) uptime.value = `${secs}s`
  else if (secs < 3600) uptime.value = `${Math.floor(secs / 60)}m ${secs % 60}s`
  else uptime.value = `${Math.floor(secs / 3600)}h ${Math.floor((secs % 3600) / 60)}m`
}

function handleReset() {
  resetSyncStats()
  wsStats.frames = 0
  wsStats.bytes = 0
  remotePullCount.value = 0
}

function onGunSync(e) {
  const { key, data } = e.detail
  const now = new Date()
  const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`
  const raw = JSON.stringify(data, null, 2)
  const size = formatBytes(raw.length)
  events.value.unshift({ time, key, size, data: raw, open: false })
  if (events.value.length > 100) events.value.pop()

  gunData.value[key] = data
  remotePullCount.value++
  // Refresh the sync marker since a remote pull just happened
  fetchSyncMarker()
}

async function fetchSyncMarker() {
  const val = await readSyncMarker()
  if (!val || typeof val !== 'string') return
  const colonIdx = val.indexOf(':')
  if (colonIdx === -1) return
  const ts = parseInt(val.slice(0, colonIdx), 10)
  const deviceId = val.slice(colonIdx + 1)
  if (isNaN(ts)) return
  const d = new Date(ts)
  lastSyncMarker.value = {
    timestamp: `${d.toLocaleDateString()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`,
    deviceId,
    raw: val
  }
}

// Monitor WebSocket traffic by patching WebSocket.prototype.send
let origWsSend = null

function patchWebSocket() {
  if (origWsSend) return
  origWsSend = WebSocket.prototype.send
  WebSocket.prototype.send = function(data) {
    wsStats.frames++
    if (typeof data === 'string') wsStats.bytes += data.length
    else if (data instanceof ArrayBuffer) wsStats.bytes += data.byteLength
    else if (data instanceof Blob) wsStats.bytes += data.size
    return origWsSend.call(this, data)
  }
}

function unpatchWebSocket() {
  if (origWsSend) {
    WebSocket.prototype.send = origWsSend
    origWsSend = null
  }
}

onMounted(() => {
  window.addEventListener('gun-sync', onGunSync)
  patchWebSocket()
  uptimeTimer = setInterval(updateUptime, 1000)
  updateUptime()
  if (isLoggedIn.value) {
    refresh()
    fetchSyncMarker()
  }
})

onUnmounted(() => {
  window.removeEventListener('gun-sync', onGunSync)
  unpatchWebSocket()
  if (uptimeTimer) clearInterval(uptimeTimer)
})
</script>
