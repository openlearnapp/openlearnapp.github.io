import { ref, reactive } from 'vue'

// Gun is loaded dynamically to avoid SSR issues
let Gun = null
let gun = null
let user = null
let syncListener = null

// Reactive state
const isLoggedIn = ref(false)
const username = ref('')
const authError = ref('')
const isSyncing = ref(false)
const isConnected = ref(false)
const connectedPeerList = ref([]) // tracks which peers are actually connected

// Sync metrics — tracks bytes, operations, and timing
const syncStats = reactive({
  bytesSent: 0,
  bytesReceived: 0,
  pushCount: 0,
  pullCount: 0,
  duplicatesSkipped: 0,
  lastPushAt: null,
  lastPullAt: null,
  startedAt: null,
  networkRequests: 0,
  networkBytes: 0,
})

// Each device gets a unique ID to distinguish own writes from remote ones
const DEVICE_ID = Math.random().toString(36).slice(2, 10)

// Track the last sync timestamp we wrote, so we can ignore our own .on() echo
let _lastOwnSync = 0

// Guard: prevents echo-back when applying remote data
let _applyingRemote = false

const SESSION_KEY = 'gun-session'
const PEERS_KEY = 'gun-peers'
const SYNC_KEYS = ['settings', 'progress', 'assessments', 'contentSources']

// Default public Gun relay peers (verified working)
const DEFAULT_PEERS = [
  'https://toplocs.com/gun',
  'https://relay.peer.ooo/gun',
]

function getSavedPeers() {
  try {
    const saved = localStorage.getItem(PEERS_KEY)
    return saved ? JSON.parse(saved) : null
  } catch { return null }
}

function savePeers(peers) {
  localStorage.setItem(PEERS_KEY, JSON.stringify(peers))
}

function getActivePeers() {
  return getSavedPeers() || DEFAULT_PEERS
}

// Initialize Gun (browser-only, multicast for LAN discovery)
async function initGun() {
  if (gun) return

  const GunModule = await import('gun/gun')
  Gun = GunModule.default || GunModule
  await import('gun/sea')

  const peers = getActivePeers()
  console.log(`🔗 Gun peers: ${peers.length > 0 ? peers.join(', ') : 'none (local only)'}`)

  gun = Gun({
    localStorage: true,
    radisk: false,
    file: 'gun-data',
    peers,
    multicast: true  // UDP multicast for same-WLAN device discovery (no WebRTC needed)
  })
  user = gun.user().recall({ sessionStorage: true })

  syncStats.startedAt = Date.now()

  // Track actual network traffic to Gun relay peers via Resource Timing API
  const peerOrigins = peers.map(p => { try { return new URL(p).origin } catch { return null } }).filter(Boolean)
  if (typeof PerformanceObserver !== 'undefined' && peerOrigins.length) {
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (peerOrigins.some(o => entry.name.startsWith(o))) {
            syncStats.networkRequests++
            syncStats.networkBytes += entry.transferSize || 0
          }
        }
      })
      observer.observe({ type: 'resource', buffered: false })
    } catch {
      // PerformanceObserver not supported, skip
    }
  }

  // Track peer connectivity — Gun passes the peer object to hi/bye
  gun.on('hi', (peer) => {
    const id = peer?.url || peer?.id || 'unknown'
    if (!connectedPeerList.value.includes(id)) {
      connectedPeerList.value.push(id)
    }
    isConnected.value = true
  })
  gun.on('bye', (peer) => {
    const id = peer?.url || peer?.id || 'unknown'
    connectedPeerList.value = connectedPeerList.value.filter(p => p !== id)
    isConnected.value = connectedPeerList.value.length > 0
  })

  // Listen for recall-based session restoration
  gun.on('auth', () => {
    if (gun.user().is) {
      isLoggedIn.value = true
      // After recall(), gun.user().is.alias contains the public key, not the human-readable name.
      // The readable alias is stored in localStorage under SESSION_KEY.
      username.value = localStorage.getItem(SESSION_KEY) || ''
      setupSyncListener()
      autoSyncAll()
    }
  })
}

// Register a new user
async function register(alias, pass) {
  authError.value = ''
  if (!gun) await initGun()

  return new Promise((resolve) => {
    gun.user().create(alias, pass, (ack) => {
      if (ack.err) {
        authError.value = ack.err
        resolve(false)
      } else {
        // Auto-login after register
        login(alias, pass).then(resolve)
      }
    })
  })
}

// Login
async function login(alias, pass) {
  authError.value = ''
  if (!gun) await initGun()

  return new Promise((resolve) => {
    gun.user().auth(alias, pass, (ack) => {
      if (ack.err) {
        authError.value = ack.err
        isLoggedIn.value = false
        username.value = ''
        localStorage.removeItem(SESSION_KEY)
        resolve(false)
      } else {
        isLoggedIn.value = true
        username.value = alias
        // Only store alias — never the password. Session is handled by Gun's recall().
        localStorage.setItem(SESSION_KEY, alias)
        setupSyncListener()
        autoSyncAll()
        resolve(true)
      }
    })
  })
}

// Logout
function logout() {
  teardownSyncListener()
  if (gun && gun.user()) {
    gun.user().leave()
  }
  isLoggedIn.value = false
  username.value = ''
  authError.value = ''
  localStorage.removeItem(SESSION_KEY)
}

// Auto-login via Gun's recall (session stored by Gun internally, no password needed)
async function autoLogin() {
  if (!gun) await initGun()

  // Gun's recall() was already called in initGun() — it restores the session automatically.
  // The 'auth' event handler in initGun() will set isLoggedIn when session is restored.
  return new Promise((resolve) => {
    if (isLoggedIn.value) {
      resolve(true)
      return
    }
    // Wait up to 2 seconds for recall to restore the session
    const timeout = setTimeout(() => resolve(false), 2000)
    const check = setInterval(() => {
      if (isLoggedIn.value) {
        clearTimeout(timeout)
        clearInterval(check)
        resolve(true)
      }
    }, 100)
  })
}

// Write a sync marker so other devices know data changed.
// Format: "timestamp:deviceId" — the deviceId lets us ignore our own writes.
function writeSyncMarker() {
  if (!isLoggedIn.value || !gun) return
  _lastOwnSync = Date.now()
  const marker = `${_lastOwnSync}:${DEVICE_ID}`
  gun.user().get('openlearn').get('lastSync').put(marker)
}

// Read the current sync marker from Gun (for debug display)
function readSyncMarker() {
  if (!isLoggedIn.value || !gun) return Promise.resolve(null)
  return new Promise((resolve) => {
    gun.user().get('openlearn').get('lastSync').once((val) => {
      resolve(val || null)
    })
    setTimeout(() => resolve(null), 3000)
  })
}

// Sync data to Gun (encrypted under user space)
async function syncToGun(key, data) {
  if (_applyingRemote) return // Don't echo remote data back
  if (!isLoggedIn.value || !gun) return

  try {
    const payload = JSON.stringify(data)
    syncStats.bytesSent += payload.length
    syncStats.pushCount++
    syncStats.lastPushAt = Date.now()
    gun.user().get('openlearn').get(key).put(payload)
    writeSyncMarker()
    window.dispatchEvent(new CustomEvent('gun-sync', { detail: { key, data, method: 'put' } }))
  } catch (e) {
    console.error('Gun sync error:', e)
  }
}

// Load all data from Gun into localStorage
async function loadFromGun() {
  if (!isLoggedIn.value || !gun) return null

  isSyncing.value = true

  const results = {}

  try {
    for (const key of SYNC_KEYS) {
      const data = await new Promise((resolve) => {
        gun.user().get('openlearn').get(key).once((val) => {
          if (val && typeof val === 'string') {
            try {
              resolve(JSON.parse(val))
            } catch {
              resolve(null)
            }
          } else {
            resolve(null)
          }
        })
        // Timeout after 3 seconds
        setTimeout(() => resolve(null), 3000)
      })
      if (data) results[key] = data
    }
  } finally {
    isSyncing.value = false
  }

  return results
}

// Pull all data from Gun and dispatch gun-sync events for each key
async function pullFromRemote() {
  if (!isLoggedIn.value || !gun) return

  isSyncing.value = true
  syncStats.lastPullAt = Date.now()

  try {
    for (const key of SYNC_KEYS) {
      const val = await new Promise((resolve) => {
        gun.user().get('openlearn').get(key).once((v) => resolve(v))
        setTimeout(() => resolve(null), 3000)
      })

      if (!val || typeof val !== 'string') continue

      syncStats.bytesReceived += val.length
      syncStats.pullCount++

      try {
        const data = JSON.parse(val)
        _applyingRemote = true
        window.dispatchEvent(new CustomEvent('gun-sync', { detail: { key, data, method: 'once' } }))
        // Reset after Vue watchers have flushed (watchers run as microtasks,
        // setTimeout runs as macrotask — guaranteed to come after)
        await new Promise(r => setTimeout(r, 0))
        _applyingRemote = false
      } catch {
        // ignore parse errors
      }
    }
  } finally {
    _applyingRemote = false
    isSyncing.value = false
  }

  // After merge, push the merged result back to Gun so both sides converge.
  // No sync marker — this is a silent push. Writing a marker here would cause
  // the other device to pull again, creating an infinite loop.
  for (const key of SYNC_KEYS) {
    const merged = localStorage.getItem(key)
    if (merged) {
      try {
        const data = JSON.parse(merged)
        const payload = JSON.stringify(data)
        syncStats.bytesSent += payload.length
        syncStats.pushCount++
        syncStats.lastPushAt = Date.now()
        gun.user().get('openlearn').get(key).put(payload)
        window.dispatchEvent(new CustomEvent('gun-sync', { detail: { key, data, method: 'put (merge-back)' } }))
      } catch {
        // skip invalid data
      }
    }
  }
}

// Set up a single .on() listener on the lastSync marker.
// When another device writes a new marker, we pull all data via .once().
function setupSyncListener() {
  teardownSyncListener()

  if (!isLoggedIn.value || !gun) return

  const syncRef = gun.user().get('openlearn').get('lastSync')
  const cb = (val) => {
    if (!val || typeof val !== 'string') return

    // Parse "timestamp:deviceId"
    const colonIdx = val.indexOf(':')
    if (colonIdx === -1) return
    const ts = parseInt(val.slice(0, colonIdx), 10)
    const deviceId = val.slice(colonIdx + 1)

    // Ignore our own writes
    if (deviceId === DEVICE_ID) {
      syncStats.duplicatesSkipped++
      return
    }

    // Ignore if we've already seen this timestamp
    if (ts <= _lastOwnSync) {
      syncStats.duplicatesSkipped++
      return
    }

    console.log(`🔄 Remote sync from device ${deviceId} at ${new Date(ts).toLocaleTimeString()}`)
    window.dispatchEvent(new CustomEvent('gun-sync', {
      detail: { key: 'lastSync', data: { timestamp: ts, deviceId }, method: 'on' }
    }))
    _lastOwnSync = ts
    pullFromRemote()
  }
  syncRef.on(cb)
  syncListener = { ref: syncRef, cb }
}

// Remove the sync listener
function teardownSyncListener() {
  if (syncListener) {
    try {
      syncListener.ref.off(syncListener.cb)
    } catch {
      // ignore
    }
    syncListener = null
  }
}

// Auto-sync: push all current localStorage data to Gun
async function autoSyncAll() {
  if (!isLoggedIn.value) return

  isSyncing.value = true

  try {
    for (const key of SYNC_KEYS) {
      const saved = localStorage.getItem(key)
      if (saved) {
        try {
          const data = JSON.parse(saved)
          // Write data directly without triggering writeSyncMarker per key
          const payload = JSON.stringify(data)
          syncStats.bytesSent += payload.length
          syncStats.pushCount++
          syncStats.lastPushAt = Date.now()
          gun.user().get('openlearn').get(key).put(payload)
        } catch {
          // skip invalid data
        }
      }
    }
    // Single sync marker after all keys are written
    writeSyncMarker()
  } finally {
    isSyncing.value = false
  }
}

function resetSyncStats() {
  Object.assign(syncStats, {
    bytesSent: 0, bytesReceived: 0, pushCount: 0, pullCount: 0,
    duplicatesSkipped: 0, lastPushAt: null, lastPullAt: null,
    startedAt: Date.now(), networkRequests: 0, networkBytes: 0,
  })
}

export function useGun() {
  return {
    isLoggedIn,
    username,
    authError,
    isSyncing,
    isConnected,
    connectedPeerList,
    syncStats,
    resetSyncStats,
    DEVICE_ID,
    initGun,
    register,
    login,
    logout,
    autoLogin,
    syncToGun,
    readSyncMarker,
    loadFromGun,
    autoSyncAll,
    DEFAULT_PEERS,
    getActivePeers,
    savePeers
  }
}
