import { ref } from 'vue'

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

const SESSION_KEY = 'gun-session'

// Initialize Gun (browser-only, with WebRTC for peer discovery)
async function initGun() {
  if (gun) return

  const GunModule = await import('gun/gun')
  Gun = GunModule.default || GunModule
  await import('gun/sea')

  // WebRTC enables browser-to-browser mesh networking (same WLAN discovery)
  try {
    await import('gun/lib/webrtc')
  } catch {
    // WebRTC module not available, continue without peer sync
  }

  gun = Gun({
    localStorage: true,
    radisk: false,
    file: 'gun-data',
    peers: [],       // No relay server — local peer discovery only
    multicast: true  // Enable WLAN multicast for local device discovery
  })
  user = gun.user().recall({ sessionStorage: true })

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
  if (!isLoggedIn.value || !gun) return

  try {
    gun.user().get('openlearn').get(key).put(JSON.stringify(data))
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

      try {
        const data = JSON.parse(val)
        // Dispatch custom event so composables can react
        window.dispatchEvent(new CustomEvent('gun-sync', { detail: { key, data } }))
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

export function useGun() {
  return {
    isLoggedIn,
    username,
    authError,
    isSyncing,
    initGun,
    register,
    login,
    logout,
    autoLogin,
    syncToGun,
    loadFromGun,
    autoSyncAll
  }
}
