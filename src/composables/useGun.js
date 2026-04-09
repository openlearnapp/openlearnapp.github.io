import { ref, reactive } from 'vue'

// Gun is loaded dynamically to avoid SSR issues
let Gun = null
let gun = null
let user = null
let listeners = []

// Reactive state
const isLoggedIn = ref(false)
const username = ref('')
const authError = ref('')
const isSyncing = ref(false)
const isConnected = ref(false)
const connectedPeerList = ref([]) // tracks which peers are actually connected
let connectedPeers = 0

// Sync metrics — tracks bytes, operations, and timing
const syncStats = reactive({
  bytesSent: 0,
  bytesReceived: 0,
  pushCount: 0,
  pullCount: 0,
  echoesBlocked: 0,
  duplicatesSkipped: 0,
  lastPushAt: null,
  lastPullAt: null,
  startedAt: null,
  networkRequests: 0,
  networkBytes: 0,
})

// Guard: prevents echo-back when applying remote data.
// When a .on() listener fires, the dispatched gun-sync event triggers Object.assign
// on reactive state, which triggers Vue watchers, which call syncToGun — pushing
// the same data right back. This flag suppresses that echo.
let _applyingRemote = false

// Deduplication: Gun's .on() fires on every put, even if data hasn't changed.
// We cache the last received JSON string per key to skip redundant processing.
const _lastReceived = {}

const SESSION_KEY = 'gun-session'
const PEERS_KEY = 'gun-peers'

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
    connectedPeers = connectedPeerList.value.length
    isConnected.value = true
  })
  gun.on('bye', (peer) => {
    const id = peer?.url || peer?.id || 'unknown'
    connectedPeerList.value = connectedPeerList.value.filter(p => p !== id)
    connectedPeers = connectedPeerList.value.length
    isConnected.value = connectedPeers > 0
  })

  // Listen for recall-based session restoration
  gun.on('auth', () => {
    if (gun.user().is) {
      isLoggedIn.value = true
      // After recall(), gun.user().is.alias contains the public key, not the human-readable name.
      // The readable alias is stored in localStorage under SESSION_KEY.
      username.value = localStorage.getItem(SESSION_KEY) || ''
      setupListeners()
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
        setupListeners()
        autoSyncAll()
        resolve(true)
      }
    })
  })
}

// Logout
function logout() {
  teardownListeners()
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

// Sync data to Gun (encrypted under user space)
async function syncToGun(key, data) {
  if (_applyingRemote) {
    syncStats.echoesBlocked++
    return
  }
  if (!isLoggedIn.value || !gun) return

  try {
    const payload = JSON.stringify(data)
    syncStats.bytesSent += payload.length
    syncStats.pushCount++
    syncStats.lastPushAt = Date.now()
    gun.user().get('openlearn').get(key).put(payload)
  } catch (e) {
    console.error('Gun sync error:', e)
  }
}

// Load all data from Gun into localStorage
async function loadFromGun() {
  if (!isLoggedIn.value || !gun) return null

  isSyncing.value = true

  const keys = ['settings', 'progress', 'assessments']
  const results = {}

  try {
    for (const key of keys) {
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

// Set up real-time listeners for cross-tab/device sync
function setupListeners() {
  teardownListeners()

  if (!isLoggedIn.value || !gun) return

  const keys = ['settings', 'progress', 'assessments']

  for (const key of keys) {
    const gunRef = gun.user().get('openlearn').get(key)
    const cb = (val) => {
      if (!val || typeof val !== 'string') return

      // Deduplicate: Gun's .on() fires on every relay sync even if data is identical
      if (_lastReceived[key] === val) {
        syncStats.duplicatesSkipped++
        return
      }
      _lastReceived[key] = val

      try {
        const data = JSON.parse(val)
        syncStats.bytesReceived += val.length
        syncStats.pullCount++
        syncStats.lastPullAt = Date.now()
        // Set guard before dispatching — the event handlers will Object.assign
        // reactive state, triggering Vue watchers synchronously or on next tick.
        // The flag stays true until after watchers flush, preventing syncToGun echo.
        _applyingRemote = true
        window.dispatchEvent(new CustomEvent('gun-sync', { detail: { key, data } }))
        // Reset after Vue watchers have flushed (watchers run as microtasks,
        // setTimeout runs as macrotask — guaranteed to come after)
        setTimeout(() => { _applyingRemote = false }, 0)
      } catch {
        // ignore parse errors
      }
    }
    gunRef.on(cb)
    listeners.push({ ref: gunRef, cb })
  }
}

// Remove listeners — pass callback reference for proper cleanup
function teardownListeners() {
  for (const { ref: gunRef, cb } of listeners) {
    try {
      gunRef.off(cb)
    } catch {
      // ignore
    }
  }
  listeners = []
}

// Auto-sync: push all current localStorage data to Gun
async function autoSyncAll() {
  if (!isLoggedIn.value) return

  isSyncing.value = true

  try {
    const keys = ['settings', 'progress', 'assessments']
    for (const key of keys) {
      const saved = localStorage.getItem(key)
      if (saved) {
        try {
          const data = JSON.parse(saved)
          await syncToGun(key, data)
        } catch {
          // skip invalid data
        }
      }
    }
  } finally {
    isSyncing.value = false
  }
}

function resetSyncStats() {
  Object.assign(syncStats, {
    bytesSent: 0, bytesReceived: 0, pushCount: 0, pullCount: 0,
    echoesBlocked: 0, duplicatesSkipped: 0, lastPushAt: null, lastPullAt: null,
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
    initGun,
    register,
    login,
    logout,
    autoLogin,
    syncToGun,
    loadFromGun,
    autoSyncAll,
    DEFAULT_PEERS,
    getActivePeers,
    savePeers
  }
}
