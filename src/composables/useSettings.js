import { ref, watch } from 'vue'
import { useGun } from './useGun'

// Shared state across all component instances (singleton pattern)
const settings = ref({
  showAnswers: true,
  showLearningItems: true,
  showLabels: true,
  darkMode: false,
  audioSpeed: 1.0,
  readAnswers: true,
  hideLearnedExamples: true,
  showDebugOverlay: false,
  coachConsent: false, // Opt-in to send data to coach
  coachIdentifier: '' // Name/alias sent with coach requests
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

  watch(() => settings.value.showDebugOverlay, () => {
    saveSettings()
  })

  watch(() => settings.value.coachConsent, () => {
    saveSettings()
  })

  watch(() => settings.value.coachIdentifier, () => {
    saveSettings()
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
