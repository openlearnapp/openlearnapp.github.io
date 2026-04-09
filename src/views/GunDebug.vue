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
          <div><span class="text-muted-foreground">Configured peers:</span> {{ activePeers.join(', ') || 'none' }}</div>
        </div>

        <!-- Connected peers -->
        <div class="mt-3 pt-3 border-t border-border">
          <div class="text-xs font-medium text-foreground mb-2">Connected Peers ({{ connectedPeerList.length }})</div>
          <div v-if="!connectedPeerList.length" class="text-xs text-muted-foreground italic">No peers connected</div>
          <div v-else class="space-y-1">
            <div v-for="peer in connectedPeerList" :key="peer" class="text-xs font-mono flex items-center gap-2">
              <span class="text-green-600 dark:text-green-400">●</span>
              <span :class="peer.startsWith('/RTC/') ? 'text-purple-600 dark:text-purple-400' : 'text-foreground'">{{ peer }}</span>
              <span v-if="peer.startsWith('/RTC/')" class="text-muted-foreground">(WebRTC)</span>
              <span v-else-if="peer.startsWith('ws') || peer.startsWith('http')" class="text-muted-foreground">(Relay)</span>
            </div>
          </div>
          <p v-if="connectedPeerList.some(p => p.startsWith('/RTC/'))" class="mt-2 text-xs text-muted-foreground">
            <span class="text-purple-600 dark:text-purple-400">/RTC/</span> entries are direct browser-to-browser WebRTC connections — devices on the same network or discovered via relay signaling.
          </p>
        </div>
      </CardContent>
    </Card>

    <!-- Sync Stats -->
    <Card>
      <CardHeader class="pb-3">
        <CardTitle class="text-lg flex items-center justify-between">
          Sync Stats
          <Button variant="ghost" size="sm" class="text-xs h-6 px-2 text-muted-foreground" @click="resetSyncStats">
            Reset
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div class="grid grid-cols-2 gap-3 mb-4">
          <div class="p-3 rounded-lg bg-muted text-center">
            <div class="text-2xl font-bold text-primary">{{ formatBytes(syncStats.bytesSent) }}</div>
            <div class="text-xs text-muted-foreground mt-1">↑ Pushed</div>
          </div>
          <div class="p-3 rounded-lg bg-muted text-center">
            <div class="text-2xl font-bold text-primary">{{ formatBytes(syncStats.bytesReceived) }}</div>
            <div class="text-xs text-muted-foreground mt-1">↓ Received</div>
          </div>
          <div class="p-3 rounded-lg bg-muted text-center">
            <div class="text-2xl font-bold text-primary">{{ syncStats.pushCount }}</div>
            <div class="text-xs text-muted-foreground mt-1">Push ops</div>
          </div>
          <div class="p-3 rounded-lg bg-muted text-center">
            <div class="text-2xl font-bold text-primary">{{ syncStats.pullCount }}</div>
            <div class="text-xs text-muted-foreground mt-1">Pull ops</div>
          </div>
        </div>

        <div class="space-y-1 text-xs font-mono text-muted-foreground">
          <div>Echoes blocked: {{ syncStats.echoesBlocked }}</div>
          <div>Last push: {{ formatTimestamp(syncStats.lastPushAt) }}</div>
          <div>Last pull: {{ formatTimestamp(syncStats.lastPullAt) }}</div>
          <div>Uptime: {{ uptime }}</div>
        </div>

        <!-- Network traffic (Resource Timing API) -->
        <div v-if="syncStats.networkRequests > 0" class="mt-4 pt-3 border-t border-border">
          <div class="text-xs font-medium text-foreground mb-2">Network Traffic (relay peers)</div>
          <div class="grid grid-cols-2 gap-3">
            <div class="p-3 rounded-lg bg-muted text-center">
              <div class="text-2xl font-bold text-primary">{{ syncStats.networkRequests }}</div>
              <div class="text-xs text-muted-foreground mt-1">HTTP requests</div>
            </div>
            <div class="p-3 rounded-lg bg-muted text-center">
              <div class="text-2xl font-bold text-primary">{{ formatBytes(syncStats.networkBytes) }}</div>
              <div class="text-xs text-muted-foreground mt-1">Transfer size</div>
            </div>
          </div>
        </div>

        <!-- WebSocket frames -->
        <div v-if="wsStats.frames > 0" class="mt-4 pt-3 border-t border-border">
          <div class="text-xs font-medium text-foreground mb-2">WebSocket Frames</div>
          <div class="grid grid-cols-2 gap-3">
            <div class="p-3 rounded-lg bg-muted text-center">
              <div class="text-2xl font-bold text-primary">{{ wsStats.frames }}</div>
              <div class="text-xs text-muted-foreground mt-1">Total frames</div>
            </div>
            <div class="p-3 rounded-lg bg-muted text-center">
              <div class="text-2xl font-bold text-primary">{{ formatBytes(wsStats.bytes) }}</div>
              <div class="text-xs text-muted-foreground mt-1">Total payload</div>
            </div>
          </div>
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
            <span class="flex-shrink-0">{{ event.size }}</span>
            <span class="truncate text-muted-foreground">{{ event.preview }}</span>
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

const { isLoggedIn, username, isSyncing, isConnected, connectedPeerList, syncStats, resetSyncStats, getActivePeers, syncToGun } = useGun()

const syncKeys = ['settings', 'progress', 'assessments']
const activePeers = ref(getActivePeers())
const gunData = ref({})
const events = ref([])
const isRefreshing = ref(false)
const isPushing = ref(false)
const uptime = ref('—')
const wsStats = reactive({ frames: 0, bytes: 0 })

let uptimeTimer = null

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
  return formatBytes(bytes)
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

function onGunSync(e) {
  const { key, data } = e.detail
  const now = new Date()
  const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`
  const raw = JSON.stringify(data)
  const size = formatBytes(raw.length)
  const preview = raw.slice(0, 60)
  events.value.unshift({ time, key, size, preview })
  if (events.value.length > 50) events.value.pop()

  gunData.value[key] = data
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
  if (isLoggedIn.value) refresh()
})

onUnmounted(() => {
  window.removeEventListener('gun-sync', onGunSync)
  unpatchWebSocket()
  if (uptimeTimer) clearInterval(uptimeTimer)
})
</script>
