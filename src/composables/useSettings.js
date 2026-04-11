import { ref, watch } from 'vue'
import { useGun } from './useGun'
import { setAudioDebugEnabled } from './useAudioDebug'

// Shared state across all component instances (singleton pattern)
const settings = ref({
  showAnswers: true, // Renamed from showTranslation
  showLearningItems: true,
  showLabels: true,
  darkMode: false,
  audioSpeed: 1.0, // Audio playback speed: 0.6, 0.8, 1.0
  readAnswers: true, // Whether to read the answer/translation during auto-play
  hideLearnedExamples: true, // Whether to hide examples where all items are learned
  showDebugOverlay: false // Show debug overlay for audio playback
})

let isInitialized = false

// Apply dark mode class to HTML element
function applyDarkMode(enabled) {
  if (enabled) {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
}

// Save settings to localStorage and sync to Gun
function saveSettings() {
  localStorage.setItem('settings', JSON.stringify(settings.value))
  const { isLoggedIn, syncToGun } = useGun()
  if (isLoggedIn.value) {
    syncToGun('settings', settings.value)
  }
}

// Load settings from localStorage
function loadSettings() {
  const saved = localStorage.getItem('settings')
  if (saved) {
    try {
      const parsed = JSON.parse(saved)
      settings.value = parsed
      applyDarkMode(settings.value.darkMode)
    } catch (e) {
      console.error('Error loading settings:', e)
    }
  } else {
    // Apply default dark mode on first load
    applyDarkMode(settings.value.darkMode)
  }
  // Sync the audio debug flag to whatever we just loaded. Must happen
  // AFTER the settings ref is populated — never via an `immediate: true`
  // watcher on showDebugOverlay, because that fires at watcher-register
  // time with the default value and would cause saveSettings() to clobber
  // the user's saved settings before we ever read them (regressed via #241,
  // fixed right after).
  setAudioDebugEnabled(settings.value.showDebugOverlay)
}

// Initialize watchers only once
function initializeWatchers() {
  if (isInitialized) return

  isInitialized = true

  // Watch for settings changes and save to localStorage
  watch(() => settings.value.showAnswers, () => {
    saveSettings()
  })

  watch(() => settings.value.showLearningItems, () => {
    saveSettings()
  })

  watch(() => settings.value.showLabels, () => {
    saveSettings()
  })

  watch(() => settings.value.darkMode, (newValue) => {
    applyDarkMode(newValue)
    saveSettings()
  })

  watch(() => settings.value.audioSpeed, () => {
    saveSettings()
  })

  watch(() => settings.value.readAnswers, () => {
    saveSettings()
  })

  watch(() => settings.value.hideLearnedExamples, () => {
    saveSettings()
  })

  watch(() => settings.value.showDebugOverlay, (enabled) => {
    saveSettings()
    // Keep the audio-debug event log in sync so the overlay gets populated.
    // NOTE: no `immediate: true` here — that would fire at watcher-register
    // time, call saveSettings() with the DEFAULT settings, and overwrite
    // the user's saved settings before loadSettings() ever gets to read
    // them. Initial sync with showDebugOverlay is done inside loadSettings()
    // instead. See regression test in tests/merge-settings.test.js.
    setAudioDebugEnabled(enabled)
  })

  // Listen for real-time Gun sync events from other devices/tabs
  window.addEventListener('gun-sync', (e) => {
    if (e.detail.key === 'settings' && e.detail.data) {
      Object.assign(settings.value, e.detail.data)
      applyDarkMode(settings.value.darkMode)
    }
  })
}

export function useSettings() {
  // Initialize watchers on first use
  initializeWatchers()

  return {
    settings,
    loadSettings,
    saveSettings
  }
}
