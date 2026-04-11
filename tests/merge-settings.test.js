import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock useGun before importing useSettings
vi.mock('../src/composables/useGun', () => ({
  useGun: () => ({
    isLoggedIn: { value: false },
    syncToGun: vi.fn()
  })
}))
vi.mock('../src/composables/useAudioDebug', () => ({
  setAudioDebugEnabled: vi.fn()
}))

describe('useSettings', () => {
  beforeEach(() => {
    localStorage.clear()
    // Blow away the module so isInitialized + the watchers reset between
    // tests. This is what makes the "settings persistence on boot" test
    // actually exercise the watcher-register path.
    vi.resetModules()
  })

  it('loads settings from localStorage', async () => {
    const { useSettings } = await import('../src/composables/useSettings')
    const { settings, loadSettings } = useSettings()
    loadSettings()
    expect(settings.value).toBeDefined()
    expect(typeof settings.value.darkMode).toBe('boolean')
  })

  it('saves and loads settings round-trip', async () => {
    const { useSettings } = await import('../src/composables/useSettings')
    const { settings, saveSettings, loadSettings } = useSettings()

    settings.value.darkMode = true
    settings.value.audioSpeed = 0.8
    saveSettings()

    // Verify localStorage has the data
    const stored = JSON.parse(localStorage.getItem('settings'))
    expect(stored.darkMode).toBe(true)
    expect(stored.audioSpeed).toBe(0.8)
  })

  // Regression: #241 introduced a bug where settings were reset on every
  // page load. The showDebugOverlay watcher was registered with
  // `{ immediate: true }`, which fired synchronously at watcher-register
  // time with the DEFAULT value and called saveSettings() — writing the
  // defaults to localStorage BEFORE loadSettings() ever got to read them.
  // Every page load nuked the user's saved settings.
  it('does NOT overwrite persisted settings when loadSettings is called (regression: #241)', async () => {
    // Simulate a user that previously saved some non-default settings
    localStorage.setItem('settings', JSON.stringify({
      showAnswers: false,
      showLearningItems: false,
      showLabels: false,
      darkMode: true,
      audioSpeed: 0.6,
      readAnswers: false,
      hideLearnedExamples: false,
      showDebugOverlay: false,
    }))

    // Fresh module import — this mirrors the main.js boot sequence and
    // runs initializeWatchers for the first time, so if any watcher has
    // `{ immediate: true }` with a saveSettings side effect, it would
    // overwrite our pre-seeded localStorage HERE.
    const { useSettings } = await import('../src/composables/useSettings')
    const { settings, loadSettings } = useSettings()
    loadSettings()

    // The loaded settings MUST reflect what we previously stored — not the
    // hardcoded defaults.
    expect(settings.value.showAnswers).toBe(false)
    expect(settings.value.audioSpeed).toBe(0.6)
    expect(settings.value.darkMode).toBe(true)
    expect(settings.value.readAnswers).toBe(false)

    // localStorage must still hold the original values (not clobbered)
    const stored = JSON.parse(localStorage.getItem('settings'))
    expect(stored.showAnswers).toBe(false)
    expect(stored.audioSpeed).toBe(0.6)
  })
})
