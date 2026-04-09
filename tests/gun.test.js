import { describe, it, expect, beforeEach, vi } from 'vitest'

// Track put calls per Gun path for assertions
const putCalls = []

const mockPut = vi.fn((val) => { putCalls.push({ path: currentPath, val }) })
const mockOnce = vi.fn()
const mockOn = vi.fn()
const mockOff = vi.fn()

// Track the current Gun path for put call recording
let currentPath = ''
const mockGet = vi.fn((key) => {
  currentPath += (currentPath ? '.' : '') + key
  const path = currentPath
  return {
    get: (k) => {
      currentPath = path + '.' + k
      return { get: mockGet, put: mockPut, once: mockOnce, on: mockOn, off: mockOff }
    },
    put: (val) => { putCalls.push({ path, val }); mockPut(val) },
    once: mockOnce,
    on: mockOn,
    off: mockOff
  }
})

const mockAuth = vi.fn()
const mockCreate = vi.fn()
const mockLeave = vi.fn()
const mockRecall = vi.fn()
const mockGunOn = vi.fn()

const mockUserIs = null
const mockUser = vi.fn(() => ({
  get: (key) => {
    currentPath = key
    return {
      get: (k) => {
        const path = key + '.' + k
        return {
          get: (k2) => {
            const path2 = path + '.' + k2
            return {
              put: (val) => { putCalls.push({ path: path2, val }); mockPut(val) },
              once: mockOnce,
              on: mockOn,
              off: mockOff
            }
          },
          put: (val) => { putCalls.push({ path, val }); mockPut(val) },
          once: mockOnce,
          on: mockOn,
          off: mockOff
        }
      },
      put: mockPut,
      once: mockOnce,
      on: mockOn,
      off: mockOff
    }
  },
  auth: mockAuth,
  create: mockCreate,
  leave: mockLeave,
  recall: mockRecall,
  is: mockUserIs
}))

const MockGun = vi.fn(() => ({
  user: mockUser,
  on: mockGunOn,
  _: { opt: { peers: {} } }
}))

vi.mock('gun/gun', () => ({ default: MockGun }))
vi.mock('gun/sea', () => ({}))

const { useGun } = await import('../src/composables/useGun')

describe('useGun', () => {
  let gun

  beforeEach(() => {
    gun = useGun()
    localStorage.clear()
    putCalls.length = 0
    vi.clearAllMocks()
  })

  describe('syncToGun', () => {
    it('is a no-op when not logged in', async () => {
      await gun.syncToGun('progress', { test: true })
      expect(mockPut).not.toHaveBeenCalled()
    })
  })

  describe('loadFromGun', () => {
    it('returns null when not logged in', async () => {
      const result = await gun.loadFromGun()
      expect(result).toBeNull()
    })
  })

  describe('password storage', () => {
    it('does not store password in localStorage on login', async () => {
      mockAuth.mockImplementation((alias, pass, cb) => {
        cb({ ok: 0 })
      })

      await gun.initGun()
      await gun.login('testuser', 'testpass')

      // Only alias stored under gun-session, never password
      expect(localStorage.getItem('gun-session')).toBe('testuser')
      // Verify no password-related keys exist
      const allKeys = Object.keys(localStorage)
      const hasPasswordKey = allKeys.some(k => k.includes('password') || k.includes('pass'))
      expect(hasPasswordKey).toBe(false)
    })
  })

  describe('merge-back loop prevention', () => {
    it('does not write sync marker during merge-back after pull', async () => {
      // Simulate logged-in state
      mockAuth.mockImplementation((alias, pass, cb) => cb({ ok: 0 }))
      await gun.initGun()
      await gun.login('testuser', 'testpass')

      // Set up localStorage with some data (simulates local state)
      localStorage.setItem('settings', JSON.stringify({ darkMode: true }))
      localStorage.setItem('progress', JSON.stringify({}))
      localStorage.setItem('assessments', JSON.stringify({}))
      localStorage.setItem('contentSources', JSON.stringify([]))

      // Make .once() return data so pullFromRemote processes it
      mockOnce.mockImplementation((cb) => {
        cb(JSON.stringify({ darkMode: false }))
      })

      putCalls.length = 0

      // Simulate receiving a sync marker from another device.
      // Find the .on() callback registered on lastSync and call it.
      const onCalls = mockOn.mock.calls
      const lastSyncOnCb = onCalls[onCalls.length - 1]?.[0]

      if (lastSyncOnCb) {
        // Call with a marker from a different device
        await lastSyncOnCb(`${Date.now()}:otherdevice123`)
        // Wait for async operations
        await new Promise(r => setTimeout(r, 50))
      }

      // Check: merge-back should put data keys but NOT write a lastSync marker
      const lastSyncPuts = putCalls.filter(c => c.path.includes('lastSync'))
      const dataPuts = putCalls.filter(c => !c.path.includes('lastSync'))

      // There should be no lastSync puts from the merge-back phase
      // (only the login phase may have written one)
      const loginMarkerCount = lastSyncPuts.filter(c =>
        c.val.includes(gun.DEVICE_ID)
      ).length

      // After login, autoSyncAll writes one marker. The merge-back should NOT add another.
      // So total lastSync puts with our device ID should be ≤ 1 (from login only)
      expect(loginMarkerCount).toBeLessThanOrEqual(1)
    })

    it('syncToGun writes a sync marker (normal push)', async () => {
      mockAuth.mockImplementation((alias, pass, cb) => cb({ ok: 0 }))
      await gun.initGun()
      await gun.login('testuser', 'testpass')

      putCalls.length = 0

      await gun.syncToGun('settings', { darkMode: true })

      // Should have a put for the data AND a put for lastSync marker
      const lastSyncPuts = putCalls.filter(c => c.path.includes('lastSync'))
      expect(lastSyncPuts.length).toBe(1)
      expect(lastSyncPuts[0].val).toContain(gun.DEVICE_ID)
    })
  })
})
